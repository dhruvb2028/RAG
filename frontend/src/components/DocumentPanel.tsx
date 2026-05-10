import { useRef } from "react";
import { UploadCloud } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocuments } from "../hooks/useDocuments";
import { FileItem } from "./FileItem";
import { AnimatePresence, motion } from "framer-motion";

export function DocumentPanel() {
  const {
    documents,
    isDragging,
    addDocument,
    removeDocument,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDocuments();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => addDocument(file));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const readyCount = documents.filter((d) => d.status === "Ready").length;

  return (
    <div className="flex flex-col h-full border-r border-border/60 bg-sidebar">
      {/* Panel Header */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-foreground tracking-tight">Sources</h2>
          {documents.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {readyCount}/{documents.length} ready
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Upload documents to ground the AI's responses.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="px-4 pb-4 shrink-0">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          data-testid="upload-dropzone"
          className={`
            relative cursor-pointer rounded-xl border transition-all duration-200 p-5 text-center
            ${isDragging
              ? "border-primary bg-primary/6 shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]"
              : "border-dashed border-border hover:border-primary/50 hover:bg-muted/40"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.docx,.txt,.csv,.pptx,.md"
            onChange={handleFileSelect}
            data-testid="input-file-upload"
          />

          <div className="flex flex-col items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              isDragging ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              <UploadCloud className="w-4.5 h-4.5" strokeWidth={1.75} />
            </div>

            <div>
              <p className="text-xs font-medium text-foreground">
                {isDragging ? "Release to upload" : "Drop files or click to browse"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PDF, DOCX, TXT, CSV, PPTX, Markdown
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="px-4 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
            Library
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1 px-2 pb-4">
        {documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-muted-foreground/50">
                <rect x="3" y="2" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M12 2l3 3v9a1.5 1.5 0 01-1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M6 7h5M6 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-xs font-medium text-foreground/70 mb-1">No documents yet</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[160px]">
              Upload a file to start asking questions about your content.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-0.5">
            <AnimatePresence initial={false}>
              {documents.map((doc) => (
                <FileItem key={doc.id} document={doc} onRemove={removeDocument} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
