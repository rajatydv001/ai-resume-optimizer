import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ats-resume-optimizer.vercel.app";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${base}/upload`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/resumes`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];
}
