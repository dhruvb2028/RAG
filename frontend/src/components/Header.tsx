import { useTheme } from "./theme-provider";
import { Moon, Sun } from "lucide-react";

export function Header() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="shrink-0 h-12 flex items-center px-5 border-b border-border/60 bg-background/95 backdrop-blur-sm z-50">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3h10M2 7h7M2 11h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          RAG
        </span>
        <span className="text-sm font-light text-primary/80 -ml-1">: Knowledge Retrieval Platform</span>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs text-muted-foreground font-medium">Connected</span>
        </div>

        <div className="w-px h-4 bg-border" />

        <button
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
          <Moon className="h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
        </button>
      </div>
    </header>
  );
}
