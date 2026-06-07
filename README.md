# ATS Resume Optimizer

Upload your resume, analyze ATS (Applicant Tracking System) compatibility, find missing keywords, and get actionable suggestions to optimize your resume for any job role.

## Features

- **PDF Text Extraction** — Custom zero-dependency parser supporting FlateDecode, ASCII85Decode, and ASCIIHexDecode. Handles TJ kerning, Type1/TrueType font skipping, and BT-guarded raw text fallback.
- **JD Keyword Extraction** — Heuristic engine extracts 20–30 relevant skill keywords from any pasted job description. Filters stop words, JD fluff, sentence-starters, and company names.
- **Role Keyword Library** — 16 built-in tech roles (frontend, backend, data scientist, PM, DevOps, etc.) with 8–12 keywords each. Fuzzy matching + auto-detect best role.
- **ATS Scoring** — Percentage-based score from 0–100 showing how many required keywords appear in your resume.
- **Resume History** — All analyses stored in PostgreSQL (Neon), browsable via grid cards with score gauges.
- **Detailed Reports** — Tabbed interface with matched/missing keywords, improvement suggestions, JD source display, and downloadable HTML reports.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Language | TypeScript 5.x (strict mode) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Radix UI |
| Icons | lucide-react |
| Database | Neon PostgreSQL via Prisma 6 |
| Validation | zod |
| PDF Parsing | Custom zero-dependency extractor |

## Getting Started

### Prerequisites

- Node.js 20+
- A Neon PostgreSQL database (or any PostgreSQL instance)

### Installation

```bash
git clone <repo-url>
cd ai-resume-optimizer
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@ep-xxxx-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
```

### Database Setup

```bash
npx prisma generate
npx prisma db push
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── resumes/          # GET /api/resumes (list), /api/resumes/[id]
│   │   ├── test-db/          # Database connectivity test
│   │   └── upload-resume/    # POST — main analysis endpoint
│   ├── upload/               # Upload form + results page
│   ├── resumes/[id]          # Individual report page
│   └── page.tsx              # Landing page
├── lib/
│   ├── extractPdfText.ts     # Custom PDF text extractor
│   ├── extractKeywords.ts    # JD keyword extraction engine
│   ├── prisma.ts             # Prisma client singleton
│   └── types.ts              # Shared TypeScript interfaces
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── Navbar.tsx            # Top navigation bar
│   └── AtsScoreCard.tsx      # Circular SVG gauge
└── globals.css               # Tailwind v4 + shadcn theme
```

### PDF Extraction Pipeline

1. Scan all `stream...endstream` pairs in the raw PDF binary
2. Skip font program streams (`/Length1`, `/FontFile`)
3. Apply filter chain: `ASCII85Decode` → `FlateDecode` or `ASCIIHexDecode`
4. Extract text from content streams using `Tj`/`TJ`/`'` operators
5. Fallback: `extractRawReadableText` only on streams with `BT` marker
6. Final fallback: regex scan of entire file for 3+ letter ASCII words

### ATS Scoring

1. User provides either a job role (from 16 built-in roles) or pastes a job description
2. System extracts keywords from the source (role library or JD engine)
3. Resume text is normalized (all whitespace stripped)
4. Each keyword is checked against the normalized resume text
5. ATS score = (matched keywords / total keywords) × 100

## License

MIT
