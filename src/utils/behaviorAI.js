// 실시간 웹캠 행동 감지 AI 파이프라인
//
// 구성:
//   1) MoveNet(@tensorflow-models/pose-detection)으로 매 프레임 9개 관절 키포인트 추출
//   2) 키포인트를 20프레임짜리 슬라이딩 윈도우에 누적
//   3) 학습 때(SSBD 데이터셋 + MediaPipe)와 동일한 방식으로 정규화 + 통계적 특징(37차원) 계산
//      - 관절별 평균/표준편차 속도, 이동거리/변위 비율(반복성 지표)
//      - 어깨선 회전 각속도/총 회전량(스피닝 신호)
//      - 손목/머리/어깨회전의 FFT 주파수 특징(반복 행동의 주기성 신호)
//   4) 경량 Keras MLP(TensorFlow.js로 변환)에 통과시켜 [팔흔들기, 헤드뱅잉, 스피닝] 확률 산출
//   5) 학습 데이터에 "정상" 클래스가 없으므로, 전체 움직임이 거의 없으면(평균 속도 임계값 미만)
//      모델 출력과 무관하게 "정상"으로 판단하는 보정(heuristic fallback)을 적용
//
// 주의: 이 모델은 SSBD 공개 데이터셋(자폐 아동의 자기자극행동 영상 90개 클립, 690개 윈도우)으로
// 학습되었으며, 5-fold 교차검증 기준 평균 정확도 약 61%(우연 정확도 33%) 수준입니다.
// 실제 서비스 수준의 정밀도가 아닌, "실제로 동작하는 경량 프로토타입"임을 분명히 인지하고 사용해야 합니다.

import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'

export const LM_ORDER = [
  'NOSE', 'LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_ELBOW', 'RIGHT_ELBOW',
  'LEFT_WRIST', 'RIGHT_WRIST', 'LEFT_HIP', 'RIGHT_HIP',
]
const LM_IDX = Object.fromEntries(LM_ORDER.map((n, i) => [n, i]))

// MoveNet(COCO 17 keypoints) 이름 -> 우리가 쓰는 랜드마크 이름 매핑
const MOVENET_NAME = {
  NOSE: 'nose',
  LEFT_SHOULDER: 'left_shoulder',
  RIGHT_SHOULDER: 'right_shoulder',
  LEFT_ELBOW: 'left_elbow',
  RIGHT_ELBOW: 'right_elbow',
  LEFT_WRIST: 'left_wrist',
  RIGHT_WRIST: 'right_wrist',
  LEFT_HIP: 'left_hip',
  RIGHT_HIP: 'right_hip',
}

export const WINDOW = 20
export const SAMPLE_INTERVAL_MS = 170 // 학습 시 약 6fps 샘플링과 동일한 속도로 추론
const MIN_SCORE = 0.3 // 이 이하 신뢰도는 "검출 안 됨"으로 취급
// hip-center/어깨너비로 정규화된 좌표 공간에서의 관절별 평균 속도(최댓값) 기준.
// 학습 데이터(model_meta.json mean) 상 활동적인 행동(팔흔들기/헤드뱅잉/스피닝)일 때
// 관절별 meanSpeed 평균이 대략 0.08~0.42 범위였던 것에 비춰, 그보다 충분히 낮은 값을
// "정상(거의 안 움직임)" 기준으로 잡았다. 실제 웹캠 테스트 결과에 따라 조정이 필요할 수 있다.
const CALM_SPEED_THRESHOLD = 0.06
const CONFIDENCE_THRESHOLD = 0.5 // 모델 확률이 이 이상이어야 행동으로 인정
const STABLE_WINDOWS_REQUIRED = 3 // 같은 판정이 N번 연속 나와야 알림 발생(디바운스)
const COOLDOWN_MS = 20000 // 같은 종류 알림 재발송 최소 간격

const MODEL_BASE_URL = '/models/behavior-classifier'

