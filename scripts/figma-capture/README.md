# Afterm Figma Screen Importer

베타 서버 페이지를 자동으로 스크린샷 찍어 Figma에 임포트합니다.

---

## 전체 흐름

```
1. 터미널: npm start (스크린샷 캡처 + 로컬 서버)
2. Figma: 플러그인 불러오기
3. 플러그인: Import 버튼 클릭 → 자동 배치
```

---

## Step 1. 의존성 설치

```bash
cd scripts/figma-capture
npm install
npx playwright install chromium
```

---

## Step 2. 스크린샷 캡처

```bash
npm start
```

- 브라우저가 자동으로 열립니다
- **공개 페이지** (홈, 로그인 등)는 자동 캡처
- **로그인 필요 페이지** 전 — 로그인 화면이 열리면 직접 로그인 후 Enter
- 완료 후 `http://localhost:3456` 서버가 자동 시작됩니다

> `--capture` 옵션: 캡처만 (서버 없이)
> `--serve` 옵션: 서버만 (이미 캡처된 경우)

---

## Step 3. Figma 플러그인 불러오기

1. **Figma 데스크탑 앱** 열기
2. 메뉴 → `Plugins` → `Development` → `Import plugin from manifest...`
3. `figma-plugin/manifest.json` 파일 선택
4. 새 플러그인 `Afterm Screen Importer` 실행

---

## Step 4. 임포트

플러그인 UI에서:
1. 서버 연결 확인 (초록 점)
2. 임포트할 스크린 선택 (기본: 전체)
3. 옵션 설정 (열 수, 간격)
4. **"N개 임포트"** 버튼 클릭

→ Figma 캔버스에 `🖥 Afterm Beta Screens` 섹션이 생성됩니다!

---

## 캡처 대상 페이지

| 번호 | 페이지     | 경로                  | 로그인 필요 |
|------|------------|----------------------|:-----------:|
| 01   | 홈         | /                    |             |
| 02   | 로그인     | /login               |             |
| 03   | 회원가입   | /signup              |             |
| 04   | 서비스소개 | /service             |             |
| 05   | 혜택       | /service/benefits    |             |
| 06   | 요금제     | /plans               |             |
| 07   | 소개       | /about               |             |
| 08   | 문의       | /contact             |             |
| 09   | 온보딩     | /onboarding          | ✓           |
| 10   | 대시보드   | /dashboard           | ✓           |
| 11   | 편지작성   | /create              | ✓           |
| 12   | 볼트       | /vault               | ✓           |
| 13   | 스페이스   | /space               | ✓           |
| 14   | AI채팅     | /ai-chat             | ✓           |
| 15   | AI어시스턴트| /ai-assistant       | ✓           |
| 16   | 메모리얼   | /memorial            | ✓           |
| 17   | 설정       | /settings            | ✓           |
| 18   | 수신자     | /recipient           | ✓           |
| 19   | 관리       | /manage              | ✓           |
