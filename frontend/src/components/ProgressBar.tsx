interface ProgressBarProps {
  value: number        // 0 ~ 100
  label?: string
  achieved?: string
  target?: string
}

export default function ProgressBar({ value, label, achieved, target }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100)

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium text-foreground">{clamped.toFixed(1)}%</span>
        </div>
      )}

      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>

      {(achieved !== undefined || target !== undefined) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{achieved}</span>
          <span>목표 {target}</span>
        </div>
      )}
    </div>
  )
}
