import OpenAI from "openai";
import { ENV, FALLBACK_MODELS } from "@/lib/env";

export interface RewriteResult {
  summary: string;
  bullets: string[];
  skills: string[];
  fullContent: string;
}

const MODELS_TO_TRY = [ENV.OPENROUTER_MODEL, ...FALLBACK_MODELS.filter(m => m !== ENV.OPENROUTER_MODEL)];

async function tryModels(
  client: OpenAI,
  params: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, "model">,
): Promise<OpenAI.Chat.Completions.ChatCompletion | null> {
  for (const model of MODELS_TO_TRY) {
    try {
      return await client.chat.completions.create({ ...params, model });
    } catch (error) {
      const err = error as { status?: number; error?: { metadata?: { retry_after_seconds?: number } } };
      if (err.status === 429) {
        console.warn(`Model ${model} rate-limited, reporting`);
        throw error;
      }
      console.warn(`Model ${model} failed, trying next:`, (error as Error).message);
    }
  }
  return null;
}

function parseJson(content: string): RewriteResult | null {
  const cleaned = content.replace(/```(?:json)?\n?/g, "").trim();
  try {
    const parsed: RewriteResult = JSON.parse(cleaned);
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      fullContent: typeof parsed.fullContent === "string" ? parsed.fullContent : "",
    };
  } catch {
    return null;
  }
}

export async function rewriteWithAI(
  resumeText: string,
  jobRole: string,
  jobDescription: string,
  matchedKeywords: string[],
  missingKeywords: string[],
): Promise<RewriteResult | null> {
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

  const systemPrompt = `You are an expert ATS resume writer and career coach. Rewrite the resume for the target role. Include ALL missing keywords naturally. Return ONLY valid JSON (no markdown, no code fences):
{
  "summary": "ATS-optimized professional summary (2-3 sentences incorporating key strengths and target role)",
  "bullets": ["rewritten achievement-focused bullet point 1", "rewritten bullet point 2"],
  "skills": ["skill1", "skill2", "skill3"],
  "fullContent": "Complete rewritten resume as plain text with sections: Summary, Skills, Experience, Education"
}`;

  const userPrompt = [
    `Target Role: ${jobRole || "Not specified"}`,
    jobDescription ? `Job Description:\n${jobDescription}` : "",
    matchedKeywords.length > 0 ? `Matched Keywords: ${matchedKeywords.join(", ")}` : "",
    missingKeywords.length > 0 ? `Missing Keywords (MUST INCLUDE): ${missingKeywords.join(", ")}` : "",
    `\nOriginal Resume:\n${resumeText.substring(0, 8000)}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await tryModels(client, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 2500,
    });

    if (!response) return null;

    const content = response.choices?.[0]?.message?.content;
    if (!content) return null;

    return parseJson(content);
  } catch (error) {
    console.error("rewriteWithAI failed:", error);
    const err = error as { status?: number; error?: { metadata?: { retry_after_seconds?: number } } };
    if (err.status === 429) {
      return {
        _rateLimited: true,
        _retryAfter: err.error?.metadata?.retry_after_seconds ?? 30,
      } as unknown as RewriteResult;
    }
    return null;
  }
}
