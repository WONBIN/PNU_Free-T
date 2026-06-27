// 브라우저 푸시 알림(Web Notification API) 유틸 + 알림 설정 저장/조회

const SETTINGS_KEY = 'freet_notification_settings'

export const DEFAULT_SETTINGS = {
  pushEnabled: false,      // 브라우저 푸시 알림 on/off
  danger: true,            // 긴급(자해/위험) 알림
  warning: true,           // 경고(낙상 등) 알림
  normal: false,           // 정상/복귀 알림
  system: false,           // 시스템 알림
  sound: true,             // 알림음
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function getPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  const result = await Notification.requestPermission()
  return result
}

// level: 'danger' | 'warning' | 'normal' | 'system'
export function sendPushNotification(title, body, level = 'normal') {
  const settings = loadSettings()
  if (!settings.pushEnabled) return
  if (!settings[level]) return
  if (getPermissionStatus() !== 'granted') return

  try {
    const n = new Notification(title, {
      body,
      icon: undefined,
      tag: `freet-${Date.now()}`,
    })
    setTimeout(() => n.close(), 8000)
  } catch (e) {
    console.warn('알림 전송 실패', e)
  }

  if (settings.sound) {
    playAlertSound(level)
  }
}

let audioCtx
export function playAlertSound(level = 'normal') {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.connect(g)
    g.connect(audioCtx.destination)
    o.type = 'sine'
    o.frequency.value = level === 'danger' ? 880 : level === 'warning' ? 660 : 520
    g.gain.value = 0.06
    o.start()
    setTimeout(() => o.stop(), 180)
  } catch {
    // 오디오 컨텍스트 생성 불가 시 무시
  }
}
