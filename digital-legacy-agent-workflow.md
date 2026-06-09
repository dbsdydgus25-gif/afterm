# 디지털 유산 행정 대행 서비스
## AI 에이전트 워크플로우 설계 문서
### Antigravity + Claude 기반 멀티 에이전트 아키텍처

---

## 📌 서비스 범위 확정

### 처리 대상 서비스 및 처리 방식

| 서비스 | 처리 방식 | 비고 |
|--------|----------|------|
| Facebook | 추모 계정 전환 OR 계정 삭제 | 유가족 선택 |
| Instagram | 추모 계정 전환 OR 계정 삭제 | 유가족 선택 |
| 카카오톡 | 추모 계정 전환 OR 계정 해지 | 유가족 선택 / 카카오페이 환불 제외 |
| Google | 계정 삭제 | 데이터 접근 제외, 삭제만 |
| X (Twitter) | 계정 삭제 | 추모 기능 없음 |

### 공통 필요 서류 (3종 — 전 서비스 동일 적용)

1. 유가족 신분증 사본 (주민등록증 or 운전면허증)
2. 가족관계증명서 (상세, 3개월 이내 발급)
3. 사망진단서 또는 사체검안서

> ⚠️ 카카오페이 잔액 환불은 법적 제약(전자금융거래법 + 상속법)으로 인해 제3자 대행 불가. 본 서비스 범위에서 제외. 절차 안내만 제공.

---

## 🗺️ 전체 워크플로우 개요

```
[고객 온보딩]
      ↓
STAGE 1. Intake Agent — 케이스 접수 & 분석
      ↓
STAGE 2. Document Request Agent — 서류 수집 요청 & 알림
      ↓
STAGE 3. Document Verification Agent — 서류 검증
      ↓
      ├─ 검증 실패 → Gap Analysis Agent → STAGE 2로 복귀
      └─ 검증 통과 ↓
STAGE 4. Progress Tracker Agent — 완비 판단
      ↓
      ├─ 미완비 → Gap Analysis Agent → STAGE 2로 복귀
      └─ 완비 ↓
STAGE 5. Draft Agents (서비스별 병렬 실행)
      ├─ Facebook Draft Agent
      ├─ Instagram Draft Agent
      ├─ KakaoTalk Draft Agent
      ├─ Google Draft Agent
      └─ Twitter/X Draft Agent
              ↓
STAGE 6. Final Review Agent — 운영자 검토 패키지 생성
              ↓
      [운영자 최종 확인 후 직접 발송]
```

---

## 🤖 에이전트 상세 명세

---

### STAGE 1 — Intake Agent (케이스 접수 분석 에이전트)

**목적:** 고객 최초 입력을 파싱하여 케이스 객체(Case Object)를 생성하고 전체 워크플로우를 초기화한다.

**트리거:** 고객 신청 폼 제출 완료

**입력값:**
- 고객 이름 (의뢰인 / 유가족)
- 고인 이름
- 고인과의 관계
- 처리 원하는 서비스 목록 (체크박스 선택)
- 각 서비스별 처리 방식 선택 (추모 전환 / 삭제)
- 고인의 각 플랫폼 계정 정보 (이메일, 아이디, URL 등)

**처리 로직:**
```
1. 선택된 서비스 목록 파싱
2. 서비스별 처리 방식 확인 (추모 / 삭제)
3. 공통 필요 서류 3종 체크리스트 생성
4. 서비스별 특이 사항 플래그 설정
   - Instagram 삭제 선택 시 → meta_extra_possible = true 플래그
   - 카카오 선택 시 → kakaopay_guide_needed 여부 확인 질문 트리거
5. Case Object 생성 및 DB 저장
6. 고객에게 접수 완료 알림 발송
7. Document Request Agent 트리거
```

