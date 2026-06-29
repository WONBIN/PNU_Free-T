import { useState } from 'react'
import { randomStudent } from '../data/students'

const BEHAVIOR_LABELS = ['상동행동', '자해행동', '공격성행동', '낙상 위험']
const DURATIONS = ['6초', '8초', '10초', '12초', '15초', '20초']

function buildLog(date, time) {
  const student = randomStudent()
  const behavior = BEHAVIOR_LABELS[Math.floor(Math.random() * BEHAVIOR_LABELS.length)]
  const duration = DURATIONS[Math.floor(Math.random() * DURATIONS.length)]
  return { date, time, student: student.name, class: student.class, behavior, duration }
}

function Report() {
  // useState 초기값으로 한 번만 생성 — 매 렌더마다 다시 무작위로 뽑히지 않도록 고정
  const [logs] = useState(() => [
    buildLog('6/24', '14:32'),
    buildLog('6/24', '13:55'),
    buildLog('6/23', '11:20'),
    buildLog('6/22', '10:05'),
    buildLog('6/22', '09:40'),
    buildLog('6/21', '15:10'),
  ])

  const weeklyStats = [
    { day: '월', count: 2 }, { day: '화', count: 4 }, { day: '수', count: 1 },
    { day: '목', count: 3 }, { day: '금', count: 5 },
  ]
  const max = Math.max(...weeklyStats.map(d => d.count))

  return (
    <div>
      <div className="ft-page-header">
        <div>
          <div className="ft-page-title">📋 이상행동 리포트</div>
          <div className="ft-page-sub">최근 감지 기록 및 주간 통계</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        <div className="ft-card">
          <div className="ft-card-header">
            <div className="ft-card-title"><span>🕒</span>최근 기록</div>
          </div>
          <div className="ft-card-body" style={{ paddingTop: 6 }}>
            {logs.map((l, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < logs.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.date} {l.time} · {l.class}</div>
                <div style={{ fontSize: 13 }}><b style={{ color: 'var(--text-primary)' }}>{l.student}</b> · {l.behavior} · {l.duration}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ft-card">
          <div className="ft-card-header">
            <div className="ft-card-title"><span>📊</span>주간 발생 통계</div>
          </div>
          <div className="ft-card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
              {weeklyStats.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: `${(d.count / max) * 120}px`,
                    background: 'linear-gradient(180deg, var(--blue-500), var(--blue-700))',
                    borderRadius: '6px 6px 0 0', marginBottom: 6,
                  }} />
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d.day}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.count}회</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Report
