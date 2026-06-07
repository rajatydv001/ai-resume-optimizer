"use client";

import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";

export default function SkillGapChart({ matched, missing }: { matched: number; missing: number }) {
  const total = matched + missing;
  if (total === 0) return null;
  const pct = Math.round((matched / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-muted-foreground/60">{matched}/{total} keywords</span>
        <span className="text-sm font-semibold">{pct}%</span>
      </div>
      <ResponsiveContainer width="100%" height={10}>
        <BarChart data={[{ value: matched, fill: "#22c55e" }, { value: missing, fill: "#ef4444" }]} layout="vertical" barCategoryGap={0}>
          <XAxis type="number" domain={[0, total]} hide />
          <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={10} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-green-400" /> Matched ({matched})</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" /> Missing ({missing})</span>
      </div>
    </div>
  );
}