**출력 — Case Object 구조:**
```json
{
  "case_id": "CASE-2024-001",
  "created_at": "2024-01-01T00:00:00Z",
  "requester": {
    "name": "홍길순",
    "relation": "딸",
    "email": "requester@email.com",
    "phone": "010-0000-0000"
  },
  "deceased": {
    "name": "홍길동",
    "birth_date": "1950-01-01"
  },
  "services": [
    { "platform": "facebook", "action": "memorialize", "account_url": "https://facebook.com/xxx" },
    { "platform": "instagram", "action": "delete", "account_url": "https://instagram.com/xxx" },
    { "platform": "kakaotalk", "action": "memorialize", "phone": "010-1234-5678" },
    { "platform": "google", "action": "delete", "email": "xxx@gmail.com" },
    { "platform": "twitter", "action": "delete", "username": "@xxx" }
  ],
  "required_docs": [
    { "doc_id": "ID", "name": "유가족 신분증 사본", "status": "pending" },
    { "doc_id": "FAMILY", "name": "가족관계증명서", "status": "pending" },
    { "doc_id": "DEATH", "name": "사망진단서", "status": "pending" }
  ],
  "flags": {
    "instagram_delete": true,
    "kakaopay_guide_needed": false
  },
  "status": "pending_collection",
  "stage": 2
}
```

**Claude 역할:** 자유 입력 텍스트가 있을 경우 서비스 추출 및 파싱 보조

---

### STAGE 2 — Document Request Agent (서류 수집 요청 에이전트)

**목적:** 고객에게 미수집 서류를 안내하고 업로드를 요청한다. 리마인더도 관리한다.

**트리거:**
- Intake Agent 완료 시 최초 실행
- Gap Analysis Agent가 재요청 트리거 시
- 리마인더 스케줄러 도달 시

**처리 로직:**
```
1. Case Object에서 status: "pending" 서류 목록 추출
2. Claude로 고객 친화적 안내 메시지 생성
   - 어떤 서류가 필요한지
   - 어디서 발급받는지 (정부24 링크 등)
   - 어떻게 업로드하는지
3. 이메일 + 카카오 알림톡으로 발송
4. 리마인더 스케줄 등록
   - 3일 미제출 시 1차 리마인더
   - 7일 미제출 시 2차 리마인더 + 운영자 알림
   - 14일 미제출 시 케이스 보류 처리 + 운영자 에스컬레이션
```

**발송 메시지 예시 (Claude 생성):**
```
안녕하세요, 홍길순 님.

디지털 유산 행정 대행 서비스 접수가 완료되었습니다.
원활한 처리를 위해 아래 서류 3가지를 업로드해 주세요.

✅ 유가족 신분증 사본 (주민등록증 또는 운전면허증 앞면)
✅ 가족관계증명서 (정부24에서 발급, 상세 발급, 3개월 이내)
✅ 사망진단서 또는 사체검안서 (병원 발급)

📎 서류 업로드: [업로드 링크]

서류 준비가 어려우신 경우 언제든지 문의해 주세요.
```

**출력:** 발송 로그, 리마인더 스케줄 등록 완료

---

### STAGE 3 — Document Verification Agent (서류 검증 에이전트)

**목적:** 고객이 업로드한 파일이 올바른 서류인지 자동 검증한다.

**트리거:** 고객 파일 업로드 완료 이벤트

**처리 로직:**
```
1. 업로드된 파일 수신 (PDF, JPG, PNG 지원)
2. Claude Vision으로 문서 분석
3. 검증 항목 체크
   A. 문서 종류 판별 — 요청한 서류가 맞는지
   B. 발급일 확인 — 가족관계증명서 3개월 이내 여부
   C. 공식 직인 / 서명 존재 여부
   D. 고인 성명 일치 여부 — Case Object의 deceased.name과 대조
   E. 신청인 성명 일치 여부 — 신분증, 가족관계증명서 신청인명 대조
   F. 이미지 품질 — 흐릿하거나 잘림 여부
4-A. 검증 통과 → Case Object의 해당 서류 status: "verified" 업데이트
               → Progress Tracker Agent 트리거
4-B. 검증 실패 → 실패 사유 포함 재제출 요청 메시지 생성
               → Gap Analysis Agent로 재요청 트리거
```

