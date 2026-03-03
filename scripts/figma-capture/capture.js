/**
 * Afterm 베타 서버 스크린샷 캡처 스크립트
 *
 * 사용법:
 *   node capture.js           → 캡처 + 서버 시작
 *   node capture.js --capture → 캡처만
 *   node capture.js --serve   → 서버만 (이미 캡처한 경우)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const BASE_URL = 'http://localhost:3000'; // beta-v2.0 로컬 개발 서버
const SERVER_PORT = 3456;
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// ──────────────────────────────────────────────
// 캡처할 페이지 목록
// ──────────────────────────────────────────────
const PUBLIC_PAGES = [
  { name: '01_홈',          path: '/' },
  { name: '02_로그인',      path: '/login' },
  { name: '03_회원가입',    path: '/signup' },
  { name: '04_서비스소개',  path: '/service' },
  { name: '05_혜택',        path: '/service/benefits' },
  { name: '06_요금제',      path: '/plans' },
  { name: '07_소개',        path: '/about' },
  { name: '08_문의',        path: '/contact' },
];

const AUTH_PAGES = [
  { name: '09_온보딩',      path: '/onboarding' },
  { name: '10_대시보드',    path: '/dashboard' },
  { name: '11_편지작성',    path: '/create' },
  { name: '12_볼트',        path: '/vault' },
  { name: '13_스페이스',    path: '/space' },
  { name: '14_AI채팅',      path: '/ai-chat' },
  { name: '15_AI어시스턴트',path: '/ai-assistant' },
  { name: '16_메모리얼',    path: '/memorial' },
  { name: '17_설정',        path: '/settings' },
  { name: '18_수신자',      path: '/recipient' },
  { name: '19_관리',        path: '/manage' },
];

// 모바일 뷰포트 (iPhone 14 Pro)
const VIEWPORT = { width: 390, height: 844 };

// ──────────────────────────────────────────────
// 스크린샷 캡처
// ──────────────────────────────────────────────
async function captureScreenshots() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false }); // 로그인 확인용 headed 모드
  const metadata = [];

  // ── 1단계: 공개 페이지 캡처 ──
  console.log('\n📸 공개 페이지 캡처 시작...\n');
  for (const page of PUBLIC_PAGES) {
    await capturePage(browser, page, metadata);
  }

  // ── 2단계: 로그인 안내 ──
  console.log('\n🔐 로그인이 필요한 페이지를 캡처합니다.');
  console.log('   브라우저에서 로그인해 주세요.');
  console.log('   로그인 완료 후 Enter를 누르세요...\n');

  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const loginPage = await context.newPage();
  await loginPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

  // 사용자가 로그인 완료할 때까지 대기
  await waitForEnter();

  // ── 3단계: 인증 필요 페이지 캡처 ──
  console.log('\n📸 인증 페이지 캡처 시작...\n');
  for (const page of AUTH_PAGES) {
    await capturePageWithContext(context, page, metadata);
  }

  await loginPage.close();
  await context.close();
  await browser.close();

  // 메타데이터 저장
  fs.writeFileSync(
    path.join(SCREENSHOTS_DIR, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log(`\n✅ 총 ${metadata.length}개 페이지 캡처 완료!`);
  console.log(`   저장 위치: ${SCREENSHOTS_DIR}\n`);
  return metadata;
}

async function capturePage(browser, pageInfo, metadata) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await capturePageWithContext(context, pageInfo, metadata, page);
  } finally {
    await context.close();
  }
}

async function capturePageWithContext(context, pageInfo, metadata, existingPage) {
  const page = existingPage || await context.newPage();
  const filename = `${pageInfo.name}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);

  try {
    await page.goto(`${BASE_URL}${pageInfo.path}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 애니메이션 안정화 대기
    await page.waitForTimeout(1500);

    // 스크롤바 숨기기
    await page.addStyleTag({
      content: `
        ::-webkit-scrollbar { display: none !important; }
        * { scrollbar-width: none !important; }
      `
    });

    // 전체 페이지 스크린샷 (스크롤 포함)
    await page.screenshot({
      path: filepath,
      fullPage: true,
      type: 'png',
    });

    // 실제 페이지 크기 계산
    const dimensions = await page.evaluate(() => ({
      width: document.body.scrollWidth,
      height: document.body.scrollHeight,
    }));

    console.log(`  ✓ ${pageInfo.name} (${dimensions.width}×${dimensions.height})`);
    metadata.push({
      name: pageInfo.name,
      path: pageInfo.path,
      filename,
      width: dimensions.width * 2,  // deviceScaleFactor 2
      height: dimensions.height * 2,
    });
  } catch (err) {
    console.error(`  ✗ ${pageInfo.name} 실패: ${err.message}`);
  }
}

function waitForEnter() {
  return new Promise(resolve => {
    process.stdin.setEncoding('utf8');
    process.stdout.write('  → Enter를 누르면 계속합니다: ');
    process.stdin.once('data', resolve);
  });
}

// ──────────────────────────────────────────────
// 로컬 HTTP 서버 (Figma 플러그인용)
// ──────────────────────────────────────────────
function startServer() {
  const server = http.createServer((req, res) => {
    // CORS 허용 (Figma 플러그인에서 접근 가능)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // GET /metadata → 스크린샷 목록
    if (req.url === '/metadata') {
      const metaPath = path.join(SCREENSHOTS_DIR, 'metadata.json');
      if (!fs.existsSync(metaPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '캡처를 먼저 실행하세요 (--capture)' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(fs.readFileSync(metaPath));
      return;
    }

    // GET /screenshot/:filename → 이미지 파일
    if (req.url?.startsWith('/screenshot/')) {
      const filename = decodeURIComponent(req.url.replace('/screenshot/', ''));
      const filepath = path.join(SCREENSHOTS_DIR, filename);
      if (!fs.existsSync(filepath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(fs.readFileSync(filepath));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(SERVER_PORT, () => {
    console.log(`🟢 서버 시작: http://localhost:${SERVER_PORT}`);
    console.log(`   Figma 플러그인을 열고 "Import" 버튼을 누르세요.\n`);
  });

  return server;
}

// ──────────────────────────────────────────────
// 메인 진입점
// ──────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--serve')) {
    startServer();
  } else if (args.includes('--capture')) {
    await captureScreenshots();
  } else {
    // 기본: 캡처 후 서버 시작
    await captureScreenshots();
    startServer();
  }
}

main().catch(err => {
  console.error('오류:', err);
  process.exit(1);
});
