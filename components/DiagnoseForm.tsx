'use client'

import { useState, useEffect, FormEvent } from 'react'
import {
  BookOpen,
  GraduationCap,
  Layers,
  Target,
  FileText,
  Calendar,
  Zap,
  Search,
  Loader2,
} from 'lucide-react'
import { diagnoseExistingQuestion } from '@/lib/apiClient'
import type { DiagnoseInput, DiagnosisResult } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const SUBJECT_OPTIONS = [
  'מדעים', 'היסטוריה', 'שפה', 'גאוגרפיה',
  'אזרחות', 'מתמטיקה', 'אומנות', 'ספורט',
]

const LOADING_MESSAGES = [
  'בודק אם השאלה באמת מחזיקה פרויקט...',
  'מחפש את המתח הפדגוגי...',
  'ממפה ידע, מיומנויות ותוצרים...',
  'בודק אם זו שאלה שאפשר לפתור בגוגל אחד...',
  'מנסח משוב פדגוגי ברור...',
]

const BOLDNESS_OPTIONS: { value: DiagnoseInput['boldness']; label: string; subtitle: string }[] = [
  { value: 'conservative', label: 'שמרנית', subtitle: 'מתאים לבית הספר, בטוח' },
  { value: 'balanced',     label: 'מאוזנת', subtitle: 'מאתגרת אבל ישימה' },
  { value: 'bold',         label: 'נועזת',  subtitle: 'מעוררת דיון, אולי לא נוחה' },
]

const INITIAL_FORM: DiagnoseInput = {
  existing_question: '',
  topic: '',
  grade: '',
  subjects: [],
  learning_goals: '',
  required_content: '',
  duration: 'שבועיים עד שלושה שבועות',
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
  onSuccess: (diagnosis: DiagnosisResult, mockMode: boolean) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DiagnoseForm({ onSuccess }: Props) {
  const [form, setForm] = useState<DiagnoseInput>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof DiagnoseInput, string>>>({})
  const [loading, setLoading] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Rotate loading message every 2 s
  useEffect(() => {
    if (!loading) return
    const id = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 2000)
    return () => clearInterval(id)
  }, [loading])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function set<K extends keyof DiagnoseInput>(key: K, value: DiagnoseInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function toggleSubject(subject: string) {
    const next = form.subjects.includes(subject)
      ? form.subjects.filter((s) => s !== subject)
      : [...form.subjects, subject]
    set('subjects', next)
  }

  function validate(): boolean {
    const next: Partial<Record<keyof DiagnoseInput, string>> = {}
    if (!form.existing_question.trim()) next.existing_question = 'נא להזין את שאלת ה-PBL לאבחון'
    if (!form.topic.trim())             next.topic             = 'נא להזין נושא לימוד'
    if (!form.grade.trim())             next.grade             = 'נא להזין שכבת גיל'
    if (form.subjects.length < 2)       next.subjects          = 'נא לבחור לפחות 2 תחומי דעת'
    if (!form.learning_goals.trim())    next.learning_goals    = 'נא להזין מטרות למידה'
    if (!form.required_content.trim())  next.required_content  = 'נא להזין תכנים נדרשים'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function doSubmit() {
    setLoading(true)
    setSubmitError(null)
    setLoadingMsgIdx(0)
    try {
      const { diagnosis, mockMode } = await diagnoseExistingQuestion(form)
      onSuccess(diagnosis, mockMode)
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
        <h2 className="text-lg font-semibold text-gray-900">אבחון שאלת PBL</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          הכנסי את השאלה הקיימת ו-Claude יאבחן אותה ויציע שיפורים
        </p>
      </div>

      {/* ── Existing question — prominent ── */}
      <div>
        <label htmlFor="existing_question" className={labelCls}>
          <Search className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          שאלת ה־PBL הקיימת
          <span className="text-red-400">*</span>
        </label>
        <textarea
          id="existing_question"
          rows={5}
          className={inputCls + ' resize-none text-base leading-relaxed'}
          placeholder="הכנס כאן את שאלת ה-PBL שברצונך לאבחן..."
          value={form.existing_question}
          onChange={(e) => set('existing_question', e.target.value)}
          disabled={loading}
        />
        {errors.existing_question && <p className={errorCls}>{errors.existing_question}</p>}
      </div>

      {/* ── Row: topic + grade ── */}
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
            placeholder="כיתה ח, תיכון, צוות מורים..."
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
        {errors.subjects && <p className={errorCls}>{errors.subjects}</p>}
      </div>

      {/* ── Learning goals ── */}
      <div>
        <label htmlFor="learning_goals" className={labelCls}>
          <Target className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          מטרות למידה
          <span className="text-red-400">*</span>
        </label>
        <textarea
          id="learning_goals"
          rows={3}
          className={inputCls + ' resize-none'}
          placeholder="מה התלמידים אמורים להבין, לדעת או לעשות בסוף הפרויקט?"
          value={form.learning_goals}
          onChange={(e) => set('learning_goals', e.target.value)}
          disabled={loading}
        />
        {errors.learning_goals && <p className={errorCls}>{errors.learning_goals}</p>}
      </div>

      {/* ── Required content ── */}
      <div>
        <label htmlFor="required_content" className={labelCls}>
          <FileText className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          מושגים או תכנים שחייבים להיכלל
          <span className="text-red-400">*</span>
        </label>
        <textarea
          id="required_content"
          rows={3}
          className={inputCls + ' resize-none'}
          placeholder="רשמי מושגים, נושאים מהתוכנית, חוקים, תהליכים וכו'..."
          value={form.required_content}
          onChange={(e) => set('required_content', e.target.value)}
          disabled={loading}
        />
        {errors.required_content && <p className={errorCls}>{errors.required_content}</p>}
      </div>

      {/* ── Duration ── */}
      <div>
        <label htmlFor="duration" className={labelCls}>
          <Calendar className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          משך הפרויקט
        </label>
        <select
          id="duration"
          className={inputCls + ' cursor-pointer'}
          value={form.duration}
          onChange={(e) => set('duration', e.target.value)}
          disabled={loading}
        >
          <option value="שבוע">שבוע</option>
          <option value="שבועיים עד שלושה שבועות">2–3 שבועות</option>
          <option value="ארבעה עד שישה שבועות">4–6 שבועות</option>
          <option value="סמסטר">סמסטר</option>
        </select>
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
              <Search className="w-5 h-5" strokeWidth={1.5} />
              אבחן את השאלה
            </>
          )}
        </button>

        {/* Error state */}
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
