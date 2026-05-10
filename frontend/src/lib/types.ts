export interface Document {
  id: string;
  name: string;
  size: string;
  status: "Uploading" | "Indexing" | "Ready" | "Error";
  type: "pdf" | "docx" | "txt" | "csv" | "pptx" | "md";
  progress?: number;
  pages?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  timestamp: number;
}
