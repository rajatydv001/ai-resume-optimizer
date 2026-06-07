import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasApiKey: !!process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || null,
  });
}
