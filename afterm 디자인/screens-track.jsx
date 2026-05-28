// screens-track.jsx — Tracking, Report, MyPage

const { useState: useStateT } = React;

// ───────────────────────────────────────────────────────────────
// STEP 3 · 진행 현황
// ───────────────────────────────────────────────────────────────
function TrackingScreen({ go, t }) {
  const [filter, setFilter] = useStateT('all');
  const c = ACTIVE_CASE;
  const all = c.services;
  const filtered = filter === 'all' ? all : all.filter(s => {
    if (filter === 'inprog') return s.state === 'submitted' || s.state === 'in_review';
    if (filter === 'done')   return s.state === 'completed';
    if (filter === 'action') return s.state === 'needs_action';
    return true;
  });
  const completed = all.filter(s => s.state === 'completed').length;
  const pct = Math.round((completed / all.length) * 100);

  return (
    <div className="screen">
      <Topbar title="진행 현황" onBack={() => go('home')} />
      <StepIndicator steps={STEPS} current={2} style={t.stepStyle} />

      <div className="screen-body">
        {/* Case summary */}
        <div style={{ padding: '12px 20px 0' }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ProgressRing value={pct} size={84} stroke={8} label={pct + '%'} sub={completed + ' / ' + all.length} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-label-alternative)', letterSpacing: 0.025, textTransform: 'uppercase' }}>
                  Case · {c.id.toUpperCase()}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-label-strong)', marginTop: 4, letterSpacing: '-0.012em' }}>
                  {c.deceased.relation} 김영순 님
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', marginTop: 4, letterSpacing: 0.025 }}>
                  {c.startedAt} 신청 · 예상 완료 05.30
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ padding: '20px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.012em', color: 'var(--color-label-strong)' }}>
            서비스별 상태
          </div>
          <div className="segmented">
            <button className={filter === 'all'    ? 'active' : ''} onClick={() => setFilter('all')}>전체</button>
            <button className={filter === 'inprog' ? 'active' : ''} onClick={() => setFilter('inprog')}>진행 중</button>
            <button className={filter === 'done'   ? 'active' : ''} onClick={() => setFilter('done')}>완료</button>
          </div>
        </div>

        <div style={{ padding: '0 20px' }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            {filtered.map((s, i) => (
              <TrackingRow key={s.id} entry={s} last={i === filtered.length - 1} />
            ))}
          </div>
        </div>

        <SectionHeader title="처리 타임라인" />
        <div style={{ padding: '0 20px 0' }}>
          <div className="card" style={{ padding: '12px 16px' }}>
            {[
              { t: '2026.05.27 14:30', e: 'Meta 추모 계정 전환 신청 발송' },
              { t: '2026.05.26 11:15', e: '페이스북 추가 서류 요청 알림' },
              { t: '2026.05.24 16:08', e: 'SK텔레콤 회선 해지 완료' },
              { t: '2026.05.23 09:45', e: '넷플릭스 구독 해지 · 환불 완료' },
              { t: '2026.05.21 17:22', e: '신청 접수 · 위임장 검토 시작' },
            ].map((e, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: i === 0 ? 'var(--color-primary-normal)' : 'var(--color-coolNeutral-86)' }} />
                  {i < arr.length - 1 && <div style={{ flex: 1, width: 1, background: 'var(--color-line-normal-normal)', marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 8 : 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-label-alternative)', letterSpacing: 0.025 }}>{e.t}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-label-strong)', marginTop: 2, letterSpacing: 0.0145 }}>{e.e}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dock-spacer" />
      </div>

      <div className="cta-dock" style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" block onClick={() => go('home')}>홈으로</Button>
        <Button block onClick={() => go('report')}>완료 리포트</Button>
      </div>
    </div>
  );
}

