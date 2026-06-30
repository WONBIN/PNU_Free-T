import { useEffect, useState } from 'react'
import {
  loadSettings, saveSettings, getPermissionStatus,
  requestNotificationPermission, sendPushNotification,
} from '../utils/notify'

function Toggle({ checked, onChange }) {
  return (
    <label className="ft-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="ft-toggle-track"></span>
    </label>
  )
}

function Notifications() {
  const [settings, setSettings] = useState(loadSettings())
  const [permission, setPermission] = useState(getPermissionStatus())

  useEffect(() => { saveSettings(settings) }, [settings])

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }))

  const handlePushToggle = async (checked) => {
    if (checked) {
      const result = await requestNotificationPermission()
      setPermission(result)
      if (result !== 'granted') {
        update('pushEnabled', false)
        return
      }
    }
    update('pushEnabled', checked)
  }

  const sendTest = () => {
    if (permission !== 'granted') {
      alert('먼저 브라우저 푸시 알림을 켜고 권한을 허용해주세요.')
      return
    }
    if (!settings.pushEnabled) {
      alert('푸시 알림 사용 스위치를 먼저 켜주세요.')
      return
    }
    if (!settings.danger) {
      alert('테스트는 "긴급 알림" 항목을 켜야 받을 수 있어요. 켠 뒤 다시 시도해주세요.')
      return
    }
    sendPushNotification('🔔 FREE-T 테스트 알림', '알림이 정상적으로 동작하고 있습니다.', 'danger')
  }

  const permissionLabel = {
    granted: { text: '허용됨', color: 'green' },
    denied: { text: '차단됨 (브라우저 설정에서 해제 필요)', color: 'red' },
    default: { text: '아직 요청 안 함', color: 'orange' },
    unsupported: { text: '이 브라우저는 지원하지 않음', color: 'red' },
  }[permission] || { text: permission, color: 'blue' }

  return (
    <div>
      <div className="ft-page-header">
        <div>
          <div className="ft-page-title">🔔 알림 설정</div>
          <div className="ft-page-sub">긴급 상황 발생 시 어떤 알림을 받을지 설정합니다.</div>
        </div>
      </div>

      <div className="ft-grid-main" style={{ gap: 20 }}>
        <div className="ft-card">
          <div className="ft-card-header">
            <div className="ft-card-title"><span>🔔</span>알림 종류</div>
          </div>
          <div className="ft-card-body" style={{ paddingTop: 4, paddingBottom: 4 }}>
            <div className="ft-setting-row">
              <div>
                <div className="ft-setting-label">🔴 긴급 알림 (자해·위험 행동)</div>
                <div className="ft-setting-desc">즉시 대응이 필요한 위험 상황 감지 시</div>
              </div>
              <Toggle checked={settings.danger} onChange={(v) => update('danger', v)} />
            </div>
            <div className="ft-setting-row">
              <div>
                <div className="ft-setting-label">🟡 경고 알림 (낙상·반복 행동)</div>
                <div className="ft-setting-desc">주의가 필요한 행동 패턴 감지 시</div>
              </div>
              <Toggle checked={settings.warning} onChange={(v) => update('warning', v)} />
            </div>
            <div className="ft-setting-row">
              <div>
                <div className="ft-setting-label">🟢 정상 알림 (상황 종료·복귀)</div>
                <div className="ft-setting-desc">학생이 정상 상태로 돌아왔을 때</div>
              </div>
              <Toggle checked={settings.normal} onChange={(v) => update('normal', v)} />
            </div>
            <div className="ft-setting-row">
              <div>
                <div className="ft-setting-label">⚙️ 시스템 알림</div>
                <div className="ft-setting-desc">AI 모델 업데이트, 장비 점검 등</div>
              </div>
              <Toggle checked={settings.system} onChange={(v) => update('system', v)} />
            </div>
            <div className="ft-setting-row">
              <div>
                <div className="ft-setting-label">🔊 알림음</div>
                <div className="ft-setting-desc">알림 발생 시 소리로도 알려줍니다</div>
              </div>
              <Toggle checked={settings.sound} onChange={(v) => update('sound', v)} />
            </div>
          </div>
        </div>

        <div className="ft-card">
          <div className="ft-card-header">
            <div className="ft-card-title"><span>📱</span>브라우저 푸시 알림</div>
          </div>
          <div className="ft-card-body">
            <div className="ft-setting-row" style={{ paddingTop: 0 }}>
              <div>
                <div className="ft-setting-label">푸시 알림 사용</div>
                <div className="ft-setting-desc">창이 백그라운드에 있어도 알림을 받습니다</div>
              </div>
              <Toggle checked={settings.pushEnabled} onChange={handlePushToggle} />
            </div>

            <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: 'var(--bg-card2)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>브라우저 알림 권한 상태</div>
              <span className={`ft-badge ${permissionLabel.color}`}>{permissionLabel.text}</span>
            </div>

            <button
              className="ft-btn ft-btn-primary"
              style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
              onClick={sendTest}
            >
              🔔 테스트 알림 보내기
            </button>

            <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 12, lineHeight: 1.6 }}>
              * 브라우저 알림이 차단된 경우, 주소창 왼쪽 자물쇠 아이콘 → 사이트 설정에서 알림 권한을 다시 허용해야 합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
