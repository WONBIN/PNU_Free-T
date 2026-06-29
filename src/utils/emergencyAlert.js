// 대시보드에서 발생한 "긴급(danger)" 등급 AI/시뮬레이션 알림을, 매뉴얼 페이지의
// 골든타임 타이머와 연결하기 위한 공유 저장소(localStorage 기반).
//
// 왜 필요한가:
//  실제 응급 상황에서는 교사가 "타이머 시작" 버튼을 챙겨서 누르고 있을 여유가 없다.
//  이미 AI(또는 시뮬레이션)가 위험을 감지해 대시보드에 "긴급" 알림을 띄운 시점이 있다면,
//  매뉴얼 페이지를 열었을 때 그 알림이 발생한 시각부터 자동으로 경과 시간을 계산해
//  타이머를 시작해 준다. 수동 시작 버튼은 AI가 놓친 상황(직접 목격 등)을 위한 보조 수단으로 남긴다.

const KEY = 'freet_active_emergency'
const AUTO_EXPIRE_MS = 30 * 60 * 1000 // 30분 — 너무 오래된 알림은 "지금 진행 중인 상황"으로 보기 어려움

export function setActiveEmergency({ student, class: cls, behavior, time }) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ student, class: cls, behavior, time, startedAt: Date.now() })
    )
  } catch {
    // localStorage 사용 불가(예: 프라이버시 모드) 시에는 자동 시작 기능만 비활성화됨
  }
}

export function getActiveEmergency() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.startedAt || Date.now() - data.startedAt > AUTO_EXPIRE_MS) {
      clearActiveEmergency()
      return null
    }
    return data
  } catch {
    return null
  }
}

export function clearActiveEmergency() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 무시
  }
}
