export interface RunningRecord {
  id: number
  title: string
  date: string
  distanceKm: number
  durationSeconds: number | null
  paceMinPerKm: number | null
  coordinates: [number, number][]
  createdAt: string
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.message || '요청에 실패했습니다.')
  return body.data
}

export async function getRecords(period?: 'today' | 'week', token?: string | null): Promise<RunningRecord[]> {
  const url = period ? `/api/running-records?period=${period}` : '/api/running-records'
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
  return handleResponse<RunningRecord[]>(await fetch(url, { headers }))
}

export async function uploadFile(file: File, token: string): Promise<RunningRecord> {
  const form = new FormData()
  form.append('file', file)
  return handleResponse<RunningRecord>(
    await fetch('/api/running-records/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
  )
}

export async function deleteRecord(id: number, token: string): Promise<void> {
  return handleResponse<void>(
    await fetch(`/api/running-records/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  )
}
