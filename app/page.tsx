'use client'

import { useState } from 'react'
import {
  FlaskConical,
  Search,
  ChevronRight,
  RotateCcw,
  Loader2,
  BookOpen,
} from 'lucide-react'
import type {
  AppMode,
  BigQuestion,
  DiagnosisResult,
  FormInput,
  DiagnoseInput,
  ProjectBrief,
} from '@/types'
import { createProjectBrief } from '@/lib/apiClient'
import GenerateForm from '@/components/GenerateForm'
import DiagnoseForm from '@/components/DiagnoseForm'

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  questions,
  selectedQuestion,
  onSelectQuestion,
  onGenerateBrief,
  briefLoading,
  briefError,
}: {
  questions: BigQuestion[]
  selectedQuestion: BigQuestion | null
  onSelectQuestion: (q: BigQuestion) => void
  onGenerateBrief: () => void
  briefLoading: boolean
  briefError: string | null
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        נמצאו {questions.length} שאלות מנחות — בחרי שאלה לצפייה ויצירת תיק פרויקט
      </p>

      <div className="space-y-3">
        {questions.map((q) => {
          const selected = selectedQuestion?.id === q.id
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectQuestion(q)}
              className={
                'w-full text-start p-4 rounded-xl border transition-all duration-150 ' +
                (selected
                  ? 'border-violet-500 bg-slate-800 shadow-lg shadow-violet-500/20'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-500')
              }
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-white leading-relaxed">{q.question}</p>
                <span className={
                  'shrink-0 text-xs font-semibold rounded-full px-2 py-0.5 ' +
                  (selected
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'bg-slate-700 text-slate-400')
                }>
                  {q.stress_test.overall_score.toFixed(1)}
                </span>
              </div>
              {selected && q.why_it_works && (
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{q.why_it_works}</p>
              )}
            </button>
          )
        })}
      </div>

      {selectedQuestion && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onGenerateBrief}
            disabled={briefLoading}
            className={
              'w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-base font-medium transition-all duration-150 ' +
              (briefLoading
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25')
            }
          >
            {briefLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
                בונה תיק פרויקט...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" strokeWidth={1.5} />
                צור תיק פרויקט לשאלה הנבחרת
              </>
            )}
          </button>

          {briefError && (
            <div className="rounded-xl border border-rose-700/50 bg-rose-900/30 px-4 py-3">
              <p className="text-sm text-rose-300">{briefError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Diagnosis screen ─────────────────────────────────────────────────────────

function DiagnosisScreen({ diagnosis }: { diagnosis: DiagnosisResult }) {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <span className="text-6xl font-black text-white">
          {diagnosis.overall_score.toFixed(1)}
        </span>
        <span className="text-xl text-slate-500">/ 10</span>
        <span className="text-sm text-slate-400">ציון כולל</span>
      </div>

      {diagnosis.why_problematic && (
        <div className="p-4 rounded-xl bg-rose-900/20 border border-rose-700/40">
          <p className="text-sm text-rose-300 leading-relaxed">{diagnosis.why_problematic}</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">מה עובד</h3>
        <ul className="space-y-1.5">
          {diagnosis.what_works.map((item, i) => (
            <li key={i} className="text-sm text-slate-300 flex gap-2">
              <span className="text-emerald-400 shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">מה לא עובד</h3>
        <ul className="space-y-1.5">
          {diagnosis.what_doesnt_work.map((item, i) => (
            <li key={i} className="text-sm text-slate-300 flex gap-2">
              <span className="text-rose-400 shrink-0">✗</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">כיוון לשיפור</h3>
        <div className="border-r-2 border-violet-500 pr-3">
          <p className="text-sm text-slate-300 leading-relaxed">{diagnosis.direction}</p>
        </div>
      </div>

      {diagnosis.alternative_formulations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">ניסוחים חלופיים</h3>
          <div className="space-y-3">
            {diagnosis.alternative_formulations.map((alt, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-700 bg-slate-800 space-y-1">
                <p className="text-sm font-medium text-white">{alt.question}</p>
                <p className="text-xs text-slate-400">{alt.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Brief screen ─────────────────────────────────────────────────────────────

function BriefScreen({ brief }: { brief: ProjectBrief }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-white">{brief.project_title}</h3>
        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
          <p className="text-sm font-medium text-violet-200 leading-relaxed">
            {brief.driving_question}
          </p>
        </div>
        {brief.teacher_summary && (
          <p className="text-sm text-slate-400 leading-relaxed">{brief.teacher_summary}</p>
        )}
      </div>

      {/* Learning goals */}
      {brief.learning_goals.length > 0 && (
        <section className="pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">מטרות למידה</h4>
          <ul className="space-y-2">
            {brief.learning_goals.map((g, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-violet-400 shrink-0 font-semibold">{i + 1}.</span>
                {g}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Inquiry stages */}
      {brief.inquiry_stages.length > 0 && (
        <section className="pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">שלבי החקירה</h4>
          <div className="space-y-2">
            {brief.inquiry_stages.map((stage, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-800 border-r-2 border-violet-500">
                <p className="text-sm text-slate-300 leading-relaxed">{stage}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Possible products */}
      {brief.possible_products.length > 0 && (
        <section className="pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">תוצרים אפשריים</h4>
          <ul className="space-y-1.5">
            {brief.possible_products.map((p, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-violet-400 shrink-0">•</span>
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Rubric */}
      {brief.rubric.length > 0 && (
        <section className="pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">רובריקה</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 border-b border-slate-700">
                <tr>
                  {['קריטריון', 'מתחיל', 'מתפתח', 'מיומן'].map((h) => (
                    <th key={h} className="px-3 py-2 text-right font-medium text-slate-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brief.rubric.map((row, i) => (
                  <tr key={i} className="border-b border-slate-800 last:border-0">
                    <td className="px-3 py-2 font-medium text-white align-top">{row.criterion}</td>
                    <td className="px-3 py-2 text-slate-400 align-top">{row.beginning}</td>
                    <td className="px-3 py-2 text-slate-400 align-top">{row.developing}</td>
                    <td className="px-3 py-2 text-slate-400 align-top">{row.proficient}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Differentiation */}
      {(brief.differentiation.support || brief.differentiation.extension) && (
        <section className="pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">דיפרנציאציה</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {brief.differentiation.support && (
              <div className="p-3 rounded-lg border border-blue-700/40 bg-blue-900/20">
                <p className="text-xs font-semibold text-blue-400 mb-1">תמיכה</p>
                <p className="text-sm text-blue-200 leading-relaxed">{brief.differentiation.support}</p>
              </div>
            )}
            {brief.differentiation.extension && (
              <div className="p-3 rounded-lg border border-emerald-700/40 bg-emerald-900/20">
                <p className="text-xs font-semibold text-emerald-400 mb-1">הרחבה</p>
                <p className="text-sm text-emerald-200 leading-relaxed">{brief.differentiation.extension}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Opening experience */}
      {brief.opening_experience && (
        <section className="pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">חוויית פתיחה</h4>
          <div className="p-4 rounded-xl border border-amber-700/30 bg-amber-900/20">
            <p className="text-sm text-amber-200 leading-relaxed">{brief.opening_experience}</p>
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Confirmation dialog ──────────────────────────────────────────────────────

function ConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5">
        <p className="text-white font-medium leading-relaxed">
          האם להתחיל מחדש? הנתונים הנוכחיים יימחקו.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all"
          >
            כן, התחל מחדש
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:border-slate-500 hover:text-white transition-colors"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const [mode, setMode] = useState<AppMode>('home')
  const [formInput, setFormInput] = useState<FormInput | null>(null)
  const [diagnoseInput, setDiagnoseInput] = useState<DiagnoseInput | null>(null)
  const [questions, setQuestions] = useState<BigQuestion[]>([])
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<BigQuestion | null>(null)
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null)
  const [mockMode, setMockMode] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [briefLoading, setBriefLoading] = useState(false)
  const [briefError, setBriefError] = useState<string | null>(null)

  function resetAll() {
    setMode('home')
    setFormInput(null)
    setDiagnoseInput(null)
    setQuestions([])
    setDiagnosis(null)
    setSelectedQuestion(null)
    setProjectBrief(null)
    setMockMode(false)
    setShowConfirm(false)
    setBriefLoading(false)
    setBriefError(null)
  }

  function goBack() {
    const dest: Partial<Record<AppMode, AppMode>> = {
      generate: 'home',
      diagnose: 'home',
      results: 'generate',
      diagnosis: 'diagnose',
      brief: formInput !== null ? 'results' : 'diagnosis',
    }
    setMode(dest[mode] ?? 'home')
  }

  async function handleGenerateBrief() {
    if (!selectedQuestion) return
    const originalInput = formInput ?? diagnoseInput
    if (!originalInput) return
    setBriefLoading(true)
    setBriefError(null)
    try {
      const { brief, mockMode: m } = await createProjectBrief({ selectedQuestion, originalInput })
      setProjectBrief(brief)
      setMockMode(m)
      setMode('brief')
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : 'שגיאה ביצירת תיק פרויקט')
    } finally {
      setBriefLoading(false)
    }
  }

  // ── Home ────────────────────────────────────────────────────────────────────

  if (mode === 'home') {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl text-center space-y-10">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-5 rounded-2xl bg-violet-500/10 border border-violet-500/20 shadow-2xl shadow-violet-500/20">
              <FlaskConical className="w-12 h-12 text-violet-400" strokeWidth={1.5} />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-5">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent leading-tight pb-1">
              PBL Question Lab
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed">
              שאלות שאי אפשר לפתור ב-ChatGPT.
            </p>
            <p className="text-base text-slate-400 leading-relaxed max-w-lg mx-auto">
              כלי AI שעוזר למורים לבנות שאלות מנחות שמחייבות חקר אמיתי —
              עם מתח, דילמה ותוצר משמעותי.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {['✦ יוצר שאלות חדשות', '✦ מאבחן שאלות קיימות', '✦ בונה תיק פרויקט מלא'].map((f) => (
                <span key={f} className="text-xs font-medium text-slate-400 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-full">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => setMode('generate')}
              className="inline-flex items-center gap-2 justify-center px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-base font-semibold shadow-lg shadow-violet-500/25 transition-all duration-150"
            >
              <FlaskConical className="w-5 h-5" strokeWidth={1.5} />
              צור שאלות PBL
            </button>
            <button
              type="button"
              onClick={() => setMode('diagnose')}
              className="inline-flex items-center gap-2 justify-center px-7 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-base font-medium hover:border-violet-500/50 hover:text-white transition-all duration-150"
            >
              <Search className="w-5 h-5" strokeWidth={1.5} />
              אבחן שאלה קיימת
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Non-home screens ────────────────────────────────────────────────────────

  const showRestart = mode === 'results' || mode === 'diagnosis' || mode === 'brief'
  const isWide = mode === 'results' || mode === 'diagnosis' || mode === 'brief'

  return (
    <main className="min-h-screen bg-slate-950">
      {mockMode && (
        <div className="bg-amber-900/30 border-b border-amber-700/50 px-4 py-2.5 text-center">
          <span className="text-sm text-amber-300">פועל במצב הדגמה — אין מפתח API</span>
        </div>
      )}

      {/* Navigation bar */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            חזור
          </button>

          {showRestart && (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              התחל מחדש
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`mx-auto px-6 py-8 ${isWide ? 'max-w-3xl' : 'max-w-2xl'}`}>

        {/* Generate form */}
        {mode === 'generate' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 md:p-8">
            <GenerateForm
              onSuccess={(qs, mock, input) => {
                setQuestions(qs)
                setFormInput(input)
                setMockMode(mock)
                setMode('results')
              }}
            />
          </div>
        )}

        {/* Diagnose form */}
        {mode === 'diagnose' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 md:p-8">
            <DiagnoseForm
              onSuccess={(diag, mock, input) => {
                setDiagnosis(diag)
                setDiagnoseInput(input)
                setMockMode(mock)
                setMode('diagnosis')
              }}
            />
          </div>
        )}

        {/* Results */}
        {mode === 'results' && questions.length > 0 && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 md:p-8">
            <div className="pb-4 border-b border-slate-800 mb-6">
              <h2 className="text-lg font-bold text-white">שאלות מנחות שנוצרו</h2>
            </div>
            <ResultsScreen
              questions={questions}
              selectedQuestion={selectedQuestion}
              onSelectQuestion={setSelectedQuestion}
              onGenerateBrief={() => void handleGenerateBrief()}
              briefLoading={briefLoading}
              briefError={briefError}
            />
          </div>
        )}

        {/* Diagnosis */}
        {mode === 'diagnosis' && diagnosis && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 md:p-8">
            <div className="pb-4 border-b border-slate-800 mb-6">
              <h2 className="text-lg font-bold text-white">תוצאות האבחון</h2>
            </div>
            <DiagnosisScreen diagnosis={diagnosis} />
          </div>
        )}

        {/* Brief */}
        {mode === 'brief' && projectBrief && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 md:p-8">
            <div className="pb-4 border-b border-slate-800 mb-6">
              <h2 className="text-lg font-bold text-white">תיק פרויקט</h2>
            </div>
            <BriefScreen brief={projectBrief} />
          </div>
        )}
      </div>

      {showConfirm && (
        <ConfirmDialog
          onConfirm={resetAll}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </main>
  )
}
