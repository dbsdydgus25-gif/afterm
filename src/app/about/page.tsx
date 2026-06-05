import Link from 'next/link'

export default function AboutPage() {
  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8f9fb' }}>
      {/* 헤더 */}
      <div style={{ background: '#163272', padding: '20px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <Link href="/home" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14, marginBottom: 20 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          홈으로
        </Link>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.03em' }}>에프텀 소개</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>사랑하는 분의 마지막 행정, 에프텀이 함께합니다</p>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 서비스 소개 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #E8EAF0' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>에프텀이란?</h2>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.8, margin: 0 }}>
            에프텀(Afterm)은 가족을 잃은 후 처리해야 하는 복잡한 행정 업무를 전문적으로 대행해 드리는 서비스입니다.<br /><br />
            은행 계좌 해지, 유족연금 신청, 보험금 청구, 휴대폰 해지 등 수십 가지 행정 절차를 에프텀 하나로 해결하세요.
          </p>
        </div>

        {/* 서비스 특징 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #E8EAF0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>왜 에프텀인가요?</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '⏱️', title: '시간 절약', desc: '직접 각 기관을 방문하거나 전화할 필요 없이, 에프텀이 모든 절차를 대신합니다.' },
              { icon: '📋', title: '원스톱 처리', desc: '금융, 통신, 보험, 연금 등 모든 분야를 하나의 플랫폼에서 처리합니다.' },
              { icon: '🔔', title: '실시간 알림', desc: '처리 현황이 업데이트될 때마다 앱 알림으로 즉시 안내드립니다.' },
              { icon: '💬', title: '전문가 상담', desc: '카카오 채널을 통해 언제든 전문 상담사와 직접 소통하실 수 있습니다.' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EBF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{f.title}</p>
                  <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 처리 가능 서비스 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #E8EAF0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>처리 가능한 행정 서비스</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['은행 계좌 해지', '보험금 청구', '유족연금 신청', '휴대폰 해지', '인터넷 해지', '공과금 정리', '안심상속 신청', '부동산 상속', '자동차 이전', '카드 해지'].map(tag => (
              <span key={tag} style={{ fontSize: 12, fontWeight: 600, color: '#163272', background: '#EBF3FF', padding: '6px 12px', borderRadius: 100 }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* 문의 */}
        <div style={{ background: '#FEE500', borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 28 }}>💬</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#111', margin: '0 0 2px' }}>궁금한 점이 있으신가요?</p>
            <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', margin: 0 }}>카카오 채널에서 전문 상담사가 답변드립니다</p>
          </div>
          <a href="https://pf.kakao.com/_cxfNAX" target="_blank" rel="noopener noreferrer"
            style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.12)', color: '#111', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 99, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            채널 추가
          </a>
        </div>
      </div>

      <div style={{ height: 40 }} />
    </div>
  )
}
