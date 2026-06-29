// Vercel 서버리스 함수: 공공데이터포털(data.go.kr) 국립중앙의료원
// "전국 응급의료기관 정보 조회 서비스"(getEgytListInfoInqire) 프록시
//
// 왜 프록시가 필요한가:
//  1) 이 정부 API는 XML만 응답하고 브라우저 직접 호출 시 CORS가 막혀 있음
//  2) 서비스키를 프런트엔드(클라이언트)에 노출하면 안 되므로 서버에서만 사용
//
// 사용법: GET /api/emergency-facilities?stage1=부산광역시&stage2=금정구

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
  const serviceKey = process.env.EMERGENCY_API_KEY

  if (!serviceKey) {
    res.status(500).json({
      error: 'EMERGENCY_API_KEY 환경변수가 설정되지 않았습니다. Vercel 프로젝트 설정에서 추가해주세요.',
    })
    return
  }

  const stage1 = req.query.stage1 || '부산광역시'
  const stage2 = req.query.stage2 || '금정구'
  const numOfRows = req.query.numOfRows || '50'

  const qs = new URLSearchParams({
    serviceKey,
    Q0: stage1,
    Q1: stage2,
    pageNo: '1',
    numOfRows: String(numOfRows),
  })

  try {
    const upstream = await fetch(`${SERVICE_URL}?${qs.toString()}`)
    const xml = await upstream.text()

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

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400')
    res.status(200).json({ facilities, source: '공공데이터포털 국립중앙의료원 응급의료기관 정보', stage1, stage2 })
  } catch (e) {
    res.status(500).json({ error: `요청 실패: ${e.message}` })
  }
}
