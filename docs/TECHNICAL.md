# תיעוד טכני — PBL Question Lab

מסמך זה מתאר את הארכיטקטורה, מודלי הנתונים, זרימת הנתונים, וחוזה ה-API של הכלי. לתיאור קונספטואלי ופדגוגי — ראה [`README.md`](../README.md).

---

## ארכיטקטורה כללית

```
Browser (React / Next.js Client)
  │
  │  HTTP (fetch, 120s timeout)
  ▼
Next.js API Routes (Server)
  ├── /api/generate   ──▶  Claude API  ──▶  Prisma/PostgreSQL (archive)
  ├── /api/diagnose   ──▶  Claude API
  ├── /api/brief      ──▶  Claude API
  ├── /api/archive    ──▶  Prisma/PostgreSQL
  └── /api/archive/[id]  ──▶  Prisma/PostgreSQL
```

**עקרונות עיצוב:**
- כל לוגיקת ה-AI רצה בצד שרת בלבד (`server-only`)
- הלקוח מקבל JSON מובנה — אף פעם לא מגיב ישירות ל-Claude
- מצב הדגמה (mock) פועל כשאין `ANTHROPIC_API_KEY`
- הארכיון אופציונלי — הכלי עובד ללא DB

---

## מבנה הקבצים

```
PBLQuestionLab/
│
├── app/                          # Next.js App Router
│   ├── page.tsx                  # קומפוננטת שורש — כל 7 מצבי התצוגה
│   ├── layout.tsx                # Layout כולל (גופן, RTL, skip link)
│   ├── globals.css               # Tailwind + סגנוני הדפסה
│   └── api/
│       ├── generate/route.ts     # POST /api/generate — יצירת שאלות
│       ├── diagnose/route.ts     # POST /api/diagnose — אבחון שאלה
│       ├── brief/route.ts        # POST /api/brief — תיק פרויקט
│       ├── archive/route.ts      # GET /api/archive — רשימת שאלות שמורות
│       ├── archive/[id]/route.ts # DELETE /api/archive/[id] — מחיקת שאלה
│       └── seed/route.ts         # GET /api/seed — זריעת נתוני דוגמה
│
├── components/
│   ├── GenerateForm.tsx          # טופס יצירת שאלות (validation, localStorage)
│   ├── DiagnoseForm.tsx          # טופס אבחון שאלה קיימת
│   └── Toast.tsx                 # הודעת toast (auto-dismiss, 3.5s)
│
├── lib/
│   ├── anthropic.ts              # server-only: קריאות Claude + retry + mock fallback
│   ├── apiClient.ts              # client-side: fetch wrappers עם timeout
│   ├── dailyLimit.ts             # server-only: מגבלה יומית — 10 בקשות/IP/יום
│   ├── db.ts                     # server-only: PrismaClient singleton + ensureTable()
│   ├── prompts.ts                # System prompts ל-Claude (שלושה)
│   └── mockData.ts               # נתוני דוגמה למצב הדגמה
│
├── prisma/
│   └── schema.prisma             # סכמת DB — מודל ArchivedQuestion בלבד
│
├── types.ts                      # כל ממשקי TypeScript
├── prisma.config.ts              # תצורת Prisma (סכמה, migrations, DB URL)
├── docs/
│   └── TECHNICAL.md              # מסמך זה
├── README.md                     # תיאור קונספטואלי + התחלה מהירה
├── railway.json                  # הגדרות פריסה ל-Railway
├── render.yaml                   # הגדרות פריסה ל-Render
├── tailwind.config.ts            # הרחבות Tailwind (גופן Heebo)
├── tsconfig.json                 # TypeScript config (path alias @/*)
└── package.json                  # תלויות + scripts
```

---

## מודלי נתונים

כל הטיפוסים מוגדרים ב-`types.ts`.

### `AppMode`
```typescript
type AppMode = 'home' | 'generate' | 'diagnose' | 'results' | 'diagnosis' | 'brief' | 'archive'
```
מנהל את מצב הניווט של הממשק — אין Next.js routing, רק state.

