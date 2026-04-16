export interface StatsSummary {
  totalDistanceKm: number
  totalDurationSeconds: number
  totalCount: number
  averagePaceMinPerKm: number | null
}

export async function getSummary(token?: string | null): Promise<StatsSummary> {
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch('/api/stats/summary', { headers })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.message || '통계를 불러오지 못했습니다.')
  return body.data
}
