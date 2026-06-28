// @tensorflow-models/pose-detection은 BlazePose의 "mediapipe" 런타임 코드 경로에서
// @mediapipe/pose의 `Pose` 클래스를 정적으로 import한다.
// 하지만 우리는 MoveNet(SINGLEPOSE_LIGHTNING)만 사용하고 BlazePose/mediapipe 런타임은
// 전혀 호출하지 않으므로, 이 클래스는 실제로 인스턴스화되지 않는다.
//
// @mediapipe/pose의 실제 pose.js 파일은 ESM이 아니라 전역 스크립트(IIFE)라서
// Vite(Rolldown)의 정적 import 분석("Pose" named export 확인) 단계에서 빌드 에러가 난다.
// 그래서 이 더미 모듈로 별칭(alias) 처리해 빌드만 통과시킨다. (vite.config.js의 resolve.alias 참고)
export class Pose {
  constructor() {}
  setOptions() {}
  onResults() {}
  initialize() {
    return Promise.resolve()
  }
  send() {
    return Promise.resolve()
  }
  close() {
    return Promise.resolve()
  }
  reset() {}
}

export default Pose