---

### `FormInput` — קלט ליצירת שאלה
```typescript
interface FormInput {
  topic: string            // נושא הפרויקט, חובה
  grade: string            // שכבת גיל, חובה
  subjects: string[]       // תחומי דעת (מינימום 2), חובה
  learning_goals: string   // מטרות למידה, אופציונלי
  required_content: string // מושגים/תכנים נדרשים, אופציונלי
  duration: string         // משך הפרויקט
  context: string          // הקשר בית-ספרי
  difficulty: 'basic' | 'intermediate' | 'advanced'
  preferred_product: string // סוג תוצר מועדף
  boldness: 'conservative' | 'balanced' | 'bold'
}
```

---

### `DiagnoseInput` — קלט לאבחון שאלה
```typescript
interface DiagnoseInput {
  existing_question: string // השאלה לאבחון, חובה
  topic: string             // חובה
  grade: string             // חובה
  subjects: string[]        // אופציונלי
  learning_goals: string    // אופציונלי
  required_content: string  // אופציונלי
  duration: string
  boldness: 'conservative' | 'balanced' | 'bold'
}
```

---

### `BigQuestion` — תוצאת יצירת שאלה
```typescript
interface BigQuestion {
  id: string                               // מזהה ייחודי (q1, q2...)
  question: string                         // השאלה המנחה
  why_it_works: string                     // הסבר פדגוגי (2-3 משפטים)
  strengths: string[]                      // חוזקות ספציפיות
  weaknesses: string[]                     // נקודות לשיפור
  sub_questions: string[]                  // שאלות חקירה פנימיות
  product_ideas: string[]                  // רעיונות לתוצרים לקהל חיצוני
  alternative_formulations: AlternativeFormulation[]  // 2 ניסוחים חלופיים
  stress_test: StressTest                  // ציוני 10 קריטריונים
}
```

---

### `StressTest` ו-`StressCriterion`
```typescript
interface StressCriterion {
  score: number       // ציון שלם 1–10
  explanation: string // הסבר ספציפי לשאלה הנבדקת
}

interface StressTest {
  open_ended: StressCriterion          // האם פתוחה ומרובת תשובות
  content_connection: StressCriterion  // קשר לתוכן לימודי
  authenticity: StressCriterion        // אותנטיות/העולם האמיתי
  age_appropriate: StressCriterion     // התאמה לגיל
  tension_dilemma: StressCriterion     // מתח ודילמה אמיתית
  interdisciplinary: StressCriterion   // בינתחומיות
  independent_inquiry: StressCriterion // אפשרות לחקירה עצמאית
  meaningful_product: StressCriterion  // תוצר משמעותי לקהל חיצוני
  information_available: StressCriterion // נגישות מידע לתלמידים
  not_googleable: StressCriterion      // לא ניתן לפתרון ב-Google/ChatGPT
  overall_score: number                // ממוצע מדויק של 10 הציונים
}
```

---

### `DiagnosisResult` — תוצאת אבחון שאלה
```typescript
interface DiagnosisResult {
  overall_score: number                          // ציון כולל 0–10
  what_works: string[]                           // מה עובד בשאלה הקיימת
  what_doesnt_work: string[]                     // מה לא עובד
  why_problematic: string                        // הסיבה המרכזית האחת
  learning_impact: string                        // מה יקרה בפועל בכיתה
  direction: string                              // כיוון לשיפור — הנחיה מעשית
  alternative_formulations: AlternativeFormulation[]  // 2 ניסוחים משופרים
  stress_test: StressTest                        // 10 קריטריונים לשאלה הקיימת
}
```

---

