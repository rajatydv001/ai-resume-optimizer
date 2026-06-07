import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume) {
    return NextResponse.json(
      { success: false, message: "Resume not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(resume);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume) {
    return NextResponse.json(
      { success: false, message: "Resume not found" },
      { status: 404 }
    );
  }

  await prisma.resume.delete({ where: { id } });

  return NextResponse.json({ success: true, message: "Resume deleted" });
}
