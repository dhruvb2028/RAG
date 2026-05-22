import { useState } from "react";
import { motion } from "framer-motion";
import { ChatMessage as ChatMessageType } from "../lib/types";
import { BookMarked, BrainCircuit, Sparkles, Search, CheckCircle2, XCircle, ChevronDown, ChevronRight, FileSearch } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: ChatMessageType;
}

function RAGStepsViewer({ steps }: { steps: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3 border border-border/50 rounded-xl bg-muted/20 overflow-hidden text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/70 transition-colors text-[11px] font-medium text-muted-foreground hover:text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <BrainCircuit className="w-3.5 h-3.5 text-primary animate-pulse" />
          Corrective RAG Pipeline ({steps.length} {steps.length === 1 ? 'attempt' : 'attempts'})
        </span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="p-3 space-y-3.5 divide-y divide-border/40">
          {steps.map((step, idx) => (
            <div key={idx} className={`${idx > 0 ? "pt-3.5" : ""} space-y-2.5`}>
              <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
                <span className="w-4.5 h-4.5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-[10px]">
                  {step.attempt}
                </span>
                Attempt {step.attempt}
              </div>

              {/* Query Translation */}
              <div className="space-y-1 pl-6 relative">
                <div className="absolute left-1.5 top-1.5 w-1 h-1 rounded-full bg-primary/40" />
                <div className="flex items-center gap-1 text-muted-foreground font-medium text-[10px] uppercase tracking-wider">
                  <Search className="w-3.5 h-3.5 text-primary" />
                  Query Translation
                </div>
                <p className="text-foreground bg-card border border-border/50 px-2 py-1.5 rounded-md italic">
                  "{step.rewrittenQuery}"
                </p>
              </div>

              {/* HyDE */}
              {step.hypotheticalAnswer && (
                <div className="space-y-1 pl-6 relative">
                  <div className="absolute left-1.5 top-1.5 w-1 h-1 rounded-full bg-primary/40" />
                  <div className="flex items-center gap-1 text-muted-foreground font-medium text-[10px] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Hypothetical Answer (HyDE)
                  </div>
                  <p className="text-muted-foreground bg-card border border-border/50 px-2 py-1.5 rounded-md max-h-24 overflow-y-auto leading-relaxed">
                    {step.hypotheticalAnswer}
                  </p>
                </div>
              )}

              {/* LLM relevance judge */}
              {step.judgement && step.judgement.length > 0 && (
                <div className="space-y-1.5 pl-6 relative">
                  <div className="absolute left-1.5 top-1.5 w-1 h-1 rounded-full bg-primary/40" />
                  <div className="flex items-center gap-1 text-muted-foreground font-medium text-[10px] uppercase tracking-wider">
                    <FileSearch className="w-3.5 h-3.5 text-emerald-500" />
                    Chunk Relevance Judgements
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {step.judgement.map((judge: any, jIdx: number) => (
                      <div
                        key={jIdx}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border text-[11px] ${
                          judge.relevant
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-destructive/5 border-destructive/20 text-destructive"
                        }`}
                      >
                        <span className="truncate font-medium">Chunk #{judge.index + 1}</span>
                        <span className="flex items-center gap-1 font-semibold text-[10px] uppercase">
                          {judge.relevant ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Relevant
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Irrelevant
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
                    <BookMarked className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    <span className="truncate max-w-[180px]">{citation}</span>
                  </button>
                ))}
              </div>
            )}

            {message.ragSteps && message.ragSteps.length > 0 && (
              <RAGStepsViewer steps={message.ragSteps} />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
