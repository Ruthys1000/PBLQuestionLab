import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!prisma) {
    return NextResponse.json({ error: 'אין חיבור לDB' }, { status: 503 })
  }

  let body: { brief_data: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'גוף הבקשה אינו JSON תקני' }, { status: 400 })
  }

  try {
    await prisma.archivedQuestion.update({
      where: { id: params.id },
      data: { brief_data: body.brief_data },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[archive] patch error:', err)
    return NextResponse.json({ error: 'שגיאת שמירה' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const pin = process.env.DELETE_PIN
  if (!pin) {
    return NextResponse.json({ error: 'מחיקה אינה מופעלת' }, { status: 403 })
  }

  let body: { pin?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'גוף הבקשה אינו JSON תקני' }, { status: 400 })
  }

  if (body.pin !== pin) {
    return NextResponse.json({ error: 'קוד שגוי' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'אין חיבור לDB' }, { status: 503 })
  }

  try {
    await prisma.archivedQuestion.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[archive] delete error:', err)
    return NextResponse.json({ error: 'שגיאת מחיקה' }, { status: 500 })
  }
}
