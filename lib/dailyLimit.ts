import 'server-only'

const dailyLimitMap = new Map<string, { count: number; date: string }>()
export const DAILY_LIMIT = 10

export function checkDailyLimit(ip: string): boolean {
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