### `ProjectBrief` — תיק פרויקט מלא
```typescript
interface ProjectBrief {
  project_title: string    // שם הפרויקט
  teacher_summary: string  // תיאור ב-2-3 משפטים למורה
  learning_goals: string[] // 3-4 מטרות שמתחילות ב"התלמיד יוכל..."
  knowledge_content: string[] // תכנים ומושגי מפתח ספציפיים
  sub_questions: string[]  // 3-5 שאלות חקירה פנימיות
  inquiry_stages: string[] // בדיוק 4 שלבים: "[שם] | [משך] | [פעולת תלמידים]"
  rubric: RubricRow[]      // בדיוק 3 קריטריונים
  opening_experience: string // פעילות פתיחה מוחשית
}

interface RubricRow {
  criterion: string  // מה נמדד
  beginning: string  // רמה מתחילה — תיאור ביצוע ניתן לצפייה
  developing: string // רמה מתפתחת
  proficient: string // רמה מיומנת
}
```

---

### `AlternativeFormulation`
```typescript
interface AlternativeFormulation {
  question: string    // הניסוח החלופי
  explanation: string // מה השתפר לעומת המקורי
}
```

---

### `ArchiveItem` — שאלה שמורה בDB
```typescript
interface ArchiveItem {
  id: string           // CUID מ-PostgreSQL
  topic: string
  grade: string
  subjects: string     // JSON.stringify(string[]) — מערך בתוך string
  question: string     // השאלה המנחה בלבד
  overall_score: number
  full_data?: string   // JSON.stringify(BigQuestion) — הנתון המלא
  created_at: string   // ISO timestamp
}
```

**הערה:** `subjects` ו-`full_data` מאוחסנים כ-JSON מסוג string עקב מגבלת Prisma — יש לבצע `JSON.parse()` בשימוש.

---

## זרימת נתונים

### זרימה 1: יצירת שאלה (Generate)

```
GenerateForm (client)
  │  validate(topic, grade, subjects ≥ 2)
  │  createQuestions(FormInput)  →  POST /api/generate
  ▼
/api/generate (server)
  │  checkRateLimit(IP)          →  429 אם עבר הגבול
  │  generateQuestions(input)    →  Claude API
  │  ← BigQuestion[] (JSON)
  │  prisma.archivedQuestion.create()  →  PostgreSQL (non-fatal)
  │  return { questions, mockMode }
  ▼
ResultsScreen (client)
  │  תצוגת רשימת שאלות + פרטים מורחבים
  │  המורה בוחר שאלה
  │
  │  [אופציונלי] createProjectBrief(selectedQuestion, formInput)
  │    →  POST /api/brief  →  Claude  →  ProjectBrief
  ▼
BriefScreen (client)
  תצוגת תיק פרויקט מלא (ניתן להדפסה)
```

---

### זרימה 2: אבחון שאלה (Diagnose)

```
DiagnoseForm (client)
  │  validate(existing_question, topic, grade)
  │  diagnoseExistingQuestion(DiagnoseInput)  →  POST /api/diagnose
  ▼
/api/diagnose (server)
  │  checkRateLimit(IP)
  │  diagnoseQuestion(input)  →  Claude API
  │  ← DiagnosisResult (JSON)
  │  return { diagnosis, mockMode }
  ▼
DiagnosisScreen (client)
  │  תצוגת אבחון: ציון, חוזקות/חולשות, כיוון שיפור, ניסוחים חלופיים, stress test
  │
  │  [אופציונלי] createProjectBrief(alternativeFormulation, diagnoseInput)
  │    →  POST /api/brief  →  Claude  →  ProjectBrief
  ▼
BriefScreen (client)
```

---

### זרימה 3: ארכיון (Archive)

```
ArchiveScreen (client)
  │  useEffect → fetch('/api/archive')  →  GET /api/archive
  ▼
/api/archive (server)
  │  ensureTable()
  │  prisma.archivedQuestion.findMany({ take: 100, orderBy: created_at desc })
  │  return { questions: ArchiveItem[] }
  ▼
ArchiveScreen (client)
  │  חיפוש צד-לקוח (topic, grade, subjects, question)
  │  מיון צד-לקוח (תאריך עולה/יורד, ציון עולה/יורד)
  │
  │  [מחיקה]
  │  DELETE /api/archive/[id]  body: { pin }
  │  → server verifies pin === DELETE_PIN
  │  → prisma.archivedQuestion.delete()
  │  → מסיר מה-state המקומי
```

