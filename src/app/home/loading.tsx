export default function HomeLoading() {
  return (
    <div style={{ minHeight: '100dvh', background: '#f8f9fb' }}>
      <div style={{ height: 200, background: '#2563EB', borderRadius: '0 0 24px 24px', marginBottom: 20 }} />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[1, 2].map(i => (
          <div key={i} style={{
            background: '#fff', borderRadius: 16, height: 80,
            border: '1px solid #E8EAF0',
          }} />
        ))}
      </div>
    </div>
  )
}
