import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { PdfReport } from "@/components/PdfReport";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const resume = await prisma.resume.findUnique({ where: { id } });
    if (!resume) {
      return NextResponse.json(
        { success: false, message: "Resume not found" },
        { status: 404 }
      );
    }

    // Fetch version history for the report
    const versions = resume.versionGroupId
      ? await prisma.resume.findMany({
          where: { versionGroupId: resume.versionGroupId },
          orderBy: { createdAt: "asc" },
        })
      : null;

    const currentVersionIndex = versions
      ? versions.findIndex(v => v.id === id)
      : undefined;

    const element = PdfReport({
      fileName: resume.fileName,
      jobRole: resume.jobRole,
      keywordSource: resume.keywordSource,
      atsScore: resume.atsScore ?? 0,
      keywords: resume.keywords,
      missingKeywords: resume.missingKeywords,
      suggestions: resume.suggestions,
      jdKeywords: resume.jdKeywords,
      aiMissingSkills: resume.aiMissingSkills,
      aiSuggestions: resume.aiSuggestions,
      aiSummary: resume.aiSummary,
      aiInterviewQuestions: resume.aiInterviewQuestions,
      createdAt: resume.createdAt.toISOString(),
      versions: versions?.map(v => ({
        id: v.id,
        atsScore: v.atsScore,
        fileName: v.fileName,
        createdAt: v.createdAt.toISOString(),
        keywords: v.keywords,
      })),
      currentVersionIndex,
    });

    const blob = await pdf(element).toBlob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ATS-Report-${resume.fileName.replace(/\.pdf$/i, "")}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
