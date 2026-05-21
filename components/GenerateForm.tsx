'use client'

import { useState, useEffect, FormEvent } from 'react'
import {
  BookOpen,
  GraduationCap,
  Layers,
  Target,
  FileText,
  Zap,
  FlaskConical,
  Loader2,
  Plus,
  X,
} from 'lucide-react'
import { createQuestions } from '@/lib/apiClient'
import type { BigQuestion, FormInput } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const SUBJECT_OPTIONS = [
  'מדעים', 'היסטוריה', 'שפה ותקשורת', 'גאוגרפיה',
  'אזרחות', 'מתמטיקה', 'אומנות', 'ספורט',
  'טכנולוגיה', 'כלכלה', 'ניהול', 'פסיכולוגיה',
  'פילוסופיה', 'סוציולוגיה', 'בריאות', 'סביבה',
]

const LOADING_MESSAGES = [
  'מעיר את השרת — זה עשוי לקחת עד 30 שניות בפעם הראשונה...',
  'בודק אם השאלה באמת מחזיקה פרויקט...',
  'מחפש את המתח הפדגוגי...',
  'ממפה ידע, מיומנויות ותוצרים...',
  'בודק אם זו שאלה שאפשר לפתור עם ChatGPT...',
  'מנסח משוב פדגוגי ברור...',
]

const BOLDNESS_OPTIONS: { value: FormInput['boldness']; label: string; subtitle: string }[] = [
  { value: 'conservative', label: 'שמרנית', subtitle: 'מתאים לבית הספר, בטוח' },
  { value: 'balanced',     label: 'מאוזנת', subtitle: 'מאתגרת אבל ישימה' },
  { value: 'bold',         label: 'נועזת',  subtitle: 'מעוררת דיון, אולי לא נוחה' },
]

const INITIAL_FORM: FormInput = {
  topic: '',
  grade: '',
  subjects: [],
  learning_goals: '',
  required_content: '',
  duration: 'שבועיים עד שלושה שבועות',
  context: '',
  difficulty: 'intermediate',
  preferred_product: '',
  boldness: 'balanced',
}

// ─── Shared class strings ─────────────────────────────────────────────────────

const inputCls =
  'bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 w-full text-white ' +
  'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ' +
  'placeholder:text-slate-500 transition-all text-sm'

const labelCls = 'flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5'

