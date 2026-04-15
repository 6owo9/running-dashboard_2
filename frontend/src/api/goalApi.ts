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

export async function getGoal(token: string | null): Promise<Goal | null> {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return handleResponse<Goal | null>(await fetch('/api/goals/current', { headers }))
}

export async function saveGoal(targetDistanceKm: number, token: string): Promise<Goal> {
  return handleResponse<Goal>(
    await fetch('/api/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetDistanceKm }),
    })
  )
}
