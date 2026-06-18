export default function OrdersLoading() {
  return (
    <div style={{
      height: '100dvh', background: '#F4F6F9',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* 헤더 스켈레톤 */}
      <div style={{ padding: '16px 20px 14px', background: '#2563EB', flexShrink: 0 }}>
        <div style={{ height: 24, width: 80, borderRadius: 6, background: 'rgba(255,255,255,0.3)', marginBottom: 6 }} />
        <div style={{ height: 14, width: 100, borderRadius: 4, background: 'rgba(255,255,255,0.2)' }} />
      </div>

      {/* 카드 스켈레톤 */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '16px',
          border: '1px solid #E8EAF0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ height: 10, width: 24, borderRadius: 4, background: '#F0F0F0', marginBottom: 8 }} />
              <div style={{ height: 26, width: 120, borderRadius: 6, background: '#E8EAF0' }} />
            </div>
            <div style={{ height: 26, width: 64, borderRadius: 100, background: '#EFF6FF' }} />
          </div>
          <div style={{ height: 48, borderRadius: 10, background: '#F4F6F9', marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ flex: 1, height: 16, borderRadius: 4, background: '#F0F0F0' }} />
            ))}
          </div>
        </div>

        <div style={{
          background: '#fff', borderRadius: 16, padding: '16px',
          border: '1px solid #E8EAF0', height: 180,
        }}>
          <div style={{ height: 14, width: 60, borderRadius: 4, background: '#F0F0F0', marginBottom: 12 }} />
          <div style={{ height: 120, borderRadius: 10, background: '#F4F6F9' }} />
        </div>
      </div>
    </div>
  )
}
