'use client'

export default function HomeChatButton() {
  return (
    <button
      onClick={() => window.open('http://pf.kakao.com/_cxfNAX/chat', '_blank')}
      style={{
        width: '100%', background: 'linear-gradient(135deg, #163272 0%, #1e4db7 100%)',
        border: 'none', borderRadius: 16, padding: '18px 20px',
        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left',
      }}>
      <div style={{ fontSize: 28 }}>💬</div>
      <div>
        <p style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: '0 0 3px' }}>에프텀 담당자에게 문의하기</p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>카카오톡으로 편하게 연락하세요</p>
      </div>
      <svg style={{ marginLeft: 'auto' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  )
}
