# سجل التغييرات — خربشة (Kharbasha)

> **⚠️ تعليمات صيانة هذا الملف:**
> - هذا الملف **MUST** يتم تحديثه مع كل تغيير جديد في المشروع
> - آخر مهمة دائمة في أي task: **تحديث CHANGELOG.md + DEVLOG.md**
> - لو لقيت الملف قديم أو ناقص → حدّثه فوراً
> - صنّف كل تغيير: `Added` / `Changed` / `Fixed` / `Removed` / `Security`
> - اربط كل تغيير بـ commit hash
> - رتّب من **الأحدث للأقدم**

---

## [0.8.0] — 2026-04-11

### Added
- شريط marquee مزدوج (صفين) يعرض فئات المستخدمين والاستخدامات باتجاهين مختلفين وبسرعات مختلفة `2a86ae9`
- أنيميشن scroll reveal إبداعية: scale-pop, slide-left, fade, float-gentle, pulse-glow `ecc36c8`
- تحسين الشريط المتحرك: أيقونات أكبر (36px)، نصوص أوضح، صفين عكسيين، hover effects `ecc36c8`

### Changed
- الـ `useReveal` hook يدعم اتجاهات متعددة (`up`, `left`, `right`, `scale`, `fade`) `ecc36c8`
- كل sections في الـ Landing Page تستخدم أنيميشن مختلفة (Hero=scale, Tabs=fade, Features=scale-pop, Stats=scale-bounce, Steps=float) `ecc36c8`
- CTA button يعمل pulse-glow effect متواصل `ecc36c8`

---

## [0.7.0] — 2026-04-11

### Added
- خط **Shubbak** العربي (Regular + Bold) كخط أساسي للمنصة بالكامل `2466653`
- `@font-face` في `index.html` مباشرة لتحميل الخط قبل أي CSS `2466653`

### Changed
- CSS variables (`--font-heading`, `--font-body`) تستخدم Shubbak بدل Plus Jakarta Sans `2466653`
- حُذف Google Fonts CDN من `index.html` (لا حاجة لتحميل خطين) `2466653`

### Fixed
- مشكلة عدم تحميل الخط: نقل `@font-face` من CSS layer (كان Vite يشيلها) إلى `index.html` inline `<style>` `2466653`
- مشكلة relative path: تغيير `./assets/` إلى `/assets/` في font URLs `2466653`

---

## [0.6.0] — 2026-04-11

### Added
- **Favicon SVG** — لوجو الخنفساء على خلفية سودة مدورة `1f85e0c`
- **OG Banner** (1200×630) — بانر كامل بالخنفسة + اسم خربشة + الوصف للمشاركة `1f85e0c`
- SEO meta tags كاملة: title, description, keywords, robots, theme-color, canonical `1f85e0c`
- **Open Graph** tags: og:type, og:url, og:title, og:description, og:image (width/height/alt), og:locale `1f85e0c`
- **Twitter Card** tags: twitter:card (summary_large_image), twitter:title, twitter:description, twitter:image `1f85e0c`
- **JSON-LD Structured Data**: Schema.org `WebApplication` مع featureList و offers (price: 0) `1f85e0c`
- `<html lang="ar" dir="rtl">` للغة واتجاه الكتابة `1f85e0c`

---

## [0.5.0] — 2026-04-11

### Added
- الضغط على لوجو "خربشة" (sidebar أو mobile header) يرجع لصفحة الهبوط `72c01eb`
- `handleBackToLanding` callback مع `sessionStorage.removeItem` `72c01eb`
- `stopPropagation` على DialectToggle عشان ما يرجعش للanding عند تغيير اللهجة `72c01eb`

### Fixed
- **شاشة سوداء**: إضافة `useCallback` المستخدمة في App.tsx بدون import `6378a23`
- حماية `sessionStorage` بـ try/catch لبيئات iframe sandbox `6378a23`

---

## [0.4.0] — 2026-04-11

