# سجل التحديات والحلول — خربشة (Kharbasha)

> **⚠️ تعليمات صيانة هذا الملف:**
> - هذا الملف **MUST** يتم تحديثه مع كل تحدي جديد يتم مواجهته
> - آخر مهمة دائمة في أي task: **تحديث CHANGELOG.md + DEVLOG.md**
> - لو لقيت الملف قديم أو ناقص → حدّثه فوراً
> - لكل تحدي: المشكلة → السبب → الحل → الدرس المستفاد
> - لو جرّبت أكتر من حل → وثّق كل المحاولات

---

## التحدي 1: ملفات المصدرية مشفرة بـ Base64

**التاريخ:** 2026-04-10
**Commits:** `bd09c4f`, `ed32533`

### المشكلة
كل ملفات المشروع (Python, TypeScript, JSON, HTML) كانت مشفرة بـ Base64 ومحفوظة كنصوص عادية في الـ repo. لا يمكن تشغيل المشروع أو بناؤه.

### السبب
المشروع كان محفوظاً من بيئة لا تدعم الملفات الثنائية بشكل مباشر، فتم تشفير كل شيء كـ base64 text.

### المحاولات
1. ❌ محاولة فك التشفير يدوياً ملف بملف — مضيعة وقت وعرضة للأخطاء
2. ✅ كتابة script يفك تشفير كل الملفات دفعة واحدة ويعيد بناء الهيكل

### الحل النهائي
فك تشفير كل الملفات باستخدام bash script + إعادة هيكلة المسارات + تصحيح import paths. ملف `vercel.json` كان base64 منفصل وتم فكه بشكل خاص (`ed32533`).

### الدرس المستفاد
> لا تفترض أن الملفات في repo بصيغتها الطبيعية — دائماً تحقق من encoding الملفات قبل البدء في أي مشروع مستورد.

---

## التحدي 2: HF Space Build Failures المتكررة

**التاريخ:** 2026-04-10
**Commits:** `78e8ff4`, `39d6a4c`, `8a02ed4`, `6fc677b`, `bbc121a`

### المشكلة
Hugging Face Space يفشل في البناء (build) بشكل متكرر لعدة أسباب مختلفة: typo في اسم حزمة، صلاحيات مستخدم، إعدادات Playwright، وقيم ألوان غير صحيحة.

### المحاولات (6 محاولات!)
1. ❌ `6fc677b` — إصلاح colorFrom/colorTo (كانت قيم غير مدعومة)
2. ❌ `8a02ed4` — إزالة `--with-deps` من Playwright install
3. ❌ `39d6a4c` — إعادة هيكلة Dockerfile لـ user 1000
4. ❌ `78e8ff4` — تصحيح typo: `librandr2` → `libxrandr2`
5. ❌ `bbc121a` — إضافة API restart بعد push (كان الـ Space يعطل نفسه)
6. ✅ النجاح بعد إصلاح كل هذه المشاكل معاً

### السبب الجذري
Dockerfile كان مكتوباً بدون اختبار محلي + HF Space له قيود خاصة (user 1000, color values, package names).

### الحل النهائي
- تصحيح كل الأخطاء الفردية
- إضافة GitHub Action يفشل إذا push لم ينجح (`f4417ae`)
- إضافة API restart endpoint في workflow (`bbc121a`)

### الدرس المستفاد
> اختبر Dockerfile محلياً قبل push. HF Space له قيود مخفية (user, colors, packages). كل خطأ يظهر يخفي وراءه خطأ آخر — صلحهم كلهم معاً.

---

## التحدي 3: NextToken / LiteLLM Proxy Conflict

**التاريخ:** 2026-04-11
**Commits:** `71bbf04`, `4c0af88`, `917b4b5`

### المشكلة
الـ Smart Agent مش بيشتغل. SDK كان يقرأ `GEMINI_API_KEY` ويرسلها لـ LiteLLM proxy بدل Gemini API المباشر، مما يسبب أخطاء مصادقة.

### المحاولات
1. ❌ محاولة إصلاح NextToken configuration — المشكلة أعمق من كده
2. ✅ حذف NextToken بالكامل وبناء multi-provider adapter من الصفر (`4c0af88`)

### الحل النهائي
بناء `llm.py` adapter من الصفر يستخدم urllib مباشرة (بدون SDK) مع fallback chain:
- Gemini API (REST direct) → OpenRouter → HuggingFace InferenceClient
- 8 نماذج مجانية كـ fallback
- كل provider يجرب عدة نماذج

### الدرس المستفاد
> لو library بتعمل سحر ورا الكواليس (زي NextToken) ومش عارف تتحكم فيها — احذفها وابني بنفسك. التحكم المباشر في API calls أفضل من الـ magic proxies.

---

## التحدي 4: شاشة سوداء بعد إضافة Landing Page

**التاريخ:** 2026-04-11
**Commit:** `6378a23`

### المشكلة
بعد إضافة الـ Landing Page، الموقع بيظهر شاشة سوداء تماماً — لا محتوى، لا خطأ ظاهر.

### السبب
استخدمت `useCallback` في `App.tsx` بدون استيرادها من React. JavaScript error بصمت يكسر الـ render كله.

### المحاولات
1. ❌ فحص الـ CSS والـ dark mode — المشكلة مش هناك
2. ✅ اكتشاف الـ missing import وإضافته

### الحل النهائي
إضافة `useCallback` لقائمة imports: `import React, { useState, useEffect, useRef, useCallback } from 'react'`
+ حماية `sessionStorage` بـ try/catch

### الدرس المستفاد
> Missing import في JavaScript/react بيكسر الصفحة بالكامل بصمت (especially في production builds). دايماً تحقق إن كل hook مستخدمة مستوردة. ملف index.html لازم يكون فيه `<script>` error handling.

