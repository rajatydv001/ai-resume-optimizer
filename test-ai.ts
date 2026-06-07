import dotenv from 'dotenv';
dotenv.config();
import { analyzeWithAI } from './src/lib/aiAnalysis';
import { rewriteWithAI } from './src/lib/aiRewrite';

async function test() {
  const resumeText = "Software Engineer with 5 years of experience in React and Node.js.";
  const jobRole = "Senior Frontend Engineer";
  const jobDescription = "Looking for a React expert with TypeScript experience.";

  console.log("Testing AI Analysis...");
  const analysis = await analyzeWithAI(resumeText, jobRole, jobDescription);
  console.log("Analysis Result:", analysis ? "PASS" : "FAIL");

  console.log("\nTesting AI Rewriter...");
  const rewrite = await rewriteWithAI(resumeText, jobRole, jobDescription, ["React", "Node.js"], ["TypeScript"]);
  console.log("Rewrite Result:", rewrite ? "PASS" : "FAIL");
}

test();
