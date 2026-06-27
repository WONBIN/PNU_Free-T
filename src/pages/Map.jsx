import { useEffect, useRef } from 'react'

// PNU 본교(부산대학교) 좌표 + 특수학교 건물(가상의 분리 위치) + 주변 응급시설 예시
const SCHOOL_LOCATION = { lat: 35.2326, lng: 129.0796, name: '특수학교 건물' }
const FACILITIES = [
  { lat: 35.2310, lng: 129.0820, name: '부산대학교병원 응급실', type: 'hospital' },
  { lat: 35.2335, lng: 129.0775, name: 'AED 설치 위치 (본관 1층)', type: 'aed' },
  { lat: 35.2318, lng: 129.0805, name: 'AED 설치 위치 (학생회관)', type: 'aed' },
]

function Map() {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error('카카오맵 SDK가 로드되지 않았습니다. index.html의 appkey를 확인하세요.')
      return
    }

    window.kakao.maps.load(() => {
      const container = mapRef.current
      const options = {
        center: new window.kakao.maps.LatLng(SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng),
        level: 4,
      }
      const map = new window.kakao.maps.Map(container, options)

      // 특수학교 건물 마커 (강조)
      const schoolMarker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng),
        map,
      })
      const schoolInfo = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:13px;">🏫 ${SCHOOL_LOCATION.name}</div>`,
      })
      schoolInfo.open(map, schoolMarker)

      // 주변 시설 마커
      FACILITIES.forEach((f) => {
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(f.lat, f.lng),
          map,
        })
        const icon = f.type === 'hospital' ? '🚑' : '🔴'
        window.kakao.maps.event.addListener(marker, 'click', () => {
          const info = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:13px;">${icon} ${f.name}</div>`,
          })
          info.open(map, marker)
        })
      })
    })
  }, [])

  return (
    <div>
      <div className="ft-page-header">
        <div>
          <div className="ft-page-title">📍 위치 및 응급시설 안내</div>
          <div className="ft-page-sub">학교 주변 응급실 및 AED 위치를 확인하세요</div>
        </div>
      </div>
      <div className="ft-card" style={{ padding: 14 }}>
        <div
          ref={mapRef}
          style={{ width: '100%', height: '500px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
        />
        <div style={{ marginTop: 14, display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span>🏫 특수학교 건물</span>
          <span>🚑 응급실</span>
          <span>🔴 AED 위치</span>
        </div>
      </div>
    </div>
  )
}

export default Map