---

## التحدي 5: أعلام الدول مش شغالة

**التاريخ:** 2026-04-11
**Commit:** `5ba8ce6`

### المشكلة
أعلام مصر والسعودية مش بتظهر — `<img>` بيظهر فارغ أو مكسور.

### السبب
الـ SVG files كانت عبارة عن نص Base64 (مش SVG XML حقيقي). المتصفح بيحاول يعرض base64 string كـ SVG وبيفشل.

### المحاولات
1. ❌ محاولة فك base64 — الناتج كان SVG ضخم ومعقد (ويكيبيديا flags)
2. ✅ كتابة SVG flags بسيطة من الصفر

### الحل النهائي
كتابة SVG flags نظيفة ومبسطة:
- مصر: 3 خطوط (أحمر/أبيض/أسود) + نسر مُبسّط
- السعودية: خلفية خضراء + نص الشهادة + سيف

### الدرس المستفاد
> لا تثق في ملفات SVG من مصادر خارجية — تحقق إنها SVG XML حقيقي وليست base64-encoded text. SVGs البسيطة المكتوبة يدوياً أفضل من المعقدة المستوردة.

---

## التحدي 6: خط Shubbak مش بيتحمل

**التاريخ:** 2026-04-11
**Commit:** `2466653`

### المشكلة
بعد إضافة خط Shubbak بـ `@font-face` في CSS، الخط مش بيظهر والموقع بيستخدم خط fallback.

### السبب (طبقتين)
1. Vite كان بيشيل `@font-face` من `@layer base` (لا يدعمها داخل layers)
2. Relative path `./assets/` مش بيشتغل لأن CSS bundle بيكون في `dist/assets/` والخطوط برضو هناك — الـ relative path بيختلف

### المحاولات
1. ❌ `@font-face` داخل `@layer base` في CSS — Vite شالها
2. ❌ `@font-face` بره layer مع `./assets/` — Vite حذر أن path won't resolve
3. ✅ نقل `@font-face` لـ `<style>` في `index.html` مع absolute path `/assets/`

### الحل النهائي
```html
<style>
  @font-face { font-family: 'Shubbak'; src: url('/assets/Shubbak-Regular.otf') format('opentype'); }
  @font-face { font-family: 'Shubbak'; src: url('/assets/Shubbak-Bold.otf') format('opentype'); }
</style>
```
في `index.html` مباشرة — يتحمل أول حاجة قبل أي CSS bundle.

### الدرس المستفاد
> Vite + TailwindCSS `@layer` مش بيدعم `@font-face` بشكل صحيح. الحل الأضمن: حط `@font-face` في `<style>` في HTML مباشرة مع absolute path. واستخدم `font-display: swap` دائماً.

---

## التحدي 7: CI/CD Pipeline للـ HF Space

**التاريخ:** 2026-04-10
**Commits:** `456c9e1`, `8508117`, `d07b7ba`, `f4417ae`

### المشكلة
push لـ HF Space بيفشل بصمت — GitHub Action بتقول "success" بس الـ Space مش بيتبنى.

### المحاولات
1. ❌ `456c9e1` — تقوية workflow بدون diagnostics
2. ❌ `8508117` — إضافة diagnostics — اكتشاف أن push بيعمل timeout
3. ❌ `d07b7ba` — تجربة credential store — مشحونة بشكل كافي
4. ✅ `f4417ae` — التقاط exit code الحقيقي من git push (كان `tee` يخفيه)

### السبب الجذري
أمر `tee` في pipeline كان بيستقبل stdout وبيرجع exit code بتاعه (0) بدل exit code بتاع git push.

### الحل النهائي
استخدام `PIPESTATUS` أو إعادة هيكلة pipeline عشان git push exit code يكون هو اللي يحدد نجاح الـ workflow.

### الدرس المستفاد
> في CI/CD pipelines، الأوامر المتسلسلة (pipes) ممكن تخفي exit codes. دايماً تحقق إن exit code الحقيقي هو اللي بيتسجل. إضافة diagnostics في كل خطوة يوفر ساعات من debugging.

---

## جدول الدروس المستفادة

| # | التحدي | الدرس الرئيسي |
|---|--------|---------------|
| 1 | Base64 ملفات | تحقق من encoding الملفات قبل البدء |
| 2 | HF Space Builds | اختبر Dockerfile محلياً + كل HF Space error يخفي وراءه خطأ آخر |
| 3 | NextToken Proxy | لو library بتعمل magic — احذفها وابني بنفسك |
| 4 | شاشة سوداء | Missing import بيكسر production بصمت — دايماً تحقق من imports |
| 5 | أعلام مش شغالة | لا تثق في SVGs من بره — تحقق إنها XML حقيقي |
| 6 | خط مش بيتحمل | Vite `@layer` مش بيدعم `@font-face` — حطه في HTML مباشرة |
| 7 | CI/CD صامت | `tee` و pipes يخفوا exit codes — إtrap الحقيقي دايماً |

---

## أنماط متكررة (Patterns)

1. **"المشكلة في طبقة تحت"**: كل ما المشكلة تظهر في surface level، السبب الحقيقي بيكون في طبقة أعمق (imports, encoding, paths, exit codes)
2. **"Base64 هي العدو"**: 3 تحديات من 7 كانت بسبب base64 (ملفات، أعلام، vercel.json)
3. **"Vite مش سحر"**: Vite بيعمل أشياء غير متوقعة مع `@font-face` و relative paths — دايماً اختبر في production build
4. **"DIY > Magic Libraries"**: بناء adapter بنفسك أفضل من الاعتماد على libraries بتعمل magic ورا الكواليس
