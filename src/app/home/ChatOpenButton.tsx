'use client'

export default function ChatOpenButton() {
  const openChat = () => {
    window.dispatchEvent(new CustomEvent('afterm-open-chat'))
  }

  return (
    <button
      onClick={openChat}
      style={{
        background: 'none', border: 'none', padding: 0,
        textAlign: 'left', cursor: 'pointer', width: '100%',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, padding: '20px 16px',
        border: '1px solid #F0F0F0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          🎧
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.01em' }}>전문가와 상담하기</p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>평일 10-18시</p>
        </div>
      </div>
    </button>
  )
}
