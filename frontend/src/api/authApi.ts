export interface AuthUser {
  id: number
  username: string
  nickname: string
  profileImageId: number
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.message || '요청에 실패했습니다.')
  return body.data
}

export async function signup(data: {
  username: string
  email: string
  password: string
  nickname: string
}): Promise<LoginResponse> {
  return handleResponse<LoginResponse>(
    await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  )
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return handleResponse<LoginResponse>(
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  )
}

export async function updateProfile(
  token: string,
  data: { nickname: string; profileImageId: number }
): Promise<AuthUser> {
  return handleResponse<AuthUser>(
    await fetch('/api/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
  )
}

export async function changePassword(
  token: string,
  data: { currentPassword: string; newPassword: string }
): Promise<void> {
  return handleResponse<void>(
    await fetch('/api/users/me/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
  )
}
