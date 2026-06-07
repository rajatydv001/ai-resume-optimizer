const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "shall", "can", "need",
  "must", "about", "above", "after", "again", "all", "also", "any",
  "because", "before", "between", "both", "each", "few", "more", "most",
  "other", "some", "such", "than", "that", "their", "them", "then",
  "there", "these", "they", "this", "those", "through", "under", "very",
  "was", "were", "what", "when", "where", "which", "while", "who", "why",
  "how", "into", "over", "new", "our", "its", "not", "no", "just",
  "per", "within", "without", "across", "along", "among", "around",
  "based", "due", "during", "except", "including", "via", "well",
  "your", "year", "years", "using", "used", "use", "including",
  "related", "such", "various", "within", "able", "along", "also",
  "always", "among", "another", "any", "anything", "both", "each",
  "either", "else", "every", "everything", "few", "first", "further",
  "however", "itself", "least", "less", "like", "likely", "long",
  "many", "may", "might", "much", "myself", "necessary", "neither",
  "never", "next", "often", "ones", "only", "own", "possible", "quite",
  "rather", "really", "regarding", "same", "several", "shall", "should",
  "show", "shows", "shown", "side", "since", "still", "take", "takes",
  "though", "thus", "together", "top", "toward", "towards", "unless",
  "upon", "usual", "usually", "various", "ways", "whereas", "whether",
  "whole", "within", "without", "worth",
  // JD fluff — common JD nouns/adjectives that are not skills
  "we", "you", "your", "our", "they", "looking", "join", "team",
  "skilled", "strong", "excellent", "proven", "proficient", "familiar",
  "familiarity", "knowledge", "understanding", "experience", "ability", "skills",
  "required", "preferred", "qualifications", "responsibilities",
  "requirements", "nice", "including", "etc", "e.g", "i.e",
  "must", "should", "able", "work", "works", "working",
  "role", "position", "job", "candidate", "ideal", "successful",
  "apply", "applications", "send", "resume", "cover", "letter",
  "benefits", "salary", "location", "type", "full-time", "part-time",
  "remote", "hybrid", "onsite", "office", "description",
  "growing", "fast-paced", "collaborative", "environment",
  "opportunity", "growth", "development", "training", "support",
  "diverse", "inclusive", "equal", "employer", "minority", "female",
  "veteran", "disability", "protected", "status", "orientation",
  "gender", "identity", "expression", "race", "color", "religion",
  "national", "origin", "age", "marital", "family", "medical",
  "complete", "review", "consideration", "qualified", "individuals",
  "encouraged", "privacy", "policy", "recruitment", "agency",
  "please", "note", "thank", "thanks", "regards", "sincerely",
  "best", "wishes", "hear", "soon", "contact", "directly",
  "summary", "overview", "about", "key", "main", "primary",
  "secondary", "additional", "other", "various", "multiple",
  "across", "within", "throughout", "wide", "range",
  "duties", "tasks", "activities", "functions", "areas",
  "degree", "bachelor", "master", "phd", "equivalent",
  "practical", "theoretical", "conceptual", "technical", "professional",
  "relevant", "total", "minimum", "maximum",
  // Tech/proper-noun false positives from JDs
  "solution", "solutions", "architectures", "architecture", "framework",
  "design", "designs", "pattern", "patterns", "best", "practices",
  "methodologies", "methodology", "principles", "principle",
  "approach", "approaches", "concepts", "techniques", "tools",
  // Soft skills mentioned as requirements (not keyword-matching targets)
  "communication", "collaboration", "leadership", "mentorship",
  "problem-solving", "critical", "thinking", "analytical", "creativity",
  "proactive", "self-motivated", "adaptability", "flexibility",
]);