**Claude Vision 프롬프트 구조:**
```
당신은 한국 행정 문서 검증 전문가입니다.
아래 이미지를 분석하고 JSON으로 응답해 주세요.

케이스 정보:
- 고인 성명: {deceased.name}
- 신청인 성명: {requester.name}
- 요청 서류 종류: {requested_doc_type}

검증 항목:
1. doc_type: 실제 문서 종류 (사망진단서/가족관계증명서/신분증/기타)
2. name_match: 고인 또는 신청인 성명 일치 여부 (true/false)
3. issue_date: 발급일 (YYYY-MM-DD, 없으면 null)
4. has_official_seal: 직인 또는 서명 존재 여부 (true/false)
5. image_quality: 이미지 품질 (good/poor)
6. is_valid: 최종 유효 여부 (true/false)
7. rejection_reason: 실패 시 사유 (없으면 null)
```

**검증 실패 메시지 예시:**
```
업로드하신 서류를 확인했습니다.
아래 사유로 재제출이 필요합니다.

❌ 가족관계증명서 — 발급일이 3개월을 초과했습니다.
   정부24(gov.kr)에서 새로 발급 후 다시 업로드해 주세요.
```

---

### STAGE 3.5 — Gap Analysis Agent (보완 요청 에이전트)

**목적:** 단순 재요청이 아니라 왜 서류가 부족하거나 실패했는지 맥락을 파악하고 맞춤 안내를 생성한다.

**트리거:**
- Document Verification Agent 검증 실패 시
- Progress Tracker Agent가 장기 미수집 감지 시

**처리 로직:**
```
1. 실패 사유 또는 미수집 사유 분석
2. 상황별 맞춤 안내 생성 (Claude)
   케이스 A: 이미지 품질 불량 → 재촬영 가이드 + 올바른 예시 제공
   케이스 B: 발급일 초과 → 재발급 방법 안내 (정부24 링크)
   케이스 C: 잘못된 서류 업로드 → 올바른 서류 설명 제공
   케이스 D: 장기 미응답 → 도움 필요 여부 확인 + 운영자 개입 옵션
3. Document Request Agent 재트리거
```

---

### STAGE 4 — Progress Tracker Agent (진행 상태 추적 에이전트)

**목적:** 서류 수집 완비 여부를 실시간 추적하고 다음 단계 진입 조건을 판단한다.

**트리거:** Document Verification Agent가 서류 status 업데이트할 때마다 실행

**처리 로직:**
```
1. Case Object의 required_docs 전체 상태 확인
2. 완비 조건 판단
   - 전체 서류 status = "verified" → 완비 판정
3. 완비 판정 시
   → 모든 Draft Agent 병렬 트리거
   → 고객에게 "서류 수집 완료, 신청서 작성 중" 알림 발송
4. 미완비 판정 시
   → 미수집 서류 목록 추출
   → Gap Analysis Agent 트리거
5. 고객 대시보드 상태 실시간 업데이트
```

**고객 대시보드 상태값:**
```
접수 완료 → 서류 수집 중 → 서류 검증 중 → 신청서 작성 중 → 검토 대기 중 → 처리 완료
```

---

### STAGE 5 — Draft Agents (서비스별 신청서 작성 에이전트)

모든 서류 완비 확인 후 **5개 에이전트가 병렬로 실행**된다.

---

#### 5-A. Facebook Draft Agent

**처리 방식:** 추모 전환 OR 삭제 (Case Object의 action 값에 따라 분기)

**추모 전환 신청 시 출력:**
```
[Meta 추모 계정 전환 요청 양식 입력값 패키지]
신청 URL: facebook.com/special/contact/deceased
- Deceased's full name: {deceased.name}
- Facebook profile URL: {account_url}
- Your full name: {requester.name}
- Your relationship: {relation}
- Date of passing: {death_date}
첨부 파일: 사망진단서.pdf, 신분증.pdf, 가족관계증명서.pdf
```

