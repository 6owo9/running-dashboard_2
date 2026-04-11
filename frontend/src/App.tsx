import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MapPage from './pages/MapPage'
import UploadPage from './pages/UploadPage'
import GoalPage from './pages/GoalPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/goal" element={<GoalPage />} />
      </Routes>
    </BrowserRouter>
  )
}
