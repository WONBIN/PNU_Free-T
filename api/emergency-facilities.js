// Vercel 서버리스 함수: 공공데이터포털(data.go.kr) 국립중앙의료원
// "전국 응급의료기관 정보 조회 서비스"(getEgytListInfoInqire) 프록시
//
// 왜 프록시가 필요한가:
//  1) 이 정부 API는 XML만 응답하고 브라우저 직접 호출 시 CORS가 막혀 있음
//  2) 서비스키를 프런트엔드(클라이언트)에 노출하면 안 되므로 서버에서만 사용
//
// 사용법: GET /api/emergency-facilities?stage1=부산광역시

const SERVICE_URL = 'https://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytListInfoInqire'

function decodeXmlEntities(str) {
  return str
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}

function getTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
  return m ? decodeXmlEntities(m[1]) : null
}

// <item>...</item> 반복 블록을 모두 파싱해 평면 객체 배열로 변환
function parseXmlItems(xml) {
  const items = []
  const itemRe = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = itemRe.exec(xml))) {
    const body = m[1]
    const obj = {}
    const fieldRe = /<(\w+)>([\s\S]*?)<\/\1>/g
    let fm
    while ((fm = fieldRe.exec(body))) {
      obj[fm[1]] = decodeXmlEntities(fm[2])
    }
    items.push(obj)
  }
  return items
}

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== '') return obj[k]
  }
  return null
}

export default async function handler(req, res) {
  // Vercel 환경변수 입력 시 앞뒤 공백/줄바꿈이 섞여 들어가는 경우가 있어 방어적으로 trim
  const serviceKey = (process.env.EMERGENCY_API_KEY || '').trim()

  if (!serviceKey) {
    res.status(500).json({
      error: 'EMERGENCY_API_KEY 환경변수가 설정되지 않았습니다. Vercel 프로젝트 설정에서 추가해주세요.',
    })
    return
  }

  const stage1 = req.query.stage1 || '부산광역시'
  // 시군구(Q1)는 일부러 기본값을 비워둔다 — 자치구 단위로 좁히면 그 구에 등록된
  // 응급의료기관이 0건일 수 있어(예: 금정구) "empty"로 빠지기 쉬움.
  // 시/도 단위로 넓게 받아온 뒤 클라이언트에서 Haversine 거리로 가까운 곳만 추려낸다.
  const stage2 = req.query.stage2 || ''
  const numOfRows = req.query.numOfRows || '100'

  const qs = new URLSearchParams({
    serviceKey,
    Q0: stage1,
    pageNo: '1',
    numOfRows: String(numOfRows),
  })
  if (stage2) qs.set('Q1', stage2)

  try {
    const upstream = await fetch(`${SERVICE_URL}?${qs.toString()}`)
    const xml = await upstream.text()

    // 게이트웨이 단계에서 막히면(예: "Unauthorized") XML이 아니라 평문이 오기도 한다.
    // HTTP 상태코드까지 같이 보면 원인 파악이 훨씬 쉬워진다.
    if (!upstream.ok) {
      res.status(502).json({
        error: `공공데이터포털 게이트웨이 오류 (HTTP ${upstream.status})`,
        upstreamStatus: upstream.status,
        contentType: upstream.headers.get('content-type'),
        raw: xml.slice(0, 800),
      })
      return
    }

    // data.go.kr은 인증 단계에서 실패하면 정상 응답 구조(resultCode/totalCount)가 아니라
    // <OpenAPI_ServiceResponse><cmmMsgHeader>...</cmmMsgHeader></OpenAPI_ServiceResponse> 형태의
    // 완전히 다른 에러 포맷을 돌려준다 (키 미승인/오타/트래픽초과 등). 이걸 먼저 체크한다.
    const returnAuthMsg = getTag(xml, 'returnAuthMsg')
    const errMsg = getTag(xml, 'errMsg')
    if (returnAuthMsg || errMsg) {
      res.status(502).json({
        error: `공공데이터포털 인증 오류: ${returnAuthMsg || errMsg}`,
        returnReasonCode: getTag(xml, 'returnReasonCode'),
        raw: xml.slice(0, 800),
      })
      return
    }

    const resultCode = getTag(xml, 'resultCode')
    if (resultCode && resultCode !== '00') {
      const resultMsg = getTag(xml, 'resultMsg') || getTag(xml, 'resultMag') || '알 수 없는 오류'
      res.status(502).json({ error: `공공데이터포털 응답 오류 (${resultCode}): ${resultMsg}`, raw: xml.slice(0, 500) })
      return
    }

    const items = parseXmlItems(xml)
    const facilities = items
      .map((it) => ({
        id: pick(it, 'hpid'),
        name: pick(it, 'dutyName'),
        address: pick(it, 'dutyAddr'),
        tel: pick(it, 'dutyTel1', 'dutyTel3'),
        lat: parseFloat(pick(it, 'wgs84Lat')),
        lng: parseFloat(pick(it, 'wgs84Lon')),
        type: 'hospital',
      }))
      .filter((f) => f.name && Number.isFinite(f.lat) && Number.isFinite(f.lng))

    // 진단용: 결과가 비어 보일 때 원인이 "API가 0건 반환"인지 "파싱/필터에서 걸러짐"인지 구분하기 위함
    const totalCount = getTag(xml, 'totalCount')

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400')
    res.status(200).json({
      facilities,
      source: '공공데이터포털 국립중앙의료원 응급의료기관 정보',
      stage1,
      stage2,
      debug: {
        totalCount,
        rawItemCount: items.length,
        filteredCount: facilities.length,
        rawXmlSample: items.length === 0 ? xml.slice(0, 800) : undefined,
      },
    })
  } catch (e) {
    res.status(500).json({ error: `요청 실패: ${e.message}` })
  }
}
