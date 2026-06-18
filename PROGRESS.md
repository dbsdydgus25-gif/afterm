# Afterm MVP — 작업 내역 정리

> 브랜치: `main` | 마지막 업데이트: 2026-06-18

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

## ✅ 내일 할일 체크리스트 (2026-06-19)

### 🔴 최우선 (서비스 핵심)

- [ ] **고인정보 확인 단계 — 사망진단서 OCR 연동**
  - 네이버 CLOVA OCR API 연결
  - 사망진단서 1장 업로드 → 고인 이름 / 사망일 자동 추출 → 입력폼 자동 채우기
  - 실패 시 수동 입력으로 fallback

- [ ] **위임장 구체화**
  - 위임장 내용 법적 요건에 맞게 구체화 (위임 범위 명시)
  - 어드민에서 위임장 PDF 다운로드 안 되는 버그 수정
  - 고인명 / 신청인명 / 위임 항목 / 날짜 자동 삽입 확인

- [ ] **카카오 알림톡 실 발송 테스트**
  - 결제 완료 → payment + submitted 알림 실제 수신 확인
  - 환불 → refund 알림 실제 수신 확인
  - 어드민 상태변경 → processing / completed 알림 확인

### 🟠 마이 페이지 빈 부분 체킹

- [ ] 계정 정보 (이름/전화번호) 실제 값 표시 확인
- [ ] 1:1 상담 버튼 동작 확인
- [ ] 알림 설정 모달 내용 점검
- [ ] 개인정보처리방침 / 이용약관 내용 실제 내용으로 채우기

### 🟡 어드민 페이지 개선

- [ ] **위임장 PDF 다운로드 버그 수정** (현재 안 됨)
- [ ] **구글 시트 동기화 프로세스 점검**
  - 신청 접수 시 자동 행 추가 확인
  - 상태 변경 시 컬럼 업데이트 확인
  - 결제 완료 시 금액 기록 확인
- [ ] **어드민 페이지 UX 개선** (일하기 편하게)
  - 케이스 목록 정렬 / 필터 개선
  - 상태변경 버튼 클릭 즉시 반영 (낙관적 업데이트)
  - 불필요한 AI 센터 섹션 제거
- [ ] 어드민 채팅 응대 패널 정상 동작 확인

### 🟢 전체 플로우 검증

- [ ] **신청 전체 플로우 end-to-end 테스트**
  - 약관동의 → 고인정보(OCR) → 서비스선택 → 서류업로드 → 결제 → 완료 확인
- [ ] **결제 후 플로우**: 결제완료 → 신청내역 자동 표시 → 카톡 수신
- [ ] **환불 플로우**: 취소하기 → 환불 처리 → 카톡 수신 → 결제내역에 환불 표시
- [ ] 모바일 실기기 전체 탭 이동 렉 없는지 최종 확인
- [ ] 빠진 기능 없는지 사용자 관점에서 처음부터 전체 앱 순회

---

## 🚨 알려진 버그 / 미완료

- [ ] 위임장 PDF 어드민 다운로드 안 됨
- [ ] 구글 시트 자동 행 추가 (신청 시) 미구현 (상태변경 시 업데이트만 있음)
- [ ] CLOVA OCR env 설정 있으나 UI 미연결
- [ ] KG이니시스 실결제 MID 심사 대기 중
- [ ] 카카오페이 가맹점 심사 대기 중

---

## 🔐 어드민 접속

- URL: `https://afterm.co.kr/admin-login`
- 비밀번호: `tkwkdsla123!!`
- 쿠키 유효시간: 24시간
