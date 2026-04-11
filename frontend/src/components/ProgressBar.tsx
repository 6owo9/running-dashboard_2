interface ProgressBarProps {
  value: number        // 0 ~ 100
  label?: string
  achieved?: string
  target?: string
}

export default function ProgressBar({ value, label, achieved, target }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100)
  const color = clamped >= 100 ? 'bg-primary' : clamped >= 60 ? 'bg-primary' : 'bg-warning'

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">{label}</span>
          <span className="text-sm font-bold text-black">{clamped.toFixed(1)}%</span>
        </div>
      )}

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      {(achieved !== undefined || target !== undefined) && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>{achieved}</span>
          <span>목표 {target}</span>
        </div>
      )}
    </div>
  )
}
