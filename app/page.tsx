'use client'

import { useState, useEffect } from 'react'
import {
  FlaskConical,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  BookOpen,
  RefreshCw,
  Copy,
  Check,
  Printer,
  AlertTriangle,
} from 'lucide-react'
import type {
  AppMode,
  BigQuestion,
  DiagnosisResult,
  FormInput,
  DiagnoseInput,
  ProjectBrief,
  StressTest,
} from '@/types'
import { createProjectBrief, createQuestions } from '@/lib/apiClient'
import GenerateForm from '@/components/GenerateForm'
import DiagnoseForm from '@/components/DiagnoseForm'
import Toast from '@/components/Toast'

function SiteFooter() {
  return (
    <footer className="no-print mt-10 pb-8 text-center">
      <div className="border-t border-slate-800/50 pt-6">
        <p className="text-xs text-slate-600">
          פותח על ידי{' '}
          <a
            href="mailto:ruthy.salomon@gmail.com"
            className="text-slate-500 hover:text-violet-400 transition-colors"
          >
            רותי סלומון
          </a>
        </p>
      </div>
    </footer>
  )
}

const BRIEF_LOADING_MESSAGES = [
  'בונה את מבנה הפרויקט...',
  'מגדיר מטרות למידה מדידות...',
  'מעצב שלבי חקירה...',
  'בונה רובריקה פדגוגית...',
  'מכין חוויית פתיחה...',
  'מסיים את תיק הפרויקט...',
]

// ─── Stress test ──────────────────────────────────────────────────────────────

const STRESS_LABELS: Record<keyof Omit<StressTest, 'overall_score'>, string> = {
  open_ended: 'שאלה פתוחה',
  content_connection: 'קשר לתוכן',
  authenticity: 'אותנטיות',
  age_appropriate: 'התאמת גיל',
  tension_dilemma: 'מתח ודילמה',
  interdisciplinary: 'בין-תחומי',
  independent_inquiry: 'חקירה עצמאית',
  meaningful_product: 'תוצר משמעותי',
  information_available: 'מידע זמין',
  not_googleable: 'לא ניתן לגגל',
}

