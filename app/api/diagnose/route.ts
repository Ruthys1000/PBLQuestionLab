import { NextRequest, NextResponse } from 'next/server'
import type { DiagnoseInput } from '@/types'
import { diagnoseQuestion } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  let input: DiagnoseInput
  try {
    input = await req.json() as DiagnoseInput
  } catch {
    return NextResponse.json({ error: 'גוף הבקשה אינו JSON תקני' }, { status: 400 })
  }

  try {
    const diagnosis = await diagnoseQuestion(input)
    const mockMode = !process.env.ANTHROPIC_API_KEY
    return NextResponse.json({ diagnosis, mockMode })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'שגיאה לא ידועה'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