---

## API — חוזה שירות

כל הנתיבים מוגבלים ל-3 בקשות לדקה לכל IP.

---

### `POST /api/generate`

**בקשה:**
```typescript
// body: FormInput
{
  "topic": "מים",
  "grade": "כיתה ח",
  "subjects": ["מדעים", "גאוגרפיה"],
  "learning_goals": "הבנת מחזור המים",
  "required_content": "פוטוסינתזה, אדים",
  "duration": "שבועיים",
  "context": "",
  "difficulty": "intermediate",
  "preferred_product": "",
  "boldness": "balanced"
}
```

**תגובה מוצלחת (200):**
```typescript
{
  "questions": [BigQuestion],
  "mockMode": boolean
}
```

**שגיאות:**
| קוד | סיבה |
|-----|------|
| 400 | JSON לא תקין |
| 429 | חריגה ממגבלת קצב |
| 500 | שגיאת Claude או שרת |

---

### `POST /api/diagnose`

**בקשה:**
```typescript
// body: DiagnoseInput
{
  "existing_question": "מה זה מזג אוויר?",
  "topic": "מדעים",
  "grade": "כיתה ג",
  "subjects": ["מדעים"],
  "learning_goals": "",
  "required_content": "",
  "duration": "שבוע",
  "boldness": "balanced"
}
```

**תגובה מוצלחת (200):**
```typescript
{
  "diagnosis": DiagnosisResult,
  "mockMode": boolean
}
```

---

### `POST /api/brief`

**בקשה:**
```typescript
{
  "selectedQuestion": BigQuestion,
  "originalInput": FormInput | DiagnoseInput
}
```

**תגובה מוצלחת (200):**
```typescript
{
  "brief": ProjectBrief,
  "mockMode": boolean
}
```

---

### `GET /api/archive`

**בקשה:** ללא גוף, ללא פרמטרים.

**תגובה מוצלחת (200):**
```typescript
{
  "questions": ArchiveItem[]  // עד 100, ממוין מהחדש לישן
}
```

אם אין חיבור DB — מחזיר `{ "questions": [] }` (לא שגיאה).

---

### `GET /api/seed`

**תיאור:** מוסיף 3 שאלות דוגמה לארכיון — רק אם הארכיון ריק לחלוטין. בטוח לקריאה חוזרת.

**בקשה:** ללא גוף, ללא פרמטרים.

**תגובה מוצלחת (200):**
```typescript
{ "message": "נוספו 3 שאלות דוגמה לארכיון." }
// או אם הארכיון כבר מכיל שאלות:
{ "message": "הארכיון כבר מכיל X שאלות — לא נוספו דוגמאות." }
```

**שגיאות:**
| קוד | סיבה |
|-----|------|
| 503 | אין חיבור DB (`DATABASE_URL` לא מוגדר) |
| 500 | שגיאת DB |

---

### `DELETE /api/archive/[id]`

**בקשה:**
```typescript
{ "pin": "1234" }
```

**תגובה מוצלחת (200):**
```typescript
{ "ok": true }
```

**שגיאות:**
| קוד | סיבה |
|-----|------|
| 400 | JSON לא תקין |
| 403 | קוד PIN שגוי |
| 404 | שאלה לא נמצאה |
| 500 | שגיאת DB |

---

## Rate Limiting

שני מנגנוני מגבלה פועלים במקביל — שניהם מבוססי זיכרון, ללא Redis, ללא שירות חיצוני.

### מגבלה לדקה (per-minute)

**מימוש** (חוזר בכל אחד משלושת ה-routes שמייצרים תוכן):
```typescript
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}
```

