import { useEffect, useState } from 'react'
import { getCurrentGoal, saveGoal } from '../api/goalApi'
import { getRunningRecords } from '../api/runningApi'

interface Goal {
  monthlyDistanceKm: number
  currentDistanceKm: number
  achievementRate: number
}

export default function GoalPage() {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [maxDistance, setMaxDistance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadGoal = async () => {
    setLoading(true)
    setError(null)
    try {
      const [goalRes, recsRes] = await Promise.all([getCurrentGoal(), getRunningRecords()])
      setGoal(goalRes.data ?? null)
      if (!goalRes.data) setIsEditing(true)
      const recs: { distanceKm: number }[] = recsRes.data ?? []
      setMaxDistance(recs.length > 0 ? Math.max(...recs.map((r) => r.distanceKm)) : null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadGoal() }, [])

  const handleEditClick = () => {
    setInput(goal ? String(goal.monthlyDistanceKm) : '')
    setInputError(null)
    setSaveError(null)
    setConfirming(false)
    setIsEditing(true)
  }

  const handleSaveClick = () => {
    const km = parseFloat(input)
    if (isNaN(km) || km <= 0) {
      setInputError('올바른 거리(km)를 입력해주세요.')
      return
    }
    setInputError(null)
    setConfirming(true)
  }

  const handleConfirm = async () => {
    const km = parseFloat(input)
    setSaving(true)
    setSaveError(null)
    try {
      await saveGoal(km)
      setIsEditing(false)
      setConfirming(false)
      setInput('')
      await loadGoal()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '저장에 실패했습니다.')
      setConfirming(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setConfirming(false)
    setInput('')
    setInputError(null)
    setSaveError(null)
  }

  const rate = Math.min(goal?.achievementRate ?? 0, 100)

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex-shrink-0">
      <div className="flex items-start h-full justify-between gap-4">
        {/* 왼쪽: 제목 + 진행상황 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-900">이번 달 목표</h2>
            {goal && !isEditing && (
              <button
                onClick={handleEditClick}
                className="text-xs text-blue-500 hover:text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-50 transition-colors"
              >
                수정
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-gray-400 text-xs">불러오는 중...</p>
          ) : error ? (
            <p className="text-red-500 text-xs">{error}</p>
          ) : goal && !isEditing ? (
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <div>
                  <span className="text-xl font-bold text-gray-900">{goal.currentDistanceKm.toFixed(1)}</span>
                  <span className="text-xs text-gray-400 ml-1">/ {goal.monthlyDistanceKm} km</span>
                </div>
                <span className={`text-sm font-bold ${rate >= 100 ? 'text-green-500' : 'text-blue-500'}`}>
                  {rate.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${rate >= 100 ? 'bg-green-400' : 'bg-blue-500'}`}
                  style={{ width: `${rate}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {rate >= 100 ? '🎉 목표 달성!' : `${(goal.monthlyDistanceKm - goal.currentDistanceKm).toFixed(1)} km 남음`}
              </p>
            </div>
          ) : null}

          {/* 목표 설정 폼 */}
          {isEditing && !confirming && (
            <div className="space-y-2 mt-1">
              {goal && (
                <p className="text-xs text-gray-400">
                  현재 목표: <span className="font-semibold text-gray-600">{goal.monthlyDistanceKm} km</span>
                </p>
              )}
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveClick()}
                  placeholder="목표 거리 (km)"
                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-all"
                />
                <button
                  onClick={handleSaveClick}
                  className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  저장
                </button>
                {goal && (
                  <button onClick={handleCancel} className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600">
                    취소
                  </button>
                )}
              </div>
              {inputError && <p className="text-red-500 text-xs">⚠ {inputError}</p>}
              {saveError && <p className="text-red-500 text-xs">⚠ {saveError}</p>}
            </div>
          )}

          {confirming && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-2.5 space-y-2 mt-1">
              <p className="text-xs text-amber-800">
                목표를 <span className="font-bold">{input} km</span>로 변경할까요?
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? '저장 중...' : '확인'}
                </button>
                <button onClick={() => setConfirming(false)} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700">
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 최대 거리 */}
        {maxDistance != null && !isEditing && (
          <div className="shrink-0 flex flex-col justify-center h-full  text-right border-l border-gray-100 pl-4">
            <p className="text-xs text-gray-400 mb-0.5">최대 거리</p>
            <p className="text-xl font-bold text-gray-900">{maxDistance.toFixed(1)}<span className="text-xs text-gray-400">km</span></p>
          </div>
        )}
      </div>
    </section>
  )
}
