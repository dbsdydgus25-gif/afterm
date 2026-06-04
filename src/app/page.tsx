'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

/* ─── 스크롤 FadeIn ─── */
function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Fade({ children, delay = 0, y = 20, className = '' }: {
  children: React.ReactNode; delay?: number; y?: number; className?: string
}) {
  const { ref, visible } = useFadeIn()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : `translateY(${y}px)`,
      transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

/* ─── 히어로 줄별 애니메이션 ─── */
function HeroLine({ children, delay }: { children: React.ReactNode; delay: number }) {
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <span style={{
      display: 'block',
      opacity: show ? 1 : 0,
      transform: show ? 'none' : 'translateY(18px)',
      transition: 'opacity .6s ease, transform .6s ease',
    }}>
      {children}
    </span>
  )
}

/* ─── 손글씨 타이핑 효과 ─── */
function HandwriteText({ text, trigger, delay = 0 }: { text: string; trigger: boolean; delay?: number }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!trigger) return
    const t = setTimeout(() => {
      let i = 0
      const iv = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) clearInterval(iv)
      }, 60)
      return () => clearInterval(iv)
    }, delay)
    return () => clearTimeout(t)
  }, [trigger, text, delay])
  return <>{displayed}</>
}

/* ─── 플랫폼 아이콘 데이터 ─── */
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', bg: 'linear-gradient(135deg,#FFDC80,#FCAF45,#F77737,#C13584,#833AB4)', icon: <svg viewBox="0 0 24 24" fill="white" width="26" height="26"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { id: 'facebook', label: 'Facebook', bg: '#1877F2', icon: <svg viewBox="0 0 24 24" fill="white" width="26" height="26"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { id: 'google', label: 'Google', bg: '#fff', border: '1.5px solid #e5e7eb', icon: <svg viewBox="0 0 24 24" width="26" height="26"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
  { id: 'kakao', label: 'KakaoTalk', bg: '#FEE500', icon: <svg viewBox="0 0 24 24" width="26" height="26"><path fill="#3C1E1E" d="M12 3C6.477 3 2 6.582 2 11c0 2.89 1.815 5.44 4.584 6.965L5.5 21l4.326-2.876A11.91 11.91 0 0012 18.2c5.523 0 10-3.582 10-8.2S17.523 3 12 3z"/></svg> },
  { id: 'twitter', label: 'X', bg: '#000', icon: <svg viewBox="0 0 24 24" fill="white" width="22" height="22"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
]

/* 아이콘 floating 위치 (left%, top%, 크기, 딜레이) */
const FLOAT_CONFIGS = [
  { left: 8,  top: 10, size: 52, delay: 0,    dur: 3.2 },
  { left: 72, top: 5,  size: 44, delay: 200,  dur: 2.8 },
  { left: 80, top: 55, size: 48, delay: 400,  dur: 3.5 },
  { left: 5,  top: 65, size: 44, delay: 100,  dur: 2.6 },
  { left: 42, top: 80, size: 40, delay: 300,  dur: 3.0 },
]

/* ─── 신청자 수 카운터 ─── */
function useApplicants(base = 12) {
  const [count, setCount] = useState(base)
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.3) setCount(c => c + 1)
    }, 4000)
    return () => clearInterval(id)
  }, [])
  return count.toLocaleString()
}

