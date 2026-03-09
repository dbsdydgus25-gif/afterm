# Afterm (에프텀) 프로젝트 컨텍스트 및 히스토리

이 파일은 안티그래비티(Anti-gravity)와 사용자가 에프텀(Afterm) 서비스를 기획하고 개발하며 나눈 핵심 문맥, 아키텍처, 그리고 작업 히스토리를 기억하기 위해 작성된 문서입니다. 새로운 세션이나 대화에서 이 파일을 참고하여 프로젝트의 문맥을 잃지 않도록 합니다.

## 1. 프로젝트 주요 목적 (Service Overview)
**Afterm (에프텀)**은 사용자의 '디지털 유산(Digital Legacy)'을 안전하게 관리하고 사후에 지정된 가디언(Guardians)에게 이양하는 서비스입니다. 
- AI 어시스턴트를 활용한 간편한 구독/계정 파악
- 고인 유산 찾기 및 관리
- 소중한 사람에게 남기는 메시지/데이터 유산 보관
- 디지털 추모관(Memorial Space) 운영

## 2. 기술 스택 (Tech Stack)
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend/Database**: Supabase (Auth, Database, Storage)
- **AI/API**: Google Generative AI (Gemini) - Gmail 스캔 및 데이터 추출, OpenAI (GPT-4o-mini) - 챗봇 및 편지 작성 지원
- **Authentication**:  Google OAuth (Gmail 읽기 권한 포함), Kakao

## 3. 핵심 가치 및 기능 (Key Features)

### A. AI 어시스턴트 & Gmail 스캔 (AI Chat & Email Analysis)
- **기능**: 사용자의 Gmail을 연동하여 구독(OTT, 클라우드 등) 및 정기 결제 내역을 자동으로 찾아내고 디지털 유산 목록(`[LEGACY_LIST]`)으로 정리.
- **주요 로직**:
  - `AiAssistantClient`에서 Google OAuth를 통해 `gmail.readonly` 권한 획득.
  - API 라우트(`/api/scan-emails`)에서 Gemini 프롬프트를 사용하여 이메일 메타데이터 및 본문을 분석.
  - **할루시네이션(환각) 방지**: 없는 서비스를 지어내지 않고, '유료 서비스만' 요청 시 `cost`가 '무료'인 항목을 철저히 필터링하도록 프롬프트 고도화.
  - **이중 응답 방지**: 이메일 스캔 완료 후 GPT 기반의 일반 채팅이 결과를 임의로 지어내어 이중 답변하지 않도록 통제.

### B. 가디언 시스템 & 메시지 잠금 해제 (Guardians & Message Unlock)
- 사용자는 자신의 데이터를 이양받을 가디언즈를 지정.
- 사후 또는 특정 조건 만족 시 SMS 알림이 발송되고, **48시간 대기 기간** 이후 가디언이 로그인 없이도 메시지 열람 가능.

### C. 디지털 추모관 / 스페이스 (Memorial Space)
- 고인을 기리는 공간으로, 프로필/배경 이미지 (Supabase Storage 업로드 연동) 지원.
- 모바일에 최적화된 아기자기하고 깔끔한 UI 구성.
- 에디터/뷰어 등 멤버 권한 관리 및 삭제 기능 지원.

### D. 랜딩 페이지 및 UI (Landing Page)
- FeatureGrid, FeatureSteps(애니메이션 탭 인터페이스 등)를 통한 반응형 웹앱 경험 제공.
- 디자인 시스템 및 컴포넌트 최적화 (`RiskAwarenessSection` 등 불필요 섹션 제거, 모바일 최적화)

## 4. 최근 주요 트러블슈팅 이력 (Recent Troubleshooting)
1. **Gmail API 403 Insufficient Permission 오류 해결**:
   - 원인: 일반 구글 로그인 시 획득한 토큰을 이메일 읽기 토큰으로 오인.
   - 해결: 명확히 'Gmail 연동' 버튼을 눌렀을 때만(`scan=true`) `gmail.readonly` 스코프를 포함하여 리다이렉트(`/auth/callback`)하고 인증하도록 수정.
2. **AI 채팅 할루시네이션 (환각) 통제**:
   - 원인: 이메일 자동 스캔 내역과 관계없이 GPT가 빈약한 정보로 유산 목록을 창작함.
   - 해결: `scan-emails` API의 Gemini 프롬프트를 엄격히 제어, `AiAssistantClient`에서 Legacy Intent가 감지되면 GPT 챗 API 호출을 차단하고 스캔 결과만 UI에 표시하도록 분기 처리.
3. **Space UI 모바일 최적화**:
   - 버튼(FAB) 노출 문제, `MemorialCanvas`의 Facebook 스타일 프로필 컴포넌트화 등 처리.

---
**[AI Agent 행동 지침]**
작업을 시작하기 전, 이 파일(`afterm_memory.md`)의 내용을 숙지하여 프로젝트의 전체 메커니즘과 과거 수정 의도를 파괴하지 않도록 주의할 것. 특히 인증 흐름, AI 프롬프트 규칙, UI 모바일 반응형 규칙은 유지해야 함.