**계정 삭제 신청 시 출력:**
```
[Meta 계정 삭제 요청 양식 입력값 패키지]
신청 URL: facebook.com/help/contact/228813257197480
- Deceased's full name: {deceased.name}
- Facebook profile URL: {account_url}
- Your name: {requester.name}
- Relationship to deceased: {relation}
첨부 파일: 사망진단서.pdf, 신분증.pdf, 가족관계증명서.pdf
```

---

#### 5-B. Instagram Draft Agent

**처리 방식:** 추모 전환 OR 삭제 (Case Object의 action 값에 따라 분기)

**추모 전환 신청 시 출력:**
```
[Instagram 추모 계정 전환 요청 양식 입력값 패키지]
신청 URL: help.instagram.com/contact/452224988254813
- Deceased's Instagram username: {username}
- Your full name: {requester.name}
- Your relationship: {relation}
첨부 파일: 사망진단서.pdf, 신분증.pdf, 가족관계증명서.pdf
```

**계정 삭제 신청 시 출력:**
```
[Instagram 계정 삭제 요청 양식 입력값 패키지]
신청 URL: help.instagram.com/contact/1474899482730688
- Deceased's Instagram username: {username}
- Your full name: {requester.name}
- Your relationship: {relation}
첨부 파일: 사망진단서.pdf, 신분증.pdf, 가족관계증명서.pdf
```

**⚠️ 삭제 선택 시 Final Review Agent 경고 메모:**
```
Instagram 삭제 케이스는 Meta 심사 중 추가 서류
(법적 대리인 자격 증빙 등) 요청 가능성 있음.
Meta 응답 수신 후 보완 서류 대응 루프 대기 필요.
```

---

#### 5-C. KakaoTalk Draft Agent

**처리 방식:** 추모 전환 OR 계정 해지 (Case Object의 action 값에 따라 분기)

**추모 전환 신청 시 출력:**
```
[카카오 고객센터 제출용 추모 계정 전환 요청서]
수신: 카카오 고객센터 (cs.kakao.com)
제목: 사망자 카카오 계정 추모 전환 요청

안녕하세요.
저는 고인 {deceased.name}(생년월일: {birth_date})의
{relation} {requester.name}입니다.
고인의 카카오 계정(등록 전화번호: {phone})에 대해
추모 계정 전환을 요청드립니다.

첨부 서류:
1. 사망진단서
2. 가족관계증명서
3. 신청인 신분증 사본

연락처: {requester.email} / {requester.phone}
```

**계정 해지 신청 시 출력:**
```
[카카오 고객센터 제출용 계정 해지 요청서]
수신: 카카오 고객센터 (cs.kakao.com)
제목: 사망자 카카오 계정 해지 요청

안녕하세요.
저는 고인 {deceased.name}(생년월일: {birth_date})의
{relation} {requester.name}입니다.
고인의 카카오 계정(등록 전화번호: {phone})에 대해
계정 해지를 요청드립니다.

첨부 서류:
1. 사망진단서
2. 가족관계증명서
3. 신청인 신분증 사본

연락처: {requester.email} / {requester.phone}
```

**카카오페이 안내 플래그 (kakaopay_guide_needed = true 시):**
```
카카오페이 잔액 환불은 법적 제약으로 인해 대행이 불가합니다.
상속인 본인이 직접 카카오페이 고객센터(1644-7405)에
문의하시거나 cs.kakaopay.com을 통해 직접 신청하셔야 합니다.
```

---

#### 5-D. Google Draft Agent

**처리 방식:** 삭제 전용

**출력:**
```
[Google 사망자 계정 삭제 요청 패키지]
신청 URL: support.google.com/accounts/troubleshooter/6357590

Step 1 입력값:
- Deceased person's Gmail address: {email}
- Your name: {requester.name}
- Your email address: {requester.email}
- Your relationship to the deceased: {relation}
- Country: South Korea

Step 2 첨부 파일:
- 사망진단서.pdf
- 신분증.pdf (신청인)
- 가족관계증명서.pdf

운영자 안내:
Google은 신청 후 검토 기간이 2~6주 소요될 수 있습니다.
데이터 다운로드가 필요한 경우 법원 상속 결정문이 추가로
필요하며 이는 본 서비스 범위 외입니다.
```

