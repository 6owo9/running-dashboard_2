import { useEffect, useState } from 'react'
import { X, Target } from 'lucide-react'
import ProgressBar from './ProgressBar'
import { saveGoal } from '../api/goalApi'
import type { Goal } from '../api/goalApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  goal: Goal | null
  onSaved: () => void
}

type View = 'form' | 'confirm' | 'result'

export default function GoalModal({ isOpen, onClose, goal, onSaved }: Props) {
  const [view, setView] = useState<View>(goal ? 'result' : 'form')
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // 모달 열릴 때마다 뷰 동기화
  useEffect(() => {
    if (isOpen) {
      setView(goal ? 'result' : 'form')
      setInput(goal ? String(goal.targetDistanceKm) : '')
      setError(null)
    }
  }, [isOpen, goal])

  if (!isOpen) return null

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
      await saveGoal(parseFloat(input))
      onSaved()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
      setView('form')
    } finally {
      setSaving(false)
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
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Target size={16} />
            <h2 className="font-semibold">목표 거리</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {error && <p className="text-sm text-warning">{error}</p>}

          {/* 입력 폼 */}
          {(view === 'form' || view === 'confirm') && (
            <>
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

              {view === 'confirm' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-sm text-amber-800">
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
            </>
          )}

          {/* 결과 */}
          {view === 'result' && goal && (
            <div className="flex flex-col gap-4">
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
                onClick={() => { setInput(String(goal.targetDistanceKm)); setView('form') }}
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
