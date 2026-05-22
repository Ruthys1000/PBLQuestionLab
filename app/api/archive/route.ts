import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  if (!prisma) {
    return NextResponse.json({ questions: [] })
  }

  try {
    const rows = await prisma.archivedQuestion.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      select: {
        id: true,
        topic: true,
        grade: true,
        subjects: true,
        question: true,
        overall_score: true,
        created_at: true,
      },
    })
    return NextResponse.json({ questions: rows })
  } catch {
    return NextResponse.json({ questions: [] })
  }
}
