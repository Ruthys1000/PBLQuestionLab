import { NextRequest, NextResponse } from 'next/server'
import type { FormInput } from '@/types'
import { generateQuestions } from '@/lib/anthropic'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  let input: FormInput
  try {
    input = await req.json() as FormInput
  } catch {
    return NextResponse.json({ error: 'גוף הבקשה אינו JSON תקני' }, { status: 400 })
  }

  try {
    const questions = await generateQuestions(input)
    const mockMode = !process.env.ANTHROPIC_API_KEY

    if (prisma && !mockMode) {
      await Promise.all(questions.map(q =>
        prisma!.archivedQuestion.create({
          data: {
            topic: input.topic,
            grade: input.grade,
            subjects: JSON.stringify(input.subjects),
            question: q.question,
            overall_score: q.stress_test.overall_score,
            full_data: JSON.stringify(q),
          },
        })
      ))
    }

    return NextResponse.json({ questions, mockMode })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'שגיאה לא ידועה'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
