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
  'בודק אם השאלה באמת מחזיקה פרויקט...',
  'מחפש את המתח הפדגוגי...',
  'ממפה ידע, מיומנויות ותוצרים...',
  'בודק אם זו שאלה שאפשר לפתור בגוגל אחד...',
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
  'border border-gray-200 rounded-xl px-4 py-3 w-full text-gray-900 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ' +
  'placeholder:text-gray-400 transition-shadow text-sm'

const labelCls = 'flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5'

const errorCls = 'text-red-500 text-xs mt-1'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onSuccess: (questions: BigQuestion[], mockMode: boolean, input: FormInput) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GenerateForm({ onSuccess }: Props) {
  const [form, setForm] = useState<FormInput>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormInput, string>>>({})
  const [loading, setLoading] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [customSubjectInput, setCustomSubjectInput] = useState('')

  useEffect(() => {
    if (!loading) return
    const id = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 2000)
    return () => clearInterval(id)
  }, [loading])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function set<K extends keyof FormInput>(key: K, value: FormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* ── Section header ── */}
      <div className="pb-2 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">פרטי הפרויקט</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          מלאי את הפרטים ו-Claude יבנה עבורך שאלות מנחות מותאמות
        </p>
      </div>

      {/* ── Row 1: topic + grade ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Topic */}
        <div>
          <label htmlFor="topic" className={labelCls}>
            <BookOpen className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            נושא הלמידה
            <span className="text-red-400">*</span>
          </label>
          <input
            id="topic"
            type="text"
            className={inputCls}
            placeholder="לדוגמה: מים, אנרגיה, גלות וגאולה..."
            value={form.topic}
            onChange={(e) => set('topic', e.target.value)}
            disabled={loading}
          />
          {errors.topic && <p className={errorCls}>{errors.topic}</p>}
        </div>

        {/* Grade */}
        <div>
          <label htmlFor="grade" className={labelCls}>
            <GraduationCap className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            שכבת גיל / קהל יעד
            <span className="text-red-400">*</span>
          </label>
          <input
            id="grade"
            type="text"
            className={inputCls}
            placeholder="כיתה ח, תיכון, צוות מורים, הכשרה מקצועית..."
            value={form.grade}
            onChange={(e) => set('grade', e.target.value)}
            disabled={loading}
          />
          {errors.grade && <p className={errorCls}>{errors.grade}</p>}
        </div>
      </div>

      {/* ── Subjects ── */}
      <div>
        <div className={labelCls}>
          <Layers className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          תחומי דעת
          <span className="text-red-400">*</span>
          <span className="text-xs font-normal text-gray-400">(לפחות 2)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_OPTIONS.map((subject) => {
            const selected = form.subjects.includes(subject)
            return (
              <button
                key={subject}
                type="button"
                onClick={() => toggleSubject(subject)}
                disabled={loading}
                className={
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-100 ' +
                  (selected
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400')
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
            placeholder="תחום דעת אחר... (הקלד והוסף)"
            value={customSubjectInput}
            onChange={(e) => setCustomSubjectInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSubject() } }}
            disabled={loading}
          />
          <button
            type="button"
            onClick={addCustomSubject}
            disabled={loading || !customSubjectInput.trim()}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-gray-400 disabled:opacity-40 transition-colors"
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
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-900 text-white border border-gray-900"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSubject(s)}
                  disabled={loading}
                  className="ml-0.5 hover:opacity-70"
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
              </span>
            ))}
          </div>
        )}

        {errors.subjects && <p className={errorCls}>{errors.subjects}</p>}
      </div>

      {/* ── Learning goals (optional) ── */}
      <div>
        <label htmlFor="learning_goals" className={labelCls}>
          <Target className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          מטרות למידה
          <span className="text-xs font-normal text-gray-400">(אופציונלי)</span>
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
          <FileText className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          מושגים או תכנים שחייבים להיכלל
          <span className="text-xs font-normal text-gray-400">(אופציונלי)</span>
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
          <Zap className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          רמת נועזות פדגוגית
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BOLDNESS_OPTIONS.map(({ value, label, subtitle }) => {
            const selected = form.boldness === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => set('boldness', value)}
                disabled={loading}
                className={
                  'rounded-xl px-4 py-3 text-start transition-colors duration-100 ' +
                  (selected
                    ? 'border-2 border-gray-900 bg-gray-50'
                    : 'border border-gray-200 bg-white hover:border-gray-400')
                }
              >
                <div className="text-sm font-semibold text-gray-900">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
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
            'text-base font-medium transition-colors duration-150 ' +
            (loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-700')
          }
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
              <span className="truncate">{LOADING_MESSAGES[loadingMsgIdx]}</span>
            </>
          ) : (
            <>
              <FlaskConical className="w-5 h-5" strokeWidth={1.5} />
              צור שאלות PBL
            </>
          )}
        </button>

        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start justify-between gap-3">
            <p className="text-sm text-red-700">
              משהו השתבש. בדקי את חיבור האינטרנט ונסי שוב.
            </p>
            <button
              type="button"
              onClick={() => void doSubmit()}
              className="text-sm font-medium text-red-700 underline underline-offset-2 whitespace-nowrap hover:text-red-900"
            >
              נסי שוב
            </button>
          </div>
        )}
      </div>
    </form>
  )
}
