import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AtsScoreCard from "@/components/AtsScoreCard";
import ResumeRewriter from "@/components/ResumeRewriter";
import SkillGapChart from "@/components/SkillGapChart";
import ScoreTrendChart from "@/components/ScoreTrendChart";
import DeleteResumeButton from "@/components/DeleteResumeButton";
import { Download, Sparkles, Upload, TrendingUp, ArrowUp, ArrowDown, Minus, Wand2, Lightbulb, Target, MessageSquare, ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function ResumeReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });

  if (!resume) return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">Resume not found</p></div>;

  const versions = resume.versionGroupId
    ? await prisma.resume.findMany({ where: { versionGroupId: resume.versionGroupId }, orderBy: { createdAt: "asc" } })
    : [resume];

  const idx = versions.findIndex(v => v.id === id);
  const vn = idx + 1;
  const totalV = versions.length;
  const prev = idx > 0 ? versions[idx - 1] : null;

  const curK = resume.keywords?.split(", ").filter(Boolean) || [];
  const prevK = prev?.keywords?.split(", ").filter(Boolean) || [];
  const curS = new Set(curK), prevS = new Set(prevK);
  const newK = curK.filter(k => !prevS.has(k));
  const retK = curK.filter(k => prevS.has(k));
  const dropK = prevK.filter(k => !curS.has(k));

  const matched = curK.length;
  const missing = resume.missingKeywords?.split(", ").filter(Boolean).length || 0;
  const total = matched + missing;
  const pct = total > 0 ? Math.round((matched / total) * 100) : 0;
  const delta = (resume.atsScore || 0) - (prev?.atsScore || 0);
  const hasAI = resume.aiMissingSkills || resume.aiSuggestions || resume.aiSummary || resume.aiInterviewQuestions;

  return (
    <div className="page-container py-8 sm:py-10">
      {/* Back + Header */}
      <div className="mb-6">
        <Link href="/resumes" className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="h-3 w-3" /> Back to all resumes
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{resume.fileName.replace(/\.pdf$/i, "")}{totalV > 1 && <span className="text-muted-foreground/50 font-normal ml-1">v{vn}</span>}</h1>
            <p className="text-sm text-muted-foreground/60 mt-0.5">{resume.jobRole || "N/A"} &middot; {resume.keywordSource === "jd" ? "JD-based" : "Role-based"}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {resume.versionGroupId && <Link href={`/upload?resumeId=${resume.versionGroupId}`}><Button variant="outline" size="sm"><Upload className="mr-1 h-3.5 w-3.5" />New Version</Button></Link>}
            <Link href={`/api/resumes/${id}/download-pdf`} download><Button size="sm"><Download className="mr-1 h-3.5 w-3.5" />Export PDF</Button></Link>
            <DeleteResumeButton resumeId={id} fileName={resume.fileName} />
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-px overflow-hidden rounded-xl border border-border/30 bg-border/30 mb-6 sm:grid-cols-5">
        <div className="bg-card p-4 text-center">
          <p className="section-label">ATS Score</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="kpi-value">{resume.atsScore || 0}</span>
            <span className={"text-[10px] font-medium px-1.5 py-0.5 rounded " + ((resume.atsScore || 0) >= 90 ? "badge-green" : (resume.atsScore || 0) >= 70 ? "badge-yellow" : "badge-red")}>{(resume.atsScore || 0) >= 90 ? "Excellent" : (resume.atsScore || 0) >= 70 ? "Good" : "Needs Work"}</span>
          </div>
        </div>
        <div className="bg-card p-4 text-center"><p className="section-label">Keyword Match</p><p className="kpi-value mt-1">{pct}%</p><p className="kpi-label mt-0.5">{matched}/{total} keywords</p></div>
        <div className="bg-card p-4 text-center"><p className="section-label">Matched</p><p className="kpi-value mt-1 text-green-400">{matched}</p><p className="kpi-label mt-0.5">keywords found</p></div>
        <div className="bg-card p-4 text-center"><p className="section-label">Missing</p><p className="kpi-value mt-1 text-red-400">{missing}</p><p className="kpi-label mt-0.5">to improve</p></div>
        <div className="bg-card p-4 text-center"><p className="section-label">Progression</p>{totalV > 1 ? <><p className={"kpi-value mt-1 " + (delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-muted-foreground")}>{delta > 0 ? "+" : ""}{delta}</p><p className="kpi-label mt-0.5">from v{vn - 1}</p></> : <><p className="kpi-value mt-1 text-muted-foreground">--</p><p className="kpi-label mt-0.5">upload more</p></>}</div>
      </div>

      {/* Charts + AI Insights grid */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <div className="card-ui-solid p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="h-4 w-4 text-muted-foreground" /><p className="section-label">Score Progression</p></div>
          {totalV > 1 ? <ScoreTrendChart data={versions.map((v, i) => ({ version: i + 1, score: v.atsScore || 0, date: v.createdAt.toISOString(), id: v.id }))} /> : <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground/60">Upload a new version to see your score trend</div>}
        </div>
        <div className="card-ui-solid p-5">
          <div className="flex items-center gap-2 mb-4"><Target className="h-4 w-4 text-muted-foreground" /><p className="section-label">Keyword Coverage</p></div>
          <SkillGapChart matched={matched} missing={missing} />
        </div>
      </div>

      {/* AI + Version Comparison side panel */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        {hasAI && (
          <div className="card-ui-solid p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4"><Sparkles className="h-4 w-4 text-muted-foreground" /><p className="section-label">AI Insights</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {resume.aiMissingSkills && <div><p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">Missing Skills</p><div className="flex flex-wrap gap-1">{resume.aiMissingSkills.split(", ").filter(Boolean).map((s) => <Badge key={s} className="bg-accent-blue-bg text-accent-blue text-[10px]">{s}</Badge>)}</div></div>}
              {resume.aiSuggestions && <div><p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">Suggestions</p><ul className="space-y-1">{resume.aiSuggestions.split("\n").filter(Boolean).slice(0, 3).map((s, i) => <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground/70"><span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded bg-muted text-[7px] font-medium">{i + 1}</span>{s}</li>)}</ul></div>}
              {resume.aiInterviewQuestions && <div><p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">Interview Prep</p><ul className="space-y-1">{resume.aiInterviewQuestions.split("\n").filter(Boolean).slice(0, 3).map((q, i) => <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground/70"><span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded bg-muted text-[7px] font-medium">Q{i + 1}</span>{q}</li>)}</ul></div>}
              {resume.aiSummary && <div className="sm:col-span-2"><p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">Optimized Summary</p><p className="rounded-lg bg-muted/20 p-3 text-xs italic leading-relaxed text-muted-foreground/70">{resume.aiSummary}</p></div>}
            </div>
          </div>
        )}

        {prev && (
          <div className={"card-ui-solid p-5" + (hasAI ? "" : " lg:col-start-1")}>
            <div className="flex items-center gap-2 mb-4"><ArrowUp className="h-4 w-4 text-muted-foreground" /><p className="section-label">vs v{vn - 1}</p></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-green-500/5 px-3 py-2"><span className="flex items-center gap-1.5 text-xs text-muted-foreground/70"><ArrowUp className="h-3 w-3 text-green-400" /> New</span><span className="text-sm font-medium text-green-400">{newK.length}</span></div>
              <div className="flex items-center justify-between rounded-lg bg-blue-500/5 px-3 py-2"><span className="flex items-center gap-1.5 text-xs text-muted-foreground/70"><Minus className="h-3 w-3 text-blue-400" /> Retained</span><span className="text-sm font-medium text-blue-400">{retK.length}</span></div>
              <div className="flex items-center justify-between rounded-lg bg-red-500/5 px-3 py-2"><span className="flex items-center gap-1.5 text-xs text-muted-foreground/70"><ArrowDown className="h-3 w-3 text-red-400" /> Dropped</span><span className="text-sm font-medium text-red-400">{dropK.length}</span></div>
              <div className="flex items-center justify-between border-t border-border/30 pt-2 mt-2"><span className="text-xs text-muted-foreground/70">Score delta</span><span className={"text-sm font-bold " + (delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-muted-foreground")}>{delta > 0 ? "+" : ""}{delta}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="keywords">
        <div className="sticky top-12 z-40 -mx-4 px-4 py-2 bg-background/80 backdrop-blur-xl">
          <TabsList className="card-ui-solid w-full justify-start overflow-x-auto">
            <TabsTrigger value="keywords">Keywords Found</TabsTrigger>
            <TabsTrigger value="missing">Missing</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="rewrite" className="flex items-center gap-1.5"><Wand2 className="h-3.5 w-3.5" />Rewriter</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="keywords" className="mt-5"><div className="card-ui-solid p-5"><p className="section-label mb-3">Keywords Found</p>{resume.keywords ? <div className="flex flex-wrap gap-1.5">{resume.keywords.split(", ").filter(Boolean).map((k) => <Badge key={k} className="bg-accent-blue-bg text-accent-blue text-[11px]">{k}</Badge>)}</div> : <p className="text-sm text-muted-foreground/60">No keywords found</p>}</div></TabsContent>
        <TabsContent value="missing" className="mt-5"><div className="card-ui-solid p-5"><p className="section-label mb-3">Missing Keywords</p>{resume.missingKeywords ? <div className="flex flex-wrap gap-1.5">{resume.missingKeywords.split(", ").filter(Boolean).map((k) => <Badge key={k} variant="destructive" className="text-[11px]">{k}</Badge>)}</div> : <p className="text-sm text-green-400/80">No missing keywords!</p>}</div></TabsContent>
        <TabsContent value="suggestions" className="mt-5"><div className="card-ui-solid p-5"><p className="section-label mb-3">Improvement Suggestions</p>{resume.suggestions ? <div className="space-y-2">{resume.suggestions.split(". ").filter(Boolean).map((s, i) => <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/30 p-3"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-muted text-[9px] font-medium text-muted-foreground">{i + 1}</span><p className="text-sm text-muted-foreground/80">{s.replace(/\.$/, "")}</p></div>)}</div> : <p className="text-sm text-green-400/80">Great resume! No suggestions needed.</p>}</div></TabsContent>
        <TabsContent value="rewrite" className="mt-5"><ResumeRewriter resumeId={id} fileName={resume.fileName} /></TabsContent>
      </Tabs>
    </div>
  );
}
