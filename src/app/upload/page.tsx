"use client";

import { useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AtsScoreCard from "@/components/AtsScoreCard";
import SkillGapChart from "@/components/SkillGapChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Loader2, ChevronRight, X, AlertCircle, Sparkles, Lightbulb, MessageSquare, Briefcase, FileCode } from "lucide-react";
import { toast } from "sonner";
import type { UploadResult } from "@/lib/types";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export default function UploadPage() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resumeId");
  const dropRef = useRef<HTMLLabelElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "uploading" | "analyzing" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const selectFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) { toast.error("Only PDF files are accepted"); return; }
    if (f.size > 4 * 1024 * 1024) { toast.error("File exceeds 4 MB limit"); return; }
    setFile(f); setFileName(f.name); setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) selectFile(f);
  }, [selectFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); }, []);
  const clearFile = useCallback(() => { setFile(null); setFileName(""); }, []);

  const handleUpload = () => {
    if (!file) return;
    if (!jobRole.trim() && !jobDescription.trim()) {
      setError("Please enter a target job role or paste a job description.");
      toast.error("Please enter a target job role or paste a job description.");
      return;
    }
    setLoading(true); setPhase("uploading"); setProgress(0); setResult(null); setError(null);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobRole", jobRole);
    if (jobDescription.trim()) formData.append("jobDescription", jobDescription);
    if (resumeId) formData.append("resumeId", resumeId);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          setPhase("done"); setResult(data);
          toast.success("Analysis complete!", { description: `${data.fileName} scored ${data.atsScore}/100` });
        } else {
          const msg = data.error || data.message || "Upload failed";
          setError(msg); setPhase("idle"); toast.error(msg);
        }
      } catch {
        setError("Invalid server response"); setPhase("idle"); toast.error("Invalid server response");
      } finally { setLoading(false); setProgress(0); }
    };
    xhr.onerror = () => { setError("Network error. Please try again."); setPhase("idle"); toast.error("Network error. Please try again."); setLoading(false); setProgress(0); };
    xhr.open("POST", "/api/upload-resume");
    xhr.send(formData);
    const checkProgress = setInterval(() => {
      setProgress((p) => { if (p >= 100) { clearInterval(checkProgress); setPhase("analyzing"); return p; } return p; });
    }, 200);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="page-container py-10 sm:py-14">
      <motion.div variants={fadeUp} className="max-w-xl mb-10">
        <div className="hero-badge mb-4">
          <Sparkles className="h-3 w-3" />
          {resumeId ? "New Version" : "Resume Analysis"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{resumeId ? "Upload New Version" : "Analyze Your Resume"}</h1>
        <p className="mt-2 text-sm text-muted-foreground/60 max-w-md leading-relaxed">
          {resumeId
            ? "Upload an updated version to track your ATS score progression"
            : "Upload your PDF, add context, and get a detailed ATS analysis with AI-powered recommendations."}
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <div className="card-ui-solid divide-y divide-border/30">
            {/* Job Role */}
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <label className="label-ui">
                <Briefcase className="h-3.5 w-3.5 text-accent-blue" />
                Target Job Role
                <span className="text-xs font-normal text-muted-foreground/50 ml-1">optional</span>
              </label>
              <input type="text" placeholder="e.g. Frontend Developer" value={jobRole} onChange={(e) => setJobRole(e.target.value)} className="input-ui" />
            </div>

            {/* Job Description */}
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <label className="label-ui">
                <FileCode className="h-3.5 w-3.5 text-accent-blue" />
                Job Description
                <span className="text-xs font-normal text-muted-foreground/50 ml-1">optional</span>
              </label>
              <textarea placeholder="Paste the full job description here for precise keyword matching..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={4} className="textarea-ui" />
            </div>

            {/* Drop zone */}
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <label className="label-ui mb-3">
                <Upload className="h-3.5 w-3.5 text-accent-blue" />
                Resume PDF
                <span className="text-xs font-normal text-muted-foreground/50 ml-1">max 4 MB</span>
              </label>
              <label
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={
                  "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-all duration-300 " +
                  (dragOver ? "border-accent-blue/60 bg-accent-blue-bg/30 scale-[1.01]" :
                   file ? "border-accent-blue/30 bg-accent-blue-bg/15" :
                   "border-border/30 bg-muted/10 hover:border-accent-blue/30 hover:bg-accent-blue-bg/10")
                }
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-blue-bg"><Loader2 className="h-5 w-5 animate-spin text-accent-blue" /></div>
                      <div className="text-center">
                        <p className="text-sm text-foreground/80 font-medium">{phase === "analyzing" ? "Analyzing with AI..." : `Uploading... ${progress}%`}</p>
                        <p className="text-xs text-muted-foreground/50 mt-0.5">{phase === "analyzing" ? "Scanning keywords & generating insights" : "Sending your file securely"}</p>
                      </div>
                    </motion.div>
                  ) : file ? (
                    <motion.div key="file" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue-bg"><FileText className="h-4 w-4 text-accent-blue" /></div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground/90 truncate max-w-[180px] sm:max-w-xs">{fileName}</p>
                          <p className="text-xs text-muted-foreground/60">{(file.size / 1024 / 1024).toFixed(2)} MB &middot; PDF</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); clearFile(); }} className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50"><Upload className="h-5 w-5 text-muted-foreground/50" /></div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{dragOver ? "Drop your PDF here" : "Drop PDF here or click to browse"}</p>
                        <p className="text-xs text-muted-foreground/40 mt-0.5">PDF only, up to 4 MB</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f); }} />
              </label>
            </div>

            {/* Progress + CTA */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-3">
              <AnimatePresence>
                {loading && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground/70">{phase === "analyzing" ? "Analyzing with AI..." : "Uploading..."}</span>
                      <span className="font-medium tabular-nums text-accent-blue">{phase === "analyzing" ? "almost done" : `${progress}%`}</span>
                    </div>
                    <Progress value={phase === "analyzing" ? 100 : progress} className="h-1.5 rounded-full bg-accent-blue/10 [&>div]:bg-accent-blue [&>div]:rounded-full" />
                  </motion.div>
                )}
              </AnimatePresence>
              {fileName && !loading && (
                <Button onClick={handleUpload} className="w-full">
                  Analyze Resume <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && !loading && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/[0.03] px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Sidebar Hint */}
        <motion.div variants={fadeUp} className="lg:col-span-2 hidden lg:block">
          <div className="card-ui p-5 space-y-4">
            <p className="section-label">Tips for best results</p>
            <div className="space-y-3 text-sm text-muted-foreground/60">
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent-blue-bg text-[10px] font-medium text-accent-blue">1</span>
                <p>Paste the full job description for the most accurate keyword matching.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent-blue-bg text-[10px] font-medium text-accent-blue">2</span>
                <p>Use a clean, text-based PDF — scanned images may not extract properly.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent-blue-bg text-[10px] font-medium text-accent-blue">3</span>
                <p>Upload updated versions to track your score improvement over time.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-12 space-y-5">
          <div className="card-ui-solid flex items-center gap-4 p-4 sm:p-5">
            <AtsScoreCard score={result.atsScore} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{result.fileName}</p>
              <p className="text-xs text-muted-foreground/60 capitalize mt-0.5">
                {result.jobRole} &middot; v{result.versionNumber || 1}
                {result.keywordSource === "jd" ? " \u00B7 JD-based" : " \u00B7 Role-based"}
              </p>
            </div>
            <Link href={`/resumes/${result.resumeId}`}><Button variant="outline" size="sm">Full Report <ChevronRight className="ml-1 h-3 w-3" /></Button></Link>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start bg-muted/20 p-0.5 rounded-lg border border-border/30">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              {(result.aiMissingSkills || result.aiSuggestions || result.aiSummary || result.aiInterviewQuestions) && <TabsTrigger value="ai">AI Analysis</TabsTrigger>}
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="card-ui-solid p-5 text-center"><p className="section-label mb-4">ATS Score</p><AtsScoreCard score={result.atsScore} size="lg" /></div>
                <div className="card-ui-solid p-5"><p className="section-label mb-4">Keyword Coverage</p><SkillGapChart matched={result.matchedKeywords?.length || 0} missing={result.missingKeywords?.length || 0} /></div>
              </div>
              {result.suggestions && <div className="card-ui-solid p-5"><p className="section-label mb-2">Quick Suggestions</p><p className="text-sm text-muted-foreground/80 leading-relaxed">{result.suggestions}</p></div>}
              {result.missingKeywords && result.missingKeywords.length > 0 && <div className="card-ui-solid p-5"><p className="section-label mb-3">Missing Keywords</p><div className="flex flex-wrap gap-1.5">{result.missingKeywords.slice(0, 6).map((k) => <Badge key={k} variant="destructive" className="text-[11px]">{k}</Badge>)}{result.missingKeywords.length > 6 && <span className="text-xs text-muted-foreground/50">+{result.missingKeywords.length - 6} more</span>}</div></div>}
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4 pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="card-ui-solid p-5"><p className="section-label mb-3">Missing Keywords</p>{result.missingKeywords?.length ? <div className="flex flex-wrap gap-1.5">{result.missingKeywords.map((k) => <Badge key={k} variant="destructive" className="text-[11px]">{k}</Badge>)}</div> : <p className="text-sm text-green-400/80">No missing keywords!</p>}</div>
                <div className="card-ui-solid p-5"><p className="section-label mb-3">Resume Strengths</p>{result.matchedKeywords?.length ? <div className="flex flex-wrap gap-1.5">{result.matchedKeywords.map((k) => <Badge key={k} className="bg-accent-blue-bg text-accent-blue text-[11px]">{k}</Badge>)}</div> : <p className="text-sm text-muted-foreground/60">No keywords matched</p>}</div>
              </div>
              {result.jdKeywords?.length ? <div className="card-ui-solid p-5"><p className="section-label mb-3">JD Extracted Keywords ({result.jdKeywords.length})</p><div className="flex flex-wrap gap-1.5">{result.jdKeywords.map((k) => <span key={k} className="rounded-md bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground/70">{k}</span>)}</div></div> : null}
            </TabsContent>

            <TabsContent value="ai" className="space-y-4 pt-5">
              {result.aiMissingSkills && <div className="card-ui-solid p-5"><p className="flex items-center gap-1.5 text-xs font-medium text-accent-blue uppercase tracking-wider mb-3"><Sparkles className="h-3 w-3" /> Missing Skills</p><div className="flex flex-wrap gap-1.5">{result.aiMissingSkills.split(", ").filter(Boolean).map((s) => <Badge key={s} className="bg-accent-blue-bg text-accent-blue text-[11px]">{s}</Badge>)}</div></div>}
              {result.aiSuggestions && <div className="card-ui-solid p-5"><p className="flex items-center gap-1.5 text-xs font-medium text-accent-blue uppercase tracking-wider mb-3"><Lightbulb className="h-3 w-3" /> Improvement Suggestions</p><ul className="space-y-2">{result.aiSuggestions.split("\n").filter(Boolean).map((s, i) => <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground/80"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent-blue-bg text-[9px] font-medium text-accent-blue">{i + 1}</span>{s}</li>)}</ul></div>}
              {result.aiSummary && <div className="card-ui-solid p-5"><p className="flex items-center gap-1.5 text-xs font-medium text-accent-blue uppercase tracking-wider mb-3"><Sparkles className="h-3 w-3" /> Optimized Summary</p><p className="text-sm italic leading-relaxed text-muted-foreground/70">{result.aiSummary}</p></div>}
              {result.aiInterviewQuestions && <div className="card-ui-solid p-5"><p className="flex items-center gap-1.5 text-xs font-medium text-accent-blue uppercase tracking-wider mb-3"><MessageSquare className="h-3 w-3" /> Interview Questions</p><ul className="space-y-2">{result.aiInterviewQuestions.split("\n").filter(Boolean).map((q, i) => <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground/80"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent-blue-bg text-[9px] font-medium text-accent-blue">Q{i + 1}</span>{q}</li>)}</ul></div>}
            </TabsContent>

            <TabsContent value="details" className="space-y-4 pt-5">
              <div className="card-ui-solid p-5"><p className="section-label mb-3">Metadata</p><div className="space-y-1.5 text-sm text-muted-foreground/70"><p><span className="font-medium text-foreground/80">Resume:</span> {result.fileName}</p><p><span className="font-medium text-foreground/80">Role:</span> {result.jobRole}</p><p><span className="font-medium text-foreground/80">Keywords Source:</span> {result.keywordSource === "jd" ? "Job Description" : "Role Library"}</p>{result.versionNumber && <p><span className="font-medium text-foreground/80">Version:</span> {result.versionNumber}</p>}</div></div>
              <div className="card-ui-solid p-5">{result.suggestions ? <><p className="section-label mb-2">Suggestions</p><p className="text-sm text-muted-foreground/80">{result.suggestions}</p></> : <p className="text-sm text-green-400/80 text-center">Great resume! No suggestions needed.</p>}</div>
              {result.diagnostic && <div className="card-ui-solid p-5"><p className="section-label mb-2">PDF Diagnostic</p><p className="text-xs text-muted-foreground/60">File size: {(result.diagnostic.size / 1024).toFixed(1)} KB<br />Valid PDF: {result.diagnostic.isPDF ? "Yes" : "No"}<br />{result.diagnostic.isPDF ? "No extractable text found. The PDF may be a scanned image." : "File does not start with a valid PDF header."}</p></div>}
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </motion.div>
  );
}
