import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GameApp } from './GameApp'
import { PlayerApp } from './PlayerApp'
import { VERSION } from './version'

console.log('App version:', VERSION);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Player routes FIRST - most specific */}
        <Route path="/play" element={<PlayerApp />} />
        
        {/* Admin routes */}
        <Route path="/admin/*" element={<GameApp />} />
        <Route path="/admin" element={<GameApp />} />
        
        {/* Default redirect naar admin (voor spelleider) */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
        {/* Catch-all - redirect unknown routes to admin */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App