import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @tensorflow-models/pose-detection은 BlazePose(MediaPipe 런타임)용으로
      // @mediapipe/pose의 `Pose`를 정적 import한다. 우리는 MoveNet만 사용해서
      // 이 코드 경로는 실제로 실행되지 않지만, @mediapipe/pose의 pose.js가
      // ESM이 아닌 전역 스크립트(IIFE)라서 빌드 시 export 분석에 실패한다.
      // 더미 모듈로 대체해서 빌드만 통과시킨다.
      '@mediapipe/pose': fileURLToPath(new URL('./src/stubs/mediapipe-pose-stub.js', import.meta.url)),
    },
  },
})
