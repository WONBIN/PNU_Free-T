import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Emergency from './pages/Emergency'
import Students from './pages/Students'
import Report from './pages/Report'
import Manual from './pages/Manual'

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
        
        {/* 사이드바 */}
        <nav style={{
          width: '200px', background: '#1a1a2e', color: 'white',
          display: 'flex', flexDirection: 'column', padding: '20px'
        }}>
          <h2 style={{ color: '#e94560', marginBottom: '30px' }}>🏫 PNU 특수학교</h2>
          {[
            { to: '/', label: '📊 대시보드' },
            { to: '/emergency', label: '🚨 긴급연락' },
            { to: '/students', label: '👤 학생관리' },
            { to: '/report', label: '📋 리포트' },
            { to: '/manual', label: '📖 매뉴얼' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                color: isActive ? '#e94560' : 'white',
                textDecoration: 'none', padding: '10px',
                borderRadius: '8px', marginBottom: '5px',
                background: isActive ? 'rgba(233,69,96,0.1)' : 'transparent'
              })}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* 메인 콘텐츠 */}
        <main style={{ flex: 1, padding: '30px', background: '#f5f5f5', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/students" element={<Students />} />
            <Route path="/report" element={<Report />} />
            <Route path="/manual" element={<Manual />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  )
}

export default App