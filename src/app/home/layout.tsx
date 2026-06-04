import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeTabBar from './HomeTabBar'

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // 온보딩 미완료면 온보딩으로
  if (!user.user_metadata?.onboarding_done) {
    redirect('/onboarding?next=/home')
  }

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
