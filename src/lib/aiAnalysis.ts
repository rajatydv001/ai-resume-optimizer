import OpenAI from "openai";
import { ENV } from "@/lib/env";

export interface AiAnalysisResult {
  missingSkills: string[];
  suggestions: string[];
  summaryOptimization: string;
  interviewQuestions: string[];
}

export async function analyzeWithAI(
  resumeText: string,
  jobRole: string,
  jobDescription: string,
): Promise<AiAnalysisResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://ai-resume-optimizer.vercel.app",
      "X-Title": "AI Resume Optimizer",
    },
  });

  const systemPrompt = `You are an expert ATS resume reviewer and career coach. Analyze the resume for the target role and job description provided. Return ONLY a valid JSON object with these exact keys (no markdown, no code fences):
{
  "missingSkills": ["specific skill 1", "specific skill 2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2"],
  "summaryOptimization": "one paragraph ATS-optimized professional summary",
  "interviewQuestions": ["likely interview question 1", "likely interview question 2"]
}`;

  const userPrompt = [
    `Target Role: ${jobRole || "Not specified"}`,
    jobDescription ? `Job Description:\n${jobDescription}` : "",
    `\nResume Text:\n${resumeText.substring(0, 8000)}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.chat.completions.create({
      model: ENV.OPENROUTER_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return null;

    const cleaned = content.replace(/```(?:json)?\n?/g, "").trim();
    const parsed: AiAnalysisResult = JSON.parse(cleaned);

    return {
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      summaryOptimization: typeof parsed.summaryOptimization === "string" ? parsed.summaryOptimization : "",
      interviewQuestions: Array.isArray(parsed.interviewQuestions) ? parsed.interviewQuestions : [],
    };
  } catch (error) {
    console.error("analyzeWithAI failed:", error);
    return null;
  }
}
