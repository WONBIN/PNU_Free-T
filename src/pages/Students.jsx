import { useMemo, useState } from 'react'
import { STUDENTS, CLASSES } from '../data/students'
import Avatar from '../components/Avatar'

function Students() {
  const [classFilter, setClassFilter] = useState('전체')

  const filtered = useMemo(
    () => (classFilter === '전체' ? STUDENTS : STUDENTS.filter((s) => s.class === classFilter)),
    [classFilter]
  )

  return (
    <div>
      <div className="ft-page-header">
        <div>
          <div className="ft-page-title">👤 학생 관리</div>
          <div className="ft-page-sub">전체 {STUDENTS.length}명 모니터링 중</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['전체', ...CLASSES].map((c) => (
          <button
            key={c}
            onClick={() => setClassFilter(c)}
            className={`ft-btn ${classFilter === c ? 'ft-btn-primary' : 'ft-btn-outline'}`}
          >
            {c}
            {c !== '전체' && (
              <span style={{ marginLeft: 5, opacity: 0.75 }}>
                {STUDENTS.filter((s) => s.class === c).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="ft-card">
        <div className="ft-card-header">
          <div className="ft-card-title"><span>📋</span>학생 명단</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length}명 표시 중</span>
        </div>
        <div className="ft-card-body" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                {['학번', '이름', '반', '나이', '장애유형', '보호자 연락처', '시간표'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 12 }}>{s.id}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={s.name} size={26} />
                      {s.name}
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{s.class}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{s.age}세</td>
                  <td style={{ padding: '12px' }}>
                    <span className="ft-badge" style={{ background: 'var(--blue-100, #dbeafe)', color: 'var(--blue-700)' }}>
                      {s.disabilityType}
                    </span>
                  </td>
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
