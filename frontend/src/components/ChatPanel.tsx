import { useRef, useEffect, useState } from "react";
import { Send, Trash2, ArrowUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "../hooks/useChat";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTED_QUESTIONS = [
  "Summarize this document",
  "What are the key insights?",
  "Extract action items",
  "Explain in simple terms",
];

export function ChatPanel() {
  const { messages, isTyping, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    sendMessage(input.trim());
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const isEmpty = messages.length === 0;
  const showSuggestions = !isTyping && (isEmpty || messages[messages.length - 1]?.role === "assistant");

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="max-w-2xl mx-auto px-6 py-6 pb-48">
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[320px] text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <svg width="20" height="20" viewBox="0 0 14 14" fill="none" className="text-primary">
                  <path d="M2 3h10M2 7h7M2 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1.5 tracking-tight">
                Ask anything about your documents
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Upload sources on the left, then ask questions, extract insights, or request summaries.
              </p>
            </motion.div>
          ) : (
            <div>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 mb-5"
                  >
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-primary">
                        <path d="M2 3h10M2 7h7M2 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Sticky Bottom */}
      <div className="shrink-0 relative">
        <div className="absolute inset-x-0 -top-12 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="px-6 pb-5 pt-2 bg-background">
          <div className="max-w-2xl mx-auto">
            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-wrap gap-2 mb-3"
                >
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      data-testid={`button-suggestion-${q}`}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Box */}
            <div className={`relative flex items-end bg-card border rounded-xl shadow-sm transition-all duration-150 ${
              input ? "border-primary/50 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]" : "border-border"
            }`}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your documents..."
                rows={1}
                data-testid="input-chat"
                className="flex-1 min-h-[48px] max-h-[160px] w-full resize-none bg-transparent px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
              />
              <div className="flex items-center gap-1 p-2 shrink-0">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    data-testid="button-clear-chat"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
                    title="Clear conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  data-testid="button-send"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] text-muted-foreground/50 mt-2.5">
              Answers are generated exclusively from your uploaded documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
