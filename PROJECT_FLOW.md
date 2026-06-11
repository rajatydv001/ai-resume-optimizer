# Project Flow — ATS Resume Optimizer

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Next.js App)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Landing  │  │ Upload   │  │ Resume   │  │ Resume     │  │
│  │ Page     │  │ Page     │  │ List     │  │ Report     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │              │              │         │
└───────┼──────────────┼──────────────┼──────────────┼─────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Routes (Edge/Server)            │
│                                                              │
│  POST /api/upload-resume    ────  Main analysis pipeline     │
│  POST /api/rewrite          ────  AI resume rewrite          │
│  POST /api/rewrite/export   ────  DOCX/PDF export            │
│  GET  /api/resumes          ────  List with pagination       │
│  GET  /api/resumes/[id]     ────  Single resume              │
│  DELETE /api/resumes/[id]   ────  Delete resume              │
│  GET  /api/resumes/[id]/download    ────  HTML report        │
│  GET  /api/resumes/[id]/download-pdf     ────  PDF report    │
└───────────┬─────────────────────────────────────────────────┘
            │
            ├─────────────────────────────────┐
            ▼                                 ▼
┌──────────────────────┐        ┌──────────────────────┐
│   PostgreSQL (Neon)  │        │  OpenRouter API      │
│   ┌──────────────┐   │        │  ┌────────────────┐  │
│   │  Resume       │   │        │  │ meta-llama/    │  │
│   │  Table        │   │        │  │ llama-3.3-70b │  │
│   │  (versions,   │◄──┼────────┼──┤  -instruct     │  │
│   │   AI data,    │   │        │  ├────────────────┤  │
│   │   keywords)   │   │        │  │ mistralai/     │  │
│   └──────────────┘   │        │  │ mistral-small  │  │
│                      │        │  ├────────────────┤  │
│   Indexed on:        │        │  │ google/gemma-  │  │
│   - versionGroupId   │        │  │ 3-27b-it       │  │
│   - id (PK)          │        │  ├────────────────┤  │
└──────────────────────┘        │  │ deepseek/      │  │
                                │  │ deepseek-chat  │  │
                                │  └────────────────┘  │
                                └──────────────────────┘
```

---

## Data Flow

### Upload + Analysis Pipeline

```
POST /api/upload-resume
  │
  ├── 1. Parse FormData
  │      ├── resume (File) — PDF file
  │      ├── jobRole (string) — optional
  │      ├── jobDescription (string) — optional
  │      └── resumeId (string) — optional, for versioning
  │
  ├── 2. Validate Input (Zod)
  │      └── Reject with 400 if invalid
  │
  ├── 3. Validate File
  │      ├── Extension must be .pdf
  │      ├── Size must be ≤ 4 MB
  │      └── Magic bytes must be %PDF-
  │
  ├── 4. Extract PDF Text
  │      ├── Read file as Buffer
  │      ├── Parse stream objects (FlateDecode, ASCII85, ASCIIHex)
  │      ├── Extract text from TJ/Tj operators
  │      └── Fallback: raw word extraction if BT markers found
  │
  ├── 5. Normalize Text
  │      └── Strip all whitespace for keyword matching
  │
  ├── 6. Determine Keyword Source
  │      ├── JD provided? → extractKeywords(jd)
  │      │     ├── Multi-word tech phrases matched first
  │      │     ├── Individual tokens filtered (stop words, junk, sentence-starts)
  │      │     └── Limited to top 30 keywords
  │      └── No JD? → roleKeywords[role]
  │            ├── 17 built-in tech roles with curated keywords
  │            └── Fuzzy match + auto-detect best role if zero matches
  │
  ├── 7. Calculate ATS Score
  │      ├── For each keyword:
  │      │     ├── In normalized resume? → matched++
  │      │     └── Not found? → missing++
  │      └── Score = floor((matched / total) × 100)
  │
  ├── 8. Generate Suggestions
  │      └── "Add [keyword] [experience/to your resume]" per missing keyword
  │
  ├── 9. AI Analysis (OpenRouter)
  │      ├── Send resume text + job role + JD to AI
  │      ├── Parse JSON response for:
  │      │     ├── missingSkills[]
  │      │     ├── suggestions[]
  │      │     ├── summaryOptimization (string)
  │      │     └── interviewQuestions[]
  │      ├── On 429: return rate-limited signal
  │      └── On model failure: try next model in fallback chain
  │
  ├── 10. Determine Version Group
  │       └── Look up existing versionGroupId if resumeId provided
  │
  ├── 11. Persist to PostgreSQL
  │       └── Create Resume record with all data
  │
  ├── 12. Compute Version Number
  │       └── Count siblings in same version group
  │
  └── 13. Return UploadResult JSON
