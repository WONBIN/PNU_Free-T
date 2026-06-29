import { useEffect, useRef, useState } from 'react'

// PNU 본교(부산대학교) 좌표 + 특수학교 건물(가상의 분리 위치)
const SCHOOL_LOCATION = { lat: 35.2326, lng: 129.0796, name: '특수학교 건물' }
const SCHOOL_STAGE1 = '부산광역시'
const SCHOOL_STAGE2 = '금정구'

// 공공데이터포털 응급의료기관 API에서 받기 전까지/실패 시 보여줄 대체 데이터
const FALLBACK_HOSPITAL = { lat: 35.2310, lng: 129.0820, name: '부산대학교병원 응급실', type: 'hospital' }

// AED는 아직 실시간 공공데이터 연동 전이라 예시 위치임을 명확히 표기
const AED_EXAMPLES = [
  { lat: 35.2335, lng: 129.0775, name: 'AED 설치 위치 (본관 1층)', type: 'aed' },
  { lat: 35.2318, lng: 129.0805, name: 'AED 설치 위치 (학생회관)', type: 'aed' },
]

const MAX_HOSPITAL_MARKERS = 6

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function Map() {
  const mapRef = useRef(null)
  const mapObjRef = useRef(null)
  const hospitalMarkersRef = useRef([])

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
    const params = new URLSearchParams({ stage1: SCHOOL_STAGE1, stage2: SCHOOL_STAGE2 })
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

    hospitalMarkersRef.current.forEach((m) => m.setMap(null))
    hospitalMarkersRef.current = []

    hospitals.forEach((f) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(f.lat, f.lng),
        map,
      })
      hospitalMarkersRef.current.push(marker)

      const distanceText = f.distanceKm != null ? ` · ${f.distanceKm.toFixed(1)}km` : ''
      const telText = f.tel ? `<br/><span style="color:#666;">${f.tel}</span>` : ''
      window.kakao.maps.event.addListener(marker, 'click', () => {
        const info = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:6px 10px;font-size:13px;">🚑 ${f.name}${distanceText}${telText}</div>`,
        })
        info.open(map, marker)
      })
    })
  }, [mapReady, hospitals])

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
        <div style={{ marginTop: 14, display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span>🏫 특수학교 건물</span>
          <span>🚑 응급실{status === 'live' && <span style={{ color: 'var(--green-600)', fontWeight: 700 }}> (공공데이터포털 실시간 연동)</span>}</span>
          <span>🔴 AED 위치 (예시)</span>
          {status === 'loading' && <span style={{ color: 'var(--text-light)' }}>응급의료기관 정보를 불러오는 중…</span>}
          {status === 'error' && <span style={{ color: 'var(--orange-500)' }}>⚠ 실시간 연동 실패 — 예시 데이터로 표시 중</span>}
        </div>
      </div>
    </div>
  )
}

export default Map
