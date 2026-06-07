import { cn } from "@/lib/utils";

const rating = (score: number) =>
  score >= 90 ? { label: "Excellent", color: "text-green-400", ring: "stroke-green-400", bg: "text-green-400/15" }
    : score >= 70 ? { label: "Good", color: "text-yellow-400", ring: "stroke-yellow-400", bg: "text-yellow-400/15" }
    : { label: "Needs Work", color: "text-red-400", ring: "stroke-red-400", bg: "text-red-400/15" };

export default function AtsScoreCard({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const r = rating(score);
  const s = Math.min(100, Math.max(0, score ?? 0));
  const c = 2 * Math.PI * 42;
  const o = c - (s / 100) * c;
  const dim = size === "sm" ? 64 : size === "lg" ? 120 : 88;
  const fs = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className={r.bg} />
          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" strokeLinecap="round" className={r.ring} strokeDasharray={c} strokeDashoffset={o} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", fs)}>{s}</span>
        </div>
      </div>
      <span className={cn("text-[10px] font-medium", r.color)}>{r.label}</span>
    </div>
  );
}