const JUNK_KEYWORDS = new Set([
  "full", "stack", "developer", "engineer", "manager", "senior", "junior",
  "lead", "leadership", "build", "define", "roadmap", "hire", "ensure",
  "drive", "handle", "launch", "scale", "scaling", "deliver", "ship",
  "profile", "startup", "startups", "passion", "passionate", "comfortable",
  "candidates", "hiring", "recruitment", "onboarding",
  "product", "products", "platform", "platforms", "application",
  "operations", "optimization", "continuously", "improve", "improving",
  "coordinate", "coordination", "manage", "managing", "management",
  "oversee", "overseeing", "responsible", "responsibility",
  "collaborate", "collaborating", "collaboration",
  "communicate", "communicating", "communication",
  "decision-making", "problem-solving", "analytical",
  "mentor", "mentoring", "mentorship",
  "stakeholder", "stakeholders", "cross-functional",
  "ideation", "deployment", "end-to-end",
  "fast-paced", "dynamic", "agile", "scrum",
  "quality", "performance", "scalability", "reliability",
  "integrations", "integration",
  "production", "deployment", "optimization",
  "architecture", "architect", "architectures",
  "design", "designs", "designer",
  "launch", "launching", "launched",
  "implement", "implementing", "implementation",
  "experience", "expertise", "proficiency", "skilled",
  "proven", "track", "record", "strong", "excellent",
  "outstanding", "exceptional", "solid", "deep",
  "preferred", "required", "qualifications", "requirements",
  "added", "advantage", "bonus", "plus",
  "mindset", "ownership", "mentality", "initiative",
  "independently", "supervision", "autonomous",
  "adaptable", "adaptability", "flexible", "flexibility",
  "startup", "startups", "fast-paced",
  "roles", "role", "position", "opportunity",
  "key", "main", "primary", "secondary", "additional",
  "about", "overview", "summary", "description",
  "it", "its", "they", "their", "them",
  // Junk company/product names from user's actual JD
  "quickhyre", "hrms", "employers",
  // Past-tense action verbs that aren't keywords
  "built", "created", "developed", "designed", "implemented",
  "managed", "led", "drove", "handled", "launched", "delivered",
  "established", "maintained", "improved", "optimized", "reduced",
  "increased", "achieved", "coordinated", "facilitated",
]);

const TECH_KEYWORDS = new Set([
  "react", "angular", "vue", "svelte", "nextjs", "nuxt", "gatsby", "ai",
  "machine learning", "deep learning", "nlp", "computer vision",
  "javascript", "typescript", "node", "deno", "bun",
  "python", "java", "go", "golang", "rust", "c++", "csharp", "dotnet",
  "kotlin", "swift", "ruby", "php", "scala", "elixir", "clojure",
  "html", "css", "sass", "scss", "less", "tailwind", "bootstrap",
  "sql", "nosql", "mysql", "postgresql", "postgres", "mongodb",
  "redis", "elasticsearch", "cassandra", "dynamodb", "bigquery",
  "aws", "azure", "gcp", "google cloud", "amazon web services",
  "docker", "kubernetes", "terraform", "ansible", "jenkins", "ci/cd",
  "git", "github", "gitlab", "bitbucket", "jira", "confluence",
  "rest", "graphql", "grpc", "soap", "api", "microservices",
  "linux", "unix", "bash", "powershell", "shell",
  "machine learning", "deep learning", "nlp", "computer vision",
  "tensorflow", "pytorch", "keras", "scikit-learn", "pandas",
  "numpy", "jupyter", "databricks", "airflow", "spark", "hadoop",
  "tableau", "power bi", "looker", "qlik", "excel", "sheets",
  "seo", "sem", "analytics", "marketing", "salesforce", "hubspot",
  "agile", "scrum", "kanban", "jira", "confluence", "slack",
  "figma", "sketch", "adobe xd", "photoshop", "illustrator", "zeplin",
  "product management", "product strategy", "roadmap", "a/b testing",
  "leadership", "team management", "cross-functional", "stakeholder",
  "communication", "presentation", "negotiation", "mentoring",
  "project management", "pmp", "prince2", "six sigma", "lean",
  "sdlc", "software development", "testing", "qa", "jest",
  "mocha", "chai", "cypress", "playwright", "selenium", "junit",
  "webpack", "vite", "rollup", "babel", "eslint", "prettier",
  "nginx", "apache", "traefik", "haproxy", "load balancing",
  "oauth", "jwt", "saml", "openid", "ssl", "tls", "https",
  "firebase", "supabase", "heroku", "netlify", "vercel", "railway",
  "snowflake", "redshift", "lake", "data warehouse", "etl",
  "blockchain", "web3", "solidity", "ethereum", "bitcoin",
  "iot", "embedded", "firmware", "raspberry pi", "arduino",
  "security", "cybersecurity", "penetration testing", "compliance",
  "mobile", "ios", "android", "react native", "flutter", "xamarin",
  "ui/ux", "user experience", "user interface", "wireframe", "prototype",
  "data science", "statistics", "probability", "regression", "classification",
  "natural language", "time series", "recommendation", "optimization",
  "research", "analysis", "analytics", "insights", "visualization",
  "customer", "client", "vendor", "partner", "b2b", "b2c", "saas",
  "budgeting", "forecasting", "financial", "accounting", "audit",
  "recruitment", "hiring", "onboarding", "hr", "human resources",
  "supply chain", "logistics", "procurement", "inventory", "operations",
  "compliance", "regulatory", "risk management", "governance",
]);

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s-]+/g, "");
}

