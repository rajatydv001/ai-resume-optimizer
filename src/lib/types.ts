export interface UploadResult {
  success: boolean;
  resumeId: string;
  fileName: string;
  jobRole: string;
  userRole?: string;
  atsScore: number;
  keywordSource: "jd" | "role";
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string;
  versionGroupId?: string;
  versionNumber?: number;
  jdKeywords?: string[];
  diagnostic?: {
    header: string;
    size: number;
    isPDF: boolean;
  };
  aiWarning?: string;
  aiMissingSkills?: string;
  aiSuggestions?: string;
  aiSummary?: string;
  aiInterviewQuestions?: string;
  error?: string;
  message?: string;
}

export interface ResumeListItem {
  id: string;
  fileName: string;
  content?: string | null;
  atsScore?: number | null;
  jobRole?: string | null;
  keywords?: string | null;
  missingKeywords?: string | null;
  suggestions?: string | null;
  keywordSource: string;
  jobDescription?: string | null;
  jdKeywords?: string | null;
  aiMissingSkills?: string | null;
  aiSuggestions?: string | null;
  aiSummary?: string | null;
  aiInterviewQuestions?: string | null;
  versionGroupId?: string | null;
  createdAt: string;
}

export interface ResumeDetail extends ResumeListItem {
  versionHistory?: VersionEntry[];
}

export interface VersionEntry {
  id: string;
  versionNumber: number;
  atsScore: number;
  fileName: string;
  createdAt: string;
}