**מגבלה:** 3 בקשות לדקה לכל IP (`x-forwarded-for` header מה-reverse proxy).  
**מה קורה בחריגה:** HTTP 429 + `"יותר מדי בקשות — נסה שוב בעוד דקה"`.  
**חיי ה-Map:** מאופסת עם כל הפעלה מחדש של השרת (מתאים לפריסה בודדת).

### מגבלה יומית (daily limit) — `lib/dailyLimit.ts`

```typescript
const dailyLimitMap = new Map<string, { count: number; date: string }>()
export const DAILY_LIMIT = 10

export function checkDailyLimit(ip: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  const entry = dailyLimitMap.get(ip)
  if (!entry || entry.date !== today) {
    dailyLimitMap.set(ip, { count: 1, date: today })
    return true
  }
  if (entry.count >= DAILY_LIMIT) return false
  entry.count++
  return true
}
```

**מגבלה:** 10 בקשות ליום קלנדרי (UTC) לכל IP.  
**חלה על:** `/api/generate`, `/api/diagnose`, `/api/brief`.  
**מה קורה בחריגה:** HTTP 429.  
**איפוס:** אוטומטי בחצות UTC — כשהתאריך משתנה הספירה מתאפסת.

---

## מצב הדגמה (Mock Mode)

כשאין `ANTHROPIC_API_KEY` בסביבה, כל קריאות Claude מוחלפות בנתוני דוגמה מ-`lib/mockData.ts`.

**תוכן ה-mock data:**
- 3 דוגמאות `BigQuestion`: שכונה ברת-קיימא, זהות ישראלית, תפריט בית-ספר
- 1 דוגמת `DiagnosisResult`: ביקורת על "מה זה מזג אוויר?"
- 1 דוגמת `ProjectBrief`: תיק פרויקט לדוגמה

