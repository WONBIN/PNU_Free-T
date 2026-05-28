function Emergency() {
  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>🚨 긴급연락</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        
        {/* 119 */}
        <a href="tel:119" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#e74c3c', color: 'white', padding: '40px',
            borderRadius: '16px', textAlign: 'center', cursor: 'pointer'
          }}>
            <div style={{ fontSize: '48px' }}>🚑</div>
            <h2>119 구급대</h2>
            <p>응급상황 즉시 신고</p>
          </div>
        </a>

        {/* 112 */}
        <a href="tel:112" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#2980b9', color: 'white', padding: '40px',
            borderRadius: '16px', textAlign: 'center', cursor: 'pointer'
          }}>
            <div style={{ fontSize: '48px' }}>🚔</div>
            <h2>112 경찰</h2>
            <p>안전사고 신고</p>
          </div>
        </a>

        {/* 담임선생님 */}
        <a href="tel:010-0000-0000" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#27ae60', color: 'white', padding: '40px',
            borderRadius: '16px', textAlign: 'center', cursor: 'pointer'
          }}>
            <div style={{ fontSize: '48px' }}>👩‍🏫</div>
            <h2>담임선생님</h2>
            <p>010-0000-0000</p>
          </div>
        </a>

        {/* 학교 행정실 */}
        <a href="tel:051-000-0000" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#8e44ad', color: 'white', padding: '40px',
            borderRadius: '16px', textAlign: 'center', cursor: 'pointer'
          }}>
            <div style={{ fontSize: '48px' }}>🏫</div>
            <h2>학교 행정실</h2>
            <p>051-000-0000</p>
          </div>
        </a>

      </div>
    </div>
  )
}

export default Emergency