import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import type { BigQuestion, DiagnosisResult, FormInput, DiagnoseInput, ProjectBrief } from '@/types'
import {
  GENERATE_SYSTEM_PROMPT,
  DIAGNOSE_SYSTEM_PROMPT,
  BRIEF_SYSTEM_PROMPT,
} from '@/lib/prompts'
import {
  mockBigQuestions,
  mockDiagnosisResult,
  mockProjectBrief,
} from '@/lib/mockData'

function isMock() { return !process.env.ANTHROPIC_API_KEY }

console.log('[anthropic] API key present:', !!process.env.ANTHROPIC_API_KEY)

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4000,
): Promise<string> {
  const client = getClient()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 110_000)

  try {
    const response = await client.messages.create(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      },
      { signal: controller.signal },
    )

    const block = response.content[0]
    if (!block || block.type !== 'text') {
      throw new Error('שגיאה: Claude לא החזיר תוכן טקסטואלי')
    }
    return block.text
  } finally {
    clearTimeout(timeoutId)
  }
}

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return fenced ? fenced[1].trim() : raw.trim()
}

function parseJSON<T>(raw: string, label: string): T {
  try {
    return JSON.parse(extractJSON(raw)) as T
  } catch {
    throw new Error(
      `שגיאה בניתוח תגובת Claude עבור ${label}. הפורמט שהתקבל אינו JSON תקני.`
    )
  }
}

function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 2000))
}

export async function generateQuestions(input: FormInput): Promise<BigQuestion[]> {
  if (isMock()) {
    console.log('Mock mode active — no API key found')
    await mockDelay()
    return mockBigQuestions
  }

  try {
    const raw = await callClaude(GENERATE_SYSTEM_PROMPT, JSON.stringify(input), 3500)
    const parsed = parseJSON<{ questions: BigQuestion[] }>(raw, 'generateQuestions')
    return parsed.questions
  } catch (err) {
    console.error('[generateQuestions] Anthropic error:', err)
    if (err instanceof Error && err.message.startsWith('שגיאה')) throw err
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`שגיאת שרת: ${msg}`)
  }
}

export async function diagnoseQuestion(input: DiagnoseInput): Promise<DiagnosisResult> {
  if (isMock()) {
    console.log('Mock mode active — no API key found')
    await mockDelay()
    return mockDiagnosisResult
  }

  try {
    const raw = await callClaude(DIAGNOSE_SYSTEM_PROMPT, JSON.stringify(input), 3000)
    const parsed = parseJSON<{ diagnosis: DiagnosisResult }>(raw, 'diagnoseQuestion')
    return parsed.diagnosis
  } catch (err) {
    console.error('[diagnoseQuestion] Anthropic error:', err)
    if (err instanceof Error && err.message.startsWith('שגיאה')) throw err
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`שגיאת שרת: ${msg}`)
  }
}

export async function generateProjectBrief(params: {
  selectedQuestion: BigQuestion
  originalInput: FormInput | DiagnoseInput
}): Promise<ProjectBrief> {
  if (isMock()) {
    console.log('Mock mode active — no API key found')
    await mockDelay()
    return mockProjectBrief
  }

  try {
    const raw = await callClaude(BRIEF_SYSTEM_PROMPT, JSON.stringify(params), 5000)
    const parsed = parseJSON<{ brief: ProjectBrief }>(raw, 'generateProjectBrief')
    return parsed.brief
  } catch (err) {
    console.error('[generateProjectBrief] Anthropic error:', err)
    if (err instanceof Error && err.message.startsWith('שגיאה')) throw err
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`שגיאת שרת: ${msg}`)
  }
}
