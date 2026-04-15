import { useEffect, useState } from 'react'
import { X, Activity } from 'lucide-react'
import { login, signup } from '../api/authApi'
import type { AuthUser, LoginResponse } from '../api/authApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (token: string, user: AuthUser) => void
  initialTab?: 'login' | 'signup'
}

type Tab = 'login' | 'signup'

const SPECIAL_CHAR = /[!@#$%^&*(),.?":{}|<>]/

export default function AuthModal({ isOpen, onClose, onSuccess, initialTab = 'login' }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [signupForm, setSignupForm] = useState({
    username: '', email: '', password: '', nickname: '',
  })

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab)
      setError(null)
      setLoginForm({ username: '', password: '' })
      setSignupForm({ username: '', email: '', password: '', nickname: '' })
    }
  }, [isOpen, initialTab])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginForm.username || !loginForm.password) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res: LoginResponse = await login(loginForm.username, loginForm.password)
      onSuccess(res.token, res.user)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const { username, email, password, nickname } = signupForm
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('아이디는 3~20자의 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.')
      return
    }
    if (!email.includes('@')) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }
    if (password.length < 8 || !SPECIAL_CHAR.test(password)) {
      setError('비밀번호는 8자 이상, 특수문자를 포함해야 합니다.')
      return
    }
    if (!nickname.trim() || nickname.length > 20) {
      setError('닉네임은 1~20자여야 합니다.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res: LoginResponse = await signup({ username, email, password, nickname })
      onSuccess(res.token, res.user)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">러닝 대시보드</h2>
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
          {(['login', 'signup'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <div className="p-5 flex flex-col gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">아이디</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="아이디 입력"
                  className="mt-1 w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">비밀번호</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="비밀번호 입력"
                  className="mt-1 w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">아이디</label>
                <input
                  type="text"
                  value={signupForm.username}
                  onChange={e => setSignupForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="3~20자 영문, 숫자, 밑줄"
                  className="mt-1 w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">이메일</label>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="이메일 입력"
                  className="mt-1 w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">비밀번호</label>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="8자 이상, 특수문자 포함"
                  className="mt-1 w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">닉네임</label>
                <input
                  type="text"
                  value={signupForm.nickname}
                  onChange={e => setSignupForm(f => ({ ...f, nickname: e.target.value }))}
                  placeholder="표시될 이름"
                  className="mt-1 w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
              >
                {loading ? '가입 중...' : '회원가입'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
