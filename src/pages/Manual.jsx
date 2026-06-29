import { useEffect, useRef, useState } from 'react'
import { getActiveEmergency, clearActiveEmergency } from '../utils/emergencyAlert'

// 캠퍼스가 고지대/외곽에 위치해 119 도착까지 시간이 걸리는 점을 고려해
// "구급대 도착 전까지 현장에서 바로 할 수 있는 행동"을 단계별로 명시한다.
const MANUALS = [
  {
    id: 'selfharm',
    type: '자해성 행동',
    icon: '🤕',
    color: '#dc2626',
    bg: '#fef2f2',
    summary: '헤드뱅잉, 손목/팔 물기, 신체를 바닥·벽에 부딪히는 행동',
    steps: [
      '주변의 날카롭거나 단단한 물건(책상 모서리, 도구 등)을 즉시 치운다.',
      '강제로 제압하지 않고, 팔이나 손으로 머리·신체를 감싸 충격을 흡수한다.',
      '낮고 차분한 목소리로 이름을 부르며 자극(소음·조명)을 줄인다.',
      '5분 이상 지속되거나 출혈·외상이 보이면 보건실과 담임을 동시에 호출한다.',
      '의식 저하, 심한 출혈 등 위급 징후가 있으면 즉시 119에 신고한다.',
    ],
  },
  {
    id: 'aggression',
    type: '공격성 행동',
    icon: '⚠️',
    color: '#ea580c',
    bg: '#fff7ed',
    summary: '타인을 향한 밀치기, 물건 던지기, 손/발 휘두름',
    steps: [
      '주변 학생들을 즉시 안전한 거리(최소 1.5m 이상)로 대피시킨다.',
      '눈맞춤이나 신체 접촉을 강요하지 않고 차분한 거리를 유지한다.',
      '선택지를 주며("여기 앉을까, 저기 앉을까") 스스로 진정할 시간을 준다.',
      '진정되지 않거나 타인에게 위해가 우려되면 교무실/담임을 즉시 호출한다.',
      '타인이 부상당했거나 통제가 불가능한 경우 112/119에 신고한다.',
    ],
  },
  {
    id: 'stereotypy',
    type: '상동행동',
    icon: '🔄',
    color: '#d97706',
    bg: '#fffbeb',
    summary: '손 흔들기, 몸 흔들기 등 반복적인 행동 패턴',
    steps: [
      '대부분 자기조절 행동이므로 즉각 개입보다 우선 관찰한다.',
      '행동의 강도·빈도·지속시간을 기록한다 (리포트 페이지에 반영).',
      '주변에 위험 요소가 없는지만 확인하고 활동을 방해하지 않는다.',
      '강도가 점점 강해지거나 자해로 전환되면 자해성 행동 절차로 전환한다.',
    ],
  },
  {
    id: 'destructive',
    type: '파괴 및 돌발 행동',
    icon: '💥',
    color: '#7c3aed',
    bg: '#f5f3ff',
    summary: '기물 파손, 갑작스러운 이탈, 예측 불가한 돌발 행동',
    steps: [
      '주변의 깨지기 쉬운 물건, 가구 등 위험 요소를 먼저 치운다.',
      '출입구를 막지 않는 선에서 안전한 공간으로 유도한다.',
      '돌발 이탈 시 단독으로 쫓지 말고 인근 교사에게 즉시 공유한다.',
      '상황 종료 후 경위를 기록하고 필요 시 보건실에 인계한다.',
    ],
  },
  {
    id: 'fall',
    type: '낙상 · 실신',
    icon: '🚑',
    color: '#0d9488',
    bg: '#f0fdfa',
    summary: '쓰러짐, 의식 소실, 호흡 이상 — 골든타임이 가장 중요한 상황',
    steps: [
      '학생을 함부로 흔들거나 옮기지 말고, 먼저 의식과 호흡을 확인한다.',
      '의식이 없고 호흡이 비정상이면 즉시 119에 신고하고 심장 마사지(CPR)를 준비한다.',
      '의식이 있으면 무리하게 일으키지 말고 편안한 자세로 눕히고 보온한다.',
      '119 도착 전까지 상태 변화(의식, 호흡, 안색)를 계속 관찰하고 기록한다.',
      '가능하면 가까운 AED 위치(아래 응급시설 안내 참고)를 동료 교사에게 미리 알린다.',
    ],
  },
]

