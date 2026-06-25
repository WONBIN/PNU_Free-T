function Report() {
  const logs = [
    { date: '6/24', time: '14:32', student: '김민준', behavior: '상동행동', duration: '12초' },
    { date: '6/24', time: '13:55', student: '이서윤', behavior: '자해행동', duration: '8초' },
    { date: '6/23', time: '11:20', student: '김민준', behavior: '상동행동', duration: '15초' },
    { date: '6/22', time: '10:05', student: '박지호', behavior: '공격성행동', duration: '20초' },
  ]

  const weeklyStats = [
    { day: '월', count: 2 }, { day: '화', count: 4 }, { day: '수', count: 1 },
    { day: '목', count: 3 }, { day: '금', count: 5 },
  ]
  const max = Math.max(...weeklyStats.map(d => d.count))

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>📋 이상행동 리포트</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* 기록 리스트 */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>최근 기록</h3>
          {logs.map((l, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '13px', color: '#888' }}>{l.date} {l.time}</div>
              <div><b>{l.student}</b> · {l.behavior} · {l.duration}</div>
            </div>
          ))}
        </div>

        {/* 주간 통계 */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>주간 발생 통계</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px' }}>
            {weeklyStats.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  height: `${(d.count / max) * 120}px`, background: '#e94560',
                  borderRadius: '6px 6px 0 0', marginBottom: '6px'
                }} />
                <div style={{ fontSize: '13px' }}>{d.day}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{d.count}회</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Report