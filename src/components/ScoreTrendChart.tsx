"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props { data: { version: number; score: number; date: string; id: string }[] }

export default function ScoreTrendChart({ data }: Props) {
  if (data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
        <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.12} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260 / 0.3)" vertical={false} />
        <XAxis dataKey="version" tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} tickFormatter={(v) => `v${v}`} axisLine={{ stroke: "oklch(0.28 0.01 260 / 0.3)" }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "oklch(0.17 0.01 260)", border: "1px solid oklch(0.28 0.01 260 / 0.5)", borderRadius: 8, fontSize: 12, color: "oklch(0.95 0.005 260)" }} labelFormatter={(l) => `Version ${l}`} formatter={(v) => [`${v}/100`, "ATS Score"]} />
        <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={1.5} fill="url(#sg)" dot={{ r: 3, fill: "oklch(0.17 0.01 260)", stroke: "#22c55e", strokeWidth: 1.5 }} activeDot={{ r: 5, fill: "#22c55e", stroke: "oklch(0.17 0.01 260)", strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
