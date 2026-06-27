import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import './theme.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Emergency from './pages/Emergency'
import Students from './pages/Students'
import Report from './pages/Report'
import Manual from './pages/Manual'
import Map from './pages/Map'
import Notifications from './pages/Notifications'

const NAV_ITEMS = [
  { to: '/', label: '대시보드', icon: '📊' },
  { to: '/emergency', label: '긴급연락', icon: '🚨', badge: { text: '2', color: 'red' } },
  { to: '/students', label: '학생관리', icon: '👤' },
  { to: '/report', label: '리포트', icon: '📋' },
  { to: '/map', label: '위치/시설', icon: '📍' },
  { to: '/notifications', label: '알림 설정', icon: '🔔' },
  { to: '/manual', label: '매뉴얼', icon: '📖' },
]

function AppContent({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate()

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="ft-shell">
      <aside className="ft-sidebar">
        <div className="ft-sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="ft-logo-emblem">FREE<br />-T</div>
          <div>
            <div className="ft-logo-title">FREE-T</div>
            <div className="ft-logo-sub">행동 감지 대응 시스템</div>
          </div>
        </div>

        <div className="ft-nav-section">
          <div className="ft-nav-label">메인 메뉴</div>
          {NAV_ITEMS.map(({ to, label, icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `ft-nav-item${isActive ? ' active' : ''}`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              {badge && <span className={`ft-nav-badge ${badge.color}`} style={{ background: 'var(--red-100)', color: 'var(--red-700)' }}>{badge.text}</span>}
            </NavLink>
          ))}
        </div>

        <div className="ft-sidebar-bottom">
          <button className="ft-logout-btn" onClick={() => setIsLoggedIn(false)}>로그아웃</button>
        </div>
      </aside>

      <main className="ft-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/students" element={<Students />} />
          <Route path="/report" element={<Report />} />
          <Route path="/manual" element={<Manual />} />
          <Route path="/map" element={<Map />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <BrowserRouter>
      <AppContent isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
    </BrowserRouter>
  )
}

export default App