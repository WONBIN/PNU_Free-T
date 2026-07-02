# 🎨 FREE-T | AI 기반 예술특수학교 안전 모니터링 시스템

> **부산대학교 사범대학 부설 예술 중·고등 특수학교**의 안전 사각지대 해소를 위한  
> 행동 감지 AI → 교사 알림 → 응급 대응까지 이어지는 end-to-end 웹 시스템

🔗 **배포 주소**: [https://pnu-free-t.vercel.app](https://pnu-free-t.vercel.app)

---

## 👥 Team: Free-T

| 성명 | 학과 | 학번 | 역할 |
| :--- | :--- | :--- | :--- |
| 김현비 | 실내환경디자인학과 | 2025***** | 팀장, AI 모델링 |
| 김현진 | 화공생명공학과 | 2023***** | 데이터 수집 및 전처리 |
| 한정진 | 사회기반시스템공학과 | 2023***** | 알림 시스템 개발 |
| 서원빈 | 정보컴퓨터공학부 | 2022***** | 웹 시스템 설계 및 전체 구현 |

---

## 📌 Project Overview

본 프로젝트는 국내 최초 국립 예술특수학교 설립에 맞춰, **발달장애 학생의 예술적 자율성을 보장하면서도 안전 사각지대를 최소화**하기 위해 기획·개발되었습니다.

악기 연습실·미술 작업실 등 단독 활동 공간이 많은 예술 교육 환경의 특수성과, 고지대 캠퍼스라는 지형적 조건을 고려하여, **카메라 영상 기반 Vision AI**로 학생의 이상 행동을 실시간 감지하고 교사에게 즉시 알림을 전송합니다. 별도의 서버 GPU 없이 브라우저에서 직접 AI 추론이 이루어지므로, 기존 CCTV·PC 인프라만으로도 운용 가능한 구조를 지향합니다.

---

## ⚠️ Problem Definition

1. **모니터링 사각지대**: 악기 연습실·미술 작업실 등 개별 공간에서의 관리 공백
2. **인솔 공백 시 위험**: 전공 레슨·이동 중 자해·쓰러짐 등 돌발 상황 대응 부재
3. **예산·확산성 제약**: 기존 CCTV 인프라를 활용해 추가 비용 없이 전국 확산 가능한 모델 필요

---

## 🛠 구현된 기능

### 🤖 실시간 AI 행동 감지 (Dashboard)
- 웹캠 영상에서 **MoveNet**으로 9개 관절 키포인트를 매 프레임 추출
- 20프레임 슬라이딩 윈도우 + 37차원 특징 벡터(속도·반복성·FFT 주기성) 계산
- **TensorFlow.js 경량 MLP 분류기**가 브라우저에서 직접 추론 (서버 불필요)
- 감지 대상: 팔 흔들기(ArmFlapping) · 헤드뱅잉(HeadBanging) · 스피닝(Spinning)
- 연속 3윈도우 동일 판정 시 알림 발생 (디바운스), 20초 쿨다운

### 🔔 즉각 알림 시스템
- 브라우저 **Web Push 알림** (백그라운드 상태에서도 수신)
- **Web Audio API** 기반 알림음
- 알림 수준 3단계: 긴급(danger) · 경고(warning) · 정상(normal)
- 알림 피드에 "확인 처리" 버튼 — 처리 여부 추적

### ⏱ 골든타임 자동 타이머 (Manual)
- AI가 "긴급" 등급 감지 시 localStorage에 발생 시각 자동 저장
- 매뉴얼 페이지 진입 시 해당 시각부터 경과 시간 자동 계산·표시
- 단계별 응급 대응 매뉴얼 함께 제공

### 📍 응급시설 지도 (Map)
- **카카오맵 SDK** 기반 학교 주변 지도
- **공공데이터포털 국립중앙의료원 응급의료기관 API** 실시간 연동 (부산광역시 37개소)
- Haversine 공식으로 학교에서 가까운 순으로 정렬 + 지도 마커 표시
- **보건복지부 지정 발달장애인 거점병원·행동발달증진센터** (온종합병원, 부산 진구) 별도 식별·안내 — 특수학생의 행동문제에는 일반 응급실보다 전문 대응이 필요할 수 있다는 도메인 고려
- 응급실 클릭 시 카카오맵 길찾기 바로 연결

### 📋 기타
- 상황 스냅샷 캡처 및 다운로드 (Canvas API)
- 이상행동 기록 리포트 + 주간 통계 차트 (Report)
- 학생 명단 관리 (Students)
- 긴급연락처 (Emergency)
- 알림 설정 (Notifications)

---

## 🧠 AI 모델 상세

| 항목 | 내용 |
| :--- | :--- |
| 학습 데이터셋 | SSBD (Self-Stimulatory Behaviour Dataset), 총 90개 클립 |
| 포즈 추출 | Google MoveNet (SinglePose Lightning) — 9개 관절 키포인트 |
| 특징 벡터 | 37차원: 관절별 평균/표준편차 속도 + 이동거리/변위 비율(27) + 어깨 회전 각속도(2) + FFT 주기성(8) |
| 모델 구조 | 경량 MLP (Keras 학습 → TensorFlow.js 변환) |
| 검증 방법 | 5-fold 그룹 교차검증 (클립 단위 그룹화) |
| 평균 정확도 | **약 61%** (우연 정확도 33% 대비 +28%p) |
| 실행 환경 | 브라우저 (TensorFlow.js WebGL/CPU 백엔드) |

> ⚠️ 본 모델은 소규모 공개 데이터셋 기반의 경량 프로토타입입니다. 실제 서비스 수준의 정밀도가 아닌 **보조 참고용**으로만 사용해야 하며, 최종 판단은 반드시 교사가 직접 확인하는 Human-in-the-loop 체계를 유지해야 합니다.

---

## 🏗 기술 스택

| 구분 | 기술 |
| :--- | :--- |
| 프론트엔드 | React 18, Vite 6, React Router, CSS Variables |
| AI 추론 (브라우저) | TensorFlow.js, @tensorflow-models/pose-detection (MoveNet) |
| AI 학습 (Python) | Keras, MediaPipe, NumPy |
| 백엔드 (서버리스) | Vercel Serverless Functions (Node.js) |
| 외부 API | 공공데이터포털 응급의료기관 API, 카카오맵 SDK |
| 배포 | Vercel (GitHub 연동 자동 배포) |
| 알림 | Web Push API, Web Audio API |

---

## 🏛 아키텍처

```
브라우저 (클라이언트)
├── React SPA — 화면 렌더링, 라우팅
├── TensorFlow.js — AI 행동 감지 추론 (영상이 외부로 나가지 않음)
└── fetch('/api/emergency-facilities')
        │
        ▼
Vercel Serverless Function (서버)
└── 공공데이터포털 XML API → JSON 변환 후 반환
        │
        ▼
data.go.kr 응급의료기관 API
```

영상 데이터는 사용자 기기 내에서만 처리되며 외부 서버로 전송되지 않습니다.

---

## 📁 프로젝트 구조

```
PNU_PROJECT/
├── api/
│   └── emergency-facilities.js   # Vercel 서버리스 함수 (응급의료기관 API 프록시)
├── public/
│   └── models/behavior-classifier/  # 학습된 AI 모델 파일 (TF.js 포맷)
├── src/
│   ├── pages/          # 각 화면 컴포넌트
│   │   ├── Dashboard.jsx      # 실시간 CCTV + AI 감지 + 알림 피드
│   │   ├── Map.jsx            # 카카오맵 + 응급실 목록
│   │   ├── Manual.jsx         # 골든타임 타이머 + 대응 매뉴얼
│   │   ├── Students.jsx       # 학생 명단
│   │   ├── Emergency.jsx      # 긴급연락처
│   │   ├── Notifications.jsx  # 알림 설정
│   │   └── Report.jsx         # 이상행동 리포트
│   ├── utils/
│   │   ├── behaviorAI.js      # AI 파이프라인 전체 (포즈 추출 → 분류 → 디바운스)
│   │   ├── notify.js          # 푸시 알림 / 알림음
│   │   └── emergencyAlert.js  # 긴급 감지 → 골든타임 타이머 자동 연결
│   ├── components/
│   │   └── Avatar.jsx         # 이름 이니셜 아이콘 (재사용 UI)
│   ├── data/
│   │   └── students.js        # 학생 명단 데이터
│   └── App.jsx                # 라우터 + 네비게이션
├── index.html                 # 앱 진입점
├── vercel.json                # SPA 라우팅 설정
└── vite.config.js             # 빌드 설정
```

---

## 🔮 Future Work

1. **더 정밀한 AI 모델**: ISAS 2025 게재 논문 저자 연구팀과 신규 데이터셋 제공 협의 진행 중 — 확보 시 모델 재학습 및 정확도 개선 예정
2. **다기기 통합 모니터링**: 현재는 기기 1대 기준 프로토타입 — 여러 교실 CCTV를 한 화면에서 통합 관제하려면 중앙 알림 허브 서버 추가 필요
3. **Human-in-the-loop 체계화**: AI 오탐지로 인한 학생 낙인효과 방지를 위해, 교사의 최종 확인을 필수 단계로 명시하는 운영 가이드라인 수립
4. **보호자 동의 및 데이터 파기 기준 마련**: 실 운영 시 미성년 학생 영상 관련 개인정보보호법 준수 절차 정비

---

## 🇺🇸 English Summary

**FREE-T** is a browser-based, end-to-end safety monitoring system for a national arts special school for students with developmental disabilities (affiliated with Pusan National University).

**Key Technical Contributions:**
- Real-time stereotypical behavior detection (ArmFlapping, HeadBanging, Spinning) using MoveNet pose estimation + a lightweight MLP classifier running entirely in-browser via TensorFlow.js — no video data leaves the device
- 37-dimensional feature vectors computed from 20-frame sliding windows (per-joint velocity statistics, repetition ratio, FFT periodicity)
- 5-fold group cross-validation accuracy: ~61% on SSBD dataset (vs. 33% chance)
- Live emergency facility data via Korea's public data portal API (37 hospitals in Busan), with special identification of the Ministry of Health-designated Developmental Disability Hub Hospital
- Automated golden-time timer: AI "danger" detections automatically start the response timer on the manual page via localStorage — no manual trigger needed

**Stack:** React · Vite · TensorFlow.js · MoveNet · Keras · Vercel Serverless · Kakao Maps · 공공데이터포털 API

🔗 **Live Demo**: [https://pnu-free-t.vercel.app](https://pnu-free-t.vercel.app)

---

**Last Updated**: 2026-07-02
