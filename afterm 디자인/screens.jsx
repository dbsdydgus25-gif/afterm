// screens.jsx — afterm screens
// Each screen reads from the shared {nav, set} navigation object, plus the
// `t` tweaks object (homeLayout, serviceUI, stepStyle).
//
// Screens exported to window:
//   OnboardingScreen, HomeScreen, InfoScreen, ServicesScreen,
//   DocsScreen, SignScreen, TrackingScreen, ReportScreen, MyPageScreen

const { useState: useStateS, useRef: useRefS, useEffect: useEffectS } = React;

const STEPS = [
  { id: 'info',     label: '정보 입력' },
  { id: 'docs',     label: '서류·서명' },
  { id: 'tracking', label: '처리 중' },
  { id: 'report',   label: '완료' },
];
// Map screen → step index
function stepIndexFor(screen) {
  if (screen === 'info' || screen === 'services') return 0;
  if (screen === 'docs' || screen === 'sign') return 1;
  if (screen === 'tracking') return 2;
  if (screen === 'report') return 3;
  return 0;
}

// ───────────────────────────────────────────────────────────────
// Onboarding — 3 panels, swipe via dots (we just render the first
// for stillness; a Tweak could navigate, but cardinal flow lands users on Home).
// ───────────────────────────────────────────────────────────────
function OnboardingScreen({ go }) {
  const [page, setPage] = useStateS(0);
  const panels = [
    {
      eyebrow: '디지털 유산 행정 대행',
      title: '떠나신 분의 디지털 흔적,\nafterm이 대신 정리해드려요',
      sub: '통신사·OTT·SNS까지\n한 번의 신청으로 위임 처리합니다.',
      art: 'mail',
    },
    {
      eyebrow: '간편한 4단계',
      title: '서류 촬영부터\n해지 완료까지 한 곳에서',
      sub: '고인 정보 입력 → 서류 업로드 → afterm 처리 → 완료 알림.',
      art: 'steps',
    },
    {
      eyebrow: '무료 서비스',
      title: '비용 없이 이용하실 수 있습니다',
      sub: '평균 5–7영업일 내 처리.\n진행 현황은 실시간으로 알려드려요.',
      art: 'free',
    },
  ];
  const p = panels[page];

  return (
    <div className="screen">
      <div style={{
        padding: '24px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <AftermLogo size={18} />
        <button onClick={() => go('home')}
          style={{
            border: 0, background: 'transparent',
            fontSize: 14, fontWeight: 500,
            color: 'var(--color-label-alternative)', cursor: 'pointer',
            letterSpacing: 0.0145,
          }}>건너뛰기</button>
      </div>

      <div className="screen-body" style={{ padding: '24px 20px 0' }}>
        <div style={{
          padding: '0 0 24px',
          fontSize: 13, fontWeight: 600,
          color: 'var(--color-primary-normal)',
          letterSpacing: 0.025, textTransform: 'uppercase',
        }}>{p.eyebrow}</div>
        <h1 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 28, fontWeight: 700, lineHeight: 1.3,
          letterSpacing: '-0.023em',
          color: 'var(--color-label-strong)',
          margin: 0,
          whiteSpace: 'pre-line',
        }}>{p.title}</h1>
        <p style={{
          marginTop: 14, marginBottom: 0,
          fontSize: 15, lineHeight: 1.6,
          color: 'var(--color-label-alternative)',
          letterSpacing: 0.0096,
          whiteSpace: 'pre-line',
        }}>{p.sub}</p>

        {/* Art block */}
        <div style={{
          marginTop: 32, height: 260,
          background: 'var(--color-coolNeutral-98)',
          borderRadius: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-primary-normal)',
          border: '1px solid var(--color-line-normal-normal)',
          position: 'relative', overflow: 'hidden',
        }}>
          {p.art === 'mail' && <OnboardingArtMail />}
          {p.art === 'steps' && <OnboardingArtSteps />}
          {p.art === 'free' && <OnboardingArtFree />}
        </div>
      </div>

      <div className="cta-dock" style={{ borderTop: 0 }}>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6,
          marginBottom: 16,
        }}>
          {panels.map((_, i) => (
            <div key={i} style={{
              width: i === page ? 20 : 6, height: 6, borderRadius: 4,
              background: i === page ? 'var(--color-primary-normal)' : 'var(--color-coolNeutral-92)',
              transition: 'width 200ms',
            }} />
          ))}
        </div>
        {page < panels.length - 1 ? (
          <Button block onClick={() => setPage(page + 1)}>다음</Button>
        ) : (
          <Button block onClick={() => go('home')}>시작하기</Button>
        )}
      </div>
    </div>
  );
}

