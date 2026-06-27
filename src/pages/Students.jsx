function Students() {
  const students = [
    { name: '김민준', class: '1반', age: 9, guardian: '010-1234-5678', schedule: '월·수·금 9시~12시' },
    { name: '이서윤', class: '1반', age: 10, guardian: '010-2345-6789', schedule: '화·목 10시~13시' },
    { name: '박지호', class: '2반', age: 8, guardian: '010-3456-7890', schedule: '매일 9시~14시' },
    { name: '최하은', class: '3반', age: 11, guardian: '010-4567-8901', schedule: '월~금 9시~12시' },
  ]

  return (
    <div>
      <div className="ft-page-header">
        <div>
          <div className="ft-page-title">👤 학생 관리</div>
          <div className="ft-page-sub">전체 {students.length}명 모니터링 중</div>
        </div>
      </div>
      <div className="ft-card">
        <div className="ft-card-header">
          <div className="ft-card-title"><span>📋</span>학생 명단</div>
        </div>
        <div className="ft-card-body" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                {['이름', '반', '나이', '보호자 연락처', '시간표'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{s.class}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{s.age}세</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{s.guardian}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{s.schedule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Students