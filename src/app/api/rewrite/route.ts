import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rewriteWithAI } from "@/lib/aiRewrite";

export async function POST(request: Request) {
  try {
    const { resumeId } = await request.json();
    if (!resumeId) {
      return NextResponse.json({ success: false, message: "resumeId required" }, { status: 400 });
    }

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || !resume.content) {
      return NextResponse.json({ success: false, message: "Resume not found or empty" }, { status: 404 });
    }

    const matchedKeywords = resume.keywords?.split(", ").filter(Boolean) || [];
    const missingKeywords = resume.missingKeywords?.split(", ").filter(Boolean) || [];

    const result = await rewriteWithAI(
      resume.content,
      resume.jobRole || "",
      resume.jobDescription || "",
      matchedKeywords,
      missingKeywords,
    );

    if (!result) {
      return NextResponse.json({
        success: false,
        message: "AI rewrite unavailable. Set OPENROUTER_API_KEY or check server logs.",
      }, { status: 503 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
