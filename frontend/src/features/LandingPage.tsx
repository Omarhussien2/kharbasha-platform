import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../lib/utils';
import {
  Globe,
  LayoutGrid,
  Bot,
  ArrowLeft,
  Sparkles,
  Zap,
  Shield,
  Languages,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

/* ──────────── scroll-reveal hook ──────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ──────────── animated typing ──────────── */
function useTyping(strings: string[], typingSpeed = 60, deletingSpeed = 30, pause = 2000) {
  const [text, setText] = useState('');
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = strings[idx];
    let timer: ReturnType<typeof setTimeout>;
    if (!deleting && text.length < current.length) {
      timer = setTimeout(() => setText(current.slice(0, text.length + 1)), typingSpeed);
    } else if (!deleting && text.length === current.length) {
      timer = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && text.length > 0) {
      timer = setTimeout(() => setText(current.slice(0, text.length - 1)), deletingSpeed);
    } else if (deleting && text.length === 0) {
      setDeleting(false);
      setIdx((idx + 1) % strings.length);
    }
    return () => clearTimeout(timer);
  }, [text, deleting, idx, strings, typingSpeed, deletingSpeed, pause]);
  return text;
}

/* ──────────── counter animation ──────────── */
function useCounter(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

/* ════════════════════════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════════════════════════ */
interface LandingPageProps {
  onEnterApp: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'scrape' | 'crawl' | 'agent'>('scrape');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden" dir="rtl">
      {/* ───── Navbar ───── */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled ? "bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl" : "bg-transparent"
      )}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="./assets/logo-kharbasha-scarab.svg" alt="خربشة" className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight">خربشة</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onEnterApp} className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors">
              جرّب المنصة
            </button>
            <button
              onClick={onEnterApp}
              className="bg-gradient-to-l from-amber-500 to-orange-600 text-black text-sm font-bold px-5 py-2 rounded-full hover:shadow-lg hover:shadow-orange-500/25 transition-all hover:scale-105"
            >
              ابدأ مجاناً
            </button>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <HeroSection onEnterApp={onEnterApp} />

      {/* ───── Interactive Tabs ───── */}
      <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ───── Features Grid ───── */}
      <FeaturesSection />

      {/* ───── Stats ───── */}
      <StatsSection />

      {/* ───── How It Works ───── */}
      <HowItWorksSection />

      {/* ───── Final CTA ───── */}
      <FinalCTA onEnterApp={onEnterApp} />

      {/* ───── Footer ───── */}
      <Footer />
    </div>
  );
}

