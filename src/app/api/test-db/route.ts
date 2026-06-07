import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const resume = await prisma.resume.create({
      data: {
        fileName: "Rajat Resume.pdf",
        atsScore: 87,
      },
    });

    return NextResponse.json({
      success: true,
      resume,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error,
    });
  }
}