const QUICK_CONTACTS = [
  { href: 'tel:119', label: '119 신고', icon: '🚑', cls: 'ft-em-btn-119' },
  { href: 'tel:051-000-0000', label: '보건실', icon: '🏥', cls: 'ft-em-btn-blue' },
  { href: 'tel:010-0000-0000', label: '담임 교사', icon: '👩‍🏫', cls: 'ft-em-btn-green' },
]

const NEARBY_FACILITIES = [
  { icon: '🚑', name: '부산대학교병원 응급실', distance: '도보 약 6분 · 차량 약 2분', note: '중증 외상·의식소실 시 1순위' },
  { icon: '🟥', name: 'AED 설치 위치 (본관 1층)', distance: '도보 약 1분', note: '심정지 의심 시 즉시 사용' },
  { icon: '🟥', name: 'AED 설치 위치 (학생회관)', distance: '도보 약 2분', note: '예술관·실기실 인근' },
]

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

function timerColor(seconds) {
  if (seconds >= 300) return { fg: '#dc2626', bg: '#fef2f2', label: '119 도착 지연 — 즉시 재확인 필요' }
  if (seconds >= 120) return { fg: '#d97706', bg: '#fffbeb', label: '경과 시간 확인 중' }
  return { fg: '#16a34a', bg: '#f0fdf4', label: '정상 대응 진행 중' }
}

function GoldenTimer() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [autoInfo, setAutoInfo] = useState(null) // 대시보드 AI/시뮬레이션이 감지한 "긴급" 알림으로 자동 시작된 경우 그 정보
  const intervalRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  // 실제 구급 상황 중에는 "타이머 시작" 버튼을 챙겨서 누르고 있을 여유가 없다는 피드백을 반영해,
  // 대시보드에서 이미 "긴급" 등급 알림(AI 실시간 감지 또는 시뮬레이션)이 발생해 있다면
  // 그 발생 시각을 기준으로 자동으로 타이머를 시작한다. 버튼은 AI가 놓친 상황을 위한 수동 보조 수단으로 남긴다.
  useEffect(() => {
    const checkAutoStart = () => {
      setRunning((isRunning) => {
        if (isRunning) return isRunning
        const active = getActiveEmergency()
        if (!active) return isRunning
        const elapsed = Math.floor((Date.now() - active.startedAt) / 1000)
        setSeconds(elapsed)
        setAutoInfo(active)
        setLastResult(null)
        return true
      })
    }
    checkAutoStart()
    pollRef.current = setInterval(checkAutoStart, 2000)
    return () => clearInterval(pollRef.current)
  }, [])

  const start = () => {
    setSeconds(0)
    setLastResult(null)
    setAutoInfo(null)
    setRunning(true)
  }
  const stop = () => {
    setRunning(false)
    setLastResult(formatTime(seconds))
    setAutoInfo(null)
    clearActiveEmergency()
  }

  const tc = timerColor(seconds)

  return (
    <div className="ft-card" style={{ marginBottom: 18, borderColor: running ? tc.fg : undefined }}>
      <div className="ft-card-header">
        <div className="ft-card-title"><span>⏱️</span>골든타임 타이머</div>
        {running && (
          <span className="ft-live-pill" style={{ background: `${tc.fg}1a`, color: tc.fg }}>
            {autoInfo ? '🤖 AI 감지로 자동 시작' : '대응 중'}
          </span>
        )}
      </div>
      <div className="ft-card-body" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{
          fontSize: 38, fontWeight: 800, color: running ? tc.fg : 'var(--text-primary)',
          fontFamily: 'ui-monospace, Consolas, monospace', minWidth: 110,
        }}>
          {formatTime(seconds)}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 12.5, color: running ? tc.fg : 'var(--text-muted)', fontWeight: 600 }}>
            {running ? tc.label : (lastResult ? `마지막 대응 시간: ${lastResult}` : '상황 발생 시 자동으로 시작되거나, 직접 시작할 수 있습니다')}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-light)', marginTop: 3 }}>
            {autoInfo
              ? `🤖 대시보드에서 감지된 긴급 알림(${autoInfo.student} · ${autoInfo.behavior}, ${autoInfo.time} 발생)을 기준으로 자동 시작되었습니다.`
              : '본교는 119 도착까지 시간이 걸릴 수 있는 위치에 있습니다. AI가 놓친 상황이라면 직접 시작하고, 경과 시간을 확인하며 아래 절차를 진행하세요.'}
          </div>
        </div>
        {!running ? (
          <button className="ft-btn ft-btn-danger" onClick={start}>🚨 상황 발생 — 직접 시작</button>
        ) : (
          <button className="ft-btn ft-btn-outline" onClick={stop}>⏹ 종료 / 기록</button>
        )}
      </div>
    </div>
  )
}

