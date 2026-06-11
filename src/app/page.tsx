"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Sparkles, Target, MessageSquare } from "lucide-react";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

const features = [
  { icon: Target, title: "ATS Scoring", desc: "Real-time compatibility scoring with detailed keyword breakdowns for any role." },
  { icon: BarChart3, title: "Keyword Analysis", desc: "Identify exactly what's missing and get role-specific keyword recommendations." },
  { icon: Sparkles, title: "AI Insights", desc: "Smart suggestions, optimized summaries, and tailored interview questions." },
  { icon: MessageSquare, title: "Interview Prep", desc: "Generate role-specific interview questions based on your resume content." },
];

const stats = [
  { value: "100+", label: "Resumes Analyzed" },
  { value: "85%", label: "Average Score" },
  { value: "10x", label: "More Interviews" },
];

export default function Home() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="page-container">
      <div className="mx-auto max-w-4xl pt-20 sm:pt-28 pb-16 sm:pb-20">
        {/* Hero */}
        <motion.div variants={fadeUp} className="text-center">
          <div className="hero-badge mb-6 inline-flex">
            <Sparkles className="h-3 w-3" />
            AI-Powered ATS Optimization
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Beat the bots.
            <br />
            <span className="text-muted-foreground/60">Get more interviews.</span>
          </h1>
          <p className="mt-4 mx-auto max-w-xl text-sm text-muted-foreground/60 leading-relaxed">
            Upload your resume, analyze your ATS score, find missing keywords, and get
            actionable suggestions to optimize for any job.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/upload">
              <Button size="default">
                Upload Resume
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/resumes">
              <Button variant="outline" size="default">
                View History
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp} className="mt-16 grid grid-cols-3 gap-8 border-y border-border/30 py-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div variants={fadeUp} className="mt-14 grid gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="card-ui-highlight p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/80">
                <f.icon className="h-4 w-4 text-foreground/70" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* How it works */}
        <motion.div variants={fadeUp} className="mt-14">
          <p className="section-label mb-5 text-center">How it works</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { step: "1", title: "Upload", desc: "Upload your PDF resume and optionally paste a job description" },
              { step: "2", title: "Analyze", desc: "Our engine scans keywords, checks ATS compatibility, and runs AI analysis" },
              { step: "3", title: "Optimize", desc: "Review your score, fill gaps, and export an optimized version" },
            ].map((s) => (
              <div key={s.step} className="card-ui p-5 text-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/80 text-xs font-semibold text-muted-foreground mx-auto">{s.step}</span>
                <h3 className="mt-3 text-sm font-semibold">{s.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground/60 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust CTA */}
        <motion.div variants={fadeUp} className="mt-14 text-center">
          <p className="text-xs text-muted-foreground/50 mb-3">Trusted by job seekers worldwide</p>
          <div className="flex items-center justify-center gap-6 text-muted-foreground/30">
            {["Indeed", "LinkedIn", "Glassdoor", "Monster"].map((name) => (
              <span key={name} className="text-xs font-semibold tracking-wider uppercase">{name}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
