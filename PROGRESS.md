# Afterm MVP3 — 작업 내역 정리

> 브랜치: `mvp3` | 마지막 업데이트: 2026-06-09

---

## 🏗️ 전체 구조

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 App Router |
| 인증 | Supabase Auth (카카오 OAuth 단일) |
| DB | Supabase (PostgreSQL + RLS) |
| 미들웨어 | `src/proxy.ts` (middleware.ts 대신) |
| 어드민 인증 | 쿠키 기반 (`admin_session`) — Supabase Auth와 분리 |
| 배포 | Vercel (mvp3 브랜치) |

---

## 📁 주요 파일 & 역할

```
src/
├── proxy.ts                          # Next.js 미들웨어 (인증 라우팅)
├── store/useApplyStore.ts            # Zustand persist — 신청 플로우 상태
├── app/
│   ├── (landing)/page.tsx            # 랜딩 페이지
│   ├── login/page.tsx                # 카카오 로그인
│   ├── onboarding/page.tsx           # 신규 유저 온보딩 (전화번호 등)
│   ├── home/
│   │   ├── page.tsx                  # 홈 대시보드 (서버 컴포넌트)
│   │   ├── HomeChatButton.tsx        # 카카오 채널 채팅 버튼 (클라이언트)
│   │   ├── HomeTabBar.tsx            # 하단 탭바 (홈/신청내역/내정보)
│   │   ├── orders/page.tsx           # 신청 내역 (서비스 카드 가로 스크롤)
│   │   └── myinfo/page.tsx           # 내 정보
│   ├── apply/
│   │   ├── page.tsx                  # Step 0: 고인 기본 정보
│   │   ├── services/page.tsx         # Step 1: 서비스 선택
│   │   ├── documents/page.tsx        # Step 2: 서류 업로드
│   │   └── confirm/page.tsx          # Step 3: 최종 확인 & 제출
│   ├── admin/
│   │   ├── layout.tsx                # 어드민 레이아웃 (쿠키 인증)
│   │   ├── page.tsx                  # 어드민 대시보드
│   │   └── cases/
│   │       ├── page.tsx              # 케이스 목록
│   │       └── [caseId]/
│   │           ├── page.tsx          # 케이스 상세
│   │           ├── CaseStatusBar.tsx # 상태 변경 UI (클라이언트)
│   │           └── AdminServiceRow.tsx
│   ├── admin-login/page.tsx          # 어드민 로그인 (admin layout 밖)
│   └── api/
│       ├── admin/
│       │   ├── auth/route.ts         # 어드민 로그인 → 쿠키 발급
│       │   ├── logout/route.ts       # 쿠키 삭제
│       │   └── cases/[caseId]/status/route.ts  # 케이스 상태 변경
│       ├── dispatch/[caseId]/route.ts  # 이메일 발송 (nodemailer Gmail)
│       └── debug/cases/route.ts      # RLS 디버그 (임시, 나중에 삭제)
```

---

## 🔑 환경변수 (Vercel 설정 필요)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 카카오
NEXT_PUBLIC_KAKAO_JS_KEY=        # 카카오 Developers → JavaScript 키
KAKAO_REST_API_KEY=
KAKAO_ADMIN_KEY=

# 어드민
ADMIN_PASSWORD=tkwkdsla123!!     # Production 환경 설정됨

# 이메일 발송 (Gmail SMTP)
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

---

## 🐛 고쳐진 버그들

### 1. 로그인 5초 딜레이
- **원인**: `proxy.ts`에서 모든 요청마다 `getUser()` (네트워크 호출) 실행
- **수정**: `getSession()` (로컬 쿠키 읽기)으로 교체 + matcher 범위 축소

### 2. 어드민 ERR_TOO_MANY_REDIRECTS
- **원인**: 로그인 페이지가 `/admin/login`에 있어서 admin layout 쿠키 체크 → redirect 무한루프
- **수정**: 로그인 페이지를 `/admin-login` (최상위, layout 밖)으로 이동

### 3. 카카오 채널 "이 계정과 연결된 카카오톡이 없습니다"
- **원인**: `followChannel()` PC에서 동작 안 함
- **수정**: `addChannel()` (브릿지 페이지)으로 변경 + REST API로 채널 관계 조회

### 4. 새 신청이 기존 케이스를 덮어씀
- **원인**: Zustand persist로 `caseId`가 localStorage에 남아있어 새 신청 시 UPDATE 실행
- **수정**: apply 페이지 마운트 시 기존 caseId 상태 확인, `draft`가 아니면 `resetStore()`

### 5. 신청 완료 후 상태가 "처리 중"으로 뜸
- **원인**: `dispatch/[caseId]` API가 이메일 발송 후 자동으로 status를 `processing`으로 변경
- **수정**: 자동 상태 변경 제거 → `submitted` 유지, 어드민이 수동 관리

### 6. 신청내역 카드 내용 안 보임
- **원인**: 뉴모픽 카드 배경(`#F0F2F5`)이 페이지 배경과 동일해서 내용 안 보임
- **수정**: 카드 배경 흰색(`#ffffff`)으로 변경

