import type {
  BigQuestion,
  DiagnosisResult,
  FormInput,
  DiagnoseInput,
  ProjectBrief,
} from '@/types'

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  let res: Response
  let data: Record<string, unknown>

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120_000)

  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('הבקשה ארכה זמן רב מדי — נסי שוב, לפעמים Claude זקוק לכמה שניות נוספות')
    }
    throw new Error(`שגיאת רשת: לא ניתן להתחבר לשרת. ${err instanceof Error ? err.message : ''}`)
  } finally {
    clearTimeout(timeoutId)
  }

  try {
    data = await res.json() as Record<string, unknown>
  } catch {
    if (res.status === 504 || res.status === 524) {
      throw new Error('הבקשה ארכה זמן רב מדי — נסי שוב, לפעמים Claude זקוק לכמה שניות נוספות')
    }
    throw new Error(`שגיאת שרת ${res.status}: התגובה אינה JSON תקני`)
  }

  if (!res.ok) {
    const message = typeof data.error === 'string'
      ? data.error
      : `שגיאת שרת ${res.status}: ${JSON.stringify(data)}`
    throw new Error(message)
  }

  return data as T
}

export async function createQuestions(
  input: FormInput
): Promise<{ questions: BigQuestion[]; mockMode: boolean }> {
  return postJSON('/api/generate', input)
}

export async function diagnoseExistingQuestion(
  input: DiagnoseInput
): Promise<{ diagnosis: DiagnosisResult; mockMode: boolean }> {
  return postJSON('/api/diagnose', input)
}

export async function createProjectBrief(params: {
  selectedQuestion: BigQuestion
  originalInput: FormInput | DiagnoseInput
}): Promise<{ brief: ProjectBrief; mockMode: boolean }> {
  return postJSON('/api/brief', params)
}
