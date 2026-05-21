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

  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new Error(`שגיאת רשת: לא ניתן להתחבר לשרת. ${err instanceof Error ? err.message : ''}`)
  }

  try {
    data = await res.json() as Record<string, unknown>
  } catch {
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
