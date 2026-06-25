import { useEffect, useRef, useState } from 'react'

function Dashboard() {
  const videoRef = useRef(null)
  const [alerts] = useState([
    { time: '14:32', class: '1반', behavior: '상동행동(스피닝)', level: '주의', color: '#f39c12' },
    { time: '14:18', class: '2반', behavior: '정상', level: '안전', color: '#27ae60' },
    { time: '13:55', class: '1반', behavior: '자해행동(헤드뱅잉)', level: '위험', color: '#e74c3c' },
    { time: '13:40', class: '3반', behavior: '정상', level: '안전', color: '#27ae60' },
  ])

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream })
      .catch(() => console.log('웹캠 접근 불가'))
  }, [])

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>📊 대시보드</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
        
        {/* 웹캠 영상 */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ marginBottom: '10px' }}>🎥 실시간 CCTV</h3>
          <video ref={videoRef} autoPlay muted
            style={{ width: '100%', borderRadius: '12px', background: '#000' }} />
        </div>

        {/* 실시간 알림 피드 */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>🔔 실시간 알림 피드</h3>
          {alerts.map((a, i) => (
            <div key={i} style={{
              borderLeft: `4px solid ${a.color}`, padding: '10px 14px',
              marginBottom: '10px', background: '#f9f9f9', borderRadius: '8px'
            }}>
              <div style={{ fontSize: '13px', color: '#888' }}>{a.time} · {a.class}</div>
              <div style={{ fontWeight: 'bold' }}>{a.behavior}</div>
              <span style={{
                fontSize: '12px', color: 'white', background: a.color,
                padding: '2px 8px', borderRadius: '10px'
              }}>{a.level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard