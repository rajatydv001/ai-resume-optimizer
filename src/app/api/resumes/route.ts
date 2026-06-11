import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") || "12", 10) || 12));
    const search = (url.searchParams.get("search") || "").trim();

    const skip = (page - 1) * pageSize;
    const where: Prisma.ResumeWhereInput = search
      ? { fileName: { contains: search, mode: "insensitive" } }
      : {};

    const [resumes, total] = await Promise.all([
      prisma.resume.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.resume.count({ where }),
    ]);

    return NextResponse.json({
      resumes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      search,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
