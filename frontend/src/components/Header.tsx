import { useLocation, useNavigate } from 'react-router-dom'
import { Map, Upload, Target } from 'lucide-react'

const NAV = [
  { label: 'Map', path: '/', icon: Map },
  { label: 'Upload', path: '/upload', icon: Upload },
  { label: 'Goal', path: '/goal', icon: Target },
]

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card shadow-sm">
      <span className="text-lg font-bold tracking-tight">러닝 대시보드</span>

      <nav className="flex gap-1">
        {NAV.map(({ label, path, icon: Icon }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                active
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
