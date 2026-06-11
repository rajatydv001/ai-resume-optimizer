# ATS Resume Optimizer

> **AI-powered ATS Resume Optimizer** — Upload your resume, analyze ATS compatibility against any job description, identify missing keywords, get an ATS score, and receive AI-powered improvements.

**Live Demo:** [ai-resume-optimizer-hazel.vercel.app](https://ai-resume-optimizer-hazel.vercel.app)

---

## Hero

Stop losing applications to automated screeners. The ATS Resume Optimizer analyzes your resume against real job descriptions, pinpoints exactly what's missing, and uses AI to rewrite it for maximum ATS compatibility.

| Metric | Detail |
|--------|--------|
| Score | 0–100 ATS compatibility rating |
| Keywords | Matched vs missing per job role |
| AI Analysis | Missing skills, suggestions, optimized summary, interview questions |
| AI Rewrite | Full resume optimization with missing keywords integrated |

---

## Features

| Feature | Description |
|---------|-------------|
| **Resume Upload** | Drag-and-drop PDF upload with progress tracking and versioning support |
| **ATS Score** | Percentage-based score (0–100) showing keyword match rate |
| **Keyword Analysis** | Matched and missing keywords with role-library or JD-based extraction |
| **Missing Skills Detection** | AI-identified skill gaps based on resume + target role |
| **AI Resume Analysis** | Deep analysis: missing skills, actionable suggestions, optimized summary, interview questions |
| **AI Resume Rewrite** | Full AI-powered rewrite incorporating all missing keywords naturally |
| **Resume History** | All analyses stored in PostgreSQL with version tracking |
| **PDF Export** | Download full ATS report as PDF via `@react-pdf/renderer` |
| **HTML Export** | Download full ATS report as styled HTML |
| **Multi-model AI Fallback** | Automatic fallback across 4 OpenRouter models if primary is unavailable or rate-limited |

---

## Screenshots

<!-- Replace these with actual screenshots before publishing -->

```
public/screenshots/
├── landing.png              # Hero landing page
├── upload-form.png          # Upload form with job description input
├── upload-progress.png      # Upload with progress bar
├── results-overview.png     # ATS score + keyword coverage results
├── results-keywords.png     # Matched/missing keywords breakdown
├── results-ai-analysis.png  # AI analysis tab
├── resume-report.png        # Full resume report page
├── resume-history.png       # Resume history list
└── resume-rewriter.png      # AI rewrite results
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.2.6 (App Router, Turbopack) |
| **Language** | TypeScript 5.x (strict mode) |
| **UI** | React 19, Tailwind CSS v4, shadcn/ui, Radix UI |
| **Icons** | lucide-react |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Database** | Neon PostgreSQL via Prisma 6 |
| **Validation** | zod |
| **PDF Parsing** | Custom zero-dependency extractor (FlateDecode, ASCII85, ASCIIHex) |
| **PDF Generation** | @react-pdf/renderer |
| **DOCX Generation** | docx |
| **AI** | OpenRouter API (multi-model with automatic fallback) |
| **Deployment** | Vercel |

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── upload-resume/    POST  — Main analysis: upload, extract, score, AI analyze
│   │   ├── rewrite/          POST  — AI-powered resume rewrite
│   │   ├── rewrite/export/   POST  — Export rewritten resume as DOCX/PDF
│   │   ├── resumes/          GET   — List resumes (paginated, searchable)
│   │   ├── resumes/[id]/     GET   — Get single resume / DELETE resume
│   │   ├── resumes/[id]/download/
│   │   │                     GET   — Download HTML report
│   │   ├── resumes/[id]/download-pdf/
│   │   │                     GET   — Download PDF report
│   │   ├── debug-env/        GET   — Debug environment variables
│   │   └── test-db/          GET   — Database connectivity test
│   ├── upload/               page  — Upload form + inline results
│   ├── resumes/[id]          page  — Full resume report with charts + rewriter
│   ├── resumes/              page  — Resume history list with search + pagination
│   ├── analysis/             page  — Quick analysis view
│   └── page.tsx              page  — Landing page
├── lib/
│   ├── extractPdfText.ts     — Custom zero-dependency PDF text extractor
│   ├── extractKeywords.ts    — JD keyword extraction engine
│   ├── aiAnalysis.ts         — OpenRouter AI analysis with model fallback
│   ├── aiRewrite.ts          — OpenRouter AI rewrite with model fallback
│   ├── env.ts                — Environment config + fallback model list
│   ├── prisma.ts             — Prisma client singleton
│   ├── types.ts              — Shared TypeScript interfaces
│   └── utils.ts              — cn() utility for Tailwind class merging
├── components/
│   ├── ui/                   — shadcn/ui primitives (button, badge, tabs, etc.)
│   ├── Navbar.tsx            — Sticky top navigation
│   ├── AtsScoreCard.tsx      — Circular SVG score gauge
│   ├── SkillGapChart.tsx     — Matched vs missing bar chart
│   ├── ScoreTrendChart.tsx   — Score progression over versions
│   ├── ResumeRewriter.tsx    — AI rewrite UI with export
│   ├── DeleteResumeButton.tsx — Confirmation dialog for deletion
│   └── PdfReport.tsx        — React-PDF document component
└── app/globals.css           — Tailwind v4 theme + shadcn dark theme
```

---

## Database Schema

```prisma
model Resume {
  id                   String   @id @default(cuid())
  fileName             String
  atsScore             Int?
  createdAt            DateTime @default(now())
  content              String?  // Extracted PDF text
  jobRole              String?
  keywords             String?  // Matched keywords (comma-separated)
  missingKeywords      String?  // Missing keywords (comma-separated)
  suggestions          String?
  jdKeywords           String?  // JD-extracted keywords
  jobDescription       String?
  keywordSource        String   @default("role")  // "role" | "jd"
  aiMissingSkills      String?
  aiSuggestions        String?
  aiSummary            String?
  aiInterviewQuestions String?
  versionGroupId       String?  // Links versions together

  @@index([versionGroupId])
}
```

---

## Complete User Flow

```
User uploads PDF + (optional) job description
                  │
                  ▼
         File validation
   ┌───────────────┼───────────────┐
   │ Extension check (.pdf)        │
   │ Magic byte check (%PDF-)      │
   │ Size check (max 4 MB)         │
   └───────────────┼───────────────┘
                   │
                   ▼
         PDF text extraction
   ┌───────────────┼───────────────┐
   │ Custom parser: FlateDecode    │
   │ ASCII85Decode, ASCIIHexDecode │
   │ TJ kerning operators handled  │
   │ Font streams skipped          │
   └───────────────┼───────────────┘
                   │
                   ▼
      Keyword source determination
   ┌───────────────┼───────────────┐
   │ Job Description provided?     │
   │  ├─ YES → extractKeywords(jd) │
   │  └─ NO  → roleKeywords[role]  │
   │                                │
   │ Zero matches? Auto-detect     │
   │ best role from library        │
   └───────────────┼───────────────┘
                   │
                   ▼
           ATS scoring
   ┌───────────────┼───────────────┐
   │ For each keyword:             │
   │  ├─ In resume? → matched++   │
   │  └─ Not found? → missing++   │
   │                                │
   │ Score = (matched / total)     │
   │         × 100                 │
   └───────────────┼───────────────┘
                   │
                   ▼
          AI analysis
   ┌───────────────┼───────────────┐
   │ OpenRouter API call           │
   │  ├─ Missing skills detected   │
   │  ├─ Improvement suggestions   │
   │  ├─ Optimized summary         │
   │  └─ Interview questions       │
   │                                │
   │ Automatic fallback on failure │
   │ Rate-limit detection          │
   └───────────────┼───────────────┘
                   │
                   ▼
     Results stored in PostgreSQL
                   │
                   ▼
   ┌───────────────┼───────────────┐
   │ User can:                     │
   │  ├─ View full report          │
   │  ├─ AI rewrite resume         │
   │  ├─ Download HTML report      │
   │  ├─ Download PDF report       │
   │  ├─ Track version history     │
   │  └─ Delete resume             │
   └───────────────┴───────────────┘
```

---

## API Routes

| Method | Route | Description | Input | Response |
|--------|-------|-------------|-------|----------|
| `POST` | `/api/upload-resume` | Upload PDF + analyze | FormData: `resume` (file), `jobRole`, `jobDescription`, `resumeId` | `UploadResult` JSON |
| `POST` | `/api/rewrite` | AI rewrite resume | `{ resumeId }` | `{ summary, bullets, skills, fullContent }` |
| `POST` | `/api/rewrite/export` | Export rewritten resume | `{ format, summary, bullets, skills, fullContent, fileName }` | DOCX or PDF binary |
| `GET` | `/api/resumes` | List resumes | Query: `page`, `pageSize`, `search` | `{ resumes, total, page, totalPages }` |
| `GET` | `/api/resumes/[id]` | Get resume | — | Resume object |
| `DELETE` | `/api/resumes/[id]` | Delete resume | — | `{ success: true }` |
| `GET` | `/api/resumes/[id]/download` | Download HTML report | — | HTML file download |
| `GET` | `/api/resumes/[id]/download-pdf` | Download PDF report | — | PDF file download |
| `GET` | `/api/debug-env` | Check API key | — | `{ hasApiKey, model }` |
| `GET` | `/api/test-db` | Test database | — | Created resume or error |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | — | Neon PostgreSQL connection string (with `?sslmode=require`) |
| `OPENROUTER_API_KEY` | **Yes** | — | OpenRouter API key for AI features |
| `OPENROUTER_MODEL` | No | `meta-llama/llama-3.3-70b-instruct` | Primary AI model for analysis/rewrite |

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/yourusername/ai-resume-optimizer.git
cd ai-resume-optimizer

# 2. Install
npm install

# 3. Set up .env (see Environment Variables above)
cp .env.example .env

# 4. Generate Prisma client + push schema
npx prisma generate
npx prisma db push

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Vercel + Neon deployment guide.

**Quick deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## Challenges Solved

| Challenge | Solution |
|-----------|----------|
| **Zero-dependency PDF parsing** | Built a custom parser handling FlateDecode, ASCII85Decode, ASCIIHexDecode, TJ kerning operators, and font stream skipping — no `pdf-parse` or `pdfjs` needed |
| **Keyword extraction from messy JDs** | Heuristic engine with 60+ stop words, 50+ junk keywords, sentence-start detection, multi-word tech phrase matching, and deduplication by normalized form |
| **AI model availability** | Multi-model fallback chain across 4 OpenRouter models; rate-limit detection with retry-after; graceful degradation when AI is unavailable |
| **Resume versioning** | Version group ID links multiple uploads; score progression tracking across versions; keyword change detection (new/retained/dropped) |
| **ATS scoring accuracy** | Normalized text matching (whitespace-stripped), role auto-detection on zero matches, fuzzy role-keyword matching |
| **Serverless PDF generation** | `@react-pdf/renderer` outputs PDF via Edge-compatible stream; configured as `serverExternalPackages` for Vercel |

---

## Future Improvements

- Authentication (OAuth / magic link)
- Multi-page resume support
- Bulk resume analysis
- Company-specific ATS rule sets
- Custom keyword library editor
- Resume template suggestions
- Export to Google Docs / Word Online
- Team collaboration with shared workspaces
- Admin dashboard with usage analytics

---

## Portfolio Highlights

This project demonstrates:

- **Full-stack Next.js engineering** — App Router, server components, API routes, streaming
- **Custom PDF parsing** — Built a production-grade PDF text extractor from scratch (no dependencies)
- **AI integration** — OpenRouter multi-model orchestration with automatic fallback and rate-limit resilience
- **Database design** — Prisma schema with version tracking, indexed queries, and PostgreSQL migrations
- **Production deployment** — Vercel serverless + Neon PostgreSQL + environment-based configuration
- **TypeScript mastery** — Strict mode, generics, discriminated unions, Zod validation
- **UI/UX** — Dark theme, shadcn design system, Framer Motion animations, responsive layout

---

## License

MIT
