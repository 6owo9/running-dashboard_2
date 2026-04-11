import { Upload, Target } from 'lucide-react'

interface HeaderProps {
  onUpload: () => void
  onGoal: () => void
}

export default function Header({ onUpload, onGoal }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-4 bg-card shadow-sm">
      <span className="text-base font-bold tracking-tight">러닝 대시보드</span>
      <div className="flex gap-2">
        <button
          onClick={onGoal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Target size={15} />
          <span className="hidden sm:inline">목표</span>
        </button>
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors"
        >
          <Upload size={15} />
          업로드
        </button>
      </div>
    </header>
  )
}
