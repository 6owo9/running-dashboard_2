import { User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AuthUser } from '../api/authApi'
import { changePassword, updateProfile } from '../api/authApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  token: string
  user: AuthUser
  onUpdated: (user: AuthUser) => void
}

type Tab = 'profile' | 'password'

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-pink-500',
]

export function AvatarCircle({ id, size = 'md' }: { id: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'w-7 h-7 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }[size]
  const color = AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length]
  return (
    <div className={`${color} ${sizeClass} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      <User size={size === 'sm' ? 12 : size === 'md' ? 16 : 22} />
    </div>
  )
}

export default function ProfileModal({ isOpen, onClose, token, user, onUpdated }: Props) {
  const [tab, setTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [nickname, setNickname] = useState(user.nickname)
  const [selectedImg, setSelectedImg] = useState(user.profileImageId)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })

  useEffect(() => {
    if (isOpen) {
      setTab('profile')
      setError(null)
      setSuccess(null)
      setNickname(user.nickname)
      setSelectedImg(user.profileImageId)
      setPwForm({ current: '', next: '', confirm: '' })
    }
  }, [isOpen, user])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || nickname.length > 20) {
      setError('닉네임은 1~20자여야 합니다.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await updateProfile(token, { nickname, profileImageId: selectedImg })
      onUpdated(updated)
      setSuccess('프로필이 저장되었습니다.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwForm.current) { setError('현재 비밀번호를 입력해주세요.'); return }
    if (pwForm.next.length < 8 || !/[!@#$%^&*(),.?":{}|<>]/.test(pwForm.next)) {
      setError('새 비밀번호는 8자 이상, 특수문자를 포함해야 합니다.')
      return
    }
    if (pwForm.next !== pwForm.confirm) { setError('새 비밀번호가 일치하지 않습니다.'); return }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await changePassword(token, { currentPassword: pwForm.current, newPassword: pwForm.next })
      setSuccess('비밀번호가 변경되었습니다.')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
              <AvatarCircle id={user.profileImageId} size="md" />
            <div>
              <p className="text-sm font-semibold text-foreground">{user.nickname}</p>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-border">
          {(['profile', 'password'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); setSuccess(null) }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'profile' ? '프로필 수정' : '비밀번호 변경'}
            </button>
          ))}
        </div>

        <div className="p-5 flex flex-col gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          {tab === 'profile' ? (
            <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
              {/* 프로필 이미지 선택 */}
              <div>
                <label className="text-xs text-muted-foreground font-medium">프로필 이미지</label>
                <div className="flex gap-3 mt-2">
                  {[1, 2, 3, 4, 5].map(id => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedImg(id)}
                      className={`rounded-full transition-all ${
                        selectedImg === id ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                    >
                      <AvatarCircle id={id} size="md" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-medium">닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="표시될 이름"
                  className={`mt-1 ${inputClass}`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? '저장 중...' : '저장'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSave} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">현재 비밀번호</label>
                <input
                  type="password"
                  value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                  placeholder="현재 비밀번호"
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">새 비밀번호</label>
                <input
                  type="password"
                  value={pwForm.next}
                  onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                  placeholder="8자 이상, 특수문자 포함"
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="새 비밀번호 재입력"
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
              >
                {loading ? '변경 중...' : '변경'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
