import { ThemeProvider } from "./components/theme-provider";
import { Header } from "./components/Header";
import { DocumentPanel } from "./components/DocumentPanel";
import { ChatPanel } from "./components/ChatPanel";
import { Toaster } from "@/components/ui/toaster";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="documind-theme">
      <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
        <Header />
        <main className="flex flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Left Sidebar: Document Management */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={45}>
              <DocumentPanel />
            </ResizablePanel>

            {/* Professional Drag Handle */}
            <ResizableHandle withHandle className="bg-border/60 hover:bg-primary/50 transition-colors" />

            {/* Right Chat Interface */}
            <ResizablePanel defaultSize={75}>
              <ChatPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
