export interface CctvItem {
  cctvname: string
  cctvurl: string
  coordx: number
  coordy: number
}

export async function getCctvList(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): Promise<CctvItem[]> {
  const res = await fetch(`/api/cctv?minX=${minX}&maxX=${maxX}&minY=${minY}&maxY=${maxY}`)
  if (!res.ok) return []
  const body = await res.json()
  return body.data ?? []
}
