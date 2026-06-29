// 전체 학생 명단 — 학생 관리 / 대시보드 / 리포트 페이지가 모두 이 배열을 단일 출처로 사용한다.
// (이전에는 페이지마다 학생 이름을 따로따로 하드코딩해서, 한쪽에서 이름을 바꾸면
//  다른 페이지와 어긋나는 문제가 있었음. 또한 학생이 4명뿐이라 데모로서 비현실적이었음)

export const CLASSES = ['1반', '2반', '3반', '4반']

export const DISABILITY_TYPES = ['지적장애', '자폐성장애', '정서·행동장애', '지체장애', '발달지체']

const SCHEDULE_PRESETS = [
  '월·수·금 9시~12시',
  '화·목 10시~13시',
  '매일 9시~14시',
  '월~금 9시~12시',
  '화·목·금 9시~13시',
  '월·화·수 10시~14시',
]

// 이름/반/나이/장애유형만 손으로 지정하고, 학번·보호자 연락처·시간표는 아래에서 규칙적으로 채운다.
const RAW = [
  { name: '김민준', class: '1반', age: 9, disabilityType: '자폐성장애' },
  { name: '이서윤', class: '1반', age: 10, disabilityType: '지적장애' },
  { name: '박지호', class: '2반', age: 8, disabilityType: '발달지체' },
  { name: '최하은', class: '3반', age: 11, disabilityType: '정서·행동장애' },
  { name: '정도윤', class: '1반', age: 9, disabilityType: '지체장애' },
  { name: '강서아', class: '2반', age: 10, disabilityType: '자폐성장애' },
  { name: '윤지안', class: '2반', age: 8, disabilityType: '지적장애' },
  { name: '임하준', class: '3반', age: 12, disabilityType: '발달지체' },
  { name: '한유준', class: '4반', age: 7, disabilityType: '정서·행동장애' },
  { name: '오수아', class: '4반', age: 13, disabilityType: '지체장애' },
  { name: '서지우', class: '1반', age: 9, disabilityType: '자폐성장애' },
  { name: '신예준', class: '1반', age: 10, disabilityType: '지적장애' },
  { name: '권아윤', class: '2반', age: 8, disabilityType: '발달지체' },
  { name: '황시우', class: '2반', age: 11, disabilityType: '정서·행동장애' },
  { name: '안유나', class: '3반', age: 9, disabilityType: '지체장애' },
  { name: '송준서', class: '3반', age: 12, disabilityType: '자폐성장애' },
  { name: '류하린', class: '4반', age: 7, disabilityType: '지적장애' },
  { name: '전민서', class: '4반', age: 13, disabilityType: '발달지체' },
  { name: '홍은우', class: '1반', age: 9, disabilityType: '정서·행동장애' },
  { name: '조나윤', class: '1반', age: 10, disabilityType: '지체장애' },
  { name: '배시현', class: '2반', age: 8, disabilityType: '자폐성장애' },
  { name: '백다은', class: '2반', age: 11, disabilityType: '지적장애' },
  { name: '남도현', class: '3반', age: 9, disabilityType: '발달지체' },
  { name: '문서윤', class: '3반', age: 12, disabilityType: '정서·행동장애' },
  { name: '양준우', class: '4반', age: 7, disabilityType: '지체장애' },
  { name: '차아린', class: '4반', age: 13, disabilityType: '자폐성장애' },
  { name: '노은서', class: '1반', age: 9, disabilityType: '지적장애' },
  { name: '심지호', class: '1반', age: 10, disabilityType: '발달지체' },
  { name: '곽유빈', class: '2반', age: 8, disabilityType: '정서·행동장애' },
  { name: '표재윤', class: '2반', age: 11, disabilityType: '지체장애' },
  { name: '위하윤', class: '3반', age: 9, disabilityType: '자폐성장애' },
  { name: '추선우', class: '3반', age: 12, disabilityType: '지적장애' },
]

// 보호자 연락처(가상)를 학생마다 다르게, 그러나 매 렌더마다 바뀌지 않게 인덱스 기반으로 생성
function fakeGuardianPhone(index) {
  const mid = String(1000 + ((index * 137) % 9000)).padStart(4, '0')
  const last = String(1000 + ((index * 271) % 9000)).padStart(4, '0')
  return `010-${mid}-${last}`
}

export const STUDENTS = RAW.map((s, i) => ({
  id: `S${String(i + 1).padStart(3, '0')}`,
  ...s,
  guardian: fakeGuardianPhone(i + 1),
  schedule: SCHEDULE_PRESETS[i % SCHEDULE_PRESETS.length],
}))

export function randomStudent() {
  return STUDENTS[Math.floor(Math.random() * STUDENTS.length)]
}

export function studentsInClass(className) {
  return STUDENTS.filter((s) => s.class === className)
}