---

#### 5-E. Twitter/X Draft Agent

**처리 방식:** 삭제 전용

**이메일 초안 출력:**
```
수신: privacy@x.com
제목: Request for Account Deactivation of Deceased User - {username}

Dear X Privacy Team,

I am writing to request the deactivation and removal of the
following account belonging to my deceased {relation}.

Account Information:
- Username: {username}
- Account holder's name: {deceased.name}
- Date of passing: {death_date}

Requester Information:
- Name: {requester.name}
- Relationship to deceased: {relation}
- Contact email: {requester.email}

I have attached the following documents to verify
my identity and relationship to the deceased:
1. Death Certificate
2. Government-issued ID of the requester
3. Family Relationship Certificate (Korean official document)

Please process this request at your earliest convenience.
If you require any additional information, please contact
me at the email address above.

Sincerely,
{requester.name}

Attachments:
- death_certificate.pdf
- requester_id.pdf
- family_certificate.pdf
```

---

### STAGE 6 — Final Review Agent (최종 검토 패키지 에이전트)

**목적:** 모든 Draft Agent 완료 후 운영자가 한눈에 검토할 수 있는 최종 패키지를 생성한다.

**트리거:** 모든 활성화된 Draft Agent 완료 시

**운영자 검토 대시보드 출력:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
케이스 번호: CASE-2024-001
의뢰인: 홍길순 (딸)
고인: 홍길동
접수일: 2024-01-01
서류 완비일: 2024-01-05
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ Facebook — 추모 계정 전환
  신청 URL: facebook.com/special/contact/deceased
  첨부 파일: 3종 완비 ✅
  [양식 입력값 보기] [첨부 파일 확인]

■ Instagram — 계정 삭제
  신청 URL: help.instagram.com/contact/1474899482730688
  첨부 파일: 3종 완비 ✅
  ⚠️ 주의: Meta 심사 중 추가 서류 요청 가능성 있음
  [양식 입력값 보기] [첨부 파일 확인]

■ 카카오톡 — 계정 해지
  신청 방법: cs.kakao.com 1:1 문의
  첨부 파일: 3종 완비 ✅
  [요청서 초안 보기] [첨부 파일 확인]

■ Google — 계정 삭제
  신청 URL: support.google.com/accounts/troubleshooter/6357590
  첨부 파일: 3종 완비 ✅
  [양식 입력값 보기] [첨부 파일 확인]

■ Twitter/X — 계정 삭제
  수신 이메일: privacy@x.com
  첨부 파일: 3종 완비 ✅
  [이메일 초안 보기] [첨부 파일 확인]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[전체 검토 완료 — 운영자 발송 진행]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**운영자 발송 후 처리:**
```
1. 발송 완료 표시 (서비스별)
2. 발송 일시 기록
3. 고객에게 "신청 완료" 알림 발송
   → 각 플랫폼 예상 처리 기간 안내
      - Facebook/Instagram: 1~4주
      - 카카오톡: 1~3주
      - Google: 2~6주
      - Twitter/X: 2~8주
4. 후속 팔로업 스케줄 등록 (플랫폼별 예상 처리 기간 기준)
```

---

## 🔄 예외 처리 & 보완 루프

### Instagram 추가 서류 요청 대응 루프
```
Meta로부터 추가 서류 요청 응답 수신
→ 운영자가 요청 내용 시스템 입력
→ Gap Analysis Agent 트리거
→ 고객에게 추가 서류 안내
→ Document Request Agent → Verification → Draft 재생성 → Final Review
```

### 장기 미응답 케이스 처리
```
3일:  1차 리마인더 (자동 발송)
7일:  2차 리마인더 + 운영자 알림 (자동)
14일: 케이스 보류 상태 전환 + 운영자 수동 개입 필요 알림
30일: 케이스 자동 만료 처리 (운영자 확인 후 최종 확정)
```