function isSentenceStart(rawTokens: string[], i: number): boolean {
  if (i === 0) return true;
  const prev = rawTokens[i - 1];
  // Ends with sentence punctuation (. ! ?)
  if (/[.!?]$/.test(prev)) return true;
  // Ends with colon (common in JD lists: "Requirements:" then next line)
  if (/[:,;]$/.test(prev)) return true;
  // Previous token is a bullet/number marker (1., 2., -, •, etc.)
  if (/^[\d•\-\*]+\.?$/.test(prev)) return true;
  return false;
}

function isJunkKeyword(word: string): boolean {
  const lower = word.toLowerCase();
  if (JUNK_KEYWORDS.has(lower)) return true;
  // Single chars
  if (lower.length < 2) return true;
  // Words that are entirely 2 uppercase letters that aren't known tech
  if (/^[A-Z]{2}$/.test(word) && !TECH_KEYWORDS.has(lower)) return true;
  return false;
}

export function extractKeywords(jd: string): string[] {
  const seen = new Set<string>();
  const keywords: string[] = [];

  // Check for multi-word tech phrases first (longest match)
  const lowerJd = jd.toLowerCase();
  const sortedPhrases = [...TECH_KEYWORDS]
    .filter((kw) => kw.includes(" ") || kw.includes("/"))
    .sort((a, b) => b.length - a.length);

  for (const phrase of sortedPhrases) {
    if (lowerJd.includes(phrase)) {
      const key = normalize(phrase);
      if (!seen.has(key)) {
        seen.add(key);
        keywords.push(phrase);
        for (const w of phrase.split(/[\s/]+/)) {
          if (w.length > 1) seen.add(normalize(w));
        }
      }
    }
  }

  // Tokenize — keep raw for sentence detection, cleaned for matching
  const rawTokens = jd
    .replace(/[^a-zA-Z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const tokens = rawTokens
    .map((t) => t.replace(/[.,;:!?]+$/g, ""))
    .filter(Boolean);

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    const lower = word.toLowerCase();

    if (lower.length < 2) continue;
    if (STOP_WORDS.has(lower)) continue;

    const phraseKey = normalize(lower);
    if (seen.has(phraseKey)) continue;

    // Known tech keywords (case-insensitive already)
    if (TECH_KEYWORDS.has(lower)) {
      if (!seen.has(phraseKey)) {
        seen.add(phraseKey);
        keywords.push(lower);
      }
      continue;
    }

    // Capitalized words — skip if sentence-starting or junk
    if (/^[A-Z][a-z]/.test(word) && word.length > 1) {
      if (isSentenceStart(rawTokens, i)) continue;
      if (isJunkKeyword(word)) continue;
      if (!seen.has(phraseKey)) {
        seen.add(phraseKey);
        keywords.push(lower);
      }
      continue;
    }

    // UPPERCASE abbreviations (AWS, API, SQL, etc.) — min 3 chars
    if (/^[A-Z+#]{3,}$/.test(word)) {
      if (isJunkKeyword(word)) continue;
      if (!seen.has(phraseKey)) {
        seen.add(phraseKey);
        keywords.push(lower);
      }
      continue;
    }

    // Words with dots (Node.js, .NET, etc.)
    if (word.includes(".") && word.length > 3) {
      if (!seen.has(phraseKey)) {
        seen.add(phraseKey);
        keywords.push(lower);
      }
      continue;
    }

    // Words with # (C#, .NET Core, etc.)
    if (word.includes("#") && word.length > 2) {
      if (!seen.has(phraseKey)) {
        seen.add(phraseKey);
        keywords.push(lower);
      }
      continue;
    }
  }

  // Filter out junk keywords, deduplicate by normalized form, limit
  const final = [...new Map(keywords.map((kw) => [normalize(kw), kw])).values()]
    .filter((kw) => !isJunkKeyword(kw));
  return final.slice(0, 30);
}
