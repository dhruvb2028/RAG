import { motion } from "framer-motion";
import { ChatMessage as ChatMessageType } from "../lib/types";
import { BookMarked } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
      className={`flex w-full mb-5 ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`chat-message-${message.id}`}
    >
      {isUser ? (
        <div className="max-w-[72%]">
          <div className="px-4 py-2.5 bg-primary text-primary-foreground rounded-2xl rounded-br-sm text-sm leading-relaxed">
            {message.content}
          </div>
        </div>
      ) : (
        <div className="max-w-[84%] flex gap-3 items-start">
          <div className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-primary">
              <path d="M2 3h10M2 7h7M2 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="px-4 py-3 bg-card border border-border/70 rounded-2xl rounded-tl-sm shadow-xs">
              <div className="text-sm leading-relaxed text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:my-2 prose-p:my-1.5 prose-headings:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>

            {message.citations && message.citations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 pl-1">
                {message.citations.map((citation, idx) => (
                  <button
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted border border-border/50 hover:border-border px-2 py-1 rounded-md transition-colors"
                    data-testid={`citation-${message.id}-${idx}`}
                  >
                    <BookMarked className="w-3 h-3 opacity-60 shrink-0" />
                    <span className="truncate max-w-[180px]">{citation}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
