import { useEffect, useRef, useState } from 'react'
import { sendPushNotification } from '../utils/notify'
import { setActiveEmergency } from '../utils/emergencyAlert'
import { STUDENTS, randomStudent } from '../data/students'
import {
  loadBehaviorModel, getDetector, extractLandmarks, classifyWindow,
  LandmarkWindowBuffer, BehaviorStateTracker, labelToAlert,
  SAMPLE_INTERVAL_MS, MODEL_DISCLOSURE,
} from '../utils/behaviorAI'

// 행동 유형 풀 — 실제 학생(STUDENTS)을 무작위로 골라 조합해 알림을 만든다.
// (예전에는 학생 4명의 이름이 항상 똑같이 반복돼서 데모가 비현실적으로 보였음)
const BEHAVIOR_POOL = [
  { behavior: '상동행동(손 흔들기) 감지', level: 'warning', tag: '경고' },
  { behavior: '상동행동(스피닝) 감지', level: 'warning', tag: '경고' },
  { behavior: '반복 행동 패턴 감지', level: 'warning', tag: '경고' },
  { behavior: '자해행동(헤드뱅잉) 감지', level: 'danger', tag: '긴급' },
  { behavior: '낙상 위험 감지', level: 'danger', tag: '긴급' },
  { behavior: '공격성행동 감지', level: 'danger', tag: '긴급' },
  { behavior: '정상 활동 중', level: 'normal', tag: '정상' },
  { behavior: '정상 활동 복귀', level: 'normal', tag: '정상' },
]

function buildAlert(time) {
  const template = BEHAVIOR_POOL[Math.floor(Math.random() * BEHAVIOR_POOL.length)]
  const student = randomStudent()
  return { time, class: student.class, student: student.name, ...template }
}

// 페이지가 로드될 때 한 번만 생성되는 "이전 기록" — 실제 학생 명단에서 무작위로 구성
const INITIAL_ALERTS = ['14:32', '14:18', '13:55', '13:40'].map((t) => buildAlert(t))

const CCTV_CHANNELS = [
  { id: 'CAM-02', loc: '2반 교실', bg: 'linear-gradient(135deg,#0a1628,#0d2040,#071018)', state: 'normal' },
  { id: 'CAM-03', loc: '복도 B구역', bg: 'linear-gradient(135deg,#14100a,#201808,#0e0c06)', state: 'warn', label: '⚠ 낙상 위험 감지' },
  { id: 'CAM-04', loc: '예술 실기실', bg: 'linear-gradient(135deg,#0a1410,#0d2018,#060e0a)', state: 'normal' },
]

function levelColor(level) {
  if (level === 'danger') return 'var(--red-600)'
  if (level === 'warning') return 'var(--orange-500)'
  return 'var(--green-600)'
}

