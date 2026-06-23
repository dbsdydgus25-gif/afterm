# Afterm MVP — 작업 내역 정리

> 브랜치: `main` | 마지막 업데이트: 2026-06-23

---

## 🏗️ 전체 구조

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 14 App Router |
| 인증 | Supabase Auth (카카오 OAuth) |
| DB | Supabase (PostgreSQL + RLS) |
| 결제 | PortOne V2 (KG이니시스 + 카카오페이) |
| 알림 | Solapi 카카오 알림톡 + SMS OTP |
| 배포 | Vercel (`git push origin main` 으로만 배포) |
| 어드민 인증 | 쿠키 기반 (`admin_session`) |

---

## 📁 주요 파일 & 역할

```
src/
├── proxy.ts                              # Next.js 미들웨어 (인증 라우팅)
├── store/useApplyStore.ts                # Zustand persist — 신청 플로우 상태
├── lib/
│   ├── kakao/sendKakao.ts               # 카카오 알림톡 공용 함수
│   └── supabase/admin.ts                # Supabase Admin Client
├── app/
│   ├── page.tsx                         # 랜딩 페이지 (로그인 상태 분기)
│   ├── apply/page.tsx                   # 신청 플로우 (약관→사망진단서→신청인→서비스→결제)
│   ├── admin/
│   │   ├── page.tsx                     # 어드민 대시보드
│   │   ├── cases/page.tsx               # 신청 목록
│   │   ├── cases/[caseId]/page.tsx      # 케이스 상세 + 위임장 다운로드
│   │   ├── payments/page.tsx            # 결제 관리
│   │   └── promo/page.tsx               # 베타 코드 관리
│   └── api/
│       ├── verify/send-otp/route.ts     # Solapi SMS OTP 발송
│       ├── verify/check-otp/route.ts    # HMAC OTP 검증
│       ├── payment/verify/route.ts      # 결제 검증 + 구글시트 + 알림톡
│       ├── promo/validate/route.ts      # 프로모 코드 검증
│       ├── promo/apply/route.ts         # 0원 결제 처리 + 구글시트 + 알림톡
│       └── admin/cases/[caseId]/
│           └── delegation-pdf/route.ts  # 위임장 PDF 생성
```

---

## 🔑 환경변수 (Vercel 설정 완료 목록)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Solapi
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_NUMBER=
SOLAPI_KAKAO_PFID=KA01PF260615084445678bWiHWK5ED9x
SOLAPI_KAKAO_SUBMIT_TEMPLATE_ID=KA01TP260615084732913xaw3HWNjJPk
SOLAPI_KAKAO_PROCESSING_TEMPLATE_ID=KA01TP260615122342986eh9S82hu0Jo
SOLAPI_KAKAO_COMPLETE_TEMPLATE_ID=KA01TP260615123354909J5sCGxAq8O3
SOLAPI_KAKAO_PAYMENT_TEMPLATE_ID=KA01TP260617073154295DjvzhK7wAPJ
SOLAPI_KAKAO_REFUND_TEMPLATE_ID=KA01TP260617073227184l5mWCWMsdIn
SOLAPI_KAKAO_OTP_TEMPLATE_ID=KA01TP260617073822823nnIbC4taeKs

# PortOne V2
NEXT_PUBLIC_PORTONE_STORE_ID=
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=
NEXT_PUBLIC_PORTONE_KAKAO_CHANNEL_KEY=
PORTONE_API_SECRET=

# 사업자 정보 (위임장 PDF용)
AFTERM_BUSINESS_REG=221-20-19292
AFTERM_CEO_NAME=윤용현
AFTERM_ADDR=경기도 평택시 지산로 128, 107동 9층 901호

# Gmail SMTP
GMAIL_USER=afterm001@gmail.com
GMAIL_APP_PASSWORD=

# 구글 시트 연동
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_SHEET_ID=

# OTP
OTP_SECRET=

