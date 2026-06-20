# Afterm MVP — 작업 내역 정리

> 브랜치: `main` | 마지막 업데이트: 2026-06-20

---

## 🏗️ 전체 구조

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 14 App Router |
| 인증 | Supabase Auth (카카오 OAuth) |
| DB | Supabase (PostgreSQL + RLS) |
| 결제 | PortOne V2 (KG이니시스 + 카카오페이) |
| 알림 | Solapi 카카오 알림톡 |
| 배포 | Vercel (`git push origin main` 으로만 배포) |
| 어드민 인증 | 쿠키 기반 (`admin_session`) |

---

## 📁 주요 파일 & 역할

```
src/
├── proxy.ts                              # Next.js 미들웨어 (인증 라우팅)
├── store/useApplyStore.ts                # Zustand persist — 신청 플로우 상태
├── lib/
│   ├── kakao/sendKakao.ts               # 카카오 알림톡 공용 함수 (모든 route에서 직접 import)
│   └── supabase/admin.ts                # Supabase Admin Client
├── app/
│   ├── (landing)/page.tsx               # 랜딩 페이지
│   ├── login/page.tsx                   # 카카오 로그인
│   ├── onboarding/page.tsx              # 신규 유저 온보딩
│   ├── home/
│   │   ├── page.tsx                     # 홈 대시보드 (revalidate 30)
│   │   ├── HomeTabBar.tsx               # 하단 탭바 (Link prefetch 적용)
│   │   ├── orders/
│   │   │   ├── page.tsx                 # 신청 내역 (revalidate 0)
│   │   │   └── OrdersClient.tsx         # 취소하기 버튼, 환불 모달
│   │   └── myinfo/
│   │       ├── page.tsx                 # 내 정보 (revalidate 30)
│   │       └── MyInfoClient.tsx         # 결제내역 모달, 알림/약관 모달
│   ├── apply/
│   │   ├── page.tsx                     # Step 0: 약관 동의
│   │   ├── service-info/page.tsx        # Step 1: 고인 정보 + 서비스 선택
│   │   ├── documents/page.tsx           # Step 2: 서류 업로드
│   │   ├── payment/page.tsx             # Step 3: 결제 (카드/카카오페이)
│   │   ├── payment/complete/page.tsx    # 카카오페이 리다이렉트 완료
│   │   └── confirm/page.tsx             # Step 4: 신청 완료 확인
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # 어드민 대시보드
│   │   ├── cases/[caseId]/page.tsx      # 케이스 상세 (위임장 다운로드, 환불, 상태변경)
│   │   └── payments/page.tsx            # 결제 관리
│   └── api/
│       ├── notify/kakao/route.ts        # 카카오 알림톡 발송 엔드포인트
│       ├── notify/email/route.ts        # 이메일 발송 (Gmail SMTP)
│       ├── payment/verify/route.ts      # 결제 검증 + 알림톡 발송
│       ├── payment/refund/route.ts      # 환불 처리 + 알림톡 발송
│       ├── case-summary/route.ts        # 케이스 요약 (admin client, RLS 우회)
│       └── admin/cases/[caseId]/
│           └── status/route.ts          # 케이스 상태 변경 + 알림톡 + 구글시트
```

---

## 🔑 환경변수 (Vercel 설정 완료 목록)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Solapi 카카오 알림톡
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_NUMBER=
SOLAPI_KAKAO_PFID=KA01PF260615084445678bWiHWK5ED9x      ✅ 2026-06-18 추가
SOLAPI_KAKAO_SUBMIT_TEMPLATE_ID=KA01TP260615084732913xaw3HWNjJPk    ✅
SOLAPI_KAKAO_PROCESSING_TEMPLATE_ID=KA01TP260615122342986eh9S82hu0Jo ✅
SOLAPI_KAKAO_COMPLETE_TEMPLATE_ID=KA01TP260615123354909J5sCGxAq8O3  ✅
SOLAPI_KAKAO_PAYMENT_TEMPLATE_ID=KA01TP260617073154295DjvzhK7wAPJ   ✅
SOLAPI_KAKAO_REFUND_TEMPLATE_ID=KA01TP260617073227184l5mWCWMsdIn    ✅
SOLAPI_KAKAO_OTP_TEMPLATE_ID=KA01TP260617073822823nnIbC4taeKs       ✅