// tfjs는 환경에 따라 webgpu/webgl/cpu 백엔드 중 하나를 "우선순위"로 등록해두지만,
// 실제로 그 백엔드가 초기화(await)되기 전까지는 어떤 메서드도 호출할 수 없다.
// webgpu는 아직 브라우저 지원이 불안정할 수 있어서, 항상 webgl로 명시적으로 고정하고
// 초기화가 끝난 뒤에만 모델 로드/추론을 진행하도록 한다.
let backendReadyPromise = null
function ensureBackend() {
  if (!backendReadyPromise) {
    backendReadyPromise = (async () => {
      try {
        await tf.setBackend('webgl')
      } catch (e) {
        console.warn('webgl 백엔드 설정 실패, cpu로 폴백', e)
        try {
          await tf.setBackend('cpu')
        } catch (e2) {
          console.warn('cpu 백엔드 설정도 실패', e2)
        }
      }
      await tf.ready()
    })()
  }
  return backendReadyPromise
}

let modelPromise = null
let metaPromise = null

export function loadBehaviorModel() {
  if (!modelPromise) {
    modelPromise = ensureBackend().then(() => tf.loadLayersModel(`${MODEL_BASE_URL}/model.json`))
  }
  if (!metaPromise) {
    metaPromise = fetch(`${MODEL_BASE_URL}/model_meta.json`).then((r) => r.json())
  }
  return Promise.all([modelPromise, metaPromise]).then(([model, meta]) => ({ model, meta }))
}

let detectorPromise = null

export function getDetector() {
  if (!detectorPromise) {
    detectorPromise = ensureBackend().then(() =>
      poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      })
    )
  }
  return detectorPromise
}

// 모델 정확도 안내용 상수 (5-fold 그룹 교차검증 기준, UI 고지에 사용)
export const MODEL_DISCLOSURE = {
  cvMeanAcc: 0.607,
  cvStdAcc: 0.075,
  chanceAcc: 1 / 3,
  note: 'SSBD 데이터셋(90개 클립) 기반 경량 프로토타입 — 보조 참고용으로만 사용하세요.',
}

// 프레임에서 9개 관절의 [x,y]를 0~1 정규화 좌표로 추출. 신뢰도가 낮으면 null.
export function extractLandmarks(keypoints, videoWidth, videoHeight) {
  const byName = {}
  for (const kp of keypoints) byName[kp.name] = kp

  const pts = []
  for (const lm of LM_ORDER) {
    const kp = byName[MOVENET_NAME[lm]]
    if (kp && kp.score >= MIN_SCORE && videoWidth > 0 && videoHeight > 0) {
      pts.push([kp.x / videoWidth, kp.y / videoHeight])
    } else {
      pts.push(null)
    }
  }
  return pts // length 9, each [x,y] or null
}

// 슬라이딩 윈도우 버퍼: 관절 미검출 시 이전 값으로 보간(causal carry-forward)
export class LandmarkWindowBuffer {
  constructor(size = WINDOW) {
    this.size = size
    this.frames = [] // each: number[9][2]
    this.lastKnown = LM_ORDER.map(() => [0.5, 0.5])
  }

  push(rawPts) {
    const frame = rawPts.map((p, i) => {
      if (p) {
        this.lastKnown[i] = p
        return p
      }
      return this.lastKnown[i]
    })
    this.frames.push(frame)
    if (this.frames.length > this.size) this.frames.shift()
  }

  isFull() {
    return this.frames.length >= this.size
  }

  toArray() {
    // returns Float64Array-like nested array (T,9,2)
    return this.frames
  }
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1]]
}
function add(a, b) {
  return [a[0] + b[0], a[1] + b[1]]
}
function scaleVec(a, s) {
  return [a[0] * s, a[1] * s]
}
function norm2(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1])
}

// hip-center 기준 위치 정규화 + 어깨-엉덩이 길이로 스케일 정규화 (학습 때와 동일)
function normalizeWindow(frames) {
  const T = frames.length
  const norm = []
  for (let t = 0; t < T; t++) {
    const f = frames[t]
    const hipC = scaleVec(add(f[LM_IDX.LEFT_HIP], f[LM_IDX.RIGHT_HIP]), 0.5)
    const shC = scaleVec(add(f[LM_IDX.LEFT_SHOULDER], f[LM_IDX.RIGHT_SHOULDER]), 0.5)
    const scale = Math.max(norm2(sub(shC, hipC)), 1e-3)
    norm.push(f.map((p) => scaleVec(sub(p, hipC), 1 / scale)))
  }
  return norm
}

