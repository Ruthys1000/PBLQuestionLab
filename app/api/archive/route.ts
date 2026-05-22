import { NextResponse } from 'next/server'
import { prisma, ensureTable } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!prisma) {
    return NextResponse.json({ questions: [] })
  }

  try {
    await ensureTable()
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
