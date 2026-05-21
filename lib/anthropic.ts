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

const isMockMode = !process.env.ANTHROPIC_API_KEY

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const client = getClient()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const block = response.content[0]
  if (!block || block.type !== 'text') {
    throw new Error('שגיאה: Claude לא החזיר תוכן טקסטואלי')
  }
  return block.text
}

function parseJSON<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T
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
  if (isMockMode) {
    console.log('Mock mode active — no API key found')
    await mockDelay()
    return mockBigQuestions
  }

  try {
    const raw = await callClaude(GENERATE_SYSTEM_PROMPT, JSON.stringify(input))
    const parsed = parseJSON<{ questions: BigQuestion[] }>(raw, 'generateQuestions')
    return parsed.questions
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('שגיאה')) throw err
    throw new Error('שגיאת שרת: לא ניתן ליצור שאלות כרגע. אנא נסה שוב.')
  }
}

export async function diagnoseQuestion(input: DiagnoseInput): Promise<DiagnosisResult> {
  if (isMockMode) {
    console.log('Mock mode active — no API key found')
    await mockDelay()
    return mockDiagnosisResult
  }

  try {
    const raw = await callClaude(DIAGNOSE_SYSTEM_PROMPT, JSON.stringify(input))
    const parsed = parseJSON<{ diagnosis: DiagnosisResult }>(raw, 'diagnoseQuestion')
    return parsed.diagnosis
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('שגיאה')) throw err
    throw new Error('שגיאת שרת: לא ניתן לאבחן את השאלה כרגע. אנא נסה שוב.')
  }
}

export async function generateProjectBrief(params: {
  selectedQuestion: BigQuestion
  originalInput: FormInput | DiagnoseInput
}): Promise<ProjectBrief> {
  if (isMockMode) {
    console.log('Mock mode active — no API key found')
    await mockDelay()
    return mockProjectBrief
  }

  try {
    const raw = await callClaude(BRIEF_SYSTEM_PROMPT, JSON.stringify(params))
    const parsed = parseJSON<{ brief: ProjectBrief }>(raw, 'generateProjectBrief')
    return parsed.brief
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('שגיאה')) throw err
    throw new Error('שגיאת שרת: לא ניתן ליצור תיק פרויקט כרגע. אנא נסה שוב.')
  }
}
