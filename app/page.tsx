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
  Check,
  Printer,
  AlertTriangle,
  BarChart2,
  Archive,
  Trash2,
  Link2,
} from 'lucide-react'
import type {
  AppMode,
  ArchiveItem,
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
  const scoreColor =
    stressTest.overall_score >= 8 ? 'bg-emerald-900/60 text-emerald-300'
    : stressTest.overall_score >= 5 ? 'bg-amber-900/60 text-amber-300'
    : 'bg-rose-900/60 text-rose-300'

  return (
    <div className="mt-4 rounded-xl border border-violet-500/40 bg-violet-950/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-100 bg-violet-900/10 hover:bg-violet-900/30 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-violet-400 shrink-0" strokeWidth={1.5} />
          <span>מבחן לחץ פדגוגי</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColor}`}>
            {stressTest.overall_score.toFixed(1)} / 10
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-violet-400">
          {!open && <span className="text-xs font-normal text-violet-400/70">לחץ לפרטים</span>}
          {open
            ? <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
            : <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
          }
        </span>
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
                  <span className="text-sm text-slate-400 flex-1">{label}</span>
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
                  <p className="text-sm text-slate-500 leading-relaxed">{explanation}</p>
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


// ─── Step indicator ──────────────────────────────────────────────────────────

const GENERATE_STEPS = ['מלא פרטים', 'בחר שאלה', 'תיק הפרויקט']
const DIAGNOSE_STEPS = ['מלא פרטים', 'תוצאות אבחון', 'תיק הפרויקט']

function StepIndicator({ mode, isGenerateFlow }: { mode: AppMode; isGenerateFlow: boolean }) {
  const steps = isGenerateFlow ? GENERATE_STEPS : DIAGNOSE_STEPS
  const currentStep =
    mode === 'generate' || mode === 'diagnose' ? 1
    : mode === 'results' || mode === 'diagnosis' ? 2
    : 3

  return (
    <div className="no-print border-b border-slate-800/60 bg-slate-950">
      <div className="max-w-3xl mx-auto px-6 py-3">
        <div className="flex items-center justify-center">
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
  hasBrief,
  onGoToBrief,
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
  hasBrief: boolean
  onGoToBrief: () => void
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
                <p className="text-sm font-medium text-slate-100 leading-relaxed">{q.question}</p>
                <span className={
                  'text-xs font-semibold rounded-full px-2 py-0.5 shrink-0 ' +
                  (selected
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'bg-slate-700 text-slate-400')
                }>
                  {q.stress_test.overall_score.toFixed(1)}
                </span>
              </div>
            </button>

            {/* Expanded details when selected */}
            {selected && (
              <div className="border border-t-0 border-violet-500/40 rounded-b-xl bg-slate-800/50 px-4 pb-4 pt-3 space-y-4">

                {/* Why it works */}
                {q.why_it_works && (
                  <div>
                    <p className="text-sm font-semibold text-slate-400 mb-1">למה זה עובד</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{q.why_it_works}</p>
                  </div>
                )}

                {/* Strengths + Weaknesses */}
                {(q.strengths.length > 0 || q.weaknesses.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.strengths.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-emerald-400 mb-1.5">חוזקות</p>
                        <ul className="space-y-1">
                          {q.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-slate-300 flex gap-1.5">
                              <span className="text-emerald-500 shrink-0">✓</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {q.weaknesses.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-rose-400 mb-1.5">נקודות לשיפור</p>
                        <ul className="space-y-1">
                          {q.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm text-slate-300 flex gap-1.5">
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
                    <p className="text-sm font-semibold text-slate-400 mb-1.5">שאלות משנה</p>
                    <ul className="space-y-1">
                      {q.sub_questions.map((sq, i) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-1.5">
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
                    <p className="text-sm font-semibold text-slate-400 mb-1.5">רעיונות לתוצרים</p>
                    <ul className="space-y-1">
                      {q.product_ideas.map((p, i) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-1.5">
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
                    <p className="text-sm font-semibold text-slate-400 mb-1.5">ניסוחים חלופיים</p>
                    <div className="space-y-2">
                      {q.alternative_formulations.map((alt, i) => {
                        const isAltSelected =
                          selectedQuestion?.id === q.id && selectedQuestion?.question === alt.question
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onSelectQuestion({ ...q, question: alt.question })}
                            className={`w-full text-right p-3 rounded-lg border transition-colors ${
                              isAltSelected
                                ? 'border-violet-500 bg-violet-500/10 cursor-default'
                                : 'border-slate-700 bg-slate-800 hover:border-violet-500/50 hover:bg-violet-500/5'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <p className="text-sm font-medium text-slate-100 flex-1 leading-relaxed">{alt.question}</p>
                              <div className={`mt-0.5 w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-colors ${
                                isAltSelected
                                  ? 'bg-violet-600 border-violet-600'
                                  : 'border-slate-500'
                              }`}>
                                {isAltSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                              </div>
                            </div>
                            {alt.explanation && (
                              <p className="text-sm text-slate-500 mt-1">{alt.explanation}</p>
                            )}
                          </button>
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
            <p className="text-xs text-violet-400 font-semibold mb-1">השאלה שתיבנה עליה תיק הפרויקט:</p>
            <p className="text-sm text-slate-100 leading-relaxed">{selectedQuestion.question}</p>
          </div>

          {hasBrief && (
            <button
              type="button"
              onClick={onGoToBrief}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-base font-medium shadow-lg shadow-violet-500/25 transition-all duration-150"
            >
              <BookOpen className="w-5 h-5" strokeWidth={1.5} />
              חזור לתיק הפרויקט
            </button>
          )}

          <button
            type="button"
            onClick={onGenerateBrief}
            disabled={briefLoading || regenerateLoading}
            className={
              'w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-base font-medium transition-all duration-150 ' +
              (briefLoading
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : hasBrief
                  ? 'border border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:text-white'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25')
            }
          >
            {briefLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
                בונה תיק הפרויקט...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" strokeWidth={1.5} />
                {hasBrief ? 'צור תיק חדש לשאלה זו' : 'צור תיק הפרויקט לשאלה זו'}
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
            <div className="rounded-xl border border-rose-700/50 bg-rose-900/30 px-4 py-3 flex items-start justify-between gap-3">
              <p className="text-sm text-rose-300">{briefError}</p>
              <button
                onClick={onGenerateBrief}
                className="shrink-0 text-xs text-rose-300 border border-rose-700/50 rounded-lg px-3 py-1 hover:bg-rose-800/30 transition-colors"
              >
                נסה שוב
              </button>
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
                <p className="text-sm text-slate-400">{alt.explanation}</p>
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

function BriefScreen({ brief, selectedQuestion }: { brief: ProjectBrief; selectedQuestion: BigQuestion }) {
  return (
    <div className="space-y-8">

      {/* ── Part A: question analysis (from memory, no extra AI cost) ── */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">השאלה המנחה</p>
        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
          <p className="text-sm font-medium text-violet-200 leading-relaxed">
            {selectedQuestion.question}
          </p>
        </div>
        {selectedQuestion.why_it_works && (
          <p className="text-sm text-slate-400 leading-relaxed">{selectedQuestion.why_it_works}</p>
        )}
        {(selectedQuestion.strengths.length > 0 || selectedQuestion.weaknesses.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {selectedQuestion.strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-400 mb-1.5">חוזקות</p>
                <ul className="space-y-1">
                  {selectedQuestion.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-1.5">
                      <span className="text-emerald-500 shrink-0">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedQuestion.weaknesses.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-rose-400 mb-1.5">נקודות לשיפור</p>
                <ul className="space-y-1">
                  {selectedQuestion.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-1.5">
                      <span className="text-rose-500 shrink-0">✗</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedQuestion.product_ideas.length > 0 && (
        <section className="pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">תוצרים אפשריים</h4>
          <ul className="space-y-1.5">
            {selectedQuestion.product_ideas.map((p, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-violet-400 shrink-0">•</span>
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Part B: generated brief ── */}
      <div className="pt-6 border-t-2 border-slate-700 space-y-8">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">תיק הפרויקט</p>
          <h3 className="text-2xl font-bold text-white">{brief.project_title}</h3>
          {brief.teacher_summary && (
            <p className="text-sm text-slate-400 leading-relaxed pt-1">{brief.teacher_summary}</p>
          )}
        </div>

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

        {brief.opening_experience && (
          <section className="pt-6 border-t border-slate-800">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">חוויית פתיחה</h4>
            <div className="p-4 rounded-xl border border-amber-700/30 bg-amber-900/20">
              <p className="text-sm text-amber-200 leading-relaxed">{brief.opening_experience}</p>
            </div>
          </section>
        )}

        <div className="pt-8 border-t border-slate-800 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium transition-all shadow-lg shadow-violet-500/20"
          >
            <Printer className="w-5 h-5" strokeWidth={1.5} />
            הדפסה / שיתוף
          </button>
        </div>
      </div>
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
  const [archiveIds, setArchiveIds] = useState<string[]>([])
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
  const [archiveQuestions, setArchiveQuestions] = useState<ArchiveItem[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [archiveSearch, setArchiveSearch] = useState('')
  const [archiveSort, setArchiveSort] = useState<'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'>('date_desc')
  const [archiveBriefLoadingId, setArchiveBriefLoadingId] = useState<string | null>(null)
  const [archiveBriefConfirmId, setArchiveBriefConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletePin, setDeletePin] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [briefSource, setBriefSource] = useState<AppMode>('results')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const qId = params.get('q')
    if (qId) { setMode('archive'); setHighlightedId(qId) }
    else if (params.has('archive')) { setMode('archive') }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [mode])

  useEffect(() => {
    if (!highlightedId || archiveLoading) return
    setTimeout(() => {
      document.getElementById(`archive-item-${highlightedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [highlightedId, archiveLoading])

  useEffect(() => {
    if (mode !== 'archive') return
    const controller = new AbortController()
    setArchiveLoading(true)
    fetch('/api/archive', { signal: controller.signal })
      .then(r => r.json())
      .then(d => setArchiveQuestions(d.questions ?? []))
      .catch(err => { if (err.name !== 'AbortError') setArchiveQuestions([]) })
      .finally(() => setArchiveLoading(false))
    return () => controller.abort()
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

  function copyLink(text: string, id: string) {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function goBack() {
    const dest: Partial<Record<AppMode, AppMode>> = {
      generate: 'home',
      diagnose: 'home',
      results: 'generate',
      diagnosis: 'diagnose',
      brief: briefSource,
    }
    setMode(dest[mode] ?? 'home')
  }

  async function handleGenerateBrief() {
    if (!selectedQuestion || briefLoading) return
    const originalInput = formInput ?? diagnoseInput
    if (!originalInput) return
    setBriefLoading(true)
    setBriefError(null)
    try {
      const { brief, mockMode: m } = await createProjectBrief({ selectedQuestion, originalInput })
      // cache brief in archive entry (non-fatal)
      const idx = questions.findIndex(q => q === selectedQuestion)
      const archiveId = archiveIds[idx]
      if (archiveId) {
        try {
          const patchRes = await fetch(`/api/archive/${archiveId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brief_data: JSON.stringify(brief) }),
          })
          if (patchRes.ok) {
            setArchiveQuestions(prev =>
              prev.map(a => a.id === archiveId ? { ...a, brief_data: JSON.stringify(brief) } : a)
            )
          } else {
            console.warn('[brief] failed to cache brief in archive:', patchRes.status)
          }
        } catch (e) { console.warn('[brief] patch error:', e) }
      }
      setProjectBrief(brief)
      setMockMode(m)
      setBriefSource('results')
      setMode('brief')
      showToast('תיק הפרויקט נוצר בהצלחה!')
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : 'שגיאה ביצירת תיק הפרויקט')
    } finally {
      setBriefLoading(false)
    }
  }

  async function handleArchiveBrief(item: ArchiveItem, fullData: BigQuestion) {
    if (archiveBriefLoadingId) return
    const subjects = (() => { try { return JSON.parse(item.subjects) as string[] } catch { return [] } })()
    const minimalInput: FormInput = {
      topic: item.topic,
      grade: item.grade,
      subjects,
      learning_goals: '',
      required_content: '',
      duration: 'שבועיים עד שלושה שבועות',
      context: '',
      difficulty: 'intermediate',
      preferred_product: '',
      boldness: 'balanced',
    }

    // Fast path: brief already cached in DB
    if (item.brief_data) {
      try {
        const brief = JSON.parse(item.brief_data) as ProjectBrief
        setProjectBrief(brief)
        setSelectedQuestion(fullData)
        setFormInput(minimalInput)
        setBriefSource('archive')
        setMode('brief')
        showToast('תיק הפרויקט נטען מהארכיון')
        return
      } catch { /* fall through to AI */ }
    }

    // Slow path: generate via AI then cache
    setArchiveBriefLoadingId(item.id)
    try {
      const { brief, mockMode: m } = await createProjectBrief({ selectedQuestion: fullData, originalInput: minimalInput })
      // cache result in DB (non-fatal)
      try {
        const patchRes = await fetch(`/api/archive/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief_data: JSON.stringify(brief) }),
        })
        if (patchRes.ok) {
          setArchiveQuestions((prev) => prev.map((a) => a.id === item.id ? { ...a, brief_data: JSON.stringify(brief) } : a))
        } else {
          console.warn('[archive] failed to cache brief:', patchRes.status)
        }
      } catch (e) { console.warn('[archive] patch error:', e) }
      setProjectBrief(brief)
      setSelectedQuestion(fullData)
      setFormInput(minimalInput)
      setMockMode(m)
      setBriefSource('archive')
      setMode('brief')
      showToast('תיק הפרויקט נוצר בהצלחה!')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'שגיאה ביצירת תיק הפרויקט', 'info')
    } finally {
      setArchiveBriefLoadingId(null)
    }
  }

  async function handleDelete(id: string) {
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/archive/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: deletePin }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setDeleteError(data.error ?? 'שגיאת מחיקה')
        return
      }
      setArchiveQuestions((prev) => prev.filter((q) => q.id !== id))
      setDeletingId(null)
      setDeletePin('')
    } catch {
      setDeleteError('שגיאת רשת')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleGenerateAgain() {
    if (!formInput) return
    setRegenerateLoading(true)
    setRegenerateError(null)
    setSelectedQuestion(null)
    try {
      const { questions: qs, archiveIds: ids, mockMode: m } = await createQuestions(formInput)
      setQuestions(qs)
      setArchiveIds(ids)
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
      <main id="main-content" className="min-h-screen bg-slate-950 flex flex-col items-center px-6 py-16">
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
                שאלות PBL — עם ניקוד, משוב ותיק הפרויקט.
              </p>
              <p className="text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
                כלי AI למורים, מרצים ומנהלי למידה. כותבים נושא, כיתה ומקצועות —
                ומקבלים שאלה מנחה בין-תחומית עם ניקוד פדגוגי, משוב ספציפי ותיק הפרויקט מוכן לשימוש.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="text-center space-y-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">איך זה עובד</p>
            <div className="flex items-start justify-center gap-1" dir="rtl">
              {[
                { num: 1, title: 'מלא פרטים', desc: 'נושא, כיתה, מקצועות, רמת אתגר' },
                { num: 2, title: 'קבל שאלה מנחה', desc: 'עם ניקוד ב-10 קריטריונים PBL' },
                { num: 3, title: 'תיק הפרויקט המלא', desc: 'שלבי חקירה, רובריקה ומטרות' },
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
                    <p className="text-sm text-slate-400 leading-snug">{step.desc}</p>
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
              <ul className="space-y-2.5">
                {[
                  'ציון מיידי: האם השאלה שלך באמת מחזיקה פרויקט?',
                  'בדיוק מה עובד ומה לא — לא "לשפר", אלא למה',
                  'שאלות חקירה מוכנות לתת לתלמידים',
                  '2 ניסוחים חלופיים לבחור מהם',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-violet-400 shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              {/* Mini stress test preview */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider">דוגמה לניקוד</p>
                {([['פתוח לפרשנות', 8, 'emerald'], ['אותנטיות', 6, 'amber'], ['מתח / דילמה', 3, 'rose']] as const).map(([label, score, color]) => (
                  <div key={label} className="flex items-center gap-2" dir="ltr">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-5 text-start shrink-0 ${color === 'emerald' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : 'text-rose-400'}`}>
                      {score}
                    </span>
                    <span className="text-xs text-slate-400 w-24 text-start shrink-0">{label}</span>
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
              <ul className="space-y-2.5">
                {[
                  'מה בדיוק חזק בשאלה — ומה פוגע בלמידה',
                  'מה יקרה בכיתה אם תשתמש בה כפי שהיא',
                  'הנחיה ברורה לאן לכתוב מחדש',
                  '2 גרסאות משופרות עם הסבר מה השתנה',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-indigo-400 shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="bg-rose-900/20 border border-rose-700/30 rounded-lg p-3">
                  <p className="text-sm text-rose-400 font-semibold mb-1">מה לא עובד</p>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">שאלה סגורה שניתן לפתור ב-ChatGPT ללא חשיבה עצמאית</p>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3">
                  <p className="text-sm text-emerald-400 font-semibold mb-1">כיוון לשיפור</p>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">הוסף דילמה ועמדה שדורשת הכרעה ערכית</p>
                </div>
              </div>
            </div>

            {/* Card 3 — תיק הפרויקט */}
            <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 shrink-0">
                  <BookOpen className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-bold text-white">תיק הפרויקט המלא</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  'מטרות שאפשר לבדוק — לא "הבנה כללית"',
                  'מה התלמידים עושים בכל שלב — לא מה המורה מסביר',
                  'רובריקה מוכנה לשימוש ביום הראשון',
                  'מה לתת למי שנתקע ולמי שרץ קדימה',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-cyan-400 shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-slate-800 space-y-1.5">
                <p className="text-xs text-slate-500 uppercase tracking-wider">מה מוגדר בתיק</p>
                {['שם ושאלה מנחה', 'תכנים ומיומנויות', 'פעילות פתיחה', 'תוצרים לקהל אמיתי'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-cyan-500 shrink-0" />
                    <span className="text-sm text-slate-400 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
              <button
                type="button"
                onClick={() => setMode('archive')}
                className="inline-flex items-center gap-2 justify-center px-8 py-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-base font-medium hover:border-cyan-500/50 hover:text-white transition-all duration-150"
              >
                <Archive className="w-5 h-5" strokeWidth={1.5} />
                ארכיון שאלות
              </button>
            </div>
            <p className="text-center text-xs text-slate-500 pb-4">
              <Archive className="w-3.5 h-3.5 inline-block align-text-bottom ml-1" strokeWidth={1.5} />
              השאלות ותיק הפרויקט שתיצור נשמרים אוטומטית בארכיון
            </p>
          </div>

        </div>
        <SiteFooter />
      </main>
    )
  }

  // ── Archive ─────────────────────────────────────────────────────────────────

  if (mode === 'archive') {
    const filteredArchive = archiveQuestions
      .filter(item => {
        if (!archiveSearch.trim()) return true
        const q = archiveSearch.trim().toLowerCase()
        const subjectsStr = (() => { try { return (JSON.parse(item.subjects) as string[]).join(' ') } catch { return item.subjects } })()
        return (
          item.topic.toLowerCase().includes(q) ||
          item.grade.toLowerCase().includes(q) ||
          subjectsStr.toLowerCase().includes(q) ||
          item.question.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        switch (archiveSort) {
          case 'date_asc':   return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          case 'score_desc': return b.overall_score - a.overall_score
          case 'score_asc':  return a.overall_score - b.overall_score
          default:           return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
      })

    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-4xl space-y-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMode('home')}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              חזור לדף הבית
            </button>
            <button
              type="button"
              onClick={() => copyLink(window.location.origin + '?archive', 'archive')}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <Link2 className="w-4 h-4" strokeWidth={1.5} />
              {copiedId === 'archive' ? 'הועתק!' : 'שתף ארכיון'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Archive className="w-7 h-7 text-cyan-400" strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">ארכיון שאלות</h1>
            <p className="text-slate-400 text-sm">כל השאלות שנוצרו בכלי</p>
          </div>

          {!archiveLoading && archiveQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" strokeWidth={1.5} />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={e => setArchiveSearch(e.target.value)}
                  placeholder="חיפוש לפי נושא, כיתה, תחום או תוכן השאלה..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors"
                  dir="rtl"
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-slate-500">מיון:</span>
                {([ ['date_desc', 'תאריך ↓'], ['date_asc', 'תאריך ↑'], ['score_desc', 'ציון ↓'], ['score_asc', 'ציון ↑'] ] as const).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setArchiveSort(val)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      archiveSort === val
                        ? 'border-violet-500/60 bg-violet-500/10 text-violet-300'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {archiveSearch && (
                  <span className="text-xs text-slate-500 mr-auto">
                    {filteredArchive.length} מתוך {archiveQuestions.length} שאלות
                  </span>
                )}
              </div>
            </div>
          )}

          {archiveLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" strokeWidth={1.5} />
            </div>
          )}

          {!archiveLoading && archiveQuestions.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <p className="text-slate-500 text-lg">הארכיון ריק עדיין</p>
              <p className="text-slate-600 text-sm">שאלות ייכנסו לכאן אוטומטית לאחר שייווצרו</p>
            </div>
          )}

          {!archiveLoading && archiveQuestions.length > 0 && filteredArchive.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <p className="text-slate-500 text-lg">לא נמצאו שאלות התואמות לחיפוש</p>
              <p className="text-slate-600 text-sm">נסה מילת חיפוש אחרת</p>
            </div>
          )}

          {!archiveLoading && filteredArchive.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArchive.map((item) => {
                const scoreColor =
                  item.overall_score >= 8 ? 'text-emerald-400 bg-emerald-900/40'
                  : item.overall_score >= 5 ? 'text-amber-400 bg-amber-900/40'
                  : 'text-rose-400 bg-rose-900/40'
                const subjects = (() => {
                  try { return (JSON.parse(item.subjects) as string[]).join(' · ') } catch { return item.subjects }
                })()
                const fullData = (() => {
                  if (!item.full_data) return null
                  try { return JSON.parse(item.full_data) as BigQuestion } catch { return null }
                })()
                const isDeleting = deletingId === item.id
                return (
                  <div
                    key={item.id}
                    id={`archive-item-${item.id}`}
                    className={`bg-slate-900 border rounded-xl p-4 space-y-3 transition-colors ${highlightedId === item.id ? 'border-amber-400/60 shadow-lg shadow-amber-400/10' : 'border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.topic}</p>
                        <p className="text-xs text-slate-500">{item.grade}{subjects ? ` · ${subjects}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor}`}>
                          {item.overall_score.toFixed(1)}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyLink(window.location.origin + '?q=' + item.id, item.id)}
                          className="p-1 rounded text-slate-600 hover:text-cyan-400 transition-colors"
                          aria-label="העתק קישור לשאלה"
                        >
                          {copiedId === item.id
                            ? <Check className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.5} />
                            : <Link2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDeletingId(item.id); setDeletePin(''); setDeleteError(null); setArchiveBriefConfirmId(null) }}
                          className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors"
                          aria-label="מחק שאלה"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>

                    {isDeleting ? (
                      <div className="space-y-2 pt-1">
                        <p className="text-xs text-slate-400">הזן קוד מחיקה:</p>
                        <input
                          type="password"
                          value={deletePin}
                          onChange={(e) => setDeletePin(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') void handleDelete(item.id) }}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 w-full text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="קוד..."
                          autoFocus
                        />
                        {deleteError && <p className="text-xs text-rose-400">{deleteError}</p>}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleDelete(item.id)}
                            disabled={deleteLoading || !deletePin}
                            className="flex-1 py-1.5 rounded-lg bg-rose-900/40 border border-rose-700/50 text-rose-300 text-xs font-medium hover:bg-rose-900/70 disabled:opacity-40 transition-colors"
                          >
                            {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" strokeWidth={1.5} /> : 'מחק'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDeletingId(null); setDeletePin(''); setDeleteError(null) }}
                            className="flex-1 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium hover:text-white transition-colors"
                          >
                            ביטול
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">{item.question}</p>
                        {fullData?.stress_test && (
                          <StressTestPanel stressTest={fullData.stress_test} />
                        )}
                        <p className="text-xs text-slate-600">
                          {new Date(item.created_at).toLocaleDateString('he-IL')}
                        </p>
                        {fullData && (
                          item.brief_data ? (
                            <button
                              type="button"
                              onClick={() => void handleArchiveBrief(item, fullData)}
                              disabled={!!archiveBriefLoadingId}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-cyan-800/50 bg-cyan-950/30 text-xs text-cyan-400 hover:bg-cyan-900/40 disabled:opacity-40 transition-colors"
                            >
                              <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                              פתח תיק הפרויקט השמור
                            </button>
                          ) : archiveBriefConfirmId === item.id ? (
                            <div className="space-y-1.5">
                              <p className="text-xs text-amber-400 text-center">ליצור תיק הפרויקט לשאלה זו?</p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setArchiveBriefConfirmId(null); void handleArchiveBrief(item, fullData) }}
                                  disabled={!!archiveBriefLoadingId}
                                  className="flex-1 py-1.5 rounded-lg bg-violet-900/40 border border-violet-700/50 text-violet-300 text-xs font-medium hover:bg-violet-900/70 disabled:opacity-40 transition-colors"
                                >
                                  {archiveBriefLoadingId === item.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" strokeWidth={1.5} />
                                    : 'כן, צור תיק'
                                  }
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setArchiveBriefConfirmId(null)}
                                  className="flex-1 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium hover:text-white transition-colors"
                                >
                                  ביטול
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => setArchiveBriefConfirmId(item.id)}
                                disabled={!!archiveBriefLoadingId}
                                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-xs text-slate-400 hover:text-violet-300 hover:border-violet-500/40 disabled:opacity-40 transition-colors"
                              >
                                <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                                צור תיק הפרויקט
                              </button>
                              <p className="text-xs text-slate-600 text-center">עד 10 פעולות ביום (משותף)</p>
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
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

          <div className="flex items-center gap-3">
            {mode === 'brief' && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
                הדפסה
              </button>
            )}
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
      </div>

      {/* Step indicator */}
      <StepIndicator mode={mode} isGenerateFlow={isGenerateFlow} />

      {/* Content */}
      <div className={`mx-auto px-6 py-8 ${isWide ? 'max-w-3xl' : 'max-w-2xl'}`}>

        {/* Generate form */}
        {mode === 'generate' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 md:p-8">
            <GenerateForm
              onSuccess={(qs, mock, input, ids) => {
                setQuestions(qs)
                setArchiveIds(ids)
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
                hasBrief={projectBrief !== null}
                onGoToBrief={() => { setBriefSource('results'); setMode('brief') }}
              />
            ) : (
              <div className="text-center py-8 space-y-3">
                <p className="text-slate-400 text-sm">לא הוחזרו שאלות. נסה שוב.</p>
                <button
                  type="button"
                  onClick={() => void handleGenerateAgain()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                  נסה שנית
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
        {mode === 'brief' && projectBrief && selectedQuestion && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 md:p-8">
            <div className="pb-4 border-b border-slate-800 mb-6 flex items-center justify-between no-print">
              <h2 className="text-lg font-bold text-white">תיק הפרויקט</h2>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-300 hover:text-white bg-violet-900/30 hover:bg-violet-900/60 border border-violet-700/50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Printer className="w-4 h-4" strokeWidth={1.5} />
                הדפסה / שיתוף
              </button>
            </div>
            <BriefScreen brief={projectBrief} selectedQuestion={selectedQuestion} />
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
