import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3.5 bg-card border border-border/60 rounded-2xl rounded-tl-sm w-fit shadow-xs">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.span
          key={i}
          className="block w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay }}
        />
      ))}
    </div>
  );
}
