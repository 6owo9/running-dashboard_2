export interface CctvItem {
  cctvname: string;
  cctvurl: string;
  cctvimageurl?: string;
  coordx: number;
  coordy: number;
}

export async function getCctvList(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): Promise<CctvItem[]> {
  const res = await fetch(`/api/cctv?minX=${minX}&maxX=${maxX}&minY=${minY}&maxY=${maxY}`);
  if (!res.ok) return [];
  const body = await res.json();
  return body.data ?? [];
}

export function getCctvImageUrl(url: string): string {
  return `/api/cctv/image?url=${encodeURIComponent(url)}`;
}

export function getCctvHlsUrl(url: string): string {
  if (!url) return '';
  return `/api/cctv/hls?url=${encodeURIComponent(url)}`;
}

export async function getCctvStreamUrl(cctvIp: string): Promise<string | null> {
  const res = await fetch(`/api/cctv/stream-url?cctvIp=${encodeURIComponent(cctvIp)}`);
  if (!res.ok) return null;
  const body = await res.json();
  return body.data ?? null;
}

export function getCctvStreamProxyUrl(url: string): string {
  return `/api/cctv/stream?url=${encodeURIComponent(url)}`;
}
