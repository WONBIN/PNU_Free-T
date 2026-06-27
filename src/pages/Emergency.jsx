const CONTACTS = [
  { href: 'tel:119', icon: '🚑', title: '119 구급대', desc: '응급상황 즉시 신고', bg: 'linear-gradient(135deg, var(--red-600), var(--red-700))' },
  { href: 'tel:112', icon: '🚔', title: '112 경찰', desc: '안전사고 신고', bg: 'linear-gradient(135deg, var(--blue-700), var(--blue-900))' },
  { href: 'tel:010-0000-0000', icon: '👩‍🏫', title: '담임선생님', desc: '010-0000-0000', bg: 'linear-gradient(135deg, var(--green-600), var(--green-700))' },
  { href: 'tel:051-000-0000', icon: '🏫', title: '학교 행정실', desc: '051-000-0000', bg: 'linear-gradient(135deg, var(--orange-600), #92400e)' },
]

function Emergency() {
  return (
    <div>
      <div className="ft-page-header">
        <div>
          <div className="ft-page-title">🚨 긴급연락</div>
          <div className="ft-page-sub">아래 항목을 눌러 바로 전화를 걸 수 있습니다.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
        {CONTACTS.map((c) => (
          <a key={c.title} href={c.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: c.bg, color: 'white', padding: '36px',
              borderRadius: 'var(--radius)', textAlign: 'center', cursor: 'pointer',
              boxShadow: 'var(--shadow-md)', transition: 'transform 0.15s',
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: 44, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{c.title}</div>
              <p style={{ fontSize: 12.5, opacity: 0.85, margin: 0 }}>{c.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

export default Emergency