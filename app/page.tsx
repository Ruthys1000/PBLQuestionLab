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
      <p className="text-sm text-gray-500">
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
                'w-full text-start p-4 rounded-xl border transition-colors duration-100 ' +
                (selected
                  ? 'border-2 border-gray-900 bg-gray-50'
                  : 'border border-gray-200 bg-white hover:border-gray-400')
              }
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-gray-900 leading-relaxed">{q.question}</p>
                <span className="shrink-0 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                  {q.stress_test.overall_score.toFixed(1)}
                </span>
              </div>
              {selected && q.why_it_works && (
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">{q.why_it_works}</p>
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
              'w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-base font-medium transition-colors duration-150 ' +
              (briefLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-700')
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
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{briefError}</p>
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
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-bold text-gray-900">
          {diagnosis.overall_score.toFixed(1)}
        </span>
        <span className="text-xl text-gray-400">/ 10</span>
        <span className="text-sm text-gray-500 mr-1">ציון כולל</span>
      </div>

      {diagnosis.why_problematic && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
          <p className="text-sm text-red-800 leading-relaxed">{diagnosis.why_problematic}</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">מה עובד</h3>
        <ul className="space-y-1.5">
          {diagnosis.what_works.map((item, i) => (
            <li key={i} className="text-sm text-gray-600 flex gap-2">
              <span className="text-green-500 shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">מה לא עובד</h3>
        <ul className="space-y-1.5">
          {diagnosis.what_doesnt_work.map((item, i) => (
            <li key={i} className="text-sm text-gray-600 flex gap-2">
              <span className="text-red-400 shrink-0">✗</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">כיוון לשיפור</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{diagnosis.direction}</p>
      </div>

      {diagnosis.alternative_formulations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">ניסוחים חלופיים</h3>
          <div className="space-y-3">
            {diagnosis.alternative_formulations.map((alt, i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                <p className="text-sm font-medium text-gray-900">{alt.question}</p>
                <p className="text-xs text-gray-500">{alt.explanation}</p>
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
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-gray-900">{brief.project_title}</h3>
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-sm font-medium text-gray-800 leading-relaxed">
            {brief.driving_question}
          </p>
        </div>
        {brief.teacher_summary && (
          <p className="text-sm text-gray-600 leading-relaxed">{brief.teacher_summary}</p>
        )}
      </div>

      {/* Learning goals */}
      {brief.learning_goals.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">מטרות למידה</h4>
          <ul className="space-y-1.5">
            {brief.learning_goals.map((g, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2">
                <span className="text-gray-400 shrink-0">{i + 1}.</span>
                {g}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Inquiry stages */}
      {brief.inquiry_stages.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">שלבי החקירה</h4>
          <div className="space-y-2">
            {brief.inquiry_stages.map((stage, i) => (
              <div key={i} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-700 leading-relaxed">{stage}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Possible products */}
      {brief.possible_products.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">תוצרים אפשריים</h4>
          <ul className="space-y-1.5">
            {brief.possible_products.map((p, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2">
                <span className="text-gray-400 shrink-0">•</span>
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Rubric */}
      {brief.rubric.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">רובריקה</h4>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['קריטריון', 'מתחיל', 'מתפתח', 'מיומן'].map((h) => (
                    <th key={h} className="px-3 py-2 text-right font-medium text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brief.rubric.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2 font-medium text-gray-900 align-top">{row.criterion}</td>
                    <td className="px-3 py-2 text-gray-600 align-top">{row.beginning}</td>
                    <td className="px-3 py-2 text-gray-600 align-top">{row.developing}</td>
                    <td className="px-3 py-2 text-gray-600 align-top">{row.proficient}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Differentiation */}
      {(brief.differentiation.support || brief.differentiation.extension) && (
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">דיפרנציאציה</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {brief.differentiation.support && (
              <div className="p-3 rounded-lg border border-blue-100 bg-blue-50">
                <p className="text-xs font-semibold text-blue-700 mb-1">תמיכה</p>
                <p className="text-sm text-blue-800 leading-relaxed">{brief.differentiation.support}</p>
              </div>
            )}
            {brief.differentiation.extension && (
              <div className="p-3 rounded-lg border border-green-100 bg-green-50">
                <p className="text-xs font-semibold text-green-700 mb-1">הרחבה</p>
                <p className="text-sm text-green-800 leading-relaxed">{brief.differentiation.extension}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Opening experience */}
      {brief.opening_experience && (
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">חוויית פתיחה</h4>
          <div className="p-4 rounded-xl border border-amber-100 bg-amber-50">
            <p className="text-sm text-amber-800 leading-relaxed">{brief.opening_experience}</p>
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-5">
        <p className="text-gray-900 font-medium leading-relaxed">
          האם להתחיל מחדש? הנתונים הנוכחיים יימחקו.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            כן, התחל מחדש
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
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
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-2xl text-center space-y-10">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <FlaskConical className="w-10 h-10 text-gray-700" strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              PBL Question Lab
            </h1>
            <p className="text-xl font-medium text-gray-700 leading-relaxed">
              הופכים נושא לימודי לשאלת PBL שאי אפשר לפתור עם תשובה מגוגל.
            </p>
            <p className="text-base text-gray-500 leading-relaxed max-w-xl mx-auto">
              PBL Question Lab עוזר למורים לבנות, לבדוק ולשפר שאלות גדולות שמחזיקות חקר,
              דילמה, תוכן ותוצר משמעותי.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => setMode('generate')}
              className="inline-flex items-center gap-2 justify-center px-6 py-3 rounded-xl bg-gray-900 text-white text-base font-medium hover:bg-gray-700 transition-colors duration-150"
            >
              <FlaskConical className="w-5 h-5" strokeWidth={1.5} />
              צור שאלות PBL
            </button>
            <button
              type="button"
              onClick={() => setMode('diagnose')}
              className="inline-flex items-center gap-2 justify-center px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 text-base font-medium hover:bg-gray-50 transition-colors duration-150"
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
    <main className="min-h-screen bg-gray-50">
      {mockMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center">
          <span className="text-sm text-amber-800">פועל במצב הדגמה — אין מפתח API</span>
        </div>
      )}

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            חזור
          </button>

          {showRestart && (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              התחל מחדש
            </button>
          )}
        </div>
      </div>

      <div className={`mx-auto px-6 py-8 ${isWide ? 'max-w-3xl' : 'max-w-2xl'}`}>

        {/* Generate form */}
        {mode === 'generate' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
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
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
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
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <div className="pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">שאלות מנחות שנוצרו</h2>
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
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <div className="pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">תוצאות האבחון</h2>
            </div>
            <DiagnosisScreen diagnosis={diagnosis} />
          </div>
        )}

        {/* Brief */}
        {mode === 'brief' && projectBrief && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <div className="pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">תיק פרויקט</h2>
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
