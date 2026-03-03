// ──────────────────────────────────────────────
// Afterm Screen Importer - Figma Plugin Main Code
// UI(ui.html)에서 메시지를 받아 Figma에 프레임 생성
// ──────────────────────────────────────────────

figma.showUI(__html__, { width: 380, height: 560, title: 'Afterm Screen Importer' });

// UI에서 메시지 수신
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import-screenshots') {
    await importScreenshots(msg.screenshots, msg.options);
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};

async function importScreenshots(screenshots, options = {}) {
  const {
    columns = 4,
    gap = 80,
    frameWidth = 390,
    frameHeight = 844,
    createSection = true,
  } = options;

  try {
    // 최상위 섹션 생성
    let container;
    if (createSection) {
      container = figma.createSection();
      container.name = '🖥 Afterm Beta Screens';
    }

    const frames = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < screenshots.length; i++) {
      const shot = screenshots[i];

      figma.ui.postMessage({
        type: 'progress',
        current: i + 1,
        total: screenshots.length,
        name: shot.name,
      });

      try {
        // 이미지 바이트 → Figma 이미지 생성
        const bytes = new Uint8Array(shot.bytes);
        const image = figma.createImage(bytes);

        // 프레임 생성
        const frame = figma.createFrame();
        frame.name = shot.name;
        frame.resize(frameWidth, frameHeight);

        // 이미지 fill 적용
        frame.fills = [
          {
            type: 'IMAGE',
            imageHash: image.hash,
            scaleMode: 'FIT',
            opacity: 1,
          },
        ];

        // 그리드 위치 계산
        const col = i % columns;
        const row = Math.floor(i / columns);
        frame.x = col * (frameWidth + gap);
        frame.y = row * (frameHeight + gap);

        if (container) {
          container.appendChild(frame);
        } else {
          figma.currentPage.appendChild(frame);
        }

        frames.push(frame);
        successCount++;
      } catch (err) {
        console.error(`프레임 생성 실패 (${shot.name}):`, err);
        failCount++;
      }
    }

    // 섹션 크기를 내용에 맞게 조정
    if (container && frames.length > 0) {
      const totalRows = Math.ceil(frames.length / columns);
      const totalCols = Math.min(frames.length, columns);
      container.resizeWithoutConstraints(
        totalCols * (frameWidth + gap) - gap + 120,
        totalRows * (frameHeight + gap) - gap + 120
      );
      container.x = 100;
      container.y = 100;

      // 섹션 내용에 맞게 패딩 추가
      frames.forEach(f => {
        f.x += 60;
        f.y += 60;
      });

      figma.currentPage.appendChild(container);
      figma.viewport.scrollAndZoomIntoView([container]);
    } else if (frames.length > 0) {
      figma.viewport.scrollAndZoomIntoView(frames);
    }

    figma.ui.postMessage({
      type: 'done',
      successCount,
      failCount,
    });

    if (failCount === 0) {
      figma.notify(`✅ ${successCount}개 스크린 임포트 완료!`);
    } else {
      figma.notify(`⚠️ ${successCount}개 성공, ${failCount}개 실패`);
    }
  } catch (err) {
    console.error('임포트 오류:', err);
    figma.ui.postMessage({ type: 'error', message: err.message });
    figma.notify('❌ 임포트 실패: ' + err.message);
  }
}
