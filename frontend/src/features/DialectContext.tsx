import React, { createContext, useContext, useState, ReactNode } from 'react';

type Dialect = 'egyptian' | 'saudi';

interface DialectContent {
  title: string;
  scrape: string;
  crawl: string;
  agent: string;
  history: string;
  urlPlaceholder: string;
  taskPlaceholder: string;
  scrapeBtn: string;
  crawlBtn: string;
  limitLabel: string;
  noHistory: string;
  newScrape: string;
  newCrawl: string;
  newAgent: string;
  back: string;
  delete: string;
  markdown: string;
  metadata: string;
  pages: string;
  status: string;
  welcome: string;
  description: string;
}

const translations: Record<Dialect, DialectContent> = {
  egyptian: {
    title: "خربشة",
    scrape: "اسحب الداتا",
    crawl: "لف في الموقع",
    agent: "العميل الذكي",
    history: "اللي فات",
    urlPlaceholder: "حط الرابط هنا يا فنان...",
    taskPlaceholder: "عايزني أعملك إيه في الموقع ده؟",
    scrapeBtn: "يلا بينا",
    crawlBtn: "ابدأ اللف",
    limitLabel: "آخرنا كام صفحة؟",
    noHistory: "لسه مفيش حاجة هنا.. ابدأ خربش!",
    newScrape: "خربشة جديدة",
    newCrawl: "لفّة جديدة",
    newAgent: "مهمة جديدة",
    back: "رجوع",
    delete: "امسح",
    markdown: "الكلام (Markdown)",
    metadata: "تفاصيل (Metadata)",
    pages: "الصفحات اللي لقيناها",
    status: "الحالة أهي",
    welcome: "أهلاً بيك في خربشة",
    description: "أقوى أداة لسحب الداتا وتصفح المواقع بالذكاء الاصطناعي.. ومجانية تماماً!",
  },
  saudi: {
    title: "خربشة",
    scrape: "سحب البيانات",
    crawl: "زحف النطاق",
    agent: "العميل الذكي",
    history: "السجل",
    urlPlaceholder: "ضع الرابط هنا يا طويل العمر...",
    taskPlaceholder: "وش تبي نسوي في هذا الموقع؟",
    scrapeBtn: "ابشر",
    crawlBtn: "ابدأ الزحف",
    limitLabel: "عدد الصفحات؟",
    noHistory: "ما فيه سجل الحين.. ابدأ جرب خربشة!",
    newScrape: "سحب جديد",
    newCrawl: "زحف جديد",
    newAgent: "مهمة جديدة",
    back: "رجوع",
    delete: "حذف",
    markdown: "النص (Markdown)",
    metadata: "البيانات الوصفية",
    pages: "الصفحات المكتشفة",
    status: "حالة العمل",
    welcome: "حياك الله في خربشة",
    description: "أفضل منصة لجلب البيانات وتصفح المواقع آلياً.. ومجانية بالكامل!",
  }
};

interface DialectContextType {
  dialect: Dialect;
  setDialect: (d: Dialect) => void;
  t: DialectContent;
}

const DialectContext = createContext<DialectContextType | undefined>(undefined);

export function DialectProvider({ children }: { children: ReactNode }) {
  const [dialect, setDialect] = useState<Dialect>('egyptian');
  return (
    <DialectContext.Provider value={{ dialect, setDialect, t: translations[dialect] }}>
      <div dir="rtl" className="font-sans">
        {children}
      </div>
    </DialectContext.Provider>
  );
}

export function useDialect() {
  const context = useContext(DialectContext);
  if (!context) throw new Error('useDialect must be used within DialectProvider');
  return context;
}
