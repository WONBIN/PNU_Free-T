import { useState } from 'react'
import '../theme.css'

function Login({ onLogin }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!id.trim() || !pw.trim()) {
      setError('아이디와 비밀번호를 모두 입력해주세요.')
      return
    }
    setError('')
    onLogin()
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 60%, var(--blue-700) 100%)',
    }}>
      <form onSubmit={handleSubmit} className="ft-card" style={{
        padding: '40px', width: '340px', textAlign: 'center', background: 'var(--bg-white)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, var(--blue-900), var(--blue-700))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 13, lineHeight: 1.1,
        }}>FREE<br />-T</div>
        <h2 style={{ color: 'var(--blue-900)', marginBottom: 4, fontSize: 18 }}>FREE-T 관리자 로그인</h2>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 22 }}>부산대학교 사범대학 부설 예술 중고등 특수학교</p>
        <input value={id} onChange={e => { setId(e.target.value); if (error) setError('') }} placeholder="아이디"
          style={{ width: '100%', padding: '10px 12px', marginBottom: '10px', borderRadius: 'var(--radius-sm)', border: `1.5px solid ${error ? 'var(--red-600)' : 'var(--border)'}`, fontSize: 13 }} />
        <input value={pw} onChange={e => { setPw(e.target.value); if (error) setError('') }} type="password" placeholder="비밀번호"
          style={{ width: '100%', padding: '10px 12px', marginBottom: error ? '8px' : '20px', borderRadius: 'var(--radius-sm)', border: `1.5px solid ${error ? 'var(--red-600)' : 'var(--border)'}`, fontSize: 13 }} />
        {error && (
          <p style={{ color: 'var(--red-600)', fontSize: 11.5, textAlign: 'left', marginBottom: 12 }}>⚠️ {error}</p>
        )}
        <button type="submit" className="ft-btn ft-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
          로그인
        </button>
      </form>
    </div>
  )
}

export default Login