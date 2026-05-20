import { NextRequest, NextResponse } from 'next/server'
import type { BigQuestion, FormInput, DiagnoseInput } from '@/types'
import { generateProjectBrief } from '@/lib/anthropic'

interface BriefRequestBody {
  selectedQuestion: BigQuestion
  originalInput: FormInput | DiagnoseInput
}

export async function POST(req: NextRequest) {
  let body: BriefRequestBody
  try {
    body = await req.json() as BriefRequestBody
  } catch {
    return NextResponse.json({ error: 'גוף הבקשה אינו JSON תקני' }, { status: 400 })
  }

  try {
    const brief = await generateProjectBrief(body)
    const mockMode = !process.env.ANTHROPIC_API_KEY
    return NextResponse.json({ brief, mockMode })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'שגיאה לא ידועה'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