export default function LandingPage() {
  const applicants = useApplicants()

  /* 섹션2 트리거 */
  const sec2Ref = useRef<HTMLDivElement>(null)
  const [sec2Visible, setSec2Visible] = useState(false)
  useEffect(() => {
    const el = sec2Ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSec2Visible(true); obs.disconnect() } }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <>
      {/* ── 글로벌 keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap');
        @keyframes float0 { 0%,100%{transform:translateY(0px) rotate(-3deg)} 50%{transform:translateY(-12px) rotate(2deg)} }
        @keyframes float1 { 0%,100%{transform:translateY(0px) rotate(2deg)} 50%{transform:translateY(-14px) rotate(-2deg)} }
        @keyframes float2 { 0%,100%{transform:translateY(0px) rotate(-1deg)} 50%{transform:translateY(-10px) rotate(3deg)} }
        @keyframes float3 { 0%,100%{transform:translateY(0px) rotate(3deg)} 50%{transform:translateY(-16px) rotate(-1deg)} }
        @keyframes float4 { 0%,100%{transform:translateY(0px) rotate(-2deg)} 50%{transform:translateY(-11px) rotate(2deg)} }
        @keyframes popIn { 0%{opacity:0;transform:scale(0.4)} 70%{transform:scale(1.15)} 100%{opacity:1;transform:scale(1)} }
        @keyframes heroFadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
      `}</style>

      <div style={{
        fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif",
        background: '#fff',
        minHeight: '100vh',
        maxWidth: 480,
        margin: '0 auto',
        overflowX: 'hidden',
      }}>

        {/* ════════════════════════════════
            히어로 (헤더 포함 — 배경 이어짐)
        ════════════════════════════════ */}
        <div style={{
          background: 'linear-gradient(155deg,#0b1d47 0%,#163272 55%,#1c4494 100%)',
          paddingBottom: 64,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 배경 장식 */}
          <div style={{ position:'absolute', top:-100, right:-100, width:320, height:320, borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.025)', pointerEvents:'none' }} />

          {/* 헤더 */}
          <header style={{
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Image src="/logo.jpg" alt="AFTERM" width={88} height={26}
              style={{ objectFit:'contain', objectPosition:'left', filter:'invert(1) brightness(10)', mixBlendMode:'screen' }} />
            <Link href="/login" style={{
              fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600,
              textDecoration: 'none', padding: '7px 16px',
              border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 8,
            }}>
              로그인
            </Link>
          </header>

          {/* 히어로 텍스트 */}
          <div style={{ padding: '40px 24px 0' }}>
            <p style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: 12, fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '0 0 28px',
              animation: 'heroFadeUp .5s ease .1s both',
            }}>
              디지털 유산 행정 대행 서비스
            </p>

            <h1 style={{
              color: '#fff', fontSize: 40, fontWeight: 800,
              lineHeight: 1.2, margin: '0 0 22px',
              wordBreak: 'keep-all', letterSpacing: '-0.5px',
            }}>
              <HeroLine delay={200}>아직도</HeroLine>
              <HeroLine delay={420}><span style={{ color:'#89bfff' }}>정리할 게</span></HeroLine>
              <HeroLine delay={640}>남았다고요?</HeroLine>
            </h1>

            <div style={{ animation:'heroFadeUp .6s ease .9s both', opacity:0 }}>
              <p style={{
                color:'rgba(255,255,255,0.65)',
                fontSize:15, lineHeight:1.75,
                margin:'0 0 36px', wordBreak:'keep-all',
              }}>
                장례 이후 남겨진 디지털 유산,<br />
                에프텀이 전부 대신 처리해드립니다.
              </p>

              <Link href="/apply" style={{
                display:'inline-flex', alignItems:'center', gap:8,
                background:'#fff', color:'#0b1d47',
                borderRadius:14, padding:'15px 28px',
                fontWeight:800, fontSize:15,
                textDecoration:'none',
                boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
                letterSpacing:'-0.2px',
              }}>
                무료로 신청하기
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════
            SECTION 2: 감정 공감 + 플로팅 아이콘
        ════════════════════════════════ */}
        <section ref={sec2Ref} style={{ padding:'72px 24px 80px', textAlign:'center', position:'relative' }}>

          {/* 플로팅 아이콘들 */}
          {PLATFORMS.map((p, i) => {
            const cfg = FLOAT_CONFIGS[i]
            return (
              <div key={p.id} style={{
                position:'absolute',
                left:`${cfg.left}%`,
                top:`${cfg.top}%`,
                width: cfg.size,
                height: cfg.size,
                borderRadius: cfg.size * 0.26,
                background: p.bg,
                border: (p as {border?:string}).border ?? 'none',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
                opacity: sec2Visible ? 1 : 0,
                animation: sec2Visible
                  ? `popIn .5s ease ${cfg.delay + 600}ms both, float${i} ${cfg.dur}s ease-in-out ${cfg.delay + 1100}ms infinite`
                  : 'none',
                zIndex: 0,
              }}>
                {p.icon}
              </div>
            )
          })}

          {/* 텍스트 — 플로팅 위에 올라옴 */}
          <div style={{ position:'relative', zIndex:1 }}>
            <p style={{ color:'#bbb', fontSize:12, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', margin:'0 0 16px' }}>
              많은 분들이 겪고 있어요
            </p>

            <h2 style={{ fontSize:26, fontWeight:800, color:'#111', lineHeight:1.4, margin:'0 0 14px', wordBreak:'keep-all' }}>
              장례 이후 쌓여있는
            </h2>

            {/* 손글씨 타이핑 */}
            <p style={{
              fontSize:34, margin:'0 0 24px', lineHeight:1.2,
              fontFamily:"'Nanum Pen Script', cursive",
              color:'#163272',
              minHeight:44,
            }}>
              <HandwriteText text="고인의 디지털 유산" trigger={sec2Visible} delay={400} />
            </p>

            <p style={{ color:'#666', fontSize:14, lineHeight:1.85, margin:0, wordBreak:'keep-all' }}>
              아직 해지되지 않은 구독, 정리되지 않은 계정들.<br />
              가족 중 누가 처리해야 할지 몰라<br />그냥 두고 계신가요?
            </p>
          </div>
        </section>

        {/* ════════════════════════════════
            SECTION 3: 에프텀 약속 (박스 없음 + 악수 일러스트)
        ════════════════════════════════ */}
        <section style={{ padding:'0 24px 72px', textAlign:'center' }}>
          <Fade>
            <p style={{ color:'#1a3a7c', fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', margin:'0 0 14px' }}>OUR PROMISE</p>
            <h2 style={{ fontSize:26, fontWeight:800, color:'#111', margin:'0 0 12px', lineHeight:1.45, wordBreak:'keep-all' }}>
              에프텀이 고인의<br />
              <span style={{ color:'#163272' }}>장례 그 이후</span>를<br />
              함께 하겠습니다
            </h2>
            <p style={{ color:'#777', fontSize:14, lineHeight:1.8, margin:'0 0 36px', wordBreak:'keep-all' }}>
              슬픔의 시간에 행정 부담까지<br />지지 않아도 됩니다.
            </p>
          </Fade>

          <Fade delay={150}>
            <div style={{ width:'100%', borderRadius:24, overflow:'hidden', aspectRatio:'4/3', position:'relative' }}>
              <Image
                src="/handshake.png"
                alt="에프텀 대행 서비스"
                fill
                style={{ objectFit:'cover', objectPosition:'center' }}
              />
            </div>
          </Fade>
        </section>

        {/* ════════════════════════════════
            SECTION 4: HOW IT WORKS
        ════════════════════════════════ */}
        <section style={{ padding:'0 24px 72px', background:'#f7f9ff', marginBottom:0 }}>
          <div style={{ paddingTop:56 }}>
            <Fade>
              <p style={{ color:'#1a3a7c', fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', margin:'0 0 10px' }}>HOW IT WORKS</p>
              <h2 style={{ fontSize:24, fontWeight:800, color:'#111', lineHeight:1.5, margin:'0 0 32px', wordBreak:'keep-all' }}>
                간편 가입부터<br />
                간단한 서류 제출로
              </h2>
            </Fade>

            {[
              { num:'01', title:'회원가입', desc:'이름, 이메일, 전화번호만 입력하면 끝' },
              { num:'02', title:'서류 3종 업로드', desc:'사망진단서 · 가족관계증명서 · 신분증' },
              { num:'03', title:'서비스 선택 & 서명', desc:'처리할 계정 선택 후 위임장에 서명' },
              { num:'04', title:'에프텀이 처리', desc:'접수 후 모든 대행은 저희가 담당합니다' },
            ].map((step, i) => (
              <Fade key={step.num} delay={i * 70}>
                <div style={{ display:'flex', gap:16, marginBottom:20, alignItems:'flex-start' }}>
                  <div style={{
                    width:44, height:44, borderRadius:13,
                    background:'#fff', border:'1.5px solid #dde8ff',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    boxShadow:'0 2px 8px rgba(22,50,114,0.08)',
                  }}>
                    <span style={{ fontSize:12, fontWeight:800, color:'#163272' }}>{step.num}</span>
                  </div>
                  <div style={{ paddingTop:3 }}>
                    <p style={{ fontWeight:700, color:'#111', fontSize:15, margin:'0 0 3px' }}>{step.title}</p>
                    <p style={{ color:'#888', fontSize:13, margin:0, lineHeight:1.65 }}>{step.desc}</p>
                  </div>
                </div>
              </Fade>
            ))}

            <Fade delay={300}>
              <div style={{ marginTop:8, padding:'18px 20px', background:'#edf3ff', borderRadius:14, borderLeft:'4px solid #163272' }}>
                <p style={{ color:'#163272', fontSize:14, margin:0, lineHeight:1.75, fontWeight:700, wordBreak:'keep-all' }}>
                  남겨진 포인트·혜택은<br />
                  <span style={{ color:'#333', fontWeight:500 }}>가족에게 돌아올 수 있습니다</span>
                </p>
              </div>
            </Fade>
          </div>
        </section>

        {/* ════════════════════════════════
            SECTION 5: 신뢰 이미지 (이별 후)
        ════════════════════════════════ */}
        <section style={{ padding:'64px 24px' }}>
          <Fade>
            <h2 style={{ fontSize:22, fontWeight:800, color:'#111', margin:'0 0 8px', lineHeight:1.5, wordBreak:'keep-all' }}>
              이별 후 슬프기도 잠시,<br />
              행정처리로 어려움<br />겪지 마세요
            </h2>
            <p style={{ color:'#888', fontSize:14, lineHeight:1.8, margin:'0 0 28px', wordBreak:'keep-all' }}>
              에프텀이 그 이후의 기간을 함께하겠습니다
            </p>
          </Fade>

          <Fade delay={100}>
            <div style={{ width:'100%', borderRadius:24, overflow:'hidden', aspectRatio:'4/3', position:'relative' }}>
              <Image
                src="/office.png"
                alt="에프텀 행정 대행 업무"
                fill
                style={{ objectFit:'cover', objectPosition:'center' }}
              />
              {/* 신뢰 배지 오버레이 */}
              <div style={{
                position:'absolute', bottom:16, left:16, right:16,
                background:'rgba(255,255,255,0.15)',
                backdropFilter:'blur(14px)',
                borderRadius:14, padding:'14px 18px',
                display:'flex', alignItems:'center', gap:12,
              }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <p style={{ color:'#fff', fontWeight:700, fontSize:13, margin:0, textShadow:'0 1px 4px rgba(0,0,0,0.4)' }}>전담 매니저 1:1 대행</p>
                  <p style={{ color:'rgba(255,255,255,0.85)', fontSize:11, margin:0, textShadow:'0 1px 4px rgba(0,0,0,0.3)' }}>접수부터 완료까지 직접 처리합니다</p>
                </div>
              </div>
            </div>
          </Fade>
        </section>

        {/* ════════════════════════════════
            SECTION 6: CTA — 신청자 수
        ════════════════════════════════ */}
        <section style={{ padding:'0 24px 56px' }}>
          <Fade>
            <div style={{
              background:'linear-gradient(135deg,#0b1d47,#163272)',
              borderRadius:24, padding:'44px 28px',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
              <div style={{ position:'absolute', bottom:-60, left:-30, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />

              {/* 신청자 수 */}
              <div style={{ marginBottom:24, position:'relative' }}>
                <p style={{ color:'rgba(255,255,255,0.55)', fontSize:12, fontWeight:600, margin:'0 0 4px', letterSpacing:'0.05em' }}>
                  지금까지 신청한 분들
                </p>
                <p style={{ color:'#fff', fontSize:52, fontWeight:900, margin:0, lineHeight:1, letterSpacing:'-1px' }}>
                  {applicants}
                  <span style={{ fontSize:20, fontWeight:600, marginLeft:4, color:'rgba(255,255,255,0.7)' }}>명</span>
                </p>
              </div>

              <h2 style={{ color:'#fff', fontSize:24, fontWeight:800, margin:'0 0 8px', lineHeight:1.4, wordBreak:'keep-all' }}>
                지금 신청하면<br />
                <span style={{ color:'#89bfff' }}>행정 처리 무료</span>
              </h2>
              <p style={{ color:'rgba(255,255,255,0.55)', fontSize:13, margin:'0 0 32px', lineHeight:1.65 }}>
                선착순 한정 혜택입니다
              </p>

              <Link href="/apply" style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                background:'#fff', color:'#0b1d47',
                borderRadius:14, padding:'18px 0',
                fontWeight:800, fontSize:17,
                textDecoration:'none',
                boxShadow:'0 6px 24px rgba(0,0,0,0.3)',
                letterSpacing:'-0.3px',
                position:'relative',
              }}>
                신청하기
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>

              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, marginTop:14, textAlign:'center' }}>
                신용카드 없이 · 약정 없이 · 지금 바로
              </p>
            </div>
          </Fade>
        </section>

        {/* ── 푸터 ── */}
        <footer style={{ background:'#fff', padding:'32px 24px 52px', borderTop:'1px solid #e8eaed' }}>
          <Image src="/logo.jpg" alt="AFTERM" width={72} height={22}
            style={{ objectFit:'contain', objectPosition:'left', opacity:0.7, marginBottom:18 }} />
          <div style={{ color:'#555', fontSize:11, lineHeight:2.1 }}>
            <p style={{ margin:0 }}>상호명: 에프텀</p>
            <p style={{ margin:0 }}>대표자: 윤용현</p>
            <p style={{ margin:0 }}>사업자번호: 221-20-19292</p>
            <p style={{ margin:0 }}>소재지: 경기도 평택시 지산로 128 9층</p>
            <p style={{ margin:0 }}>이메일: afterm001@gmail.com</p>
          </div>
          <div style={{ display:'flex', gap:16, marginTop:20 }}>
            <Link href="/terms" style={{ color:'#888', fontSize:11, textDecoration:'none' }}>이용약관</Link>
            <Link href="/privacy" style={{ color:'#888', fontSize:11, textDecoration:'none' }}>개인정보처리방침</Link>
          </div>
          <p style={{ color:'#bbb', fontSize:10, margin:'16px 0 0' }}>© 2026 Afterm. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}
