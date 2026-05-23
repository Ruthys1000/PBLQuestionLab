import { NextRequest, NextResponse } from 'next/server'
import type { DiagnoseInput } from '@/types'
import { diagnoseQuestion } from '@/lib/anthropic'

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

const dailyLimitMap = new Map<string, { count: number; date: string }>()
const DAILY_LIMIT = 5

function checkDailyLimit(ip: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  const entry = dailyLimitMap.get(ip)
  if (!entry || entry.date !== today) {
    dailyLimitMap.set(ip, { count: 1, date: today })
    return true
  }
  if (entry.count >= DAILY_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'יותר מדי בקשות — נסה שוב בעוד דקה' }, { status: 429 })
  }
  if (!checkDailyLimit(ip)) {
    return NextResponse.json({ error: `הגעת למגבלת ${DAILY_LIMIT} הבקשות היומיות — נסה שוב מחר` }, { status: 429 })
  }

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
