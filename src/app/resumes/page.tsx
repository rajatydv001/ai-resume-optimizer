"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ChevronRight, Trash2, RefreshCw, ChevronLeft, ChevronRight as ChevronRightIcon, Search, FileSearch } from "lucide-react";
import type { ResumeListItem } from "@/lib/types";

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } } };

interface PaginatedResponse { resumes: ResumeListItem[]; total: number; page: number; pageSize: number; totalPages: number; search: string; }

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="h-8 w-8 rounded-full bg-muted/60" />
      <div className="flex-1 space-y-1.5"><div className="h-4 w-1/3 rounded bg-muted/60" /><div className="h-3 w-1/5 rounded bg-muted/60" /></div>
      <div className="h-4 w-12 rounded bg-muted/60" />
      <div className="h-4 w-12 rounded bg-muted/60" />
      <div className="h-4 w-16 rounded bg-muted/60" />
      <div className="h-8 w-20 rounded bg-muted/60" />
    </div>
  );
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResumeListItem | null>(null);
  const [search, setSearch] = useState("");

  const fetchResumes = useCallback(async (p: number, q?: string) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: "12" });
      if (q) params.set("search", q);
      const res = await fetch(`/api/resumes?${params}`);
      if (!res.ok) throw new Error("Failed to load resumes");
      const data: PaginatedResponse = await res.json();
      setResumes(data.resumes); setTotalPages(data.totalPages); setTotal(data.total); setPage(data.page);
    } catch { setError("Could not load resumes. Check your connection and try again."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => fetchResumes(1, search), 350); return () => clearTimeout(t); }, [search, fetchResumes]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id; setDeletingId(id); setDeleteTarget(null);
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setResumes(prev => prev.filter(r => r.id !== id));
      toast.success("Resume deleted");
    } catch { toast.error("Failed to delete resume."); }
    finally { setDeletingId(null); }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="page-container py-10 sm:py-14">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resume History</h1>
          <p className="text-sm text-muted-foreground/60 mt-1">View past analyses and track your improvement</p>
        </div>
        {!loading && !error && total > 0 && <p className="text-xs text-muted-foreground/50 shrink-0">{total} resume{total !== 1 ? "s" : ""}{totalPages > 1 ? ` \u00B7 Page ${page} of ${totalPages}` : ""}</p>}
      </motion.div>

      {/* Search bar */}
      <motion.div variants={fadeUp} className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
        <input type="text" placeholder="Search by filename..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-ui pl-9" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">&times;</button>}
      </motion.div>

      {/* Error */}
      {error && <motion.div variants={fadeUp} className="card-ui-solid flex flex-col items-center gap-3 py-10 text-center"><p className="text-sm text-destructive/80">{error}</p><Button variant="outline" size="sm" onClick={() => fetchResumes(page, search)}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry</Button></motion.div>}

      {/* Loading */}
      {loading && !error && <div className="card-ui-solid divide-y divide-border/30">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>}

      {/* Empty */}
      {!loading && !error && resumes.length === 0 && (
        <motion.div variants={fadeUp} className="card-ui-solid flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60"><FileSearch className="h-5 w-5 text-muted-foreground/50" /></div>
          <p className="text-sm font-semibold text-muted-foreground/80">No resumes analyzed yet</p>
          <p className="text-xs text-muted-foreground/50">Upload your first PDF to see your ATS score</p>
          <Link href="/upload"><Button className="mt-2">Upload your first resume</Button></Link>
        </motion.div>
      )}

      {/* Table */}
      {!loading && !error && resumes.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="card-ui-solid overflow-hidden">
            {/* Header row */}
            <div className="hidden sm:flex items-center gap-4 px-5 py-3 bg-muted/30 border-b border-border/30 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
              <div className="flex-1">Filename</div>
              <div className="w-16 text-center">Score</div>
              <div className="w-16 text-center">Match</div>
              <div className="w-16 text-center">Missing</div>
              <div className="w-24 text-center">Source</div>
              <div className="w-20 text-right">Actions</div>
            </div>

            {/* Rows */}
            <motion.div variants={stagger} initial="hidden" animate="visible" className="divide-y divide-border/30">
              {resumes.map((r) => (
                <motion.div key={r.id} variants={fadeUp} className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-4 transition-colors hover:bg-muted/20">
                  {/* Mobile: card style */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue-bg shrink-0">
                      <span className="text-xs font-bold text-accent-blue">{r.atsScore || 0}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{r.fileName}</p>
                      <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                        <span className="text-[10px] text-muted-foreground/60">{r.keywords ? r.keywords.split(", ").length : 0} matched</span>
                        <span className="text-[10px] text-red-400/80">{r.missingKeywords ? r.missingKeywords.split(", ").length : 0} missing</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground/70">{r.keywordSource === "jd" ? "JD" : "Role"}</span>
                      </div>
                      {r.jobRole && <p className="text-xs text-muted-foreground/60 capitalize hidden sm:block">{r.jobRole}</p>}
                    </div>
                  </div>

                  {/* Desktop: data columns */}
                    <div className="hidden sm:flex items-center gap-4 text-sm w-full sm:w-auto">
                      <div className="w-16 text-center font-semibold tabular-nums">{r.atsScore || 0}</div>
                      <div className="w-16 text-center text-muted-foreground/70">{r.keywords ? r.keywords.split(", ").length : 0}</div>
                      <div className="w-16 text-center text-red-400/80">{r.missingKeywords ? r.missingKeywords.split(", ").length : 0}</div>
                      <div className="w-24 text-center"><span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground/70">{r.keywordSource === "jd" ? "JD" : "Role"}</span></div>
                    </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:w-20 sm:justify-end">
                    <Link href={`/resumes/${r.id}`}><Button variant="outline" size="sm" className="h-9 min-w-[44px]"><ChevronRight className="h-4 w-4" /></Button></Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button disabled={deletingId === r.id} className="rounded-lg p-2 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4" /></button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete Resume</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete &quot;{r.fileName}&quot;? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel asChild><Button variant="outline" size="sm">Cancel</Button></AlertDialogCancel><AlertDialogAction asChild><Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button></AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchResumes(page - 1, search)} className="h-9 min-w-[44px]"><ChevronLeft className="h-4 w-4" /></Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => fetchResumes(p, search)} className="min-w-[44px] h-9">{p}</Button>
              ))}
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchResumes(page + 1, search)} className="h-9 min-w-[44px]"><ChevronRightIcon className="h-4 w-4" /></Button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
