"use client";

import { useEffect, useState } from "react";

export default function AnalysisPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resume, setResume] = useState<any>(null);

  useEffect(() => {
    fetch("/api/resumes")
      .then((res) => res.json())
      .then((data) => {
        const list = data.resumes ?? data;
        if (list.length > 0) {
          setResume(list[0]);
        }
      });
  }, []);

  if (!resume) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        Loading...
      </main>
    );
  }

  const keywords =
    resume.keywords && typeof resume.keywords === "string"
      ? resume.keywords.split(", ")
      : [];

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-5xl font-bold">
          ATS Analysis Report
        </h1>

        <div className="rounded-xl border border-zinc-800 p-8">
          <p className="text-zinc-400">
            ATS Score
          </p>

          <p className="mt-3 text-6xl font-bold text-green-400">
            {resume.atsScore}/100
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-zinc-800 p-8">
          <h2 className="mb-4 text-2xl font-semibold">
            Recommended Keywords
          </h2>

          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {keywords.map((keyword: string) => (
                <span
                  key={keyword}
                  className="rounded-full bg-green-500/20 px-4 py-2 text-green-400"
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400">
              No keywords found
            </p>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-zinc-800 p-8">
          <p>
            <strong>Resume:</strong> {resume.fileName}
          </p>

          <p className="mt-2">
            <strong>Role:</strong> {resume.jobRole}
          </p>
        </div>
      </div>
    </main>
  );
} 