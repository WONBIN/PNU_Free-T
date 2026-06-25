function Students() {
  const students = [
    { name: '김민준', class: '1반', age: 9, guardian: '010-1234-5678', schedule: '월·수·금 9시~12시' },
    { name: '이서윤', class: '1반', age: 10, guardian: '010-2345-6789', schedule: '화·목 10시~13시' },
    { name: '박지호', class: '2반', age: 8, guardian: '010-3456-7890', schedule: '매일 9시~14시' },
    { name: '최하은', class: '3반', age: 11, guardian: '010-4567-8901', schedule: '월~금 9시~12시' },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>👤 학생 관리</h1>
      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
              {['이름', '반', '나이', '보호자 연락처', '시간표'].map(h => (
                <th key={h} style={{ padding: '12px', color: '#888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{s.name}</td>
                <td style={{ padding: '12px' }}>{s.class}</td>
                <td style={{ padding: '12px' }}>{s.age}세</td>
                <td style={{ padding: '12px' }}>{s.guardian}</td>
                <td style={{ padding: '12px' }}>{s.schedule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Students