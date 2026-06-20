'use client'

const CHANNEL_URL = 'https://pf.kakao.com/_cxfNAX'

export default function ChatOpenButton() {
  return (
    <a
      href={CHANNEL_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block', width: '100%' }}
    >
      <div style={{
        background: '#FEE500', borderRadius: 16, padding: '20px 16px',
        border: '1px solid #F0D000', boxShadow: '0 1px 6px rgba(254,229,0,0.4)',
        display: 'flex', flexDirection: 'column', gap: 12, minHeight: 100, justifyContent: 'flex-end',
      }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#111', margin: '0 0 4px', letterSpacing: '-0.01em' }}>카카오 채널 추가</p>
          <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', margin: 0 }}>에프텀 공식 채널</p>
        </div>
      </div>
    </a>
  )
}