function Dashboard() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [alerts, setAlerts] = useState(INITIAL_ALERTS)
  const [snapshots, setSnapshots] = useState([])
  const [camReady, setCamReady] = useState(false)
  const [toast, setToast] = useState(null)
  const [aiStatus, setAiStatus] = useState('idle') // idle | loading | ready | error
  const [aiLive, setAiLive] = useState(null) // { label, confidence, motion }

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setCamReady(true)
        }
      })
      .catch(() => setCamReady(false))
  }, [])

  // CAM-01(실제 웹캠)에 대한 실시간 AI 행동 감지: MoveNet 포즈 추출 -> 20프레임 윈도우
  // -> 37차원 특징(속도/반복성/주기성) -> 경량 분류기(TFJS) 추론 -> 상태 안정화 후 알림 발생
  useEffect(() => {
    if (!camReady) return
    let cancelled = false
    let intervalId = null
    const buffer = new LandmarkWindowBuffer()
    const tracker = new BehaviorStateTracker()

    setAiStatus('loading')

    Promise.all([loadBehaviorModel(), getDetector()])
      .then(([{ model, meta }, detector]) => {
        if (cancelled) return
        setAiStatus('ready')

        intervalId = setInterval(async () => {
          const video = videoRef.current
          if (!video || video.readyState < 2) return
          try {
            const poses = await detector.estimatePoses(video)
            const vw = video.videoWidth
            const vh = video.videoHeight
            const kps = poses.length > 0 ? poses[0].keypoints : []
            buffer.push(extractLandmarks(kps, vw, vh))

            if (!buffer.isFull()) return
            const result = await classifyWindow(model, meta, buffer.toArray())
            setAiLive(result)

            const fired = tracker.update(result.label)
            if (fired) {
              const info = labelToAlert(fired)
              const now = new Date()
              const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
              const newAlert = {
                time, class: '1반', student: '실시간 웹캠(CAM-01)',
                behavior: info.behavior, level: info.level, tag: info.tag,
              }
              setAlerts((prev) => [newAlert, ...prev].slice(0, 12))
              sendPushNotification(
                `${newAlert.tag} — AI 실시간 감지`,
                `CAM-01 · ${info.behavior}`,
                newAlert.level
              )
              // 실제 웹캠 AI가 "긴급" 등급을 감지하면, 매뉴얼 페이지의 골든타임 타이머가
              // 수동 클릭 없이도 이 시점부터 자동으로 시작되도록 신호를 남긴다.
              if (newAlert.level === 'danger') {
                setActiveEmergency({
                  student: newAlert.student, class: newAlert.class,
                  behavior: newAlert.behavior, time: newAlert.time,
                })
              }
            }
          } catch (e) {
            console.warn('AI 추론 오류', e)
          }
        }, SAMPLE_INTERVAL_MS)
      })
      .catch((e) => {
        console.warn('AI 모델 로딩 실패', e)
        if (!cancelled) setAiStatus('error')
      })

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [camReady])

  // 임시 데이터로 "실시간" 느낌을 시뮬레이션 (실제 AI 모델 연동 전까지) — 전체 학생 명단에서 무작위로 선택
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const newAlert = buildAlert(time)
      setAlerts((prev) => [newAlert, ...prev].slice(0, 12))
      sendPushNotification(
        `${newAlert.tag} — ${newAlert.student}`,
        `${newAlert.class} · ${newAlert.behavior}`,
        newAlert.level
      )
      // 시뮬레이션이라도 "긴급" 등급이면 매뉴얼 페이지 타이머 자동 시작 신호를 동일하게 남긴다.
      if (newAlert.level === 'danger') {
        setActiveEmergency({
          student: newAlert.student, class: newAlert.class,
          behavior: newAlert.behavior, time: newAlert.time,
        })
      }
    }, 25000)
    return () => clearInterval(id)
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  const captureSnapshot = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !camReady) {
      showToast('웹캠이 연결되어 있지 않아 캡처할 수 없습니다.')
      return
    }
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 360
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const now = new Date()
    const stamp = now.toLocaleString('ko-KR', { hour12: false })
    setSnapshots((prev) => [{ url: dataUrl, time: stamp }, ...prev].slice(0, 8))
    showToast('📸 스냅샷이 캡처되었습니다.')
  }

  const downloadSnapshot = (url, time) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `freet_snapshot_${time.replace(/[^0-9]/g, '')}.jpg`
    a.click()
  }

  const dangerCount = alerts.filter(a => a.level === 'danger').length

  return (
    <div>
      <div className="ft-page-header">
        <div>
          <div className="ft-page-title">📊 실시간 모니터링 대시보드</div>
          <div className="ft-page-sub">AI 기반 행동 감지 및 긴급 대응 시스템</div>
        </div>
        <span className="ft-live-pill">LIVE</span>
      </div>

      <div className="ft-stat-row">
        <div className="ft-stat-card blue">
          <div className="ft-stat-icon">👥</div>
          <div className="ft-stat-value">{STUDENTS.length}</div>
          <div className="ft-stat-label">모니터링 중인 학생</div>
        </div>
        <div className="ft-stat-card red">
          <div className="ft-stat-icon">⚠️</div>
          <div className="ft-stat-value">{dangerCount}</div>
          <div className="ft-stat-label">오늘 긴급 알림</div>
        </div>
        <div className="ft-stat-card green">
          <div className="ft-stat-icon">📹</div>
          <div className="ft-stat-value">{CCTV_CHANNELS.length + 1}</div>
          <div className="ft-stat-label">활성 CCTV 채널</div>
        </div>
        <div className="ft-stat-card orange">
          <div className="ft-stat-icon">⏱️</div>
          <div className="ft-stat-value">2.4분</div>
          <div className="ft-stat-label">평균 대응 시간</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* 실시간 CCTV */}
        <div className="ft-card">
          <div className="ft-card-header">
            <div className="ft-card-title"><span>🎥</span>실시간 CCTV 모니터링</div>
            <span className="ft-live-pill">LIVE</span>
          </div>
          <div className="ft-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 10 }}>
              {/* 실제 웹캠 — CAM-01 */}
              <div className="ft-cctv-card" style={{ gridRow: 'span 1' }}>
                <video ref={videoRef} autoPlay muted playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                <div className="ft-cctv-scan" />
                <div className="ft-cctv-overlay">
                  <div className="ft-cctv-top">
                    <div className="ft-rec-badge">REC</div>
                    <div className="ft-cam-no">CAM-01</div>
                  </div>
                  <div className="ft-cctv-loc">1반 교실 (실제 웹캠)</div>
                </div>
              </div>

              {CCTV_CHANNELS.map((c) => (
                <div key={c.id} className={`ft-cctv-card ${c.state === 'warn' ? 'warn' : ''}`}>
                  <div className="ft-cctv-bg" style={{ background: c.bg }} />
                  <div className="ft-cctv-scan" style={{ animationDelay: '1s' }} />
                  <div className="ft-cctv-overlay">
                    <div className="ft-cctv-top">
                      <div className="ft-rec-badge">REC</div>
                      <div className="ft-cam-no">{c.id}</div>
                    </div>
                    {c.label && <div className="ft-cctv-alert-label orange">{c.label}</div>}
                    <div className="ft-cctv-loc">{c.loc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="ft-btn ft-btn-primary" onClick={captureSnapshot}>📸 스냅샷 캡처</button>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
                {camReady ? 'CAM-01 웹캠 연결됨' : '웹캠 연결 안 됨 — 권한을 확인하세요'}
              </span>
              {camReady && (
                <span style={{
                  fontSize: 11, fontWeight: 700, alignSelf: 'center', padding: '3px 8px', borderRadius: 6,
                  background: aiStatus === 'ready' ? 'var(--green-600)22' : aiStatus === 'error' ? 'var(--red-600)22' : 'var(--orange-500)22',
                  color: aiStatus === 'ready' ? 'var(--green-600)' : aiStatus === 'error' ? 'var(--red-600)' : 'var(--orange-500)',
                }}>
                  {aiStatus === 'loading' && '🤖 AI 모델 로딩 중…'}
                  {aiStatus === 'ready' && '🤖 AI 실시간 분석 중'}
                  {aiStatus === 'error' && '🤖 AI 모델 로드 실패'}
                </span>
              )}
            </div>

            {camReady && aiStatus === 'ready' && (
              <div style={{
                marginTop: 8, fontSize: 11, color: 'var(--text-muted)', display: 'flex',
                gap: 10, flexWrap: 'wrap', alignItems: 'center',
              }}>
                <span>
                  현재 판단: <b style={{ color: 'var(--text-primary)' }}>
                    {aiLive ? (aiLive.label === 'NORMAL' ? '정상' : aiLive.label) : '윈도우 수집 중…'}
                  </b>
                  {aiLive && ` (확신도 ${(aiLive.confidence * 100).toFixed(0)}%)`}
                </span>
                <span style={{ color: 'var(--text-light)' }}>
                  ※ SSBD 데이터셋 기반 경량 프로토타입 — 5-fold 교차검증 정확도 약 {Math.round(MODEL_DISCLOSURE.cvMeanAcc * 100)}%
                  (우연 정확도 {Math.round(MODEL_DISCLOSURE.chanceAcc * 100)}%), 보조 참고용으로만 사용하세요.
                </span>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {snapshots.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                  📁 캡처된 상황 스냅샷 ({snapshots.length})
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                  {snapshots.map((s, i) => (
                    <div key={i} style={{ flexShrink: 0, width: 110 }}>
                      <img
                        src={s.url}
                        alt="snapshot"
                        onClick={() => downloadSnapshot(s.url, s.time)}
                        style={{ width: 110, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
                        title="클릭하여 다운로드"
                      />
                      <div style={{ fontSize: 9, color: 'var(--text-light)', marginTop: 3 }}>{s.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 실시간 알림 피드 */}
        <div className="ft-card">
          <div className="ft-card-header">
            <div className="ft-card-title"><span>🔔</span>실시간 알림 피드</div>
            <span className="ft-live-pill">실시간</span>
          </div>
          <div className="ft-card-body">
            <div className="ft-alert-feed">
              {alerts.map((a, i) => (
                <div key={i} className={`ft-alert-item ${a.level}`}>
                  <div className="ft-alert-dot" />
                  <div className="ft-alert-content">
                    <div className="ft-alert-msg">{a.student} — {a.behavior}</div>
                    <div className="ft-alert-meta">
                      <span className="ft-alert-time">{a.time}</span>
                      <span className="ft-badge" style={{ background: `${levelColor(a.level)}22`, color: levelColor(a.level) }}>{a.tag}</span>
                      <span>{a.class}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 긴급 대응 퀵패널 */}
      <div className="ft-emergency-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--red-700)', fontSize: 15 }}>긴급 대응 센터</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>위험 상황 발생 시 즉시 연락하세요</div>
          </div>
        </div>
        <div className="ft-emergency-grid">
          <a href="tel:119" className="ft-em-btn ft-em-btn-119">🚑 119 긴급 신고</a>
          <a href="tel:051-000-0000" className="ft-em-btn ft-em-btn-blue">
            🏥 <div className="ft-em-btn-detail"><span>보건실 연락</span><small>내선 201</small></div>
          </a>
          <a href="tel:010-0000-0000" className="ft-em-btn ft-em-btn-green">
            👩‍🏫 <div className="ft-em-btn-detail"><span>담임 교사</span><small>내선 305</small></div>
          </a>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: 'var(--bg-white)',
          border: '1px solid var(--border)', borderLeft: '4px solid var(--blue-500)',
          borderRadius: 10, padding: '12px 18px', boxShadow: 'var(--shadow-md)', fontSize: 12.5, zIndex: 3000,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

export default Dashboard
