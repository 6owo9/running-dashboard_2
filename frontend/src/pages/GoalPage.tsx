import { useEffect, useState } from 'react'
import { Target } from 'lucide-react'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import { getGoal, saveGoal } from '../api/goalApi'
import type { Goal } from '../api/goalApi'

type View = 'loading' | 'form' | 'confirm' | 'result'

export default function GoalPage() {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [view, setView] = useState<View>('loading')
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getGoal()
      .then(g => {
        setGoal(g)
        setView(g ? 'result' : 'form')
      })
      .catch(e => {
        setError(e.message)
        setView('form')
      })
  }, [])

  const handleSaveClick = () => {
    const val = parseFloat(input)
    if (!input || isNaN(val) || val <= 0) {
      setError('올바른 거리(km)를 입력해주세요.')
      return
    }
    setError(null)
    setView('confirm')
  }

  const handleConfirm = async () => {
    setSaving(true)
    try {
      const saved = await saveGoal(parseFloat(input))
      setGoal(saved)
      setInput('')
      setView('result')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
      setView('form')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = () => {
    setInput(goal ? String(goal.targetDistanceKm) : '')
    setError(null)
    setView('form')
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="flex items-start justify-center p-8">
        <div className="bg-card rounded-2xl shadow-sm p-8 w-full max-w-md">
          <div className="flex items-center gap-2 mb-6">
            <Target size={20} />
            <h2 className="text-lg font-bold">목표 거리</h2>
          </div>

          {/* 로딩 */}
          {view === 'loading' && (
            <p className="text-sm text-gray-400">불러오는 중...</p>
          )}

          {/* API 오류 */}
          {error && view !== 'confirm' && (
            <p className="text-sm text-warning mb-4">{error}</p>
          )}

          {/* 입력 폼 */}
          {(view === 'form' || view === 'confirm') && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-400 font-medium">목표 거리 (km)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={view === 'confirm'}
                    placeholder="예: 100"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-black disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  <span className="text-sm text-gray-400">km</span>
                </div>
              </div>

              {view === 'form' && (
                <button
                  onClick={handleSaveClick}
                  className="w-full bg-black text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  저장
                </button>
              )}

              {/* 확인 절차 */}
              {view === 'confirm' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-sm text-amber-800 font-medium">
                    목표를 <strong>{input} km</strong>으로 설정할까요?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirm}
                      disabled={saving}
                      className="flex-1 bg-black text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {saving ? '저장 중...' : '확인'}
                    </button>
                    <button
                      onClick={() => setView('form')}
                      disabled={saving}
                      className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 결과 */}
          {view === 'result' && goal && (
            <div className="flex flex-col gap-5">
              <ProgressBar
                value={goal.progressRate}
                label={`달성률 ${goal.progressRate.toFixed(1)}%`}
                achieved={`${goal.achievedDistanceKm.toFixed(1)} km`}
                target={`${goal.targetDistanceKm} km`}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-black">{goal.achievedDistanceKm.toFixed(1)}</p>
                  <p className="text-xs text-gray-400 mt-1">달성 km</p>
                </div>
                <div className="bg-bg rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-black">{goal.targetDistanceKm}</p>
                  <p className="text-xs text-gray-400 mt-1">목표 km</p>
                </div>
              </div>

              <button
                onClick={handleEdit}
                className="w-full border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                수정
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