# 어드민
ADMIN_PASSWORD=
ADMIN_PHONE=
CRON_SECRET=
```

---

## 📋 케이스 상태 흐름

```
submitted(접수완료) → reviewing(서류확인) → processing(처리중) → completed(처리완료)
```

### 결제 상태 흐름
```
pending → paid(결제완료) → refunded(환불완료)
프로모 코드 → paid(0원, payment_id: promo-CODE-caseId[:8])
```

---

## 🚀 2026-06-22 작업 내역

### 1. 위임장 PDF 전면 재설계
- 한국 법무 문서 형식 (제1~5조 구성, 당사자 표, 서명란)
- 한글 글자 깨짐 수정: `charW()` + `drawStr()` 함수로 글자별 수동 위치 지정
- Supabase RLS join 우회: `delegations` 별도 쿼리로 조회
- 사업자 정보 env var에서 자동 기입

### 2. 베타 테스트 프로모 코드 시스템
- `promo_codes` + `promo_code_uses` Supabase 테이블 생성
- AFTERM001~050 코드 50개 생성 (90일 유효, AFTERM001은 max_uses=9999로 무제한)
- `/api/promo/validate` — 코드 유효성 검증
- `/api/promo/apply` — 0원 결제 처리 + 구글시트 + 카카오 알림톡
- 결제 페이지에 프로모 코드 입력 UI 추가
- 어드민 `/admin/promo` 베타 코드 관리 페이지 추가

### 3. SMS OTP 실발송 연동 (Solapi)
- HMAC-SHA256 인증 헤더 구현
- 프로덕션: devCode 미노출 / 개발: devCode 화면 표시
- 10분 유효 시간 윈도우 검증

### 4. 사망진단서 업로드 UX 개선
- 이모지 제거 → "사진 촬영" / "파일 업로드" 텍스트 버튼
- OCR 확인 화면 "성함" → "고인 성함"
- 관계 질문: 신청인 이름 → 고인 이름으로 표시

### 5. 구글 시트 / 어드민 신청인 정보 수정
- Supabase RLS join 이슈로 `delegations` 별도 쿼리 패턴 전면 적용
- 어드민 대시보드: delegationMap 방식으로 신청인 정보 정상 표시
- payment/verify, promo/apply: delegationFresh로 구글시트 G/H/N 컬럼 정상 저장

### 6. 홈 페이지 개선
- 로그인 상태 분기: 로그인 시 CTA → `/apply` 직행 / 미로그인 → 로그인 시트
- 헤더 버튼: 로그인 시 "내 신청" → `/home`, 미로그인 시 "로그인"
- "선착순 50명 무료 이벤트" 배너 삭제

### 7. 신청 플로우 — 신청인 주소 수집 추가
- StepApplicant에 주소 입력 단계 추가 (총 5단계로 확장)
- `delegations.delegator_address` 컬럼 DB 생성 + 저장
- 내일: 네이버 주소 API 연동 예정

### 8. 위임장 워드(.docx) 양식 제작
- 실제 한국 법문서 형식 (흑백, 테이블 기반)
- 제1조 위임인 / 제2조 수임인 / 제3조 고인 정보 / 제4조 위임 내용 / 제5조 특기사항
- 위임인·수임인 양쪽 서명란 및 (인) 도장칸 포함
- 바탕화면 `위임장_에프텀.docx` 저장

---

## 🚀 2026-06-23 작업 내역

### 1. 위임장 PDF 401 에러 버그 수정 (개발팀)
- 일반 유저가 마이페이지에서 "위임장 확인" 클릭 시 401 에러 발생 → 수정 완료
- 유저용 API 엔드포인트 `/api/cases/[caseId]/delegation-pdf` 신규 생성 (어드민 전용이었던 것을 분리)
- git push origin main 완료 (배포됨)
- 추가 발견: `delegations.delegator_address` 컬럼 누락으로 위임장 PDF 주소 항상 빈칸 출력
  - 마이그레이션 SQL 파일 생성됨 → **대표님이 Supabase에서 직접 실행 필요**

### 2. 플랫폼 문의처 조사 (전략기획팀)
- 카카오/구글/인스타/페북/트위터(X) 5개 플랫폼 고인 계정 처리 정책 파악 완료
- 결론: 이메일 문의 불가, 모두 공식 온라인 폼으로만 접수
- 구글, 인스타, 페북, 트위터(X): 위임장 기반 제3자 대행 정책적으로 허용 (명문화 확인)
- 카카오: 정책 불명확 → 고객센터 먼저 문의 후 서면 회신 필요
- 카카오 공식 PDF 폼 발견: `고인 계정 탈퇴 처리 요청서.pdf` → 자동 생성 기능 개발 예정

### 3. 온라인 마케팅 채널 전략 수립 (마케팅팀)
- 채널 구축 순서 확정: 네이버 블로그 → 인스타그램 → 카카오 오픈채널 → 유튜브
- 1주 내 시작: 네이버 블로그 개설 + 첫 글 ("카카오 계정, 가족이 해지 신청할 수 있나요?")
- 인스타그램 계정명 확정: @afterm.kr
- 30일 콘텐츠 계획 수립 완료

---

## 📋 2026-06-24 내일 할일 체크리스트

### 🔴 최우선 — 서비스 동작 직결 (대표님 직접)

- [ ] **[Supabase] delegator_address 컬럼 마이그레이션 SQL 실행** — 위임장 주소 빈칸 문제 해결 (개발팀 SQL 파일 수령 후 실행)
- [ ] **[Supabase] delegator_address 컬럼 정상 저장 확인** — 마이그레이션 후 테스트 신청으로 주소 저장 여부 확인

### 🔴 최우선 — 핵심 기능 (개발팀)

- [ ] **네이버 주소 API 연동** — 신청인 주소 입력에 주소 검색 팝업 추가
- [ ] **위임장 PDF 주소 반영** — delegator_address → PDF 위임인 주소 칸 자동 기입
- [ ] **카카오 공식 폼 PDF 자동 생성** — `고인 계정 탈퇴 처리 요청서.pdf` 케이스별 자동 생성
- [ ] **AFTERM001 무제한 코드로 전체 플로우 end-to-end 테스트**

### 🟠 외부 기관 대응 (대표님 직접) — [외부기관]

- [ ] **[카카오] 고인 계정 처리 대행 가능 여부 고객센터 문의** — 서면 회신 요청, 정책 확정 전 서비스 안내 문구 보수적으로 유지
- [ ] **[포트원] KG이니시스 실결제 MID 심사 현황 확인**
- [ ] **[포트원] 카카오페이 가맹점 심사 현황 확인**

### 🟠 마케팅 실행 (대표님 직접)

- [ ] **네이버 블로그 계정 개설** — 비용 없음
- [ ] **첫 글 발행**: "카카오 계정, 가족이 해지 신청할 수 있나요?" — SEO 핵심 키워드 글
- [ ] **인스타그램 @afterm.kr 계정 개설** — 비용 없음

### 🟡 법적/운영 (대표님 직접)

- [ ] **위임장 워드 파일 법적 검토** — 변호사 또는 법무사 검토 의뢰 권장 (비용 발생)
- [ ] **개인정보처리방침 / 이용약관 실제 내용 작성** — 법무 전문가 검토 권장 (비용 발생)

### 🟢 중장기 기획 (결정 필요)

- [ ] **고인 아이디 찾기 기능 방향 결정** — 1안(영상 업로드+Vision API), 2안(e프라이버시 PDF), 3안(mbox 파일) 중 채택
- [ ] **사업기획 에이전트 & 마케팅 에이전트** 정식 구축 및 운영 체계 수립

---

## 🚨 알려진 버그 / 미완료

- [ ] **위임장 PDF 주소 빈칸** — delegator_address 컬럼 마이그레이션 필요 (대표님 Supabase 실행 대기 중)
- [ ] 네이버 주소 API 미연동 (개발 예정)
- [ ] 카카오 고인 계정 대행 정책 불명확 (고객센터 문의 필요)
- [ ] KG이니시스 실결제 MID 심사 대기 중
- [ ] 카카오페이 가맹점 심사 대기 중
- [ ] 개인정보처리방침 / 이용약관 실제 내용 미작성
- [ ] 고인 아이디 찾기 기능 미구현 (기획 단계)

---

## 🔐 어드민 접속

- URL: `https://afterm.co.kr/admin-login`
- 비밀번호: `tkwkdsla123!!`
- 쿠키 유효시간: 24시간