// 길이 n(<=32)짜리 실수 신호의 FFT 기반 주요 주파수 비율/파워 비율 (numpy rfft와 동일 정의의 단순 DFT)
function dominantFreqPower(signal) {
  const n = signal.length
  if (n < 4) return [0, 0]
  const mean = signal.reduce((a, b) => a + b, 0) / n
  const s = signal.map((v) => v - mean)

  const numBins = Math.floor(n / 2) + 1
  const spec = new Array(numBins).fill(0)
  for (let k = 0; k < numBins; k++) {
    let re = 0
    let im = 0
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n
      re += s[t] * Math.cos(angle)
      im -= s[t] * Math.sin(angle)
    }
    spec[k] = Math.sqrt(re * re + im * im)
  }
  spec[0] = 0 // DC 제거

  const totalPower = spec.reduce((a, b) => a + b, 0) + 1e-6
  const maxVal = Math.max(...spec)
  if (maxVal < 1e-8) return [0, 0]
  let domBin = 0
  for (let k = 1; k < spec.length; k++) if (spec[k] > spec[domBin]) domBin = k
  const freqRatio = domBin / (n / 2)
  const powerRatio = spec[domBin] / totalPower
  return [freqRatio, powerRatio]
}

// 학습 때(build_features.py)와 동일한 37차원 특징 벡터 계산
export function computeWindowFeatures(frames) {
  const norm = normalizeWindow(frames)
  const T = norm.length
  const feats = []

  // 1) 관절별 [mean_speed, std_speed, path/displacement 비율] x 9 = 27
  for (let j = 0; j < LM_ORDER.length; j++) {
    const pts = norm.map((f) => f[j])
    const speeds = []
    for (let t = 1; t < T; t++) speeds.push(norm2(sub(pts[t], pts[t - 1])))
    const meanSpeed = speeds.reduce((a, b) => a + b, 0) / (speeds.length || 1)
    const variance = speeds.reduce((a, b) => a + (b - meanSpeed) ** 2, 0) / (speeds.length || 1)
    const stdSpeed = Math.sqrt(variance)
    const pathLen = speeds.reduce((a, b) => a + b, 0)
    const netDisp = norm2(sub(pts[T - 1], pts[0]))
    const ratio = pathLen / (netDisp + 1e-3)
    feats.push(meanSpeed, stdSpeed, ratio)
  }

  // 2) 어깨선 회전 (스피닝 신호) = 2
  const ls = norm.map((f) => f[LM_IDX.LEFT_SHOULDER])
  const rs = norm.map((f) => f[LM_IDX.RIGHT_SHOULDER])
  const angles = ls.map((l, t) => {
    const v = sub(rs[t], l)
    return Math.atan2(v[1], v[0])
  })
  const dangles = []
  for (let t = 1; t < T; t++) {
    let d = angles[t] - angles[t - 1]
    d = ((d + Math.PI) % (2 * Math.PI)) - Math.PI
    if (d < -Math.PI) d += 2 * Math.PI
    dangles.push(Math.abs(d))
  }
  const meanAngvel = dangles.reduce((a, b) => a + b, 0) / (dangles.length || 1)
  const totalRotation = dangles.reduce((a, b) => a + b, 0)
  feats.push(meanAngvel, totalRotation)

  // 3) 주기성(FFT) 특징: 손목 평균 x/y, 머리-어깨 상대 y, 어깨 회전각 = 4 x 2 = 8
  const wristAvg = norm.map((f) => scaleVec(add(f[LM_IDX.LEFT_WRIST], f[LM_IDX.RIGHT_WRIST]), 0.5))
  const nose = norm.map((f) => f[LM_IDX.NOSE])
  const shC = ls.map((l, t) => scaleVec(add(l, rs[t]), 0.5))
  const noseRelY = nose.map((p, t) => p[1] - shC[t][1])

  const signals = [wristAvg.map((p) => p[0]), wristAvg.map((p) => p[1]), noseRelY, angles]
  for (const sig of signals) {
    const [fr, pr] = dominantFreqPower(sig)
    feats.push(fr, pr)
  }

  return feats // length 37
}

