import { useState } from 'react'
import MapPage from './pages/MapPage'
import UploadPage from './pages/UploadPage'
import GoalPage from './pages/GoalPage'

function App() {
  const [focusDate, setFocusDate] = useState<string | null>(null)

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-gray-100 lg:overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center gap-3 flex-shrink-0">
        <span className="text-xl">🏃</span>
        <div>
          <h1 className="text-sm font-bold text-gray-900 leading-tight">러닝 대시보드</h1>
          <p className="text-xs text-gray-400 leading-tight">Running Dashboard</p>
        </div>
      </header>
      <main className="flex-1 lg:overflow-hidden p-4 w-full max-w-7xl mx-auto space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[3fr_2fr] lg:gap-4 lg:items-start">
        {/* 왼쪽: 목표 + 지도 */}
        <div className="flex flex-col gap-4 lg:h-full lg:min-h-0">
          <GoalPage />
          <div className="lg:flex-1 lg:min-h-0">
            <MapPage focusDate={focusDate} />
          </div>
        </div>
        {/* 오른쪽: 기록 */}
        <div className="lg:h-full lg:min-h-0">
          <UploadPage onFocusDate={setFocusDate} focusDate={focusDate} />
        </div>
      </main>
    </div>
  )
}

export default App
