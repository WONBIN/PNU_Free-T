import { useState } from 'react'

function Login({ onLogin }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin()
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', background: '#1a1a2e'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'white', padding: '40px', borderRadius: '16px',
        width: '320px', textAlign: 'center'
      }}>
        <h2 style={{ color: '#e94560', marginBottom: '24px' }}>🏫 PNU 특수학교</h2>
        <input value={id} onChange={e => setId(e.target.value)} placeholder="아이디"
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
        <input value={pw} onChange={e => setPw(e.target.value)} type="password" placeholder="비밀번호"
          style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' }} />
        <button type="submit" style={{
          width: '100%', padding: '12px', background: '#e94560', color: 'white',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
        }}>로그인</button>
      </form>
    </div>
  )
}

export default Login