const errorCls = 'text-rose-400 text-xs mt-1'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onSuccess: (questions: BigQuestion[], mockMode: boolean, input: FormInput) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GenerateForm({ onSuccess }: Props) {
  const [form, setForm] = useState<FormInput>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormInput, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormInput, boolean>>>({})
  const [loading, setLoading] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [customSubjectInput, setCustomSubjectInput] = useState('')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!loading) return
    const id = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 2000)
    return () => clearInterval(id)
  }, [loading])

  useEffect(() => {
    if (!loading) { setProgress(0); return }
    setProgress(5)
    const id = setInterval(() => {
      setProgress((p) => p + (90 - p) * 0.07)
    }, 350)
    return () => clearInterval(id)
  }, [loading])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function set<K extends keyof FormInput>(key: K, value: FormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (touched[key]) {
      validateSingleField(key, value)
    }
  }

  function validateSingleField<K extends keyof FormInput>(key: K, value: FormInput[K]) {
    setErrors((prev) => {
      const next = { ...prev }
      if (key === 'topic') {
        const v = value as string
        if (!v.trim()) next.topic = 'נא להזין נושא לימוד'
        else delete next.topic
      }
      if (key === 'grade') {
        const v = value as string
        if (!v.trim()) next.grade = 'נא להזין שכבת גיל'
        else delete next.grade
      }
      return next
    })
  }

  function handleBlur(key: keyof FormInput) {
    setTouched((prev) => ({ ...prev, [key]: true }))
    validateSingleField(key, form[key])
  }

  function toggleSubject(subject: string) {
    const next = form.subjects.includes(subject)
      ? form.subjects.filter((s) => s !== subject)
      : [...form.subjects, subject]
    set('subjects', next)
  }

  function addCustomSubject() {
    const trimmed = customSubjectInput.trim()
    if (!trimmed || form.subjects.includes(trimmed)) {
      setCustomSubjectInput('')
      return
    }
    set('subjects', [...form.subjects, trimmed])
    setCustomSubjectInput('')
  }

  function removeSubject(subject: string) {
    set('subjects', form.subjects.filter((s) => s !== subject))
  }

  const customSubjects = form.subjects.filter((s) => !SUBJECT_OPTIONS.includes(s))

  function validate(): boolean {
    const allTouched: Partial<Record<keyof FormInput, boolean>> = {
      topic: true,
      grade: true,
      subjects: true,
    }
    setTouched((prev) => ({ ...prev, ...allTouched }))
    const next: Partial<Record<keyof FormInput, string>> = {}
    if (!form.topic.trim()) next.topic = 'נא להזין נושא לימוד'
    if (!form.grade.trim()) next.grade = 'נא להזין שכבת גיל'
    if (form.subjects.length < 2) next.subjects = 'נא לבחור לפחות 2 תחומי דעת'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function doSubmit() {
    setLoading(true)
    setSubmitError(null)
    setLoadingMsgIdx(0)
    try {
      const { questions, mockMode } = await createQuestions(form)
      setProgress(100)
      onSuccess(questions, mockMode, form)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'שגיאה לא ידועה')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    void doSubmit()
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="pb-2 border-b border-slate-800 animate-pulse">
          <div className="h-5 w-40 bg-slate-800 rounded-lg" />
          <div className="h-3 w-64 bg-slate-800 rounded-lg mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-11 bg-slate-800 rounded-xl" />
          <div className="h-11 bg-slate-800 rounded-xl" />
        </div>
        <div className="h-24 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-16 bg-slate-800 rounded-xl animate-pulse" />

        {/* Progress + rotating message */}
        <div className="space-y-1.5">
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 text-center">{LOADING_MESSAGES[loadingMsgIdx]}</p>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* ── Section header ── */}
      <div className="pb-2 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">פרטי הפרויקט</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          מלאי את הפרטים ו-Claude יבנה עבורך שאלות מנחות מותאמות
        </p>
        <p className="text-xs text-slate-500 mt-1">
          שדות המסומנים ב-<span className="text-rose-400">*</span> הם שדות חובה
        </p>
      </div>

      {/* ── Row 1: topic + grade ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Topic */}
        <div>
          <label htmlFor="topic" className={labelCls}>
            <BookOpen className="w-4 h-4 text-violet-400" strokeWidth={1.5} />
            נושא הלמידה
            <span className="text-rose-400">*</span>
          </label>
          <input
            id="topic"
            type="text"
            className={inputCls}
            placeholder="לדוגמה: מים, אנרגיה, גלות וגאולה..."
            value={form.topic}
            onChange={(e) => set('topic', e.target.value)}
            onBlur={() => handleBlur('topic')}
            disabled={loading}
          />
          {touched.topic && errors.topic && <p className={errorCls}>{errors.topic}</p>}
        </div>

        {/* Grade */}
        <div>
          <label htmlFor="grade" className={labelCls}>
            <GraduationCap className="w-4 h-4 text-violet-400" strokeWidth={1.5} />
            שכבת גיל / קהל יעד
            <span className="text-rose-400">*</span>
          </label>
          <input
            id="grade"
            type="text"
            className={inputCls}
            placeholder="כיתה ח, תיכון, צוות מורים, הכשרה מקצועית..."
            value={form.grade}
            onChange={(e) => set('grade', e.target.value)}
            onBlur={() => handleBlur('grade')}
            disabled={loading}
          />
          {touched.grade && errors.grade && <p className={errorCls}>{errors.grade}</p>}
        </div>
      </div>

      {/* ── Subjects ── */}
      <div>
        <div className={labelCls}>
          <Layers className="w-4 h-4 text-violet-400" strokeWidth={1.5} />
          תחומי דעת
          <span className="text-rose-400">*</span>
          <span className="text-xs font-normal text-slate-500">(לפחות 2)</span>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="תחומי דעת"
        >
          {SUBJECT_OPTIONS.map((subject) => {
            const selected = form.subjects.includes(subject)
            return (
              <button
                key={subject}
                type="button"
                onClick={() => toggleSubject(subject)}
                disabled={loading}
                aria-pressed={selected}
                className={
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-100 ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ' +
                  (selected
                    ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500')
                }
              >
                {subject}
              </button>
            )
          })}
        </div>

        {/* Custom subject input */}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            className={inputCls + ' flex-1'}
            placeholder="תחום דעת נוסף... (הקלד ולחץ Enter)"
            value={customSubjectInput}
            onChange={(e) => setCustomSubjectInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSubject() } }}
            disabled={loading}
          />
          <button
            type="button"
            onClick={addCustomSubject}
            disabled={loading || !customSubjectInput.trim()}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-40 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            הוסף
          </button>
        </div>

        {/* Custom subject chips */}
        {customSubjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {customSubjects.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-600 border border-violet-600 text-white shadow-md shadow-violet-500/30"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSubject(s)}
                  disabled={loading}
                  className="ms-0.5 hover:opacity-70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded"
                  aria-label={`הסר ${s}`}
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
              </span>
            ))}
          </div>
        )}

        {touched.subjects && errors.subjects && <p className={errorCls}>{errors.subjects}</p>}
      </div>

      {/* ── Learning goals (optional) ── */}
      <div>
        <label htmlFor="learning_goals" className={labelCls}>
          <Target className="w-4 h-4 text-violet-400" strokeWidth={1.5} />
          מטרות למידה
          <span className="text-xs font-normal text-slate-500">(אופציונלי)</span>
        </label>
        <textarea
          id="learning_goals"
          rows={2}
          className={inputCls + ' resize-none'}
          placeholder="מה התלמידים אמורים להבין, לדעת או לעשות בסוף הפרויקט?"
          value={form.learning_goals}
          onChange={(e) => set('learning_goals', e.target.value)}
          disabled={loading}
        />
      </div>

      {/* ── Required content (optional) ── */}
      <div>
        <label htmlFor="required_content" className={labelCls}>
          <FileText className="w-4 h-4 text-violet-400" strokeWidth={1.5} />
          מושגים או תכנים שחייבים להיכלל
          <span className="text-xs font-normal text-slate-500">(אופציונלי)</span>
        </label>
        <textarea
          id="required_content"
          rows={2}
          className={inputCls + ' resize-none'}
          placeholder="רשמי מושגים, נושאים מהתוכנית, חוקים, תהליכים וכו'..."
          value={form.required_content}
          onChange={(e) => set('required_content', e.target.value)}
          disabled={loading}
        />
      </div>

      {/* ── Boldness ── */}
      <div>
        <div className={labelCls}>
          <Zap className="w-4 h-4 text-violet-400" strokeWidth={1.5} />
          רמת נועזות פדגוגית
        </div>
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          role="radiogroup"
          aria-label="רמת נועזות פדגוגית"
        >
          {BOLDNESS_OPTIONS.map(({ value, label, subtitle }) => {
            const selected = form.boldness === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => set('boldness', value)}
                disabled={loading}
                role="radio"
                aria-checked={selected}
                className={
                  'rounded-xl px-4 py-3 text-start transition-all duration-100 cursor-pointer ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ' +
                  (selected
                    ? 'border-2 border-violet-500 bg-slate-800 shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/20'
                    : 'border border-slate-700 bg-slate-800 hover:border-slate-500')
                }
              >
                <div className={`text-sm font-semibold ${selected ? 'text-violet-300' : 'text-white'}`}>{label}</div>
                <div className={`text-xs mt-0.5 ${selected ? 'text-slate-300' : 'text-slate-400'}`}>{subtitle}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="pt-2 space-y-3">
        <button
          type="submit"
          disabled={loading}
          className={
            'w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl ' +
            'text-base font-medium transition-all duration-150 ' +
            'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25'
          }
        >
          <FlaskConical className="w-5 h-5" strokeWidth={1.5} />
          צור שאלות PBL
        </button>

        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-700/50 bg-rose-900/30 px-4 py-3 flex items-start justify-between gap-3"
          >
            <p className="text-sm text-rose-300">
              {submitError || 'משהו השתבש. בדקי את חיבור האינטרנט ונסי שוב.'}
            </p>
            <button
              type="button"
              onClick={() => void doSubmit()}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700/50 border border-rose-600 text-sm text-rose-200 hover:bg-rose-700 transition-colors whitespace-nowrap"
            >
              נסי שוב
            </button>
          </div>
        )}
      </div>
    </form>
  )
}
