function Manual() {
  const manuals = [
    { type: '자해성 행동', icon: '🤕', color: '#e74c3c', guide: '즉시 접근하여 신체 보호 → 진정 유도 → 지속 시 보건실/담임 연결' },
    { type: '공격성 행동', icon: '⚠️', color: '#e67e22', guide: '주변 학생 안전 확보 → 거리 유지하며 차분히 대응 → 필요 시 교무실 호출' },
    { type: '상동성 행동', icon: '🔄', color: '#f39c12', guide: '대부분 자연스러운 행동 → 지속 관찰 → 강도가 높아지면 기록 후 보고' },
    { type: '파괴 및 돌발 행동', icon: '💥', color: '#8e44ad', guide: '주변 위험 요소 제거 → 안전 공간으로 유도 → 상황 종료 후 기록' },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>📖 상황별 행동 매뉴얼</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {manuals.map((m, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>{m.icon}</div>
            <h3 style={{ color: m.color, marginBottom: '10px' }}>{m.type}</h3>
            <p style={{ color: '#555', lineHeight: '1.6' }}>{m.guide}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Manual