function TrackingRow({ entry, last }) {
  const svc = getService(entry.id);
  const meta = STATE_META[entry.state];
  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: last ? '0' : '1px solid var(--color-line-normal-normal)',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <ServiceLogo service={svc} size={40} radius={11} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-label-strong)', letterSpacing: '-0.002em' }}>{svc.name}</span>
          <span style={{ fontSize: 11, color: 'var(--color-label-alternative)', letterSpacing: 0.025 }}>{svc.category}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', marginTop: 4, letterSpacing: 0.025 }}>{entry.note}</div>

        {/* mini progress lane */}
        <MiniLane state={entry.state} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--color-label-alternative)' }}>업데이트 {entry.updatedAt.slice(5)}</span>
          {entry.state === 'needs_action' && (
            <Button size="sm" variant="primary">서류 추가</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniLane({ state }) {
  // 4 stages: submitted → review → company → completed
  const stages = ['요청 발송', 'CS 검토', '기업 처리', '완료'];
  const stageIdx = state === 'pending' ? -1
    : state === 'submitted' ? 0
    : state === 'in_review' ? 1
    : state === 'needs_action' ? 1
    : state === 'completed' ? 3 : 0;
  const isAction = state === 'needs_action';
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
      {stages.map((s, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            height: 4, borderRadius: 2,
            background: i <= stageIdx
              ? (isAction && i === stageIdx ? 'var(--color-status-negative)' : 'var(--color-primary-normal)')
              : 'var(--color-coolNeutral-94)',
          }} />
          <div style={{
            fontSize: 10, fontWeight: 500,
            color: i <= stageIdx
              ? (isAction && i === stageIdx ? 'var(--color-status-negative)' : 'var(--color-label-neutral)')
              : 'var(--color-label-alternative)',
            letterSpacing: 0.025,
          }}>{s}</div>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// STEP 4 · 처리 완료 리포트
// ───────────────────────────────────────────────────────────────
function ReportScreen({ go, t }) {
  const c = ACTIVE_CASE;
  return (
    <div className="screen">
      <Topbar title="완료 리포트" onBack={() => go('tracking')}
        trailing={<div className="topbar-icon-btn"><Icon name="share-2" size={20} /></div>} />
      <StepIndicator steps={STEPS} current={3} style={t.stepStyle} />

      <div className="screen-body">
        <div className="page-header">
          <div className="page-eyebrow" style={{ color: 'var(--color-green-45)' }}>처리 완료</div>
          <div className="page-title">{c.deceased.relation} 김영순 님의 정리가 마무리됐어요</div>
          <div className="page-sub">접수 2026.05.21 → 완료 2026.05.30 · 9일 소요</div>
        </div>

        {/* hero stats */}
        <div style={{ padding: '12px 20px 0' }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <StatBlock label="처리 서비스" value="6" sub="건" />
              <StatBlock label="환불·정산" value="42,800원" valueColor="var(--color-green-45)" />
              <StatBlock label="추모 전환" value="2" sub="계정" />
            </div>
          </div>
        </div>

        <SectionHeader title="서비스별 결과" />
        <div style={{ padding: '0 20px' }}>
          <div className="card">
            {[
              { id: 'skt',       result: '회선 해지 완료',       extra: '미사용 요금 8,200원 환불' },
              { id: 'netflix',   result: '구독 해지 · 환불 완료', extra: '13,500원 환불' },
              { id: 'ytpremium', result: '구독 해지 완료',       extra: '21,100원 환불' },
              { id: 'instagram', result: '추모 계정 전환',       extra: '게시물 보존' },
              { id: 'facebook',  result: '추모 계정 전환',       extra: '게시물 보존' },
              { id: 'kakaostory',result: '계정 해지 완료',       extra: '데이터 영구 삭제' },
            ].map((r, i, arr) => {
              const svc = getService(r.id);
              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-line-normal-normal)' : '0',
                }}>
                  <ServiceLogo service={svc} size={36} radius={10} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-label-strong)', letterSpacing: '-0.002em' }}>{svc.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', marginTop: 2, letterSpacing: 0.025 }}>{r.extra}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-green-45)', letterSpacing: 0.025 }}>{r.result}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <SectionHeader title="데이터 처리 결과" />
        <div style={{ padding: '0 20px 0' }}>
          <div className="card-soft" style={{ padding: 16 }}>
            {[
              { t: '입력하신 고인 정보', s: '처리 직후 즉시 파기' },
              { t: '서류 사본', s: 'AES-256 암호화 후 5영업일 보관 · 자동 삭제' },
              { t: '위임장 원본', s: '전자증거로 1년 보관 후 폐기' },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                paddingTop: i === 0 ? 0 : 10,
              }}>
                <Icon name="shield-check" size={18} color="var(--color-green-45)" style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-label-strong)', letterSpacing: 0.0145 }}>{row.t}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', marginTop: 1, letterSpacing: 0.025 }}>{row.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            padding: 18, borderRadius: 16,
            background: 'var(--color-coolNeutral-98)',
            border: '1px solid var(--color-line-normal-normal)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary-normal)', letterSpacing: 0.025, textTransform: 'uppercase' }}>마치며</div>
            <div style={{ fontSize: 14, color: 'var(--color-label-strong)', marginTop: 8, lineHeight: 1.7, letterSpacing: 0.0145 }}>
              가족분의 디지털 정리가 무사히 마무리됐습니다.
              <br/>
              남은 절차나 도움이 필요하시면 언제든 상담해주세요.
            </div>
          </div>
        </div>

        <div className="dock-spacer" />
      </div>

      <div className="cta-dock" style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" block leadingIcon="download">PDF 저장</Button>
        <Button block onClick={() => go('home')}>홈으로</Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// MyPage
