import HomeTabBar from './HomeTabBar'

// 인증 체크는 middleware.ts에서 처리
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      maxWidth: 480, margin: '0 auto', minHeight: '100vh',
      background: '#f8f9fb', paddingBottom: 72,
    }}>
      {children}
      <HomeTabBar />
    </div>
  )
}
