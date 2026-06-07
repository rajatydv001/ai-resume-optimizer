"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, FileDown, FileText, CheckCircle } from "lucide-react";

interface RewriteResult { summary: string; bullets: string[]; skills: string[]; fullContent: string }
interface Props { resumeId: string; fileName: string }

export default function ResumeRewriter({ resumeId, fileName }: Props) {
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleRewrite = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/rewrite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resumeId }) });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.message || "Rewrite failed"); return; }
      setResult(data);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const handleExport = async (format: "docx" | "pdf") => {
    if (!result) return;
    setExporting(format);
    try {
      const res = await fetch("/api/rewrite/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...result, format, fileName }) });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${fileName.replace(/\.pdf$/i, "")}-Optimized.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch { setError("Export failed. Please try again."); }
    finally { setExporting(null); }
  };

  if (error) return <div className="card-ui-solid p-6 text-center"><p className="text-sm text-destructive/80">{error}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => setError(null)}>Dismiss</Button></div>;

  if (!result) return (
    <div className="card-ui-solid p-10 text-center">
      <Sparkles className="mx-auto mb-3 h-7 w-7 text-muted-foreground/50" />
      <p className="mb-1 text-sm font-medium">AI Resume Rewriter</p>
      <p className="mb-4 text-xs text-muted-foreground/60 max-w-sm mx-auto">Generate an ATS-optimized version of your resume. Missing keywords will be incorporated naturally.</p>
      <Button onClick={handleRewrite} disabled={loading}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rewriting...</> : <><Sparkles className="mr-2 h-4 w-4" /> Rewrite with AI</>}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="card-ui-solid flex items-center justify-between p-4">
        <div className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-400" /><div><p className="text-sm font-medium text-green-400">Resume rewritten successfully</p><p className="text-xs text-muted-foreground/60">Download your optimized resume</p></div></div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleExport("docx")} disabled={exporting === "docx"}>{exporting === "docx" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}DOCX</Button>
          <Button size="sm" onClick={() => handleExport("pdf")} disabled={exporting === "pdf"}>{exporting === "pdf" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileDown className="mr-1.5 h-3.5 w-3.5" />}PDF</Button>
        </div>
      </div>

      <div className="card-ui-solid p-5"><p className="section-label mb-3">Professional Summary</p><p className="text-sm leading-relaxed text-muted-foreground/80">{result.summary}</p></div>
      <div className="card-ui-solid p-5"><p className="section-label mb-3">Updated Skills</p><div className="flex flex-wrap gap-1.5">{result.skills.map((s) => <Badge key={s} className="bg-accent-blue-bg text-accent-blue text-[11px]">{s}</Badge>)}</div></div>
      <div className="card-ui-solid p-5"><p className="section-label mb-3">Improved Bullet Points</p><ul className="space-y-1.5">{result.bullets.map((b, i) => <li key={i} className="flex items-start gap-2 rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground/80"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-muted text-[9px] font-medium text-muted-foreground">{i + 1}</span>{b}</li>)}</ul></div>
      <div className="card-ui-solid p-5"><p className="section-label mb-3">Full Optimized Resume</p><div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/20 p-4 font-mono text-xs leading-relaxed text-muted-foreground/70">{result.fullContent}</div></div>
    </div>
  );
}
