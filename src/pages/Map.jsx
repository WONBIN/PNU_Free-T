import { useEffect, useRef, useState } from 'react'

// PNU 본교(부산대학교) 좌표 + 특수학교 건물(가상의 분리 위치)
const SCHOOL_LOCATION = { lat: 35.2326, lng: 129.0796, name: '특수학교 건물' }
const SCHOOL_STAGE1 = '부산광역시'

// 공공데이터포털 응급의료기관 API에서 받기 전까지/실패 시 보여줄 대체 데이터
const FALLBACK_HOSPITAL = { lat: 35.2310, lng: 129.0820, name: '부산대학교병원 응급실', type: 'hospital' }

// AED는 아직 실시간 공공데이터 연동 전이라 예시 위치임을 명확히 표기
const AED_EXAMPLES = [
  { lat: 35.2335, lng: 129.0775, name: 'AED 설치 위치 (본관 1층)', type: 'aed' },
  { lat: 35.2318, lng: 129.0805, name: 'AED 설치 위치 (학생회관)', type: 'aed' },
]

const MAX_HOSPITAL_MARKERS = 6

// 보건복지부 지정 발달장애인 거점병원·행동발달증진센터 (부산권, 2021년 지정 — 온종합병원)
// 자해·공격성 등 행동문제는 일반 응급실보다 이곳에서의 전문 대응이 더 적합할 수 있어,
// 공공데이터포털 응급의료기관 목록에 포함되어 있으면 별도 표시한다.
// (data.go.kr hpid 기준으로 매칭 — 행정상 병원명은 "온병원"으로도 표기됨)
const DEV_DISABILITY_HUB_ID = 'A1200020'
function isDevDisabilityHub(f) {
  return f.id === DEV_DISABILITY_HUB_ID || (f.name && (f.name.includes('온종합') || f.name.includes('온그룹의료재단')))
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// 학교 → 응급실 길찾기를 카카오맵(웹/앱)으로 바로 열어주는 링크
function kakaoDirectionsUrl(f) {
  const from = encodeURIComponent(SCHOOL_LOCATION.name)
  const to = encodeURIComponent(f.name)
  return `https://map.kakao.com/link/from/${from},${SCHOOL_LOCATION.lat},${SCHOOL_LOCATION.lng}/to/${to},${f.lat},${f.lng}`
}

function Map() {
  const mapRef = useRef(null)
  const mapObjRef = useRef(null)
  const hospitalMarkersRef = useRef([]) // [{ id, marker, info }]

  const [mapReady, setMapReady] = useState(false)
  const [status, setStatus] = useState('loading') // loading | live | error
  const [hospitals, setHospitals] = useState([])

  // 1) 카카오맵 SDK 초기화 — 학교/AED(예시) 마커는 여기서 한 번만 그림
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
      mapObjRef.current = map

      // 특수학교 건물 마커 (강조)
      const schoolMarker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng),
        map,
      })
      const schoolInfo = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:13px;">🏫 ${SCHOOL_LOCATION.name}</div>`,
      })
      schoolInfo.open(map, schoolMarker)

      // AED는 아직 예시 데이터 — info window에 "(예시)" 명시해 실데이터처럼 보이지 않게 함
      AED_EXAMPLES.forEach((f) => {
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(f.lat, f.lng),
          map,
        })
        window.kakao.maps.event.addListener(marker, 'click', () => {
          const info = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:13px;">🔴 ${f.name} <span style="color:#999;">(예시 위치)</span></div>`,
          })
          info.open(map, marker)
        })
      })

      setMapReady(true)
    })
  }, [])

  // 2) 공공데이터포털 응급의료기관 정보 가져오기 (지도 SDK와 독립적으로 동작)
  useEffect(() => {
    // 자치구(stage2)로 좁히면 그 구에 등록된 응급의료기관이 0건일 수 있어(예: 금정구)
    // 시/도 단위로만 넓게 요청하고, 가까운 곳은 클라이언트에서 거리 계산으로 추려낸다.
    const params = new URLSearchParams({ stage1: SCHOOL_STAGE1 })
    fetch(`/api/emergency-facilities?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (!data.facilities || data.facilities.length === 0) throw new Error('empty')
        const withDistance = data.facilities
          .map((f) => ({ ...f, distanceKm: haversineKm(SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng, f.lat, f.lng) }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, MAX_HOSPITAL_MARKERS)
        setHospitals(withDistance)
        setStatus('live')
      })
      .catch((e) => {
        console.warn('응급의료기관 정보 로드 실패, 예시 데이터로 대체', e)
        setHospitals([{ ...FALLBACK_HOSPITAL, distanceKm: null }])
        setStatus('error')
      })
  }, [])

  // 3) 지도와 병원 데이터가 모두 준비되면 마커 그리기 (데이터 갱신 시 기존 마커 정리 후 재생성)
  useEffect(() => {
    if (!mapReady || hospitals.length === 0) return
    const map = mapObjRef.current
    if (!map) return

    hospitalMarkersRef.current.forEach(({ marker }) => marker.setMap(null))
    hospitalMarkersRef.current = []

    hospitals.forEach((f, idx) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(f.lat, f.lng),
        map,
      })

      const distanceText = f.distanceKm != null ? ` · ${f.distanceKm.toFixed(1)}km` : ''
      const telText = f.tel ? `<br/><span style="color:#666;">${f.tel}</span>` : ''
      const info = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:13px;">🚑 ${f.name}${distanceText}${telText}</div>`,
      })
      window.kakao.maps.event.addListener(marker, 'click', () => info.open(map, marker))

      hospitalMarkersRef.current.push({ id: f.id ?? idx, marker, info })
    })
  }, [mapReady, hospitals])

  // 목록 카드 클릭 시: 지도를 그 위치로 옮기고 정보창을 띄워 지도-목록을 서로 연결되게 함
  function focusHospital(f, idx) {
    const map = mapObjRef.current
    const entry = hospitalMarkersRef.current.find((m) => m.id === (f.id ?? idx))
    if (!map || !entry) return
    map.setLevel(3)
    map.setCenter(new window.kakao.maps.LatLng(f.lat, f.lng))
    entry.info.open(map, entry.marker)
  }

  const nearest = hospitals[0]
  const devHub = hospitals.find(isDevDisabilityHub)

  return (
    <div>
      <div className="ft-page-header">
        <div>
          <div className="ft-page-title">📍 위치 및 응급시설 안내</div>
          <div className="ft-page-sub">학교 주변 응급실 및 AED 위치를 확인하세요</div>
        </div>
      </div>

      {status === 'live' && nearest && (
        <div
          className="ft-card"
          style={{
            padding: '14px 18px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--green-50, #ecfdf5)',
            borderColor: 'var(--green-200, #a7f3d0)',
          }}
        >
          <span style={{ fontSize: 20 }}>🚑</span>
          <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
            학교에서 가장 가까운 응급실은 <strong style={{ color: 'var(--text-primary)' }}>{nearest.name}</strong>이며, 약{' '}
            <strong style={{ color: 'var(--green-700, #047857)' }}>{nearest.distanceKm.toFixed(1)}km</strong> 거리에 있습니다.
          </div>
        </div>
      )}

      {devHub && (
        <div
          className="ft-card"
          style={{
            padding: '14px 18px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--orange-50, #fffbeb)',
            borderColor: 'var(--orange-200, #fde68a)',
          }}
        >
          <span style={{ fontSize: 20 }}>🧩</span>
          <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
            보건복지부 지정 <strong style={{ color: 'var(--text-primary)' }}>발달장애인 거점병원·행동발달증진센터</strong>인{' '}
            <strong style={{ color: 'var(--orange-600, #d97706)' }}>{devHub.name}</strong>도 목록에 포함되어 있습니다. 자해·공격성 등
            행동문제 발생 시 일반 응급실보다 이곳에서의 전문 대응이 더 적합할 수 있습니다.
          </div>
        </div>
      )}

      <div className="ft-card" style={{ padding: 14 }}>
        <div
          ref={mapRef}
          style={{ width: '100%', height: '440px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
        />
        <div style={{ marginTop: 14, display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span>🏫 특수학교 건물</span>
          <span>🚑 응급실{status === 'live' && <span style={{ color: 'var(--green-600)', fontWeight: 700 }}> (공공데이터포털 실시간 연동)</span>}</span>
          <span>🔴 AED 위치 (예시)</span>
          {status === 'loading' && <span style={{ color: 'var(--text-light)' }}>응급의료기관 정보를 불러오는 중…</span>}
          {status === 'error' && <span style={{ color: 'var(--orange-500)' }}>⚠ 실시간 연동 실패 — 예시 데이터로 표시 중</span>}
        </div>
      </div>

      <div className="ft-card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
          🚑 가까운 응급실 목록 {status === 'live' && <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--green-600)' }}>· 실시간 연동</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hospitals.map((f, idx) => (
            <div
              key={f.id ?? idx}
              onClick={() => focusHospital(f, idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: idx === 0 ? 'var(--blue-50, #eff6ff)' : 'var(--bg-white)',
                cursor: 'pointer',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {idx === 0 && (
                    <span className="ft-badge" style={{ background: 'var(--blue-100, #dbeafe)', color: 'var(--blue-700)' }}>
                      가장 가까운 응급실
                    </span>
                  )}
                  {isDevDisabilityHub(f) && (
                    <span className="ft-badge" style={{ background: 'var(--orange-100, #fef3c7)', color: 'var(--orange-600, #d97706)' }}>
                      🧩 발달장애인 거점병원
                    </span>
                  )}
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{f.name}</span>
                  {f.distanceKm != null && (
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{f.distanceKm.toFixed(1)}km</span>
                  )}
                </div>
                {f.address && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{f.address}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {f.tel && (
                  <a href={`tel:${f.tel}`} className="ft-btn ft-btn-danger" style={{ textDecoration: 'none' }}>
                    📞 전화하기
                  </a>
                )}
                <a
                  href={kakaoDirectionsUrl(f)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ft-btn ft-btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  🧭 길찾기
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Map
