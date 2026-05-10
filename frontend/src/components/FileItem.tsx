import { Document } from "../lib/types";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface FileItemProps {
  document: Document;
  onRemove: (id: string) => void;
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; darkColor: string; darkBg: string }> = {
  pdf:  { label: "PDF",  color: "text-red-600",    bg: "bg-red-50",    darkColor: "text-red-400",    darkBg: "bg-red-950/60" },
  docx: { label: "DOC",  color: "text-blue-600",   bg: "bg-blue-50",   darkColor: "text-blue-400",   darkBg: "bg-blue-950/60" },
  pptx: { label: "PPT",  color: "text-orange-600", bg: "bg-orange-50", darkColor: "text-orange-400", darkBg: "bg-orange-950/60" },
  csv:  { label: "CSV",  color: "text-emerald-600", bg: "bg-emerald-50", darkColor: "text-emerald-400", darkBg: "bg-emerald-950/60" },
  txt:  { label: "TXT",  color: "text-zinc-600",   bg: "bg-zinc-100",  darkColor: "text-zinc-400",   darkBg: "bg-zinc-800/60" },
  md:   { label: "MD",   color: "text-purple-600", bg: "bg-purple-50", darkColor: "text-purple-400", darkBg: "bg-purple-950/60" },
};

const STATUS_CONFIG = {
  Ready:     { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "Ready" },
  Indexing:  { dot: "bg-primary animate-pulse", text: "text-primary", label: "Indexing" },
  Uploading: { dot: "bg-blue-500 animate-pulse", text: "text-blue-600 dark:text-blue-400", label: "Uploading" },
  Error:     { dot: "bg-red-500", text: "text-red-600 dark:text-red-400", label: "Error" },
};

export function FileItem({ document, onRemove }: FileItemProps) {
  const meta = TYPE_META[document.type] ?? TYPE_META.txt;
  const status = STATUS_CONFIG[document.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2 }}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
      data-testid={`file-item-${document.id}`}
    >
      <div className={`shrink-0 w-8 h-9 rounded-md flex items-center justify-center ${meta.bg} dark:${meta.darkBg}`}>
        <span className={`text-[10px] font-bold tracking-wider ${meta.color} dark:${meta.darkColor}`}>
          {meta.label}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-snug" title={document.name}>
          {document.name}
        </p>

        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{document.size}</span>
          {document.pages && document.status === "Ready" && (
            <>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <span className="text-xs text-muted-foreground">{document.pages}p</span>
            </>
          )}
          <span className="text-muted-foreground/40 text-xs">·</span>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
            <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
          </div>
        </div>

        {(document.status === "Uploading" || document.status === "Indexing") && (
          <div className="mt-2 h-0.5 w-full rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${document.progress ?? 0}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        )}
      </div>

      <button
        onClick={() => onRemove(document.id)}
        data-testid={`button-delete-${document.id}`}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all"
        aria-label={`Remove ${document.name}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
