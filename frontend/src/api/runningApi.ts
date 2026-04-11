const BASE_URL = '/api'

async function parseError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => ({}))
  return new Error(body.message || fallback)
}

// 전체 러닝 기록 조회
export async function getRunningRecords(period?: 'today' | 'week') {
  const url = period ? `${BASE_URL}/running-records?period=${period}` : `${BASE_URL}/running-records`
  const res = await fetch(url)
  if (!res.ok) throw await parseError(res, '러닝 기록을 불러오지 못했습니다.')
  return res.json()
}

// GPX 파일 업로드
export async function uploadGpx(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/running-records/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw await parseError(res, '파일 업로드에 실패했습니다.')
  return res.json()
}
