import 'server-only'
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return null
  try {
    const adapter = new PrismaPg({ connectionString })
    return new PrismaClient({ adapter })
  } catch {
    return null
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null
  tableReady: boolean
}
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function ensureTable(): Promise<void> {
  if (!prisma) return
  if (globalForPrisma.tableReady) return
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ArchivedQuestion" (
        "id"            TEXT             NOT NULL,
        "topic"         TEXT             NOT NULL,
        "grade"         TEXT             NOT NULL,
        "subjects"      TEXT             NOT NULL,
        "question"      TEXT             NOT NULL,
        "overall_score" DOUBLE PRECISION NOT NULL,
        "full_data"     TEXT             NOT NULL,
        "created_at"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ArchivedQuestion_pkey" PRIMARY KEY ("id")
      )
    `
    globalForPrisma.tableReady = true
  } catch (err) {
    console.error('[ensureTable] DB error:', err)
  }
}
