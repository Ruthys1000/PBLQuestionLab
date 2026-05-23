import { NextRequest, NextResponse } from 'next/server'
import type { BigQuestion, FormInput, DiagnoseInput } from '@/types'
import { generateProjectBrief } from '@/lib/anthropic'
import { checkDailyLimit, DAILY_LIMIT } from '@/lib/dailyLimit'

interface BriefRequestBody {
  selectedQuestion: BigQuestion
  originalInput: FormInput | DiagnoseInput
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}


export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'יותר מדי בקשות — נסה שוב בעוד דקה' }, { status: 429 })
  }
  if (!checkDailyLimit(ip)) {
    return NextResponse.json({ error: `הגעת למגבלת ${DAILY_LIMIT} הפעולות היומיות — נסה שוב מחר` }, { status: 429 })
  }

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
