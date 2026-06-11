# Deployment Guide

## Git Workflow

```bash
# Check current state
git status

# Stage all changes
git add .

# Commit with a descriptive message
git commit -m "Production ready ATS Resume Optimizer"

# Push to GitHub
git push origin main
```

---

## Vercel Deployment Steps

### 1. Prepare Repository

```bash
# Ensure the build works locally first
npm run build
```

### 2. Create Vercel Project

**Option A: Vercel Dashboard**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `./` (default)

**Option B: Vercel CLI**

```bash
npm i -g vercel
vercel login
vercel --prod
```

### 3. Configure Project Settings

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build Command | `npm run vercel-build` |
| Output Directory | `.next` (default) |
| Install Command | `npm install` |
| Node.js Version | 20.x (default) |

### 4. Environment Variables

Add the following in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Your Neon pooled connection string with `?sslmode=require` |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | Your OpenRouter API key |
| `OPENROUTER_MODEL` | `meta-llama/llama-3.3-70b-instruct` | Optional — defaults to this value |

### 5. Database Migration

The `vercel-build` script in `package.json` handles this automatically:

```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

This runs in order:
1. `prisma generate` — generates the Prisma client
2. `prisma migrate deploy` — applies pending migrations
3. `next build` — builds the Next.js application

**Manual migration (if needed):**

```bash
npx prisma migrate deploy
```

### 6. Deploy

Click **Deploy** in the Vercel dashboard, or run:

```bash
vercel --prod
```

---

## Post-Deployment Verification Checklist

- [ ] **Landing page loads** — Visit `https://<your-domain>/`
- [ ] **Database connected** — Visit `https://<your-domain>/api/test-db` (should return resume JSON)
- [ ] **API key configured** — Visit `https://<your-domain>/api/debug-env` (should show `hasApiKey: true`)
- [ ] **Upload works** — Upload a PDF resume with a job role
- [ ] **ATS score calculated** — Verify score and keyword breakdown appear
- [ ] **AI analysis works** — Check AI insights tab has data
- [ ] **AI rewrite works** — Navigate to resume report → Rewriter tab → "Rewrite with AI"
- [ ] **History loads** — Visit `https://<your-domain>/resumes`
- [ ] **PDF export works** — Click "Export PDF" on a resume report
- [ ] **HTML export works** — Download HTML report via `/api/resumes/[id]/download`
- [ ] **Version tracking works** — Upload a new version of an existing resume
- [ ] **Search works** — Search for a resume by filename
- [ ] **Delete works** — Delete a resume from the history page
- [ ] **Error handling works** — Try uploading a non-PDF file (should show error)

---

## Troubleshooting

### Build fails with "Prisma Client could not be found"

```bash
npx prisma generate
```

Make sure `DATABASE_URL` is set in the Vercel environment variables.

### Upload fails with 413 (Request Entity Too Large)

The application limits uploads to 4 MB. Files within this range should work on Vercel Hobby (4.5 MB limit). If you need larger files:

1. Lower the limit in `src/app/api/upload-resume/route.ts` (`MAX_FILE_SIZE`)
2. Or upgrade to Vercel Pro (5.5 MB limit)

### AI features return "unavailable"

1. Check that `OPENROUTER_API_KEY` is set in Vercel environment variables
2. Verify the key is valid at [openrouter.ai/keys](https://openrouter.ai/keys)
3. Check Vercel function logs for OpenRouter API errors

### Database connection errors

1. Verify the `DATABASE_URL` is correct (use the **pooled** connection string from Neon)
2. Ensure the Neon IP allowlist includes Vercel's IPs (or set to "Allow all")
3. Check that `?sslmode=require` is appended to the connection string

### "This model is unavailable" error

The application includes automatic model fallback. If you see this:

1. Set `OPENROUTER_MODEL` to a different model slug
2. Or fallback models will be tried automatically:
   - `meta-llama/llama-3.3-70b-instruct`
   - `mistralai/mistral-small-3.1-24b-instruct`
   - `google/gemma-3-27b-it`
   - `deepseek/deepseek-chat`

### Vercel function timeout

If analysis or rewrite takes too long:

1. Check Vercel's `maxDuration` setting (default: 10s on Hobby, up to 60s on Pro)
2. Consider upgrading to Pro for longer-running AI calls

### TypeScript errors after deploy

```bash
npm run build
```

Ensure the build passes locally before deploying. TypeScript errors are caught during build.
