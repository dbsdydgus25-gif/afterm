// screens-flow.jsx — STEP 1–4 flow screens + mypage

const { useState: useStateF } = React;

// ───────────────────────────────────────────────────────────────
// STEP 1 · 고인 정보 입력
// ───────────────────────────────────────────────────────────────
function InfoScreen({ go, t, form, setForm }) {
  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const canNext = form.name && form.birth && form.death && form.relation && form.phone;

  return (
    <div className="screen">
      <Topbar title="새 신청" onBack={() => go('home')} />
      <StepIndicator steps={STEPS} current={0} style={t.stepStyle} />

      <div className="screen-body">
        <div className="page-header">
          <div className="page-eyebrow">STEP 01</div>
          <div className="page-title">고인 정보를 입력해주세요</div>
          <div className="page-sub">CS 본인확인 절차에 사용됩니다. 입력 정보는 처리 완료 후 즉시 파기돼요.</div>
        </div>

        <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label="고인 성함" required>
            <input className="input" placeholder="예: 김영순"
              value={form.name} onChange={e => update('name', e.target.value)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="생년월일" required>
              <input className="input" placeholder="1948.03.12"
                value={form.birth} onChange={e => update('birth', e.target.value)} />
            </Field>
            <Field label="사망일" required>
              <input className="input" placeholder="2026.05.18"
                value={form.death} onChange={e => update('death', e.target.value)} />
            </Field>
          </div>
          <Field label="고인과의 관계" required>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {['모친', '부친', '배우자', '자녀', '조부모', '형제', '친척', '기타'].map(r => (
                <button key={r} onClick={() => update('relation', r)}
                  style={{
                    height: 40, borderRadius: 10,
                    border: '1px solid ' + (form.relation === r ? 'var(--color-primary-normal)' : 'var(--color-line-normal-normal)'),
                    background: form.relation === r ? 'var(--color-blue-99)' : '#fff',
                    color: form.relation === r ? 'var(--color-primary-normal)' : 'var(--color-label-neutral)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    letterSpacing: 0.0145,
                  }}>{r}</button>
              ))}
            </div>
          </Field>
          <Field label="신청자(본인) 연락처" required hint="처리 진행 상황을 알려드릴 번호예요">
            <input className="input" placeholder="010-0000-0000"
              value={form.phone} onChange={e => update('phone', e.target.value)} />
          </Field>
        </div>

        <div className="dock-spacer" />
      </div>

      <div className="cta-dock">
        <Button block disabled={!canNext} onClick={() => go('services')}>다음 · 해지할 서비스 선택</Button>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="field-label">
        {label}
        {required && <span style={{ color: 'var(--color-status-negative)', marginLeft: 4 }}>*</span>}
      </div>
      {children}
      {hint && <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', marginTop: 6, letterSpacing: 0.025 }}>{hint}</div>}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// STEP 1 · 해지할 서비스 선택 — 3 UI variations
// ───────────────────────────────────────────────────────────────
function ServicesScreen({ go, t, selected, setSelected }) {
  const toggle = id => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="screen">
      <Topbar title="새 신청" onBack={() => go('info')} />
      <StepIndicator steps={STEPS} current={0} style={t.stepStyle} />

      <div className="screen-body">
        <div className="page-header">
          <div className="page-eyebrow">STEP 01 · 서비스 선택</div>
          <div className="page-title">해지·정리할 서비스를 골라주세요</div>
          <div className="page-sub">선택하신 서비스만 처리해드려요. 나중에 추가/변경할 수 있어요.</div>
        </div>

        {t.serviceUI === 'grid'      && <ServicesGrid selected={selected} toggle={toggle} />}
        {t.serviceUI === 'search'    && <ServicesSearch selected={selected} toggle={toggle} />}
        {t.serviceUI === 'recommend' && <ServicesRecommend selected={selected} toggle={toggle} />}

        <div className="dock-spacer" />
        <div className="dock-spacer" />
      </div>

      <div className="cta-dock">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-label-neutral)', letterSpacing: 0.0145 }}>
            선택한 서비스
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-primary-normal)', letterSpacing: '-0.012em' }}>
            {selected.length}건
          </span>
        </div>
        <Button block disabled={selected.length === 0} onClick={() => go('docs')}>
          다음 · 서류 업로드
        </Button>
      </div>
    </div>
  );
}

// VARIATION A — Category grid
function ServicesGrid({ selected, toggle }) {
  const [cat, setCat] = useStateF('전체');
  const filtered = SERVICE_CATALOG.filter(s => cat === '전체' || s.category === cat);
  return (
    <div>
      <div style={{
        padding: '8px 20px 0', display: 'flex', gap: 8, overflowX: 'auto',
      }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            style={{
              flexShrink: 0,
              padding: '8px 14px', borderRadius: 9999,
              border: '1px solid ' + (cat === c ? 'var(--color-label-strong)' : 'var(--color-line-normal-normal)'),
              background: cat === c ? 'var(--color-label-strong)' : '#fff',
              color: cat === c ? '#fff' : 'var(--color-label-neutral)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              letterSpacing: 0.0145,
            }}>{c}</button>
        ))}
      </div>

      <div style={{ padding: '16px 20px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {filtered.map(s => {
          const sel = selected.includes(s.id);
          return (
            <div key={s.id}
              className={'service-tile' + (sel ? ' is-selected' : '')}
              onClick={() => toggle(s.id)}>
              <ServiceLogo service={s} size={40} radius={10} />
              <div className="name">{s.name}</div>
              {sel && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 18, height: 18, borderRadius: 9,
                  background: 'var(--color-primary-normal)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  <Icon name="check" size={11} strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// VARIATION B — Search with grouped results
function ServicesSearch({ selected, toggle }) {
  const [q, setQ] = useStateF('');
  const filtered = SERVICE_CATALOG.filter(s => !q || s.name.includes(q) || s.category.includes(q));
  const grouped = filtered.reduce((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ padding: '8px 20px 0' }}>
        <div style={{
          position: 'relative',
          display: 'flex', alignItems: 'center',
          background: 'var(--color-coolNeutral-96)',
          borderRadius: 9999, padding: '0 14px', height: 44,
        }}>
          <Icon name="search" size={18} color="var(--color-label-alternative)" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="서비스 이름으로 검색 (예: 넷플릭스)"
            style={{
              flex: 1, height: '100%', marginLeft: 10,
              background: 'transparent', border: 0, outline: 'none',
              fontSize: 14, fontFamily: 'var(--font-sans)',
              color: 'var(--color-label-normal)',
              letterSpacing: 0.0145,
            }} />
        </div>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div style={{
            padding: '20px 20px 8px',
            fontSize: 12, fontWeight: 700,
            color: 'var(--color-label-alternative)',
            letterSpacing: 0.05, textTransform: 'uppercase',
          }}>{category}</div>
          <div className="card" style={{ margin: '0 20px' }}>
            {items.map((s, i) => {
              const sel = selected.includes(s.id);
              return (
                <div key={s.id} onClick={() => toggle(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    borderBottom: i < items.length - 1 ? '1px solid var(--color-line-normal-normal)' : '0',
                    cursor: 'pointer',
                  }}>
                  <ServiceLogo service={s} size={36} radius={9} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-label-strong)', letterSpacing: '-0.002em' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', marginTop: 1, letterSpacing: 0.025 }}>{s.desc}</div>
                  </div>
                  <div className={'checkbox' + (sel ? ' checked' : '')}>
                    {sel && <Icon name="check" size={14} strokeWidth={3.5} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// VARIATION C — Recommended bundle
function ServicesRecommend({ selected, toggle }) {
  const bundles = [
    { id: 'b1', title: '많이 신청하시는 묶음', desc: '대부분의 유가족이 가장 먼저 정리하시는 항목이에요', ids: ['skt', 'netflix', 'instagram', 'ytpremium'] },
    { id: 'b2', title: '통신·구독 우선', desc: '월 비용이 계속 빠져나가는 항목부터 먼저 처리해요', ids: ['skt', 'kt', 'lgu', 'netflix', 'disney', 'ytpremium'] },
    { id: 'b3', title: 'SNS 추모 전환', desc: '계정을 추모 상태로 전환하고 게시물을 보존해요', ids: ['instagram', 'facebook'] },
  ];
  const selectBundle = (ids) => {
    // ensure all bundle ids are selected
    const next = [...new Set([...selected, ...ids])];
    setSelectedAll(next);
  };
  // bypass setter pattern — pass through toggle
  function setSelectedAll(arr) {
    arr.forEach(id => { if (!selected.includes(id)) toggle(id); });
  }

  return (
    <div>
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bundles.map(b => {
          const allIn = b.ids.every(id => selected.includes(id));
          return (
            <div key={b.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-label-strong)', letterSpacing: '-0.002em' }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', marginTop: 4, lineHeight: 1.5, letterSpacing: 0.025 }}>{b.desc}</div>
                </div>
                <Button size="sm" variant={allIn ? 'secondary' : 'primary'} onClick={() => selectBundle(b.ids)}>
                  {allIn ? '담김' : '담기'}
                </Button>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {b.ids.map(id => {
                  const s = getService(id);
                  return (
                    <div key={id} onClick={() => toggle(id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 10px 5px 6px', borderRadius: 9999,
                        background: selected.includes(id) ? 'var(--color-blue-99)' : 'var(--color-coolNeutral-96)',
                        border: '1px solid ' + (selected.includes(id) ? 'var(--color-primary-normal)' : 'transparent'),
                        cursor: 'pointer',
                      }}>
                      <ServiceLogo service={s} size={20} radius={5} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: selected.includes(id) ? 'var(--color-primary-normal)' : 'var(--color-label-neutral)', letterSpacing: 0.0145 }}>{s.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <SectionHeader title="개별 선택" />
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {SERVICE_CATALOG.map(s => {
          const sel = selected.includes(s.id);
          return (
            <div key={s.id}
              className={'service-tile' + (sel ? ' is-selected' : '')}
              onClick={() => toggle(s.id)}
              style={{ padding: '10px 4px' }}>
              <ServiceLogo service={s} size={36} radius={9} />
              <div className="name" style={{ fontSize: 11 }}>{s.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// STEP 2 · 서류 업로드
// ───────────────────────────────────────────────────────────────
function DocsScreen({ go, t, docs, setDocs }) {
  const toggle = (k) => setDocs(prev => ({ ...prev, [k]: !prev[k] }));
  const allDone = docs.death && docs.family && docs.id;

  const items = [
    { key: 'death',  title: '사망진단서', sub: '병원 또는 동주민센터 발급', icon: 'file-text' },
    { key: 'family', title: '가족관계증명서', sub: '신청자 본인 기준 상세 증명서', icon: 'users' },
    { key: 'id',     title: '신청자 신분증', sub: '주민등록증 또는 운전면허증', icon: 'credit-card' },
  ];

  return (
    <div className="screen">
      <Topbar title="새 신청" onBack={() => go('services')} />
      <StepIndicator steps={STEPS} current={1} style={t.stepStyle} />

      <div className="screen-body">
        <div className="page-header">
          <div className="page-eyebrow">STEP 02 · 서류 촬영</div>
          <div className="page-title">서류 3종을 촬영해 올려주세요</div>
          <div className="page-sub">스마트폰 카메라로 그대로 찍으시면 돼요. 흐릿한 경우 다시 촬영을 안내드려요.</div>
        </div>

        <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(item => {
            const done = docs[item.key];
            return (
              <div key={item.key} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: done ? 'var(--color-blue-99)' : 'var(--color-coolNeutral-96)',
                    color: done ? 'var(--color-primary-normal)' : 'var(--color-label-neutral)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={item.icon} size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-label-strong)', letterSpacing: '-0.002em' }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-label-alternative)', marginTop: 2, letterSpacing: 0.025 }}>{item.sub}</div>
                  </div>
                  {done && <StatusPip state="completed" />}
                </div>

                <div className={'doc-frame' + (done ? ' has-image' : '')}
                  onClick={() => toggle(item.key)}
                  style={{ height: 132, cursor: 'pointer' }}>
                  {done ? (
                    <>
                      <Icon name="image" size={28} />
                      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.0145 }}>업로드 완료 · 다시 찍기</div>
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: '#fff',
                        border: '1px solid var(--color-line-normal-normal)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-label-neutral)',
                      }}>
                        <Icon name="camera" size={22} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-label-neutral)', letterSpacing: 0.0145 }}>탭해서 촬영</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="dock-spacer" />
      </div>

      <div className="cta-dock">
        <Button block disabled={!allDone} onClick={() => go('sign')}>다음 · 위임장 서명</Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// STEP 2 · 위임장 전자서명
// ───────────────────────────────────────────────────────────────
function SignScreen({ go, t, signed, setSigned, agreements, setAgreements }) {
  const allAgreed = agreements.terms && agreements.privacy && agreements.delegation;
  const canSubmit = signed && allAgreed;
  const toggle = (k) => setAgreements(prev => ({ ...prev, [k]: !prev[k] }));

  return (
    <div className="screen">
      <Topbar title="새 신청" onBack={() => go('docs')} />
      <StepIndicator steps={STEPS} current={1} style={t.stepStyle} />

      <div className="screen-body">
        <div className="page-header">
          <div className="page-eyebrow">STEP 02 · 위임장 서명</div>
          <div className="page-title">위임장에 전자서명해주세요</div>
          <div className="page-sub">afterm이 각 기업에 해지 요청을 대신 발송하기 위한 법적 위임이에요.</div>
        </div>

        {/* Delegation summary */}
        <div style={{ padding: '12px 20px 0' }}>
          <div className="card-soft" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-label-strong)', letterSpacing: '-0.002em' }}>위임 내용</div>
            <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                '선택하신 서비스에 해지 요청서를 대신 발송',
                '각 기업 CS와 본인확인 절차 대행',
                '처리 결과를 알림으로 안내',
                '처리 완료 후 입력하신 모든 정보 즉시 파기',
              ].map((text, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ marginTop: 8, width: 4, height: 4, borderRadius: 2, background: 'var(--color-primary-normal)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--color-label-neutral)', lineHeight: 1.6, letterSpacing: 0.0145 }}>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <SectionHeader title="서명" />
        <div style={{ padding: '0 20px' }}>
          <div className="sig-pad">
            {signed ? (
              <svg viewBox="0 0 400 180" width="100%" height="100%">
                <path d="M30 130 C 70 50, 110 50, 140 110 S 200 170, 230 100 S 300 60, 340 130"
                  className="sig-stroke" />
                <text x="20" y="170" style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, letterSpacing: 0.025 }}
                  fill="var(--color-label-alternative)">서명 완료 · 2026.05.28 14:22</text>
              </svg>
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, color: 'var(--color-label-alternative)' }}>
                <Icon name="pen-line" size={28} />
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.0145 }}>이 영역에 서명해주세요</div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button onClick={() => setSigned(false)}
              style={{ border: 0, background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--color-label-alternative)', cursor: 'pointer', letterSpacing: 0.0145 }}>
              지우고 다시
            </button>
            <button onClick={() => setSigned(true)}
              style={{ border: 0, background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--color-primary-normal)', cursor: 'pointer', letterSpacing: 0.0145 }}>
              {signed ? '서명 완료' : '예시 서명 입력'}
            </button>
          </div>
        </div>

        <SectionHeader title="약관 동의" />
        <div style={{ padding: '0 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { k: 'terms',      title: '서비스 이용약관', required: true },
            { k: 'privacy',    title: '개인정보 수집·이용 동의', required: true },
            { k: 'delegation', title: '위임 처리 동의서', required: true },
          ].map(a => (
            <div key={a.k} onClick={() => toggle(a.k)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div className={'checkbox' + (agreements[a.k] ? ' checked' : '')}>
                {agreements[a.k] && <Icon name="check" size={14} strokeWidth={3.5} />}
              </div>
              <span style={{ flex: 1, fontSize: 14, color: 'var(--color-label-strong)', letterSpacing: 0.0145 }}>
                <span style={{ color: 'var(--color-status-negative)', marginRight: 4 }}>[필수]</span>{a.title}
              </span>
              <Icon name="chevron-right" size={16} color="var(--color-label-alternative)" />
            </div>
          ))}
        </div>

        <div className="dock-spacer" />
      </div>

      <div className="cta-dock">
        <Button block disabled={!canSubmit} onClick={() => go('tracking')}>처리 시작하기</Button>
      </div>
    </div>
  );
}

Object.assign(window, {
  InfoScreen, ServicesScreen, DocsScreen, SignScreen,
});
