// 학생 이름 첫 글자로 된 원형 아바타.
// 사진 데이터 없이도 명단/알림 목록이 표(table)처럼 딱딱하게 보이지 않도록,
// 이름을 해시해서 4가지 테마 색상 중 하나를 일관되게 배정한다.
// (같은 이름이면 어디서 봐도 같은 색 — Students 페이지, Dashboard 알림 피드 모두 동일)

const PALETTE = [
  { bg: 'var(--blue-100, #dbeafe)', fg: 'var(--blue-700, #1a56db)' },
  { bg: 'var(--green-100, #d1fae5)', fg: 'var(--green-700, #065f46)' },
  { bg: 'var(--orange-100, #fef3c7)', fg: 'var(--orange-600, #d97706)' },
  { bg: 'var(--red-100, #fee2e2)', fg: 'var(--red-700, #b91c1c)' },
]

function colorFor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function Avatar({ name, size = 32 }) {
  const { bg, fg } = colorFor(name || '?')
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: bg, color: fg, fontWeight: 800,
        fontSize: Math.max(11, size * 0.42),
      }}
    >
      {(name || '?').charAt(0)}
    </span>
  )
}

export default Avatar