function StressTestPanel({ stressTest }: { stressTest: StressTest }) {
  const [open, setOpen] = useState(false)
  const criteria = Object.entries(STRESS_LABELS) as [keyof typeof STRESS_LABELS, string][]

  return (
    <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>מבחן לחץ פדגוגי</span>
          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
            {stressTest.overall_score.toFixed(1)} / 10
          </span>
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
          : <ChevronDown className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-700 pt-3 space-y-3">
          {criteria.map(([key, label]) => {
            const { score, explanation } = stressTest[key]
            const barColor = score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-rose-500'
            const textColor = score >= 8 ? 'text-emerald-400' : score >= 5 ? 'text-amber-400' : 'text-rose-400'
            return (
              <div key={key}>
                <div className="flex items-center gap-3 mb-0.5">
                  <span className="text-xs text-slate-400 flex-1 truncate">{label}</span>
                  <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden shrink-0">
                    <div
                      className={`h-full ${barColor} rounded-full`}
                      style={{ width: `${score * 10}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${textColor} w-5 text-start shrink-0`}>
                    {score}
                  </span>
                </div>
                {explanation && (
                  <p className="text-xs text-slate-500 leading-relaxed">{explanation}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'העתק' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      title={label}
      aria-label={label}
      className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-slate-700/50 transition-colors"
    >
      {copied
        ? <Check className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
        : <Copy className="w-4 h-4" strokeWidth={1.5} />
      }
    </button>
  )
}

// ─── Step indicator ──────────────────────────────────────────────────────────

const GENERATE_STEPS = ['מלא פרטים', 'בחר שאלה', 'תיק פרויקט']
const DIAGNOSE_STEPS = ['מלא פרטים', 'תוצאות אבחון', 'תיק פרויקט']

function StepIndicator({ mode, isGenerateFlow }: { mode: AppMode; isGenerateFlow: boolean }) {
  const steps = isGenerateFlow ? GENERATE_STEPS : DIAGNOSE_STEPS
  const currentStep =
    mode === 'generate' || mode === 'diagnose' ? 1
    : mode === 'results' || mode === 'diagnosis' ? 2
    : 3

  return (
    <div className="no-print border-b border-slate-800/60 bg-slate-950">
      <div className="max-w-3xl mx-auto px-6 py-3">
        <div className="flex items-center justify-center" dir="ltr">
          {steps.map((step, i) => {
            const num = i + 1
            const done = num < currentStep
            const active = num === currentStep
            return (
              <div key={step} className="flex items-center">
                {i > 0 && (
                  <div className={`h-px w-8 sm:w-14 mx-1 ${num <= currentStep ? 'bg-violet-600' : 'bg-slate-700'}`} />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    done ? 'bg-violet-600 text-white' :
                    active ? 'bg-violet-600/20 border-2 border-violet-500 text-violet-300' :
                    'bg-slate-800 border border-slate-700 text-slate-600'
                  }`}>
                    {done ? <Check className="w-3 h-3" strokeWidth={3} /> : num}
                  </div>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${
                    active ? 'text-white' : done ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {step}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  questions,
  selectedQuestion,
  onSelectQuestion,
  onGenerateBrief,
  briefLoading,
  briefError,
  briefProgress,
  briefMsgIdx,
  onGenerateAgain,
  regenerateLoading,
  regenerateError,
}: {
  questions: BigQuestion[]
  selectedQuestion: BigQuestion | null
  onSelectQuestion: (q: BigQuestion) => void
  onGenerateBrief: () => void
  briefLoading: boolean
  briefError: string | null
  briefProgress: number
  briefMsgIdx: number
  onGenerateAgain: () => void
  regenerateLoading: boolean
  regenerateError: string | null
}) {
  if (!questions.length) return null

  return (
    <div className="space-y-4">

      {/* Question cards */}
      {questions.map((q) => {
        const selected = selectedQuestion?.id === q.id
        return (
          <div key={q.id} className="space-y-0">
            <button
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
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={
                    'text-xs font-semibold rounded-full px-2 py-0.5 ' +
                    (selected
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'bg-slate-700 text-slate-400')
                  }>
                    {q.stress_test.overall_score.toFixed(1)}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <CopyButton text={q.question} label="העתק שאלה" />
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded details when selected */}
            {selected && (
              <div className="border border-t-0 border-violet-500/40 rounded-b-xl bg-slate-800/50 px-4 pb-4 pt-3 space-y-4">

                {/* Why it works */}
                {q.why_it_works && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">למה זה עובד</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{q.why_it_works}</p>
                  </div>
                )}

                {/* Strengths + Weaknesses */}
                {(q.strengths.length > 0 || q.weaknesses.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-400 mb-1.5">חוזקות</p>
                        <ul className="space-y-1">
                          {q.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                              <span className="text-emerald-500 shrink-0">✓</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {q.weaknesses.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-rose-400 mb-1.5">נקודות לשיפור</p>
                        <ul className="space-y-1">
                          {q.weaknesses.map((w, i) => (
                            <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                              <span className="text-rose-500 shrink-0">✗</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-questions */}
                {q.sub_questions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1.5">שאלות משנה</p>
                    <ul className="space-y-1">
                      {q.sub_questions.map((sq, i) => (
                        <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                          <span className="text-violet-400 shrink-0 font-medium">{i + 1}.</span>
                          {sq}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Product ideas */}
                {q.product_ideas.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1.5">רעיונות לתוצרים</p>
                    <ul className="space-y-1">
                      {q.product_ideas.map((p, i) => (
                        <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                          <span className="text-violet-400 shrink-0">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Alternative formulations */}
                {q.alternative_formulations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1.5">ניסוחים חלופיים</p>
                    <div className="space-y-2">
                      {q.alternative_formulations.map((alt, i) => {
                        const isAltSelected =
                          selectedQuestion?.id === q.id && selectedQuestion?.question === alt.question
                        return (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border transition-colors ${
                              isAltSelected
                                ? 'border-violet-500 bg-violet-500/10'
                                : 'border-slate-700 bg-slate-800'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <p className="text-xs font-medium text-white flex-1 leading-relaxed">{alt.question}</p>
                              <CopyButton text={alt.question} label="העתק ניסוח" />
                            </div>
                            {alt.explanation && (
                              <p className="text-xs text-slate-500 mt-1">{alt.explanation}</p>
                            )}
                            <button
                              type="button"
                              onClick={() => onSelectQuestion({ ...q, question: alt.question })}
                              disabled={isAltSelected}
                              className={`mt-2 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                                isAltSelected
                                  ? 'bg-violet-600/30 text-violet-300 cursor-default'
                                  : 'bg-slate-700 text-slate-300 hover:bg-violet-600/20 hover:text-violet-300'
                              }`}
                            >
                              {isAltSelected ? '✓ נבחרה לתיק הפרויקט' : 'בחר שאלה זו לתיק הפרויקט'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Stress test panel */}
                <StressTestPanel stressTest={q.stress_test} />
              </div>
            )}
          </div>
        )
      })}

      {/* Try again */}
      <button
        type="button"
        onClick={onGenerateAgain}
        disabled={regenerateLoading || briefLoading}
        className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-200 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
      >
        {regenerateLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            מייצר שאלה חדשה...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
            ייצר ניסוח חדש
          </>
        )}
      </button>
      {regenerateError && (
        <p className="text-xs text-rose-400 text-center">{regenerateError}</p>
      )}

      {/* Generate brief */}
      {selectedQuestion && (
        <div className="space-y-2 pt-1">
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 px-4 py-3">
            <p className="text-[11px] text-violet-400 font-semibold mb-1">השאלה שתיבנה עליה תיק הפרויקט:</p>
            <p className="text-xs text-white leading-relaxed">{selectedQuestion.question}</p>
          </div>
          <button
            type="button"
            onClick={onGenerateBrief}
            disabled={briefLoading || regenerateLoading}
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
                צור תיק פרויקט לשאלה זו
              </>
            )}
          </button>

          {briefLoading && (
            <div className="space-y-2 mt-1">
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${briefProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 text-center">
                {BRIEF_LOADING_MESSAGES[briefMsgIdx]}
              </p>
            </div>
          )}

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
                <div className="flex items-start gap-2">
                  <p className="text-sm font-medium text-white flex-1">{alt.question}</p>
                  <CopyButton text={alt.question} label="העתק ניסוח" />
                </div>
                <p className="text-xs text-slate-400">{alt.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stress test panel */}
      <StressTestPanel stressTest={diagnosis.stress_test} />
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
          <div className="flex items-start gap-2">
            <p className="text-sm font-medium text-violet-200 leading-relaxed flex-1">
              {brief.driving_question}
            </p>
            <CopyButton text={brief.driving_question} label="העתק שאלה מנחה" />
          </div>
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

      {/* Knowledge content */}
      {brief.knowledge_content.length > 0 && (
        <section className="pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">תכנים ומושגי מפתח</h4>
          <ul className="space-y-1.5">
            {brief.knowledge_content.map((k, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-violet-400 shrink-0">•</span>
                {k}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Skills */}
      {brief.skills.length > 0 && (
        <section className="pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">מיומנויות</h4>
          <ul className="space-y-1.5">
            {brief.skills.map((s, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-violet-400 shrink-0">•</span>
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sub-questions */}
      {brief.sub_questions.length > 0 && (
        <section className="pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">שאלות משנה</h4>
          <ul className="space-y-2">
            {brief.sub_questions.map((sq, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-violet-400 shrink-0 font-semibold">{i + 1}.</span>
                {sq}
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

          {/* Mobile: card layout */}
          <div className="md:hidden space-y-4">
            {brief.rubric.map((row, i) => (
              <div key={i} className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-700/50 border-b border-slate-700">
                  <p className="text-sm font-semibold text-white">{row.criterion}</p>
                </div>
                <div className="divide-y divide-slate-800">
                  {(['מתחיל', 'מתפתח', 'מיומן'] as const).map((level, li) => {
                    const vals = [row.beginning, row.developing, row.proficient]
                    return (
                      <div key={level} className="px-4 py-3 flex gap-3">
                        <span className="text-xs font-semibold text-violet-400 w-12 shrink-0 pt-0.5">{level}</span>
                        <p className="text-sm text-slate-300 leading-relaxed">{vals[li]}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700">
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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-6"
      onClick={onCancel}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-900/30 border border-amber-700/40 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white mb-1">התחלה מחדש</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              כל הנתונים הנוכחיים יימחקו ולא ניתן יהיה לשחזר אותם.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl border border-rose-600/60 bg-rose-900/30 text-rose-300 text-sm font-medium hover:bg-rose-900/60 hover:border-rose-500 transition-all"
          >
            כן, התחל מחדש
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
  const [briefProgress, setBriefProgress] = useState(0)
  const [briefMsgIdx, setBriefMsgIdx] = useState(0)
  const [regenerateLoading, setRegenerateLoading] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [mode])

  useEffect(() => {
    if (!briefLoading) return
    const id = setInterval(() => setBriefMsgIdx(i => (i + 1) % BRIEF_LOADING_MESSAGES.length), 2000)
    return () => clearInterval(id)
  }, [briefLoading])

  useEffect(() => {
    if (!briefLoading) { setBriefProgress(0); return }
    setBriefProgress(5)
    const id = setInterval(() => setBriefProgress(p => p + (90 - p) * 0.07), 350)
    return () => clearInterval(id)
  }, [briefLoading])

  function showToast(message: string, type: 'success' | 'info' = 'success') {
    setToast({ message, type })
  }

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
    setBriefProgress(0)
    setBriefMsgIdx(0)
    setRegenerateLoading(false)
    setRegenerateError(null)
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
      showToast('תיק הפרויקט נוצר בהצלחה!')
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : 'שגיאה ביצירת תיק פרויקט')
    } finally {
      setBriefLoading(false)
    }
  }

  async function handleGenerateAgain() {
    if (!formInput) return
    setRegenerateLoading(true)
    setRegenerateError(null)
    setSelectedQuestion(null)
    try {
      const { questions: qs, mockMode: m } = await createQuestions(formInput)
      setQuestions(qs)
      setMockMode(m)
      if (qs[0]) setSelectedQuestion(qs[0])
      showToast('שאלה חדשה נוצרה!', 'info')
    } catch (err) {
      setRegenerateError(err instanceof Error ? err.message : 'שגיאה')
    } finally {
      setRegenerateLoading(false)
    }
  }

  // ── Home ────────────────────────────────────────────────────────────────────

  if (mode === 'home') {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center px-6 py-16">
        <div className="w-full max-w-4xl space-y-14">

          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-5 rounded-2xl bg-violet-500/10 border border-violet-500/20 shadow-2xl shadow-violet-500/20">
                <FlaskConical className="w-12 h-12 text-violet-400" strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent leading-tight pb-1">
                PBL Question Lab
              </h1>
              <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed">
                שאלות שמחייבות חקר אמיתי.
              </p>
              <p className="text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
                כלי AI שעוזר למורים לבנות שאלות מנחות שמחייבות חקר אמיתי —
                עם מתח, דילמה ותוצר משמעותי.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="text-center space-y-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">איך זה עובד</p>
            <div className="flex items-start justify-center gap-1">
              {[
                { num: 1, title: 'מלא פרטים', desc: 'נושא, כיתה, מקצועות, רמת אתגר' },
                { num: 2, title: 'קבל שאלה מנחה', desc: 'עם ניקוד ב-10 קריטריונים PBL' },
                { num: 3, title: 'תיק פרויקט מלא', desc: 'שלבי חקירה, רובריקה ומטרות' },
              ].map((step, i) => (
                <div key={step.num} className="flex items-start">
                  {i > 0 && (
                    <ChevronLeft className="w-5 h-5 text-slate-600 mt-4 shrink-0 mx-1" strokeWidth={1.5} />
                  )}
                  <div className="flex flex-col items-center text-center w-28 sm:w-36 gap-2">
                    <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300 text-sm font-bold">
                      {step.num}
                    </div>
                    <p className="text-sm font-semibold text-white leading-snug">{step.title}</p>
                    <p className="text-xs text-slate-500 leading-snug">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Card 1 — שאלה מנחה */}
            <div className="bg-slate-900 border border-violet-500/20 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-violet-500/10 shrink-0">
                  <FlaskConical className="w-4 h-4 text-violet-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-bold text-white">שאלה מנחה חדשה</h3>
              </div>
              <ul className="space-y-2">
                {['ניקוד כן ב-10 קריטריונים PBL', 'חוזקות וחולשות ספציפיות', 'שאלות משנה לחקירה', '2 ניסוחים חלופיים'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-violet-400 shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              {/* Mini stress test preview */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider">דוגמה לניקוד</p>
                {([['פתוח לפרשנות', 8, 'emerald'], ['אותנטיות', 6, 'amber'], ['מתח / דילמה', 3, 'rose']] as const).map(([label, score, color]) => (
                  <div key={label} className="flex items-center gap-2" dir="ltr">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold w-5 text-start shrink-0 ${color === 'emerald' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : 'text-rose-400'}`}>
                      {score}
                    </span>
                    <span className="text-[10px] text-slate-500 w-24 text-start shrink-0">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2 — אבחון */}
            <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 shrink-0">
                  <Search className="w-4 h-4 text-indigo-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-bold text-white">אבחון שאלה קיימת</h3>
              </div>
              <ul className="space-y-2">
                {['מה עובד ומה לא, ולמה', 'השפעה בפועל על הכיתה', 'כיוון מדויק לשיפור', '2 ניסוחים משופרים מנומקים'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-indigo-400 shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="bg-rose-900/20 border border-rose-700/30 rounded-lg p-3">
                  <p className="text-[10px] text-rose-400 font-semibold mb-1">מה לא עובד</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">שאלה סגורה שניתן לפתור ב-ChatGPT ללא חשיבה עצמאית</p>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3">
                  <p className="text-[10px] text-emerald-400 font-semibold mb-1">כיוון לשיפור</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">הוסף דילמה ועמדה שדורשת הכרעה ערכית</p>
                </div>
              </div>
            </div>

            {/* Card 3 — תיק פרויקט */}
            <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 shrink-0">
                  <BookOpen className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-bold text-white">תיק פרויקט מלא</h3>
              </div>
              <ul className="space-y-2">
                {['מטרות למידה מדידות', '4–6 שלבי חקירה מפורטים', 'רובריקת הערכה 3 רמות', 'בידול: תמיכה והעשרה'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-cyan-400 shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-slate-800 space-y-1.5">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider">מה מוגדר בתיק</p>
                {['שם ושאלה מנחה', 'תכנים ומיומנויות', 'פעילות פתיחה', 'תוצרים לקהל אמיתי'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-cyan-600 shrink-0" />
                    <span className="text-[10px] text-slate-500">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pb-4">
            <button
              type="button"
              onClick={() => setMode('generate')}
              className="inline-flex items-center gap-2 justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-base font-semibold shadow-lg shadow-violet-500/25 transition-all duration-150"
            >
              <FlaskConical className="w-5 h-5" strokeWidth={1.5} />
              צור שאלות PBL
            </button>
            <button
              type="button"
              onClick={() => setMode('diagnose')}
              className="inline-flex items-center gap-2 justify-center px-8 py-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-base font-medium hover:border-violet-500/50 hover:text-white transition-all duration-150"
            >
              <Search className="w-5 h-5" strokeWidth={1.5} />
              אבחן שאלה קיימת
            </button>
          </div>

        </div>
        <SiteFooter />
      </main>
    )
  }

  // ── Non-home screens ────────────────────────────────────────────────────────

  const showRestart = mode === 'results' || mode === 'diagnosis' || mode === 'brief'
  const isWide = mode === 'results' || mode === 'diagnosis' || mode === 'brief'
  const isGenerateFlow = mode === 'generate' || mode === 'results' || (mode === 'brief' && formInput !== null)

  return (
    <main className="min-h-screen bg-slate-950">
      {mockMode && (
        <div className="bg-amber-900/30 border-b border-amber-700/50 px-4 py-2.5 text-center no-print">
          <span className="text-sm text-amber-300">פועל במצב הדגמה — אין מפתח API</span>
        </div>
      )}

      {/* Navigation bar */}
      <div className="bg-slate-900 border-b border-slate-800 no-print">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
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

      {/* Step indicator */}
      <StepIndicator mode={mode} isGenerateFlow={isGenerateFlow} />

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
                if (qs[0]) setSelectedQuestion(qs[0])
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
        {mode === 'results' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 md:p-8">
            <div className="pb-4 border-b border-slate-800 mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                השאלה המנחה שלך
                {questions.length > 1 && (
                  <span className="ms-2 text-sm font-normal text-slate-500">({questions.length})</span>
                )}
              </h2>
            </div>
            {questions.length > 0 ? (
              <ResultsScreen
                questions={questions}
                selectedQuestion={selectedQuestion}
                onSelectQuestion={setSelectedQuestion}
                onGenerateBrief={() => void handleGenerateBrief()}
                briefLoading={briefLoading}
                briefError={briefError}
                briefProgress={briefProgress}
                briefMsgIdx={briefMsgIdx}
                onGenerateAgain={() => void handleGenerateAgain()}
                regenerateLoading={regenerateLoading}
                regenerateError={regenerateError}
              />
            ) : (
              <div className="text-center py-8 space-y-3">
                <p className="text-slate-400 text-sm">לא הוחזרו שאלות. נסי שוב.</p>
                <button
                  type="button"
                  onClick={() => void handleGenerateAgain()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                  נסי שנית
                </button>
              </div>
            )}
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
            <div className="pb-4 border-b border-slate-800 mb-6 flex items-center justify-between no-print">
              <h2 className="text-lg font-bold text-white">תיק פרויקט</h2>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500"
              >
                <Printer className="w-4 h-4" strokeWidth={1.5} />
                הדפסה
              </button>
            </div>
            <BriefScreen brief={projectBrief} />
          </div>
        )}
      </div>

      <SiteFooter />

      {showConfirm && (
        <ConfirmDialog
          onConfirm={resetAll}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </main>
  )
}