// ───────────────────────────────────────────────────────────────
function MyPageScreen({ go, t, tab, setTab }) {
  return (
    <div className="screen">
      <Topbar title="내 정보" />

      <div className="screen-body">
        <div style={{ padding: '20px 20px 0' }}>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28,
              background: 'var(--color-coolNeutral-96)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-label-neutral)',
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
            }}>김</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-label-strong)', letterSpacing: '-0.012em' }}>김도현 님</div>
              <div style={{ fontSize: 13, color: 'var(--color-label-alternative)', marginTop: 2, letterSpacing: 0.0145 }}>010-2734-9128 · 본인인증 완료</div>
            </div>
            <Icon name="chevron-right" size={20} color="var(--color-label-alternative)" />
          </div>
        </div>

        <SectionHeader title="신청 내역" action="전체 보기" />
        <div style={{ padding: '0 20px' }}>
          <div className="card">
            <CaseRow case_={ACTIVE_CASE} active onClick={() => go('tracking')} />
            <CaseRow case_={PAST_CASE} onClick={() => go('report')} />
          </div>
        </div>

        <SectionHeader title="도움 받기" />
        <div style={{ padding: '0 20px' }}>
          <div className="card">
            <MenuRow icon="message-circle" title="1:1 상담" sub="평일 10:00 – 18:00" />
            <MenuRow icon="help-circle" title="자주 묻는 질문" sub="비용·서류·처리 기간" />
            <MenuRow icon="book-open" title="상속 절차 안내서" />
            <MenuRow icon="phone" title="긴급 연락처 등록" last />
          </div>
        </div>

        <SectionHeader title="설정" />
        <div style={{ padding: '0 20px' }}>
          <div className="card">
            <MenuRow icon="bell" title="알림 설정" />
            <MenuRow icon="lock" title="개인정보 보호" />
            <MenuRow icon="file-text" title="이용약관 및 정책" />
            <MenuRow icon="log-out" title="로그아웃" danger last />
          </div>
        </div>

        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          <AftermLogo size={14} color="var(--color-label-alternative)" />
          <div style={{ fontSize: 11, color: 'var(--color-label-alternative)', marginTop: 6, letterSpacing: 0.031 }}>
            버전 1.0.2 · 2026
          </div>
        </div>
        <div className="dock-spacer" />
      </div>

      <TabBar active="mypage" onChange={(id) => { setTab(id); if (id === 'home') go('home'); if (id === 'apply') go('info'); }} />
    </div>
  );
}

function CaseRow({ case_, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '14px 16px',
      borderBottom: '1px solid var(--color-line-normal-normal)',
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11,
        background: active ? 'var(--color-blue-99)' : 'var(--color-coolNeutral-96)',
        color: active ? 'var(--color-primary-normal)' : 'var(--color-label-neutral)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={active ? 'loader-circle' : 'check-circle-2'} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-label-strong)', letterSpacing: '-0.002em' }}>
          {case_.deceased.relation} {case_.deceased.name} 님
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', marginTop: 2, letterSpacing: 0.025 }}>
          {active ? '진행 중 · ' + case_.startedAt + ' 신청' : '완료 · ' + case_.completedAt}
        </div>
      </div>
      <Icon name="chevron-right" size={18} color="var(--color-label-alternative)" />
    </div>
  );
}

function MenuRow({ icon, title, sub, danger, last }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: last ? '0' : '1px solid var(--color-line-normal-normal)',
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: danger ? 'var(--color-red-99)' : 'var(--color-coolNeutral-96)',
        color: danger ? 'var(--color-red-50)' : 'var(--color-label-neutral)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={17} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? 'var(--color-red-50)' : 'var(--color-label-strong)', letterSpacing: 0.0145 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', marginTop: 1, letterSpacing: 0.025 }}>{sub}</div>}
      </div>
      {!danger && <Icon name="chevron-right" size={16} color="var(--color-label-alternative)" />}
    </div>
  );
}

Object.assign(window, {
  TrackingScreen, ReportScreen, MyPageScreen,
});
