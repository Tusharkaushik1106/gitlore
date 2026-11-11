export type RepoSourceType = "github" | "zip" | "local";

export interface RepoIdentifier {
  type: RepoSourceType;
  github?: {
    url: string;
    branch?: string;
    personalAccessTokenId?: string; 
  };
  uploadId?: string; 
}

export interface IndexingProgressStep {
  id: "cloning" | "parsing" | "vectorizing" | "architecting";
  label: string;
  status: "pending" | "in_progress" | "done" | "error";
  detail?: string;
}

export interface IndexingMetrics {
  totalFiles?: number;
  indexedFiles?: number;
  totalLines?: number;
  componentsFound?: number;
  languages?: Record<string, number>; 
  hotspots?: Array<{
    path: string;
    complexity: number;
  }>;
}

export interface RepoSummary {
  repoId: string;
  name: string;
  description?: string;
  elevatorPitch?: string;
  architectureOverview?: string;
  techStack?: {
    [key: string]: number; 
  };
}

export interface NarrationContext {
  type: "file" | "symbol" | "repo";
  path?: string;
  symbolName?: string;
  language?: string;
}

export interface Citation {
  id: string;
  path: string;
  startLine?: number;
  endLine?: number;
  summary?: string;
}

export interface NarrationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  citations?: Citation[];
  thinking?: boolean;
}

export interface LLMModelConfig {
  provider: "anthropic";
  model: string;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
}

export interface LLMResponseChunk {
  text: string;
  citations?: Citation[];
  done?: boolean;
}


