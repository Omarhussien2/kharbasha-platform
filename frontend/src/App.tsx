import React, { useState, useEffect } from 'react';
import { DialectProvider, useDialect } from './features/DialectContext';
import { ScraperView } from './features/ScraperView';
import { CrawlerView } from './features/CrawlerView';
import { AgentView } from './features/AgentView';
import { HistoryView } from './features/HistoryView';
import { Button } from './components/ui/button';
import { Separator } from './components/ui/separator';
import { ScrollArea } from './components/ui/scroll-area';
import { cn } from './lib/utils';
import { 
  LayoutDashboard, 
  Globe, 
  LayoutGrid, 
  Bot, 
  History, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';

// Shell Layout
function AppShell() {
  const { t, dialect, setDialect } = useDialect();
  const [activeView, setActiveView] = useState('agent');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    console.log("RENDER_SUCCESS");
  }, []);

  const navItems = [
    { id: 'agent', label: t.agent, icon: Bot },
    { id: 'scrape', label: t.scrape, icon: Globe },
    { id: 'crawl', label: t.crawl, icon: LayoutGrid },
    { id: 'history', label: t.history, icon: History },
  ];

  return (
    <div className="flex h-screen flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-lg z-50">
        <div className="flex items-center gap-2">
          <img src="./assets/logo-kharbasha-scratch.svg" alt="Logo" className="h-8 w-8" />
          <h1 className="font-heading font-bold text-xl text-primary">{t.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <DialectToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-40 w-64 bg-card/30 backdrop-blur-xl border-l border-white/5 flex flex-col transition-transform duration-300 md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl shadow-glow">
            <img src="./assets/logo-kharbasha-scratch.svg" alt="Logo" className="h-8 w-8" />
          </div>
          <h2 className="font-heading text-2xl font-bold bg-gradient-to-l from-primary to-amber-200 bg-clip-text text-transparent">
            {t.title}
          </h2>
        </div>
        
        <div className="px-4 mb-4">
           <DialectToggle />
        </div>

        <Separator className="mx-4 w-auto bg-white/5" />
        
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  activeView === item.id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", activeView === item.id ? "text-primary-foreground" : "text-primary")} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 mt-auto">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
            <p className="text-xs text-primary font-bold mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Pro Agent Mode
            </p>
            <p className="text-[10px] text-muted-foreground">
              {dialect === 'egyptian' ? 'شغالين بنظام الوكيل الذكي يا فنان' : 'نعمل بنظام الوكيل الذكي يا طويل العمر'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-mesh relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
        <div className="relative h-full flex flex-col">
          <div className="flex-1 p-4 md:p-8">
             {activeView === 'agent' && <AgentView />}
             {activeView === 'scrape' && <ScraperView />}
             {activeView === 'crawl' && <CrawlerView />}
             {activeView === 'history' && <HistoryView />}
          </div>
        </div>
      </main>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function DialectToggle() {
  const { dialect, setDialect } = useDialect();
  
  return (
    <div className="flex bg-muted/50 p-1 rounded-xl border border-white/5">
      <button 
        onClick={() => setDialect('egyptian')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
          dialect === 'egyptian' ? "bg-card text-primary shadow-sm shadow-black/20" : "text-muted-foreground opacity-60"
        )}
      >
        <img src="./assets/icon-flag-eg.svg" alt="EG" className="h-4 w-4 rounded-sm" />
        <span>مِصري</span>
      </button>
      <button 
        onClick={() => setDialect('saudi')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
          dialect === 'saudi' ? "bg-card text-primary shadow-sm shadow-black/20" : "text-muted-foreground opacity-60"
        )}
      >
        <img src="./assets/icon-flag-sa.svg" alt="SA" className="h-4 w-4 rounded-sm" />
        <span>سعودي</span>
      </button>
    </div>
  );
}

export default function App() {
  return (
    <DialectProvider>
      <AppShell />
    </DialectProvider>
  );
}