```

---

## ATS Scoring Logic

```
┌─────────────────────────────────────────────┐
│            ATS Score Algorithm               │
├─────────────────────────────────────────────┤
│                                             │
│  Input:                                     │
│    - Resume text (extracted from PDF)       │
│    - Keywords list (from JD or role)        │
│                                             │
│  Steps:                                     │
│    1. Normalize resume text:                │
│       stripAllWhitespace(resume)            │
│                                             │
│    2. For each keyword in list:             │
│       normKw = stripAllWhitespace(keyword)  │
│              .toLowerCase()                 │
│       if normText.includes(normKw):         │
│         matchedKeywords.push(keyword)       │
│       else:                                 │
│         missingKeywords.push(keyword)       │
│                                             │
│    3. Score calculation:                    │
│       if keywords.length === 0:             │
│         score = 0                           │
│       else:                                 │
│         score = floor(                      │
│           matchedKeywords.length            │
│           / keywords.length                 │
│           × 100                             │
│         )                                   │
│                                             │
│    4. Auto-detect (role-based, 0 matches):  │
│       for each role in library:             │
│         count matches for that role         │
│       pick role with most matches           │
│       recalculate score                     │
│                                             │
│  Output: 0-100 integer score                │
│                                             │
│  Rating scale:                              │
│    ≥ 90:  Excellent (green)                 │
│    ≥ 70:  Good (yellow)                     │
│    < 70:  Needs Work (red)                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## AI Rewrite Flow

```
┌─────────────────────────────────────────────┐
│           AI Rewrite Pipeline                │
├─────────────────────────────────────────────┤
│                                             │
│  Trigger: User clicks "Rewrite with AI"     │
│  on resume report page                      │
│                                             │
│  POST /api/rewrite { resumeId }             │
│                                             │
│  1. Look up resume from DB                  │
│     ├─ Get content, jobRole, jobDescription │
│     ├─ Get matchedKeywords[]                │
│     └─ Get missingKeywords[]                │
│                                             │
│  2. Build prompt:                           │
│     ├─ System: ATS resume writer instruct   │
│     ├─ Target role + JD                     │
│     ├─ Matched keywords (to keep)           │
│     ├─ Missing keywords (MUST INCLUDE)      │
│     └─ Original resume text                 │
│                                             │
│  3. Call OpenRouter (with fallback chain):  │
│     ├─ Try primary model first              │
│     ├─ On any non-429 failure: try next     │
│     ├─ On 429: report rate-limited          │
│     └─ On all fail: return null             │
│                                             │
│  4. Parse JSON response:                    │
│     └─ { summary, bullets[], skills[],      │
│          fullContent }                      │
│                                             │
│  5. Return result to client                 │
│                                             │
│  Export (DOCX / PDF):                       │
│  POST /api/rewrite/export                   │
│     ├─ Generate DOCX via docx library       │
│     └─ Generate PDF via @react-pdf/renderer │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Database Interactions

### Read Operations

| Endpoint | Query | Index Used |
|----------|-------|------------|
| `GET /api/resumes` | `findMany` with `skip`/`take` + `count` | `id` (PK) for ordering |
| `GET /api/resumes?search=` | `findMany` with `contains` (insensitive) | Full scan (no index on `fileName`) |
| `GET /api/resumes/[id]` | `findUnique` | `id` (PK) |
| `GET /api/resumes/[id]/download` | `findUnique` | `id` (PK) |
| `GET /api/resumes/[id]/download-pdf` | `findUnique` + `findMany` by `versionGroupId` | `id` + `versionGroupId` |
| Server: `resumes/[id]/page.tsx` | `findUnique` + `findMany` by `versionGroupId` | `id` + `versionGroupId` |
| Server: `upload page` | `findUnique` (version group lookup) | `id` (PK) |

### Write Operations

| Endpoint | Mutation | Notes |
|----------|----------|-------|
| `POST /api/upload-resume` | `create` | New resume with optional version link |
| `DELETE /api/resumes/[id]` | `delete` | Cascade: no related tables |

### Version Tracking

```
Upload 1 (no resumeId)
  → id: "abc", versionGroupId: "abc" (same as id)
  → version: 1

Upload 2 (with resumeId: "abc")
  → id: "def", versionGroupId: "abc" (from upload 1)
  → version: 2

Upload 3 (with resumeId: "def" or "abc")
  → id: "ghi", versionGroupId: "abc" (from existing record)
  → version: 3
```

---

## AI Model Fallback Chain

```
tryModels(client, params):
  │
  for model in [ENV.OPENROUTER_MODEL, ...FALLBACK_MODELS]:
    │
    try:
      ├── response = await client.chat.completions.create({ model, ...params })
      └── return response
    │
    catch (error):
      ├── if status === 429 (RATE LIMITED):
      │     throw error  ← stops fallback, reports to user
      │
      └── else (model unavailable, server error, etc.):
            console.warn(...)
            continue  ← tries next model
  │
  return null  ← all models exhausted
```

Current models in fallback chain:
1. `OPENROUTER_MODEL` (configurable via env — default: `meta-llama/llama-3.3-70b-instruct`)
2. `mistralai/mistral-small-3.1-24b-instruct`
3. `google/gemma-3-27b-it`
4. `deepseek/deepseek-chat`