// ── Decorative SVGs for onboarding (placeholder geometric art, no emoji)
function OnboardingArtMail() {
  return (
    <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
      <rect x="40" y="40" width="120" height="84" rx="12" stroke="currentColor" strokeWidth="2" fill="#fff"/>
      <path d="M40 50 L100 92 L160 50" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="68" y="20" width="64" height="32" rx="6" fill="#fff" stroke="currentColor" strokeWidth="2"/>
      <line x1="76" y1="32" x2="124" y2="32" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <line x1="76" y1="40" x2="108" y2="40" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <circle cx="156" cy="124" r="12" fill="currentColor"/>
      <path d="M151 124 L155 128 L162 121" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function OnboardingArtSteps() {
  return (
    <svg width="220" height="160" viewBox="0 0 220 160" fill="none">
      {[0,1,2,3].map(i => (
        <g key={i}>
          <circle cx={30 + i*52} cy="80" r="20" fill={i === 0 ? 'currentColor' : '#fff'} stroke="currentColor" strokeWidth="2"/>
          <text x={30 + i*52} y="86" textAnchor="middle"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}
            fill={i === 0 ? '#fff' : 'currentColor'}>{i+1}</text>
          {i < 3 && <line x1={50 + i*52} y1="80" x2={62 + i*52} y2="80" stroke="currentColor" strokeWidth="2" opacity="0.4"/>}
        </g>
      ))}
    </svg>
  );
}
function OnboardingArtFree() {
  return (
    <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
      <rect x="40" y="44" width="120" height="72" rx="16" fill="#fff" stroke="currentColor" strokeWidth="2"/>
      <text x="100" y="92" textAnchor="middle"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em' }}
        fill="currentColor">₩ 0</text>
      <path d="M52 44 L52 28 Q52 24 56 24 L144 24 Q148 24 148 28 L148 44" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────
// HOME — three layout variations
// ───────────────────────────────────────────────────────────────
function HomeScreen({ go, t, tab, setTab }) {
  const c = ACTIVE_CASE;

  // counts
  const completed = c.services.filter(s => s.state === 'completed').length;
  const total = c.services.length;
  const pct = Math.round((completed / total) * 100);
  const needsAction = c.services.find(s => s.state === 'needs_action');

  return (
    <div className="screen">
      <Topbar title="" brand={true}
        trailing={
          <div className="topbar-icon-btn" onClick={() => setTab('notify')}>
            <Icon name="bell" size={22} />
          </div>
        } />

      <div className="screen-body">
        <div className="page-header" style={{ paddingTop: 20, paddingBottom: 0 }}>
          <div className="page-eyebrow">진행 중인 신청</div>
          <div className="page-title" style={{ marginTop: 6 }}>
            {c.deceased.relation} 김영순 님
          </div>
          <div className="page-sub" style={{ marginTop: 4 }}>
            {c.startedAt} 신청 · {total}건 처리 중
          </div>
        </div>

        {/* layout switch */}
        <div style={{ padding: '20px 20px 0' }}>
          {t.homeLayout === 'progress' && <HomeProgressCard pct={pct} completed={completed} total={total} services={c.services} go={go} />}
          {t.homeLayout === 'timeline' && <HomeTimeline services={c.services} go={go} />}
          {t.homeLayout === 'list'     && <HomeListCard services={c.services} completed={completed} total={total} go={go} />}
        </div>

        {needsAction && (
          <div style={{ padding: '12px 20px 0' }}>
            <ActionBanner service={getService(needsAction.id)} note={needsAction.note} onClick={() => go('tracking')} />
          </div>
        )}

        <SectionHeader title="새 신청 시작하기" />
        <div style={{ padding: '0 20px' }}>
          <NewRequestCard onClick={() => go('info')} />
        </div>

        <SectionHeader title="이런 것도 도와드려요" />
        <div style={{ padding: '0 20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <HelpTile icon="message-circle-question" title="전문 상담사와 1:1" sub="평일 10-18시" />
          <HelpTile icon="book-open" title="상속 절차 안내" sub="가이드 보기" />
        </div>

        <div className="dock-spacer" />
      </div>

      <TabBar active={tab} onChange={(id) => { setTab(id); if (id === 'apply') go('info'); if (id === 'mypage') go('mypage'); }} />
    </div>
  );
}

// HOME — variation A: big progress ring card
function HomeProgressCard({ pct, completed, total, services, go }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <ProgressRing value={pct} size={108} stroke={9} label={pct + '%'} sub="처리 완료" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          <RingMini label="완료"     value={completed}      color="var(--color-green-45)" />
          <RingMini label="진행 중"   value={services.filter(s => s.state === 'in_review' || s.state === 'submitted').length}
                    color="var(--color-yellow-55)" />
          <RingMini label="조치 필요" value={services.filter(s => s.state === 'needs_action').length}
                    color="var(--color-red-50)" />
        </div>
      </div>
      <div className="hairline" style={{ margin: '16px -20px 14px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-label-alternative)' }}>예상 완료일</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-label-strong)', marginTop: 2 }}>2026.05.30</div>
        </div>
        <Button size="sm" variant="secondary" onClick={() => go('tracking')} trailingIcon="chevron-right">
          진행 현황
        </Button>
      </div>
    </div>
  );
}
function RingMini({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
      <span style={{ flex: 1, fontSize: 13, color: 'var(--color-label-neutral)', letterSpacing: 0.0145 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-label-strong)', fontFamily: 'var(--font-display)' }}>{value}</span>
    </div>
  );
}

// HOME — variation B: vertical timeline
function HomeTimeline({ services, go }) {
  // Sort: most-recent state changes first (mock by updatedAt desc)
  const sorted = [...services].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <div className="card" style={{ padding: '8px 4px 8px 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {sorted.map((s, i) => {
          const svc = getService(s.id);
          const meta = STATE_META[s.state];
          const isLast = i === sorted.length - 1;
          return (
            <div key={s.id} style={{ display: 'flex', gap: 14, paddingBottom: isLast ? 8 : 0, position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: 5,
                  background: meta.color,
                  boxShadow: '0 0 0 3px ' + meta.bg,
                  zIndex: 1,
                }} />
                {!isLast && <div style={{
                  flex: 1, width: 1.5,
                  background: 'var(--color-line-normal-normal)',
                  marginTop: 4,
                }} />}
              </div>
              <div onClick={() => go('tracking')} style={{
                flex: 1, padding: '12px 16px 12px 0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <ServiceLogo service={svc} size={36} radius={9} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-label-strong)' }}>{svc.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', marginTop: 2, letterSpacing: 0.025 }}>{s.note}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: meta.color, fontWeight: 700, letterSpacing: 0.025 }}>{meta.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-label-alternative)', marginTop: 2 }}>{s.updatedAt.slice(5)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// HOME — variation C: compact list with summary header
function HomeListCard({ services, completed, total, go }) {
  return (
    <div className="card">
      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--color-line-normal-normal)' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--color-label-strong)', letterSpacing: '-0.025em' }}>
            {completed}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--color-label-alternative)' }}>
            {' / ' + total + '건'}
          </span>
          <span style={{ fontSize: 13, color: 'var(--color-label-alternative)', marginLeft: 8 }}>완료</span>
        </div>
        <button onClick={() => go('tracking')} style={{ border: 0, background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--color-primary-normal)', cursor: 'pointer' }}>전체보기</button>
      </div>
      {services.slice(0, 4).map((s, i) => {
        const svc = getService(s.id);
        return (
          <div key={s.id} onClick={() => go('tracking')} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 20px',
            borderBottom: i < 3 ? '1px solid var(--color-line-normal-normal)' : '0',
            cursor: 'pointer',
          }}>
            <ServiceLogo service={svc} size={34} radius={9} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-label-strong)' }}>{svc.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{s.note}</div>
            </div>
            <StatusPip state={s.state} />
          </div>
        );
      })}
    </div>
  );
}

function ActionBanner({ service, note, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--color-red-99)',
      border: '1px solid var(--color-red-90)',
      borderRadius: 16, padding: 14,
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--color-red-50)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="alert-triangle" size={20} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-red-50)', letterSpacing: 0.025 }}>
          조치 필요 · {service.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-label-neutral)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note}</div>
      </div>
      <Icon name="chevron-right" size={20} color="var(--color-label-alternative)" />
    </div>
  );
}

function NewRequestCard({ onClick }) {
  return (
    <div onClick={onClick} style={{
      borderRadius: 20,
      background: 'var(--color-label-strong)',
      color: '#fff',
      padding: 20,
      display: 'flex', alignItems: 'center', gap: 16,
      cursor: 'pointer',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.025, textTransform: 'uppercase' }}>
          New request
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, letterSpacing: '-0.012em' }}>
          새 가족분의 정리를 시작해요
        </div>
        <div style={{ fontSize: 13, marginTop: 6, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.0145 }}>
          평균 5–7영업일 처리 · 무료
        </div>
      </div>
      <div style={{
        width: 48, height: 48, borderRadius: 16,
        background: 'var(--color-primary-normal)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="arrow-right" size={22} strokeWidth={2.2} color="#fff" />
      </div>
    </div>
  );
}

function HelpTile({ icon, title, sub }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: 'var(--color-coolNeutral-96)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-label-neutral)',
      }}>
        <Icon name={icon} size={18} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-label-strong)', letterSpacing: '-0.002em' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', letterSpacing: 0.025 }}>{sub}</div>
    </div>
  );
}

Object.assign(window, {
  STEPS, stepIndexFor,
  OnboardingScreen, HomeScreen,
});