/* ═══════════ HERO ═══════════ */
function HeroSection({ onEnterApp }: { onEnterApp: () => void }) {
  const typed = useTyping([
    'اسحب داتا من أي موقع...',
    'لخّصلي الصفحة دي...',
    'استخرج المنتجات من المتجر...',
    'لف في الموقع كله واجمعلي المعلومات...',
  ], 50, 25, 2500);

  const r1 = useReveal();
  const r2 = useReveal();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16">
      {/* BG glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-orange-500/8 via-amber-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div ref={r1.ref} className={cn(
          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8 transition-all duration-700",
          r1.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-medium text-white/70">مجاني 100% — باللهجة المصرية والسعودية</span>
        </div>

        {/* Headline */}
        <h1 ref={r2.ref} className={cn(
          "text-4xl sm:text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6 transition-all duration-700 delay-100",
          r2.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}>
          <span className="block">أقوى أداة عربية</span>
          <span className="block bg-gradient-to-l from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            لسحب البيانات
          </span>
        </h1>

        {/* Typing demo */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-right">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <p className="text-base sm:text-lg text-white/80 font-mono">
              <span className="text-orange-400">&gt;</span>{' '}
              <span>{typed}</span>
              <span className="inline-block w-0.5 h-5 bg-orange-400 animate-pulse align-middle mr-0.5" />
            </p>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          اسحب بيانات من أي موقع، لف في النطاق كله، أو خلّي الذكاء الاصطناعي يشتغل عنك
          — كل ده بالعربي ومجاني
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onEnterApp}
            className="group bg-gradient-to-l from-amber-500 to-orange-600 text-black font-bold text-base px-8 py-3.5 rounded-full hover:shadow-2xl hover:shadow-orange-500/30 transition-all hover:scale-105 flex items-center gap-2"
          >
            جرّب خربشة دلوقتي
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-white/60 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
          >
            اعرف أكتر
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════ TABS ═══════════ */
const TABS = [
  { id: 'scrape' as const, label: 'اسحب الداتا', icon: Globe, color: 'from-blue-500 to-cyan-500' },
  { id: 'crawl' as const, label: 'لف في الموقع', icon: LayoutGrid, color: 'from-purple-500 to-pink-500' },
  { id: 'agent' as const, label: 'العميل الذكي', icon: Bot, color: 'from-orange-500 to-amber-500' },
];

const TAB_CONTENT = {
  scrape: {
    title: 'اسحب محتوى أي صفحة ويب',
    subtitle: 'حوّل أي موقع لـ Markdown نضيف جاهز للاستخدام — بنقرة واحدة',
    prompts: [
      { input: 'https://ar.wikipedia.org/wiki/مصر', output: 'محتوى ويكيبيديا عن مصر اتنسخ كـ Markdown نضيف مع كل الروابط والتفاصيل' },
      { input: 'https://store.example.com/products', output: 'قائمة المنتجات استُخرجت: 47 منتج بالأسعار والوصف' },
      { input: 'https://news.site.com/article/123', output: 'المقال اتنسخ بالكامل: 2,340 كلمة، 5 صور، 12 رابط' },
    ],
  },
  crawl: {
    title: 'اكتشف موقع كامل تلقائياً',
    subtitle: 'لف في الموقع صفحة صفحة واجمع كل المحتوى — لحد 50 صفحة',
    prompts: [
      { input: 'https://docs.example.com — حد: 20 صفحة', output: 'تم اكتشاف 18 صفحة: التوثيق الكامل اتنسخ في 45 ثانية' },
      { input: 'https://blog.site.com — حد: 30 صفحة', output: 'تم سحب 27 مقال من المدونة مع التصنيفات والتواريخ' },
      { input: 'https://university.edu/courses — حد: 15 صفحة', output: 'تم استخراج 15 صفحة courses بالتفاصيل والمتطلبات' },
    ],
  },
  agent: {
    title: 'خلّي الذكاء الاصطناعي يشتغل',
    subtitle: 'اكتب طلبك بالعربي والعميل الذكي بيفكر ويتصرف ويرجع نتيجة',
    prompts: [
      { input: 'لخّصلي سياسة الخصوصية بتاعة الموقع ده', output: 'العميل حلل الصفحة واستخرج 8 نقاط رئيسية عن خصوصية البيانات' },
      { input: 'استخرج كل المنتجات اللي سعرها أقل من 500 جنيه', output: 'تم فلترة 12 منتج من أصل 47 — مع جدول بالأسعار والروابط' },
      { input: 'قارن بين السعر في الموقعين دول', output: 'تم المقارنة: 5 منتجات أرخص في الموقع الأول، 3 في التاني' },
    ],
  },
};

function TabsSection({ activeTab, setActiveTab }: { activeTab: 'scrape' | 'crawl' | 'agent'; setActiveTab: (t: 'scrape' | 'crawl' | 'agent') => void }) {
  const r = useReveal();
  const content = TAB_CONTENT[activeTab];

  return (
    <section ref={r.ref} className="py-24 relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className={cn(
          "text-center mb-12 transition-all duration-700",
          r.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">كيف تقدر تستخدم خربشة؟</h2>
          <p className="text-white/50 text-lg">ثلاث طرق بسيطة لسحب البيانات من أي مكان</p>
        </div>

        {/* Tab buttons */}
        <div className="flex justify-center gap-2 mb-10">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id
                  ? `bg-gradient-to-l ${tab.color} text-white shadow-lg`
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="grid md:grid-cols-2 gap-6 min-h-[380px]">
          {/* Left — info */}
          <div className="flex flex-col justify-center">
            <h3 className="text-2xl font-bold mb-3">{content.title}</h3>
            <p className="text-white/50 mb-6 leading-relaxed">{content.subtitle}</p>
            <div className="space-y-3">
              {content.prompts.map((p, i) => (
                <PromptCard key={i} input={p.input} output={p.output} delay={i * 150} active={r.visible} />
              ))}
            </div>
          </div>

          {/* Right — visual demo */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="mr-auto text-xs text-white/30 font-mono">kharbasha</span>
            </div>

            {/* Mock UI */}
            <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                  TABS.find(t => t.id === activeTab)?.color
                )}>
                  {(() => { const Icon = TABS.find(t => t.id === activeTab)?.icon || Globe; return <Icon className="h-4 w-4 text-white" />; })()}
                </div>
                <span className="text-sm font-bold">{content.title}</span>
              </div>

              <div className="space-y-3">
                <div className="h-3 bg-white/5 rounded-full w-full" />
                <div className="h-3 bg-white/5 rounded-full w-4/5" />
                <div className="h-3 bg-white/5 rounded-full w-3/5" />
                <div className="h-8 mt-4" />
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] text-white/40 font-bold">النتيجة</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-white/5 rounded-full w-full" />
                    <div className="h-2 bg-white/5 rounded-full w-5/6" />
                    <div className="h-2 bg-white/5 rounded-full w-4/6" />
                    <div className="h-2 bg-white/5 rounded-full w-full" />
                    <div className="h-2 bg-white/5 rounded-full w-3/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PromptCard({ input, output, delay, active }: { input: string; output: string; delay: number; active: boolean }) {
  const [copied, setCopied] = useState(false);
  const r = useReveal();

  return (
    <div
      ref={r.ref}
      className={cn(
        "group bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 hover:bg-white/[0.06] transition-all duration-500 cursor-pointer",
        r.visible && active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={() => { navigator.clipboard.writeText(input); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 shrink-0">
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40 transition-colors" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/70 font-mono truncate">{input}</p>
          <p className="text-xs text-white/30 mt-1">{output}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ FEATURES ═══════════ */
const FEATURES = [
  {
    icon: Globe,
    title: 'سحب ذكي',
    desc: 'حوّل أي صفحة ويب لـ Markdown نضيف — بدون إعلانات أو كود ملخبط. المحتوى جاهز للنسخ والاستخدام فوراً.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: LayoutGrid,
    title: 'زحف شامل',
    desc: 'اكتشف صفحات الموقع كله تلقائياً — لحد 50 صفحة في مهمة واحدة. شوف التقدم لحظياً وكل صفحة بتتنكشف قدامك.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Bot,
    title: 'عميل ذكي بالعربي',
    desc: 'اكتب طلبك بالعربي وباللهجتك — والذكاء الاصطناعي بيفكر ويتصرف ويرجع نتيجة. 8 نماذج مجانية بيتجرّبوا ورا بعض.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: Languages,
    title: 'مصري وسعودي',
    desc: 'كل حاجة باللهجة — "يلا بينا يا فنان" أو "ابشر يا طويل العمر". مش مجرد ترجمة، ده أسلوب حياة.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Zap,
    title: 'مجاني 100%',
    desc: 'مفيش اشتراك، مفيش حد، مفيش API key منك. المنصة بتستخدم نماذج AI مجانية مع نظام fallback ذكي.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'سريع وآمن',
    desc: 'البيانات بتتخزن محلياً على جهازك. مفيش تسجيل دخول، مفيش مشاركة بيانات. خصوصيتك أولوية.',
    gradient: 'from-red-500 to-pink-500',
  },
];

function FeaturesSection() {
  const r = useReveal();
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6 relative">
        <div ref={r.ref} className={cn(
          "text-center mb-16 transition-all duration-700",
          r.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">ليه خربشة مختلفة؟</h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">مش مجرد أداة سكرابينج — ده نظام متكامل بالعربي للمستخدم العربي</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, desc, gradient, index }: typeof FEATURES[0] & { index: number }) {
  const r = useReveal(0.1);
  return (
    <div
      ref={r.ref}
      className={cn(
        "group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-700",
        r.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform",
        gradient
      )}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ═══════════ STATS ═══════════ */
function StatsSection() {
  const r = useReveal();
  const s1 = useCounter(8, 1500, r.visible);
  const s2 = useCounter(50, 1500, r.visible);
  const s3 = useCounter(2, 800, r.visible);
  const s4 = useCounter(100, 2000, r.visible);

  const stats = [
    { value: s1, suffix: '+', label: 'نماذج AI متاحة' },
    { value: s2, suffix: '', label: 'صفحة أقصى حد للزحف' },
    { value: s3, suffix: '', label: 'لهجات عربية' },
    { value: s4, suffix: '%', label: 'مجاني' },
  ];

  return (
    <section className="py-20 border-y border-white/[0.04]">
      <div ref={r.ref} className="max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className={cn(
              "text-center transition-all duration-700",
              r.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-l from-amber-400 to-orange-500 bg-clip-text text-transparent">
                {s.value}{s.suffix}
              </div>
              <p className="text-sm text-white/40 mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════ HOW IT WORKS ═══════════ */
const STEPS = [
  {
    num: '١',
    title: 'اختار الطريقة',
    desc: 'اسحب صفحة واحدة، أو لف في موقع كامل، أو خلّي العميل الذكي يشتغل',
  },
  {
    num: '٢',
    title: 'حط الرابط أو اكتب طلبك',
    desc: 'فقط ضع رابط الموقع أو اكتب بالعربي اللي عايزه — باللهجتك',
  },
  {
    num: '٣',
    title: 'استنى النتيجة',
    desc: 'شوف التقدم لحظياً واقرأ المحتوى النضيف أو حمّله',
  },
];

function HowItWorksSection() {
  const r = useReveal();
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div ref={r.ref} className={cn(
          "text-center mb-16 transition-all duration-700",
          r.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">3 خطوات بس</h2>
          <p className="text-white/50 text-lg">من الفكرة للنتيجة في أقل من دقيقة</p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-l from-transparent via-white/10 to-transparent" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {STEPS.map((step, i) => (
              <StepCard key={i} {...step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({ num, title, desc, index }: typeof STEPS[0] & { index: number }) {
  const r = useReveal();
  return (
    <div
      ref={r.ref}
      className={cn(
        "relative text-center transition-all duration-700",
        r.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-black text-2xl font-bold mb-5 shadow-lg shadow-orange-500/20">
        {num}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ═══════════ FINAL CTA ═══════════ */
function FinalCTA({ onEnterApp }: { onEnterApp: () => void }) {
  const r = useReveal();
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl" />
      </div>
      <div ref={r.ref} className={cn(
        "max-w-3xl mx-auto px-6 text-center relative transition-all duration-700",
        r.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}>
        <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
          جاهز تخربش؟
        </h2>
        <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">
          ادخل الرابط وابدأ — مفيش تسجيل، مفيش اشتراك، مفيش تعقيد.
          مجرد أداة قوية بالعربي ومجانية.
        </p>
        <button
          onClick={onEnterApp}
          className="group bg-gradient-to-l from-amber-500 to-orange-600 text-black font-bold text-lg px-10 py-4 rounded-full hover:shadow-2xl hover:shadow-orange-500/30 transition-all hover:scale-105 inline-flex items-center gap-3"
        >
          <ExternalLink className="h-5 w-5" />
          جرّب خربشة دلوقتي — مجاني
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        </button>
      </div>
    </section>
  );
}

/* ═══════════ FOOTER ═══════════ */
function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="./assets/logo-kharbasha-scarab.svg" alt="خربشة" className="h-6 w-6" />
          <span className="text-sm font-bold text-white/40">خربشة</span>
        </div>
        <p className="text-xs text-white/25">
          صنع بـ ❤️ للمستخدم العربي — جميع الحقوق محفوظة ٢٠٢٥
        </p>
      </div>
    </footer>
  );
}