function ManualCard({ m, expanded, onToggle }) {
  const [checked, setChecked] = useState(() => m.steps.map(() => false))
  const doneCount = checked.filter(Boolean).length

  const toggleStep = (i) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  return (
    <div className="ft-card">
      <div
        className="ft-card-header"
        style={{ cursor: 'pointer', background: m.bg }}
        onClick={onToggle}
      >
        <div className="ft-card-title">
          <span style={{ fontSize: 18 }}>{m.icon}</span>
          <span style={{ color: m.color }}>{m.type}</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{expanded ? '접기 ▲' : '펼치기 ▼'}</span>
      </div>
      <div className="ft-card-body" style={{ paddingTop: 14 }}>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{m.summary}</p>

        {expanded && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>단계별 대응 체크리스트</span>
              <span style={{ fontSize: 11, color: m.color, fontWeight: 700 }}>{doneCount}/{m.steps.length} 완료</span>
            </div>
            {m.steps.map((step, i) => (
              <label key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 4px',
                borderBottom: i < m.steps.length - 1 ? '1px solid var(--border-light)' : 'none',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => toggleStep(i)}
                  style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, accentColor: m.color }}
                />
                <span style={{
                  fontSize: 12.5, lineHeight: 1.6,
                  color: checked[i] ? 'var(--text-light)' : 'var(--text-primary)',
                  textDecoration: checked[i] ? 'line-through' : 'none',
                }}>
                  <b style={{ color: checked[i] ? 'inherit' : m.color }}>{i + 1}.</b> {step}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Manual() {
  const [expandedId, setExpandedId] = useState('fall')

  return (
    <div>
      <div className="ft-page-header">
        <div>
          <div className="ft-page-title">📖 통합 대응 매뉴얼</div>
          <div className="ft-page-sub">119 도착 전까지 현장에서 바로 실행하는 단계별 대응 절차</div>
        </div>
      </div>

      <GoldenTimer />

      <div className="ft-grid-main">
        <div className="ft-card">
          <div className="ft-card-header">
            <div className="ft-card-title"><span>📞</span>빠른 연락</div>
          </div>
          <div className="ft-card-body">
            <div className="ft-emergency-grid">
              {QUICK_CONTACTS.map((c) => (
                <a key={c.label} href={c.href} className={`ft-em-btn ${c.cls}`}>{c.icon} {c.label}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="ft-card">
          <div className="ft-card-header">
            <div className="ft-card-title"><span>📍</span>인근 응급시설</div>
          </div>
          <div className="ft-card-body" style={{ paddingTop: 8 }}>
            {NEARBY_FACILITIES.map((f, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0',
                borderBottom: i < NEARBY_FACILITIES.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <span style={{ fontSize: 14 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{f.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{f.distance} · {f.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', margin: '4px 2px 10px' }}>
        행동 유형별 단계별 절차 (카드를 눌러 펼치고, 진행한 단계를 체크하세요)
      </div>
      <div className="ft-grid-half" style={{ gap: 16 }}>
        {MANUALS.map((m) => (
          <ManualCard
            key={m.id}
            m={m}
            expanded={expandedId === m.id}
            onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default Manual