// 표준화 + 모델 추론 + "정상" 보정까지 포함한 한 윈도우 분류
export async function classifyWindow(model, meta, frames) {
  const feats = computeWindowFeatures(frames)

  // "정상(움직임 거의 없음)" 폴백 판단용 모션 크기.
  // computeWindowFeatures가 이미 hip-center/어깨너비 기준으로 정규화된 좌표 공간에서
  // 9개 관절 각각의 평균 속도(meanSpeed)를 계산해두므로(feats[0,3,6,...,24]) 그걸 그대로 재사용한다.
  // 웹캠과의 거리에 영향받지 않는 스케일-불변 좌표라는 점이 핵심.
  // 9개 관절을 평균내면 가만히 있는 관절(예: 머리만 흔들 때의 어깨/엉덩이)에 묻혀버리므로,
  // 가장 활발하게 움직인 관절 하나를 기준으로 삼는다(국소적 행동도 놓치지 않기 위함).
  const perLandmarkMeanSpeed = LM_ORDER.map((_, j) => feats[j * 3])
  const motion = Math.max(...perLandmarkMeanSpeed)

  const normed = feats.map((v, i) => (v - meta.mean[i]) / (meta.std[i] || 1e-6))

  const input = tf.tensor2d([normed])
  const out = model.predict(input)
  const probs = (await out.data())
  input.dispose()
  out.dispose()

  let maxIdx = 0
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[maxIdx]) maxIdx = i

  if (motion < CALM_SPEED_THRESHOLD || probs[maxIdx] < CONFIDENCE_THRESHOLD) {
    return { label: 'NORMAL', confidence: probs[maxIdx], probs: Array.from(probs), motion }
  }
  return { label: meta.classes[maxIdx], confidence: probs[maxIdx], probs: Array.from(probs), motion }
}

// 디바운스/쿨다운까지 포함한 상태 트래커
export class BehaviorStateTracker {
  constructor() {
    this.pendingLabel = null
    this.pendingCount = 0
    this.lastFiredLabel = null
    this.lastFiredAt = 0
  }

  // 매 윈도우 분류 결과를 넣으면, 알림을 "새로" 발생시켜야 할 때만 라벨을 반환(아니면 null)
  update(label) {
    if (label === this.pendingLabel) {
      this.pendingCount += 1
    } else {
      this.pendingLabel = label
      this.pendingCount = 1
    }

    if (this.pendingCount < STABLE_WINDOWS_REQUIRED) return null
    if (label === 'NORMAL') {
      // 정상으로 안정적으로 돌아온 경우, 이전 상태 초기화(다음 이상행동은 새로 알림 가능)
      const changed = this.lastFiredLabel !== null && this.lastFiredLabel !== 'NORMAL'
      this.lastFiredLabel = 'NORMAL'
      return changed ? 'NORMAL' : null
    }

    const now = Date.now()
    const sameAsLast = label === this.lastFiredLabel
    if (sameAsLast && now - this.lastFiredAt < COOLDOWN_MS) return null

    this.lastFiredLabel = label
    this.lastFiredAt = now
    return label
  }
}

export function labelToAlert(label) {
  switch (label) {
    case 'ArmFlapping':
      return { behavior: '상동행동(손 흔들기) 감지 — AI 분석', level: 'warning', tag: '경고' }
    case 'HeadBanging':
      return { behavior: '자해행동(헤드뱅잉) 감지 — AI 분석', level: 'danger', tag: '긴급' }
    case 'Spinning':
      return { behavior: '상동행동(스피닝) 감지 — AI 분석', level: 'warning', tag: '경고' }
    case 'NORMAL':
    default:
      return { behavior: '정상 활동 복귀 — AI 분석', level: 'normal', tag: '정상' }
  }
}
