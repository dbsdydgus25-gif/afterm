// app.jsx — afterm prototype root
// Owns navigation state, flow form state, and exposes 3 variation axes
// (homeLayout, serviceUI, stepStyle) via the Tweaks panel.

const { useState: useStateA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "homeLayout": "progress",
  "serviceUI":  "grid",
  "stepStyle":  "number",
  "startScreen": "home"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Navigation
  const [screen, setScreen] = useStateA(t.startScreen || 'home');
  const [tab, setTab]       = useStateA('home');

  // Flow state (info form, selected services, docs, signature)
  const [form, setForm] = useStateA({ name: '', birth: '', death: '', relation: '', phone: '' });
  const [selected, setSelected] = useStateA(['skt', 'netflix', 'instagram']);
  const [docs, setDocs] = useStateA({ death: false, family: false, id: false });
  const [signed, setSigned] = useStateA(false);
  const [agreements, setAgreements] = useStateA({ terms: false, privacy: false, delegation: false });

  // when start-screen tweak changes, jump
  React.useEffect(() => {
    setScreen(t.startScreen || 'home');
    if (t.startScreen === 'mypage') setTab('mypage');
    if (t.startScreen === 'home') setTab('home');
  }, [t.startScreen]);

  // Re-init Lucide icons after every render
  React.useEffect(() => {
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  });

  const go = (next) => {
    // Re-init when navigating
    setScreen(next);
    requestAnimationFrame(() => {
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    });
  };

  const screenProps = {
    go, t, tab, setTab,
    form, setForm,
    selected, setSelected,
    docs, setDocs,
    signed, setSigned,
    agreements, setAgreements,
  };

  let body;
  if (screen === 'onboarding') body = <OnboardingScreen {...screenProps} />;
  else if (screen === 'home')     body = <HomeScreen {...screenProps} />;
  else if (screen === 'info')     body = <InfoScreen {...screenProps} />;
  else if (screen === 'services') body = <ServicesScreen {...screenProps} />;
  else if (screen === 'docs')     body = <DocsScreen {...screenProps} />;
  else if (screen === 'sign')     body = <SignScreen {...screenProps} />;
  else if (screen === 'tracking') body = <TrackingScreen {...screenProps} />;
  else if (screen === 'report')   body = <ReportScreen {...screenProps} />;
  else if (screen === 'mypage')   body = <MyPageScreen {...screenProps} />;

  return (
    <div className="stage">
      <IOSDevice width={402} height={874}>
        {body}
      </IOSDevice>

      <TweaksPanel title="Tweaks">
        <TweakSection label="화면" />
        <TweakSelect label="시작 화면" value={t.startScreen}
          options={[
            { value: 'onboarding', label: '온보딩' },
            { value: 'home',       label: '홈' },
            { value: 'info',       label: 'STEP 1 · 정보 입력' },
            { value: 'services',   label: 'STEP 1 · 서비스 선택' },
            { value: 'docs',       label: 'STEP 2 · 서류 업로드' },
            { value: 'sign',       label: 'STEP 2 · 위임장 서명' },
            { value: 'tracking',   label: 'STEP 3 · 진행 현황' },
            { value: 'report',     label: 'STEP 4 · 완료 리포트' },
            { value: 'mypage',     label: '마이페이지' },
          ]}
          onChange={(v) => setTweak('startScreen', v)} />

        <TweakSection label="변형" />
        <TweakRadio label="홈 레이아웃" value={t.homeLayout}
          options={[
            { value: 'progress', label: '진행률' },
            { value: 'timeline', label: '타임라인' },
            { value: 'list',     label: '리스트' },
          ]}
          onChange={(v) => setTweak('homeLayout', v)} />

        <TweakRadio label="서비스 선택" value={t.serviceUI}
          options={[
            { value: 'grid',      label: '그리드' },
            { value: 'search',    label: '검색' },
            { value: 'recommend', label: '추천' },
          ]}
          onChange={(v) => setTweak('serviceUI', v)} />

        <TweakRadio label="STEP 인디케이터" value={t.stepStyle}
          options={[
            { value: 'number',    label: '숫자' },
            { value: 'progress',  label: '바' },
            { value: 'checklist', label: '체크' },
          ]}
          onChange={(v) => setTweak('stepStyle', v)} />
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
