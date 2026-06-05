'use client'

const CHANNEL_PUBLIC_ID = '_cxfNAX'
const CHANNEL_URL = `https://pf.kakao.com/${CHANNEL_PUBLIC_ID}`

export default function ChatOpenButton() {
  const handleClick = () => {
    window.open(CHANNEL_URL, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      style={{
        background: 'none', border: 'none', padding: 0,
        textAlign: 'left', cursor: 'pointer', width: '100%',
      }}
    >
      <div style={{
        background: '#FEE500', borderRadius: 16, padding: '20px 16px',
        border: '1px solid #F0D000', boxShadow: '0 1px 6px rgba(254,229,0,0.4)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          💬
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#111', margin: '0 0 4px', letterSpacing: '-0.01em' }}>카카오 채널 추가</p>
          <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', margin: 0 }}>에프텀 공식 채널</p>
        </div>
      </div>
    </button>
  )
}
