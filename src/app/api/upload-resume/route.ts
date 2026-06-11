import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { extractPdfText } from "@/lib/extractPdfText";
import { extractKeywords } from "@/lib/extractKeywords";
import { analyzeWithAI } from "@/lib/aiAnalysis";
import type { UploadResult } from "@/lib/types";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const roleKeywords: Record<string, string[]> = {
  "frontend developer": [
    "react", "javascript", "typescript", "html", "css", "nextjs",
    "tailwind", "sass", "webpack", "jest", "git", "rest api",
  ],
  "backend developer": [
    "node", "python", "java", "sql", "nosql", "rest", "graphql",
    "docker", "postgresql", "mongodb", "git", "api",
  ],
  "full stack developer": [
    "react", "node", "python", "javascript", "typescript", "sql",
    "docker", "rest", "graphql", "aws", "git", "ci/cd",
  ],
  "software engineer": [
    "python", "java", "go", "algorithms", "data structures",
    "system design", "sql", "git", "testing", "agile",
  ],
  "data scientist": [
    "python", "r", "machine learning", "deep learning", "nlp",
    "statistics", "sql", "tensorflow", "pytorch", "pandas",
  ],
  "data analyst": [
    "sql", "excel", "power bi", "python", "tableau", "analytics",
    "statistics", "visualization",
  ],
  "business analyst": [
    "sql", "excel", "power bi", "requirements", "stakeholders",
    "analytics", "agile", "documentation",
  ],
  "product manager": [
    "agile", "scrum", "roadmap", "stakeholder", "analytics",
    "a/b testing", "user research", "strategy", "kpi", "jira",
  ],
  "devops engineer": [
    "docker", "kubernetes", "terraform", "aws", "azure", "ci/cd",
    "jenkins", "ansible", "linux", "prometheus", "git",
  ],
  "machine learning engineer": [
    "python", "machine learning", "deep learning", "tensorflow",
    "pytorch", "nlp", "computer vision", "docker", "sql", "mlops",
  ],
  "cloud engineer": [
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
    "linux", "networking", "ci/cd", "python",
  ],
  "qa engineer": [
    "testing", "selenium", "cypress", "jest", "automation",
    "api testing", "regression", "agile", "jira", "python",
  ],
  "ui/ux designer": [
    "figma", "sketch", "user research", "wireframe", "prototype",
    "usability", "design system", "adobe xd", "photoshop",
  ],
  "project manager": [
    "project management", "agile", "scrum", "stakeholder",
    "budgeting", "risk management", "jira", "timeline", "reporting",
  ],
  "cybersecurity analyst": [
    "security", "penetration testing", "compliance", "risk assessment",
    "network security", "linux", "python", "firewall", "encryption",
  ],
  "data engineer": [
    "python", "sql", "etl", "spark", "airflow", "data warehouse",
    "aws", "docker", "kafka", "big data",
  ],
  "mobile developer": [
    "kotlin", "swift", "react native", "flutter", "android",
    "ios", "rest api", "git", "firebase", "typescript",
  ],
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("resume") as File | null;
    const jobRoleRaw = (formData.get("jobRole") as string) || "";
    const jobDescriptionRaw = (formData.get("jobDescription") as string) || "";
    const resumeIdRaw = (formData.get("resumeId") as string) || "";

    // Validate inputs
    const input = z.object({
      jobRole: z.string().max(200).optional().default(""),
      jobDescription: z.string().max(50000).optional().default(""),
      resumeId: z.string().max(100).optional().default(""),
    }).safeParse({ jobRole: jobRoleRaw, jobDescription: jobDescriptionRaw, resumeId: resumeIdRaw });

    if (!input.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input", error: input.error.flatten() },
        { status: 400 }
      );
    }

    const jobRole = jobRoleRaw.toLowerCase();
    const jobDescription = jobDescriptionRaw.trim();

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type (mime + extension)
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, message: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "File exceeds 4 MB limit" },
        { status: 400 }
      );
    }

    // Validate PDF magic bytes (%PDF-)
    const headerBytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    const magic = String.fromCharCode(...headerBytes);
    if (magic !== "%PDF-") {
      return NextResponse.json(
        { success: false, message: "File is not a valid PDF (missing PDF header)" },
        { status: 400 }
      );
    }

    if (!jobRole && !jobDescription) {
      return NextResponse.json(
        { success: false, message: "Enter a target job role or paste a job description" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF using custom zero-dependency extractor
    let resumeText = "";
    let diagnostic = null;
    try {
      resumeText = extractPdfText(buffer).toLowerCase();
      console.log(`Extracted ${resumeText.length} chars from PDF`);
      if (resumeText.length === 0) {
        const header = buffer.subarray(0, 200).toString("binary").replace(/[\x00-\x1f]/g, ".");
        console.log("PDF raw header:", header);
        diagnostic = { header, size: buffer.length, isPDF: buffer.subarray(0, 5).toString() === "%PDF-" };
      }
    } catch (pdfError) {
      console.error("PDF parsing failed, continuing with empty content:", pdfError);
    }

    // Normalize text: strip all whitespace so "p o w er b i" matches "power bi"
    const normText = resumeText.replace(/\s+/g, "");

    // Determine keywords source
    let keywords: string[] = [];
    let keywordSource: "jd" | "role" = "role";
    let usedRole = jobRole;
    let jdKeywords: string[] = [];

    if (jobDescription) {
      // JD-based analysis
      keywordSource = "jd";
      jdKeywords = extractKeywords(jobDescription);
      keywords = jdKeywords;
      usedRole = jobRole || "custom";
    } else {
      // Role-based analysis with fuzzy matching
      keywords = roleKeywords[jobRole] || [];
      if (keywords.length === 0 && jobRole) {
        const normalize = (s: string) => s.replace(/[\s-]+/g, "");
        const norm = normalize(jobRole);
        const matchedKey = Object.keys(roleKeywords).find(key =>
          norm.includes(normalize(key)) || normalize(key).includes(norm)
        );
        if (matchedKey) keywords = roleKeywords[matchedKey];
      }
    }

    // Calculate actual ATS score based on keyword matching
    let matchedCount = 0;
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const keyword of keywords) {
      if (normText.includes(keyword.replace(/\s+/g, "").toLowerCase())) {
        matchedCount++;
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    }

    // If role-based and zero matches, auto-detect best role
    if (keywordSource === "role" && matchedKeywords.length === 0 && resumeText.length > 50) {
      let bestRole = "";
      let bestCount = 0;
      const bestMatched: string[] = [];
      const bestMissing: string[] = [];
      for (const [role, kws] of Object.entries(roleKeywords)) {
        const m: string[] = [];
        const miss: string[] = [];
        for (const kw of kws) {
          if (normText.includes(kw.replace(/\s+/g, ""))) m.push(kw);
          else miss.push(kw);
        }
        if (m.length > bestCount) {
          bestCount = m.length;
          bestRole = role;
          bestMatched.splice(0, bestMatched.length, ...m);
          bestMissing.splice(0, bestMissing.length, ...miss);
        }
      }
      if (bestRole && bestCount > 0) {
        usedRole = bestRole;
        matchedKeywords.splice(0, matchedKeywords.length, ...bestMatched);
        missingKeywords.splice(0, missingKeywords.length, ...bestMissing);
        matchedCount = bestCount;
        keywords = roleKeywords[bestRole];
      }
    }

    const atsScore = keywords.length > 0
      ? Math.floor((matchedCount / keywords.length) * 100)
      : 0;

    // Generate suggestions grouped by category
    let suggestions = "";
    if (keywordSource === "jd" && jobDescription) {
      suggestions = missingKeywords
        .map(kw => `Add "${kw}" to your resume.`)
        .join(" ");
    } else {
      suggestions = missingKeywords
        .map(kw => `Add ${kw} experience.`)
        .join(" ");
    }

    // AI-powered analysis (falls back to null if unavailable/fails)
    const aiResult = await analyzeWithAI(resumeText, usedRole, jobDescription);
    const aiRateLimited = (aiResult as unknown as { _rateLimited?: boolean } | null)?._rateLimited === true;

    // Determine version group
    let versionGroupId = "";
    if (resumeIdRaw) {
      const original = await prisma.resume.findUnique({ where: { id: resumeIdRaw }, select: { versionGroupId: true } });
      if (original?.versionGroupId) {
        versionGroupId = original.versionGroupId;
      }
    }

    const resumeId = crypto.randomUUID();

    const resume = await prisma.resume.create({
      data: {
        id: resumeId,
        fileName: file.name,
        content: resumeText.replace(/\0/g, "").substring(0, 50000),
        jobRole: usedRole,
        keywords: matchedKeywords.join(", "),
        missingKeywords: missingKeywords.join(", "),
        suggestions,
        atsScore,
        keywordSource,
        jobDescription: jobDescription || null,
        jdKeywords: jdKeywords.length > 0 ? jdKeywords.join(", ") : null,
        aiMissingSkills: aiResult?.missingSkills?.join(", ") || null,
        aiSuggestions: aiResult?.suggestions?.join("\n") || null,
        aiSummary: aiResult?.summaryOptimization || null,
        aiInterviewQuestions: aiResult?.interviewQuestions?.join("\n") || null,
        versionGroupId: versionGroupId || resumeId,
      },
    });

    // Compute version number
    const siblings = await prisma.resume.findMany({
      where: { versionGroupId: resume.versionGroupId },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    const versionNumber = siblings.findIndex(s => s.id === resume.id) + 1;

    const result: UploadResult = {
      success: true,
      resumeId: resume.id,
      fileName: file.name,
      jobRole: usedRole,
      userRole: jobRole || undefined,
      atsScore,
      keywordSource,
      matchedKeywords,
      missingKeywords,
      suggestions,
      versionGroupId: resume.versionGroupId || undefined,
      versionNumber,
      ...(aiRateLimited && { aiWarning: "AI analysis is temporarily rate-limited. Results will be available later." }),
      ...(!aiRateLimited && aiResult?.missingSkills?.length && { aiMissingSkills: aiResult.missingSkills.join(", ") }),
      ...(!aiRateLimited && aiResult?.suggestions?.length && { aiSuggestions: aiResult.suggestions.join("\n") }),
      ...(!aiRateLimited && aiResult?.summaryOptimization && { aiSummary: aiResult.summaryOptimization }),
      ...(!aiRateLimited && aiResult?.interviewQuestions?.length && { aiInterviewQuestions: aiResult.interviewQuestions.join("\n") }),
      ...(jdKeywords.length > 0 && { jdKeywords }),
      ...(diagnostic && { diagnostic }),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
