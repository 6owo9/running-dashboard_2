interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  sub?: string
}

export default function StatCard({ label, value, unit, sub }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm flex flex-col gap-1">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      <div className="flex items-end gap-1 mt-1">
        <span className="text-3xl font-bold text-black leading-none">{value}</span>
        {unit && <span className="text-sm text-gray-400 mb-0.5">{unit}</span>}
      </div>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}