# PortOne V2
NEXT_PUBLIC_PORTONE_STORE_ID=
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=        # KG이니시스
NEXT_PUBLIC_PORTONE_KAKAO_CHANNEL_KEY=  # 카카오페이
PORTONE_API_SECRET=

# Gmail SMTP
GMAIL_USER=afterm001@gmail.com
GMAIL_APP_PASSWORD=

# 구글 시트 연동
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_SHEET_ID=

# 어드민
ADMIN_PASSWORD=
ADMIN_PHONE=
```

---

## 📋 케이스 상태 흐름

```
submitted(접수완료) → reviewing(서류확인) → processing(처리중) → completed(처리완료)
                      ↑ 어드민 수동 변경만 (AI 에이전트 자동변경 제거됨)
```

### 결제 상태 흐름
```
pending → paid(결제완료) → refunded(환불완료)
```

### 카카오 알림톡 발송 흐름
```
결제 완료  → payment 템플릿 + submitted 템플릿 동시 발송
처리 시작  → processing 템플릿 (어드민 상태변경 시)
처리 완료  → completed 템플릿 (어드민 상태변경 시)
환불 완료  → refund 템플릿 (고객 취소 or 어드민 환불 시)
회원가입   → otp 템플릿 (인증번호)
```

---

## 🚀 2026-06-18 작업 내역

### 1. 하단 탭바 렉 개선
- `button + router.push` → `<Link prefetch>` 교체로 탭 이동 시 prefetch 자동 실행
- framer-motion 제거, CSS transition으로 채팅 패널 애니메이션 교체
- `router.prefetch()` on mount 추가 (보조)

### 2. 신청내역 UI 개선 (`OrdersClient.tsx`)
- 하단 고인이름 탭 삭제 (UX 해침)
- **취소하기 버튼** 추가 — `payment_status === 'paid'` + 미완료 케이스에만 노출
- 취소 확인 모달: 고인명, 환불금액 표시 후 확인 시 `/api/payment/refund` 호출
- 환불 완료 건 "✅ 취소 / 환불 완료" 텍스트 표시

### 3. 마이 페이지 개선 (`MyInfoClient.tsx`)
- "결제 정보" 메뉴 삭제
- "결제 내역" → 실제 결제 데이터 모달로 연결
  - `payment_status IN ('paid', 'refunded')` 케이스 목록 조회
  - 각 케이스: 고인명, 신청 서비스 목록, 결제일, 결제금액, 접수번호 표시
  - 환불 건: 빨간 배경 + 환불일 표시

### 4. 카카오 알림톡 아키텍처 전면 개선

#### 문제 1: self-referential fetch (핵심 원인)
- `refund/route.ts`, `verify/route.ts`에서 자기 자신의 `/api/notify/kakao`를 HTTP fetch로 호출
- Vercel 서버리스 환경에서 self-fetch는 불안정 (콜드스타트, 타임아웃)
- **수정**: `src/lib/kakao/sendKakao.ts` 공용 함수 추출 → 모든 route에서 직접 import

#### 문제 2: 환경변수 전부 누락
- `SOLAPI_KAKAO_PFID`, 템플릿 ID 7개가 Vercel에 미설정 상태였음
- Solapi API 직접 쿼리로 PF ID 확인 후 Vercel env add로 전부 추가

#### 카카오 알림 발송 흐름 변경
- 결제 완료 시: `payment` + `submitted` 알림 동시 발송 (신청접수 자동화)
- 어드민 상태 변경: `sendKakao()` 직접 호출 (HTTP fetch 제거)

### 5. loading.tsx 추가
- `src/app/home/loading.tsx`: 홈 탭 전환 시 스켈레톤 UI
- `src/app/home/orders/loading.tsx`: 신청내역 스켈레톤 UI

### 6. 진행바 삭제
- `/apply/_components.tsx`, `/apply/page.tsx`, `/apply/service-info/page.tsx`의 ProgressBar 제거

---

## 🚀 이전 주요 작업 내역 (요약)

| 날짜 | 주요 내용 |
|------|-----------|
| 06-05 | 홈/마이/탭바 UI 개편, 자체 1:1 채팅, 어드민 서류 뷰어 |
| 06-09 | 채팅 시스템 재구축, 어드민 케이스 그룹핑, 온보딩 이름확인 |
| 06-15 | 모바일 터치 개선, 포트원 V2 결제 연동, 환불 기능, 카카오 알림톡 |
| 06-17 | 약관 동의 화면, 서류 업로드 모바일 개선, 어드민 결제관리 페이지 |

---

## 🚀 2026-06-19 작업 내역

### 1. 김비서 AI 에이전트 구축
- **`/api/secretary/morning`** — 매일 아침 08:00 KST 모닝 브리핑 이메일 자동 발송
  - 오늘 할일 체크리스트, 어제 신규 신청 현황, 현재 진행 중 케이스, 미결제 경고
- **`/api/secretary/night`** — 매일 밤 23:00 KST 야간 보고 이메일 자동 발송
  - 오늘 신규 신청 상세(신청인/서비스/결제여부), 당일 총 결제/환불/순매출 요약
- **`/api/secretary/save-todo`** — 내일 할일을 DB에 저장, 다음 날 모닝 브리핑에 반영
- **Vercel Cron** — `vercel.json`에 08:00 / 23:00 KST 스케줄 등록
- **Supabase `secretary_notes` 테이블** 신규 생성
- **`CRON_SECRET`** 환경변수 생성 및 Vercel 등록 (보안 인증)
- **`/퇴근` 슬래시 커맨드** — `.claude/commands/퇴근.md` 등록
- **UserPromptSubmit 훅** — "하루 일과 끝내자", "퇴근", "오늘 마감" 자동 감지

### 2. 카카오 알림톡 아키텍처 개선 (전날 이어서)
- **SOLAPI_KAKAO_PFID 발급** — Solapi API 직접 쿼리로 PF ID 확인 (`KA01PF260615084445678bWiHWK5ED9x`)
- **Vercel 환경변수 7개 추가** — PFID + 템플릿 ID 6개 (submit/processing/complete/payment/refund/otp) 전부 등록

---

## 🚀 2026-06-20 작업 내역

### 1. 사망진단서 OCR UX 단순화
- 고객에게 AI 점수(45점 등) 노출 제거 → 업로드만 하면 다음 단계 진행
- AI 분석 결과(점수·진위·병원명 등)는 백엔드 DB(`case_documents`)에만 저장
- 어드민 케이스 상세에 "🔍 사망진단서 AI 분석 결과" 카드 추가
- Claude 프롬프트에 오늘 날짜 주입 → 미래 날짜 오판 버그 수정

### 2. 서류 첨부 페이지 개편 (`/apply/documents`)
- 상단 8칸 파란 진행바 제거
- 사망진단서만 필요한 플로우 → DOCS 비어있으면 자동으로 서명 단계 시작

### 3. 어드민 신청목록 전면 개편 (`/admin/cases`)
- 고인별 그룹핑 → 신청인 기준 플랫 리스트로 전환
- 컬럼: 접수일시 / 신청인+연락처 / 고인명+서류 / 사망일 / 서비스 / 결제 / 상태 / 상세버튼
- 상태 탭바 + 검색 + 누적 결제액 헤더 추가

### 4. 어드민 대시보드 업데이트
- 최근 신청 테이블에 신청인명·결제금액 컬럼 추가

### 5. 어드민 케이스 상세 개선
- 💳 결제 정보 카드 추가 (결제상태, 금액, 결제ID, 환불일)
- 🔍 사망진단서 AI 분석 카드 추가

### 6. 구글 시트 연동 수정
- `payment/verify` 결제 완료 후 Google Sheets 자동 저장 트리거
- DB 형식(case_services)과 Zustand 스토어 형식 둘 다 지원
- 결제금액·PG결제ID 컬럼(Q·R) 추가

### 7. 홈화면 완료/취소 케이스 숨김
- `.not('status', 'in', '("draft","completed","cancelled")')` 처리

### 8. 신청내역 탭 분리 (`/home/orders`)
- 진행중 / 완료 탭 분리 + 카운트 뱃지
- 완료·취소 케이스 별도 탭으로 이동

### 9. UI 아이콘 정리
- 마이페이지 MenuItem 아이콘 박스 제거 (텍스트만)
- 홈 "서비스 신청 전 준비" 섹션: 실제 브랜드 SVG 아이콘 적용 (페이스북·인스타·X·구글)
- "이런 것도 도와드려요" 카드 이모지 아이콘 제거
- 신청내역 ServiceCard 헤더 아이콘 제거
- About 페이지 나뭇잎 → 에프텀 로고

### 10. 바텀시트 safe-area 수정
- LoginBottomSheet / MyInfoClient 모달 zIndex 310+ 올림 (탭바 zIndex 300 위로)
- `paddingBottom: calc(...px + env(safe-area-inset-bottom))` 적용

### 11. 사망진단서 스캔 효과 (어드민)
- DocViewer 사망진단서 탭: `grayscale(100%) contrast(1.4)` CSS 필터 → 스캔본처럼 표시
- 라이트박스(전체화면)에도 동일 필터 적용

### 12. 서비스 정보 DB 저장 수정
- `service-info` 마지막 서비스 완료 시 `fieldValues` → `case_services.account_id / contact_info` DB 저장
- 결제 후 구글 시트에 계정ID 정보 정상 반영되도록 수정

---

## ✅ 일요일 할일 체크리스트 (2026-06-22)

### 🔴 최우선 — 테스트 & 검증

- [ ] **전체 플로우 end-to-end 테스트** (처음부터 결제까지)
  - 약관동의 → 사망진단서 업로드 → 고인정보 확인 → 서비스선택 → 계정정보 입력 → 서류업로드 → 결제
  - 구글 시트에 계정ID(계정 아이디/이메일/전화) 정상 반영 확인
  - 카카오 알림톡 수신 확인 (결제완료·접수완료 동시 발송)

- [ ] **구글 시트 전체 컬럼 확인**
  - A: 접수일시 / G: 신청인 성명 / I: 플랫폼 / L: 계정ID / Q: 결제금액 모두 채워지는지

- [ ] **환불 플로우 테스트**
  - 신청내역 → 취소하기 → 환불 확인 → 카톡 수신 → 결제내역 환불 표시

### 🟠 바텀시트 safe-area 최종 확인

- [ ] 로그인 바텀시트 하단 버튼 안 잘리는지 실기기 확인
- [ ] 마이페이지 결제내역·알림·이용약관 모달 확인 버튼 확인
- [ ] Chat 패널 입력창 안 잘리는지 확인

### 🟡 어드민 점검

- [ ] 어드민 케이스 상세 → 사망진단서 스캔 효과 (흑백) 확인
- [ ] 어드민 AI 분석 결과 카드 데이터 정상 표시 확인
- [ ] 어드민 결제 정보 카드 정상 표시 확인
- [ ] 개별 서비스 상태 변경 저장 → 카카오 알림 수신 확인

### 🟢 마무리 & 법적 검토 (대표님 직접)

- [ ] **포트원 실결제 MID 심사 현황 확인** (KG이니시스 / 카카오페이)
- [ ] **위임장 법적 내용 검토** — 위임 범위 항목 명시 필요
- [ ] 개인정보처리방침 / 이용약관 실제 내용 채우기
- [ ] 카카오페이 가맹점 심사 현황 확인

---

## 🚨 알려진 버그 / 미완료

- [ ] 위임장 PDF 어드민 다운로드 안 됨 (법적 내용 구체화도 필요)
- [ ] KG이니시스 실결제 MID 심사 대기 중
- [ ] 카카오페이 가맹점 심사 대기 중
- [ ] 사망진단서 실제 제출용 스캔본 PDF 변환 서버 처리 (현재는 CSS 필터로만 표시)
- [ ] 개인정보처리방침 / 이용약관 실제 내용 미작성

---

## 🔐 어드민 접속

- URL: `https://afterm.co.kr/admin-login`
- 비밀번호: `tkwkdsla123!!`
- 쿠키 유효시간: 24시간