**השהיה:** 2000ms מלאכותית לדימוי קריאה אמיתית לשרת.  
**תצוגה:** בנר "פועל במצב הדגמה — אין מפתח API" מופיע בממשק.  
**ארכיון:** לא נשמרות שאלות (DB לא קיים בד"כ במצב הדגמה).

---

## מסד נתונים

**ספריה:** Prisma 7 עם `@prisma/adapter-pg` (PostgreSQL native).

**סכמה** (`prisma/schema.prisma`):
```prisma
model ArchivedQuestion {
  id            String   @id @default(cuid())
  topic         String
  grade         String
  subjects      String   // JSON.stringify(string[])
  question      String
  overall_score Float
  full_data     String   // JSON.stringify(BigQuestion)
  created_at    DateTime @default(now())
}
```

**אתחול (`lib/db.ts`):**
- `PrismaClient` נוצר כ-singleton (גלובלי בפיתוח, מודול-סקופ בפרודקשן)
- `ensureTable()` מריץ SQL גולמי ליצירת הטבלה אם לא קיימת — פתרון לסביבות ללא migration
- כל פעולות DB עטופות ב-`try/catch` — אי-זמינות DB לא קורסת את הכלי

---

## ממשק משתמש — מצבי תצוגה

| `AppMode` | קומפוננטה/אזור | תוכן |
|-----------|---------------|-------|
| `home` | page.tsx ~955 | Hero, 3 כרטיסי תכונות, 3 כפתורי כניסה |
| `generate` | `GenerateForm` | טופס יצירת שאלה עם validation ו-localStorage |
| `results` | `ResultsScreen` | רשימת שאלות, פרטים מורחבים, stress test, כפתור "צור תיק" |
| `diagnose` | `DiagnoseForm` | טופס אבחון שאלה קיימת |
| `diagnosis` | `DiagnosisScreen` | ציון, ניתוח, כיוון, ניסוחים חלופיים, stress test |
| `brief` | `BriefScreen` | תיק פרויקט מלא (2 חלקים: שאלה + brief שנוצר) |
| `archive` | page.tsx ~1152 | גריד שאלות + חיפוש + מיון + מחיקה |

**ניווט:** חד-כיווני לרוב. חזרה מנוהלת ע"י `goBack()` עם מיפוי `dest`.

---

## ממשקי AI — System Prompts

שלושה system prompts מוגדרים ב-`lib/prompts.ts`, כל אחד מאכיף:
- **JSON בלבד** — אסור markdown, גדרות קוד, טקסט חופשי מחוץ ל-JSON
- **עברית בלבד** — כל הפלט
- **מבנה מדויק** — מפתחות ספציפיים, אורכי מערכים, פורמטים

| Prompt | מפתח עטיפה | מה Claude מייצר |
|--------|------------|----------------|
| `GENERATE_SYSTEM_PROMPT` | `{ "questions": [...] }` | BigQuestion עם stress_test |
| `DIAGNOSE_SYSTEM_PROMPT` | `{ "diagnosis": {...} }` | DiagnosisResult עם stress_test |
| `BRIEF_SYSTEM_PROMPT` | `{ "brief": {...} }` | ProjectBrief עם רובריקה ושלבים |

**Retry:** `lib/anthropic.ts` מנסה עד 2 פעמים נוספות על שגיאת 529 (Claude עמוס), עם המתנה של 5 שניות בין ניסיונות.

---

## טיפול בשגיאות

| שגיאה | מיקום | טיפול |
|-------|--------|--------|
| Rate limit חרג | API routes | HTTP 429 + הודעה בעברית |
| JSON לא תקין | API routes | HTTP 400 |
| Claude 529 (עומס) | `lib/anthropic.ts` | Retry עד 2 פעמים, 5s המתנה |
| שגיאת Claude אחרת | `lib/anthropic.ts` | זורק `Error` → HTTP 500 |
| Timeout לקוח (120s) | `lib/apiClient.ts` | הודעה "הבקשה ארכה זמן רב מדי" |
| PIN מחיקה שגוי | `/api/archive/[id]` | HTTP 403 + "קוד שגוי" |
| DB לא זמין | כל שימוש ב-Prisma | Graceful fallback, לא קריסה |
| DB archive נכשל | `/api/generate` | `console.error` + non-fatal |

---

## סביבות פריסה

### Railway (`railway.json`)
```json
{
  "builder": "nixpacks",
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE"
  }
}
```
- Nixpacks מזהה אוטומטית Node.js + Next.js
- `npm start` מריץ את שרת ה-Production של Next.js
- בדיקת בריאות על נתיב `/`
- הפעלה מחדש אוטומטית בכשל

### Render (`render.yaml`)
```yaml
# Web service
startCommand: npx prisma db push && npm start
# PostgreSQL database — מקושר אוטומטית
# ANTHROPIC_API_KEY — sync: false (לא בגיט, חובה להגדיר ידנית)
```
- `prisma db push` מריץ migration על PostgreSQL לפני הפעלת השרת
- `DATABASE_URL` מקושר אוטומטית מה-PostgreSQL service של Render
- `ANTHROPIC_API_KEY` **חייב** להיות מוגדר ידנית ב-Render Dashboard

### Checklist לפני פריסה
- [ ] `ANTHROPIC_API_KEY` מוגדר
- [ ] `DELETE_PIN` מוגדר (אם רוצים מחיקה מהארכיון)
- [ ] `DATABASE_URL` מוגדר (Railway/Render עושים זאת אוטומטית)
- [ ] `NODE_ENV=production`
- [ ] `npm run build` עובר ללא שגיאות TypeScript

---

## הדפסה ושיתוף

הכלי תומך בהדפסת תיק הפרויקט לPDF דרך הדפדפן.

**סגנוני הדפסה** (`app/globals.css`):
- אלמנטים עם מחלקה `.no-print` מוסתרים (ניווט, כפתורים)
- רקעים כהים הופכים לבן, טקסט הופך לשחור
- מניעת שבירת עמוד בתוך סקציות
- הטבלה/רובריקה נשמרת כטבלה גם בהדפסה
