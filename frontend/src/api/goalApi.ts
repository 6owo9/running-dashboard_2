export interface Goal {
  id: number
  targetDistanceKm: number
  achievedDistanceKm: number
  progressRate: number
  createdAt: string
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.message || '요청에 실패했습니다.')
  return body.data
}

export async function getGoal(): Promise<Goal | null> {
  return handleResponse<Goal | null>(await fetch('/api/goals/current'))
}

export async function saveGoal(targetDistanceKm: number): Promise<Goal> {
  return handleResponse<Goal>(
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDistanceKm }),
    })
  )
}