### 서류 재검증 반복 실패 처리
```
동일 서류 3회 연속 검증 실패 시
→ 운영자 알림 발송
→ 운영자가 직접 고객 연락하여 수동 처리 진행
```

---

## 🛠️ 기술 스택 역할 분담

### Antigravity 담당 영역
- 에이전트 간 데이터 라우팅 및 트리거 관리
- Case Object 상태 DB 관리 (실시간 업데이트)
- 파일 업로드 / 저장 파이프라인
- 알림 발송 연동 (이메일, 카카오 알림톡)
- 리마인더 스케줄러
- 운영자 대시보드 UI
- 고객 진행 상태 대시보드

### Claude 담당 영역

| 에이전트 | Claude 역할 |
|----------|------------|
| Intake Agent | 자유 텍스트 파싱, 서비스 추출 |
| Document Request Agent | 고객 친화적 안내 메시지 생성 |
| Document Verification Agent | Vision으로 문서 판별 및 유효성 검증 |
| Gap Analysis Agent | 상황별 맞춤 보완 안내 문구 생성 |
| Draft Agents (전체) | 서비스별 신청서 / 이메일 초안 작성 |
| Final Review Agent | 최종 패키지 요약 생성 |

---

## 📋 에이전트 전체 목록 요약

| # | 에이전트명 | 역할 | 트리거 방식 |
|---|-----------|------|------------|
| 1 | Intake Agent | 케이스 접수 & 분석 | 고객 폼 제출 |
| 2 | Document Request Agent | 서류 수집 요청 & 리마인더 | Intake 완료 / Gap Agent / 스케줄러 |
| 3 | Document Verification Agent | 서류 검증 (Claude Vision) | 파일 업로드 이벤트 |
| 3.5 | Gap Analysis Agent | 보완 서류 맞춤 안내 | 검증 실패 / 장기 미수집 |
| 4 | Progress Tracker Agent | 완비 판단 & 상태 추적 | Verification 완료 시 |
| 5-A | Facebook Draft Agent | Facebook 신청서 작성 | Progress Tracker 완비 판정 |
| 5-B | Instagram Draft Agent | Instagram 신청서 작성 | Progress Tracker 완비 판정 |
| 5-C | KakaoTalk Draft Agent | 카카오톡 요청서 작성 | Progress Tracker 완비 판정 |
| 5-D | Google Draft Agent | Google 신청 패키지 작성 | Progress Tracker 완비 판정 |
| 5-E | Twitter/X Draft Agent | X 이메일 초안 작성 | Progress Tracker 완비 판정 |
| 6 | Final Review Agent | 운영자 검토 패키지 생성 | 모든 Draft Agent 완료 |

---

## ⏱️ 예상 처리 타임라인

```
Day 0    : 고객 접수 완료 (Intake Agent 실행)
Day 0    : 서류 요청 알림 발송 (Document Request Agent)
Day 1~3  : 고객 서류 업로드 (일반적 케이스)
Day 1~3  : 서류 검증 완료 (즉시 자동 처리)
Day 3~4  : 신청서 초안 작성 완료 (즉시 자동 처리)
Day 4~5  : 운영자 검토 및 발송

대행 총 소요 시간 (서류 완비 기준): 약 1~2 영업일
플랫폼 처리 대기 시간 (발송 후):
  - Facebook/Instagram: 1~4주
  - 카카오톡: 1~3주
  - Google: 2~6주
  - Twitter/X: 2~8주
```

---

## 🚫 서비스 제외 항목 (명시적 범위 외)

- 카카오페이 잔액 환불 직접 대행 (법적 제약으로 불가, 절차 안내만 제공)
- Google 계정 데이터 접근 / 다운로드 (법원 서류 필요, 별도 서비스)
- 각 플랫폼 로그인 대리 수행
- 비밀번호 복구 대행
- 법적 상속 분쟁 개입
- 플랫폼 응답 후 추가 팔로업 대응 (운영자 수동 처리)

---

*문서 버전: v1.0*
*서비스 범위: Facebook / Instagram / KakaoTalk / Google / Twitter(X)*
*카카오페이 환불 대행 제외*
