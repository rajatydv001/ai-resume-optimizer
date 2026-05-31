import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-block rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-400">
            AI Resume Optimizer
          </div>

          <h1 className="mt-8 text-6xl font-bold tracking-tight">
            Beat ATS Systems
            <br />
            Get More Interviews
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Upload your resume, analyze ATS score, find missing keywords,
            optimize content and generate personalized cover letters.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <button className="rounded-lg bg-white px-6 py-3 font-medium text-black">
              Get Started
            </button>

            <button className="rounded-lg border border-zinc-700 px-6 py-3">
              View Demo
            </button>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-4xl">
          <Card className="border-zinc-800 bg-zinc-950">
            <CardContent className="p-8">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                  Resume Analysis Report
                </h2>

                <div className="rounded-lg bg-green-500/20 px-4 py-2 text-green-400">
                  ATS Score: 87/100
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-zinc-800 p-4">
                  <p className="text-zinc-400">Keywords</p>
                  <p className="mt-2 text-3xl font-bold">92%</p>
                </div>

                <div className="rounded-xl border border-zinc-800 p-4">
                  <p className="text-zinc-400">Skills</p>
                  <p className="mt-2 text-3xl font-bold">89%</p>
                </div>

                <div className="rounded-xl border border-zinc-800 p-4">
                  <p className="text-zinc-400">Experience</p>
                  <p className="mt-2 text-3xl font-bold">81%</p>
                </div>

                <div className="rounded-xl border border-zinc-800 p-4">
                  <p className="text-zinc-400">Education</p>
                  <p className="mt-2 text-3xl font-bold">94%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}