### Added
- **Landing Page** كاملة بستايل claude.ai: Hero مع typing animation، Interactive Tabs، Features Grid، Stats، How It Works، Final CTA، Footer `94bb8bf`
- `useReveal` hook (IntersectionObserver) لـ scroll reveal animations `94bb8bf`
- `useTyping` hook لـ typing effect متعدد الجمل `94bb8bf`
- `useCounter` hook لـ animated number counters `94bb8bf`
- نظام توجيه: landing page → app عبر `sessionStorage` state `94bb8bf`

---

## [0.3.0] — 2026-04-11

### Added
- **لوجو الخنفساء (Scarab)** كـ SVG مخصص — رمز استخراج البيانات بالمصريين القدماء `6ac8ea5`
- **DialectToggle** جديد: عرض علم الدولة بس + tooltip "تغيير اللهجة" عند hover + dropdown عند الضغط `6ac8ea5`
- أعلام مصر والسعودية كـ SVG حقيقي (كانت base64 مش شغالة) `5ba8ce6`

### Changed
- "قريباً" → "بطئ/مجاني" بجانب العميل الذكي `5ba8ce6`
- "تغيير اللغة" → "تغيير اللهجة" في tooltip وdropdown `5ba8ce6`
- حُذف `animate-pulse` من badge العميل الذكي `5ba8ce6`

---

## [0.2.0] — 2026-04-11

### Added
- **multi-provider LLM adapter** (`llm.py`): Gemini (2 models) → OpenRouter (5 models) → HuggingFace (1 model) = 8 models fallback `4c0af88`
- **probe_llm_rpc** diagnostic endpoint: يختبر كل الـ providers ويرجع حالة كل واحد `adc3abf`
- "Soon" badge للـ Smart Agent في الـ sidebar `c67b3b9`

### Changed
- تحديث قائمة النماذج لتشمل فقط النماذج المجانية المتاحة فعلياً `e245989`
- تجربة نماذج متعددة لكل provider بدل نموذج واحد `eff7152`

### Fixed
- حذف NextToken — SDK كان يقرأ GEMINI_API_KEY ويرسل لـ LiteLLM proxy `71bbf04`
- التحقق من عدة أسماء env vars للـ HF token (`HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`) `917b4b5`
- إعادة تشغيل HF Space تلقائياً بعد push عبر API `bbc121a`
- حل backend API errors: scraper 404 و agent arg mismatch `68eb58b`
- تصحيح typo في Dockerfile: `librandr2` → `libxrandr2` `78e8ff4`
- إعادة هيكلة Dockerfile لـ HF Space user 1000 permissions `39d6a4c`
- إزالة `--with-deps` من playwright install `8a02ed4`
- تصحيح HF Space color values `6fc677b`

---

## [0.1.0] — 2026-04-10

### Added
- FastAPI RPC server مع SPA serving و `__APP_CONFIG__` injection `3850809`
- Vercel deployment config مع fallback endpoint لـ HF Space `3850809`
- GitHub Actions workflow لمزامنة مع HF Space `456c9e1`
- Project README و documentation `67900bc`

### Fixed
- فك تشفير كل الملفات المصدرية (كانت base64-encoded) `bd09c4f`
- فك تشفير vercel.json (كان base64) `ed32533`
- إصلاح git push exit code (كان tee يخفي الأخطاء) `f4417ae`
- إصلاح HF auth و push log `d07b7ba`
- إضافة HF diagnostics للـ workflow `8508117`
- تقوية HF Space sync workflow `456c9e1`

---

## ملاحظات الإصدارات

| الإصدار | التاريخ | الوصف |
|---------|---------|-------|
| 0.1.0 | 2026-04-10 | البنية التحتية الأساسية: Backend + Frontend + Deployment |
| 0.2.0 | 2026-04-11 | Multi-provider AI + Docker fixes + CI/CD |
| 0.3.0 | 2026-04-11 | Scarab logo + Dialect toggle + Flag fixes |
| 0.4.0 | 2026-04-11 | Landing Page بستايل claude.ai |
| 0.5.0 | 2026-04-11 | Navigation fixes + Black screen fix |
| 0.6.0 | 2026-04-11 | SEO + Favicon + OG Banner |
| 0.7.0 | 2026-04-11 | Shubbak Arabic Font |
| 0.8.0 | 2026-04-11 | Marquee strip + Scroll animations |