### 7. 어드민 로그인 후 쿠키 미적용
- **원인**: `router.push('/admin')` — 클라이언트 사이드 라우팅으로 쿠키가 안 실림
- **수정**: `window.location.href = '/admin'`으로 강제 전체 페이지 이동

---

## 📋 케이스 상태 흐름

```
submitted(접수완료) → reviewing(서류확인) → processing(처리중) → completed(처리완료) → settled(정산완료)
                      ↑ 어드민 수동 변경 (CaseStatusBar)
```

### 서비스 상태 흐름
```
pending(대기중) → dispatched(발송완료) → received(기업접수) → done(처리완료)
```

---

## 💾 DB 스키마 추가 (적용된 마이그레이션)

```sql
-- cases 테이블
ALTER TABLE cases ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS notes TEXT;

-- case_services 테이블
ALTER TABLE case_services ADD COLUMN IF NOT EXISTS status_note TEXT;
ALTER TABLE case_services ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE case_services ADD COLUMN IF NOT EXISTS fee INTEGER DEFAULT 0;
ALTER TABLE case_services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```

---

## 🎨 신청내역 UI (orders/page.tsx)

- 고인별 그룹핑
- 신청번호 (#XXXXXXXX), 진행률 바
- 서비스별 카드 **가로 스크롤** (스와이프) — `width: calc(100vw - 56px)`
- 카드 내용:
  - 서비스명 + 카테고리 아이콘
  - 진행 단계 바 (대기중/발송완료/기업접수/처리완료)
  - 제출 서류 목록 (서비스별 하드코딩)
  - 담당자 메모 (`status_note`)
  - 정산 상태 (점 인디케이터)

---

## ⚠️ 남은 이슈 / TODO

- [ ] `/api/debug/cases` 디버그 엔드포인트 삭제 (임시용)
- [ ] 어드민 ADMIN_PASSWORD Vercel 환경변수 재배포 확인 필요
- [ ] Kakao 채널 1:1 채팅 → center-pf.kakao.com에서 활성화 필요
- [ ] 이용현 케이스 상태 DB에서 `submitted`로 수동 수정 필요 (현재 `processing`)
- [ ] 실제 이메일 발송 테스트 (GMAIL_USER, GMAIL_APP_PASSWORD 설정 확인)
- [ ] `NEXT_PUBLIC_KAKAO_JS_KEY` Vercel에 설정됐는지 확인

---

## 🔐 어드민 접속

- URL: `https://[도메인]/admin-login`
- 비밀번호: `tkwkdsla123!!`
- 쿠키 유효시간: 24시간

---

## 🚀 2026-06-05 (MVP 4 신규 기능 업데이트)

### 1. 프론트엔드 UI/UX 전면 개편
* **하단 탭 바 (HomeTabBar) 개편**: `내정보` -> `마이`로 이름 및 아이콘 변경, `채팅` 탭 신설 (홈-채팅-신청내역-마이 구조).
* **홈 화면 (Home)**: 우측 상단 프로필 옆 알림(🔔) 아이콘 추가. 하단 배너 카드 2개(카카오톡 친구하기, 전문가와 상담하기)로 재정렬.
* **마이 페이지 (MyInfo)**: 
  * 프리미엄 디자인 시안(프로필 박스, 신청내역 카드) 전면 적용.
  * 기존 하드코딩된 전화번호(`010-0000-0000`)를 지우고 `user.phone` 연동으로 수정.
  * `결제` 섹션(결제 정보/결제 내역)을 별도의 그룹으로 분리 신설.

### 2. 자체 1:1 채팅 시스템 (Customer Support)
* **DB**: `chat_messages` 테이블 생성 및 RLS 정책 추가. (`20260604_create_chat_messages.sql`)
* **API**: `/api/chat/route.ts` API 생성. (메시지 조회 및 작성)
* **고객 화면**: `/home/chat/page.tsx`로 전체 화면 채팅 페이지 연동 (기존 플로팅 버튼 제거).
* **어드민 화면**: 어드민 상세 화면 우측 하단에 `AdminChatPanel` 추가. (실시간 관리자 응대 지원)

### 3. 로그인 및 어드민 기능 최적화
* **어드민 첨부서류 버그 해결**: 비공개 버킷(Private bucket) 설정으로 인해 어드민에서 서류를 보거나 다운받지 못하던 에러를, `createSignedUrl` 호출로 1시간 임시 보안 링크를 발급하도록 수정하여 해결.
* **로그인 지연 현상(버퍼링) 최적화**: 로그인 성공 시 `router.refresh()`로 발생하던 5초 이상의 무한 로딩(Next.js 블로킹) 현상을, `window.location.href = next`로 바꿔 즉각적인 화면 이동이 되도록 최적화.

---

## 🚀 2026-06-09 작업 내역

### 1. 채팅 시스템 전면 재구축
- **`support_messages` 테이블 신규 생성** (기존 `chat_messages` → 스키마 불일치로 교체)
  - 컬럼: `id, user_id, is_admin, message, created_at`
  - RLS 적용 (유저는 자신의 메시지만 조회/작성, 어드민은 전체 접근)
- **`/api/chat` 업데이트**: `support_messages` 테이블 기반으로 재작성
- **`/api/admin/chat` 신규**: 어드민 메시지 조회 및 답장 (admin_session 쿠키 인증)
- **`/admin/chat` 페이지 신규**: 유저별 스레드 목록 + 메시지 패널 + 5초 폴링

### 2. 어드민 기능 개선
- **케이스 목록 유저별 그룹핑**: `profiles` 테이블에서 실명/이메일/전화번호 조회 후 신청인 기준으로 묶어서 표시
- **서류 뷰어 다운로드 버튼 추가**: DocViewer에 ⬇ 다운로드 버튼 absolute 위치로 추가
- **서비스 상태 관리 UI 재설계**: 테이블 → 카드형으로 전환, 드롭다운 → 버튼 선택 방식
- **서비스 상태 변경 API 인증 수정**: `ADMIN_EMAILS` Supabase 체크 → `admin_session` 쿠키로 변경
- **상태 변경 시 자동 알림 발송**: 어드민이 서비스 상태 바꾸면 `support_messages`에 자동 알림 메시지 삽입

### 3. 온보딩 이름 확인 단계 추가
- **Step 0 신설**: 카카오 로그인 후 이름 확인 단계
  - 카카오 저장 이름이 있으면 "본명이 맞습니까?" 확인
  - 아니오 선택 시 직접 입력 유도
- **Step 흐름**: `0(이름확인) → 1(휴대폰) → 2(비밀번호) → 3(완료)`

### 4. 홈 화면 실시간 업데이트
- **`OrdersClient.tsx`**: Supabase Realtime 구독 추가 — `case_services` UPDATE 이벤트 감지 시 화면 즉시 반영

### 5. 알림 벨 재설계 (`NotificationBell.tsx`)
- 기존: 채팅 패널 오픈 → **변경: 처리현황 알림 드롭다운**
- 어드민이 보낸 `support_messages` (is_admin: true) 목록 표시
- 새 알림 시 빨간 점 표시, 패널 열면 초기화
- Realtime 구독으로 실시간 갱신

### 6. 카카오 채널 추가 버튼
- "전문가와 상담하기" → **"카카오 채널 추가"** 로 교체
- 채널 ID: `_cxfNAX`, 카카오 노란 배경 스타일
- `window.open` → `<a href target="_blank">` 변경 (모바일 팝업 차단 해결)

### 7. 홈 가이드 카드 & 마이 메뉴 액션 추가
- **홈 가이드 카드 5개 외부 링크 연결**: 안심상속(정부24) / 유족연금(국민연금공단) / 은행계좌(금감원) / 휴대폰해지(과기정통부) / 생명보험(보험개발원)
- **마이 페이지 전 섹션 클라이언트 컴포넌트로 통합** (서버 컴포넌트 onClick 버그 수정)
  - 결제 정보/내역 → "서비스 준비 중" 토스트
  - 1:1 상담 → 카카오 채널 오픈
  - 알림설정 / 개인정보보호 / 이용약관 → 바텀시트 모달

### 8. 에프텀 소개 페이지 (`/about`) 신규
- 서비스 개요, 특징(시간절약/원스톱/실시간알림/전문가상담), 처리 가능 서비스 태그, 카카오 채널 배너

### 9. 계정 설정 페이지 (`/myinfo/edit`) 신규
- 목록형 UI (이름 / 전화번호 / 이메일 / 비밀번호)
- **이름 변경**: Supabase auth metadata + profiles 테이블 동시 업데이트
- **전화번호 변경**: OTP 인증 후 변경 (기존 `/api/otp` 재활용, 3분 타이머)
- **비밀번호 변경**: 보안강도 게이지, 비밀번호 보기/숨기기, 일치여부 실시간 컬러 피드백
- 이메일: 카카오 로그인 안내 (변경불가)

### 🐛 수정된 버그
| 버그 | 원인 | 수정 |
|------|------|------|
| 홈/마이 메뉴 클릭 전혀 안 됨 | 서버 컴포넌트 내 onClick 핸들러 존재 | 클라이언트 컴포넌트로 분리 |
| 알림 벨 클릭 시 채팅 패널 열림 | NotificationBell이 window 이벤트 발송 | 드롭다운 알림 UI로 완전 재작성 |
| URL에 `?chat=1` 노출 | URL 파라미터로 채팅 패널 상태 관리 | 커스텀 window 이벤트(`afterm-open-chat`)로 변경 |
| 서류확인 버튼 실패 | `reviewing` 상태가 DB CHECK 제약에 없음 | CHECK 제약 수정으로 `reviewing` 추가 |
| 어드민 서비스 상태 변경 실패 | API가 ADMIN_EMAILS로 Supabase 인증 시도 | admin_session 쿠키 인증으로 변경 |
| 앱 전체 서버 크래시 | home/page.tsx(서버컴포넌트)에 window.open 직접 사용 | ChatOpenButton 클라이언트 컴포넌트로 분리 |
| 카카오 채널 버튼 모바일 미작동 | window.open 팝업 차단 | `<a href target="_blank">` 태그로 변경 |
