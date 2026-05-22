export interface Document {
  id: string;
  name: string;
  size: string;
  status: "Uploading" | "Indexing" | "Ready" | "Error";
  type: "pdf" | "docx" | "txt" | "csv" | "pptx" | "md";
  progress?: number;
  pages?: number;
}

export interface RAGStep {
  attempt: number;
  rewrittenQuery: string;
  hypotheticalAnswer?: string;
  judgement?: { index: number; relevant: boolean }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  timestamp: number;
  ragSteps?: RAGStep[];
}
