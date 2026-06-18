export const revalidate = 30

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MyInfoClient from './MyInfoClient'

export default async function MyInfoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isGuest = !user

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '회원'
  const phone = user?.phone || user?.user_metadata?.phone || user?.user_metadata?.phone_number || '전화번호 미등록'
  const email = user?.email || ''

  // 로그인한 경우에만 신청 내역 조회
  let cases: { id: string; deceased_name: string; status: string; created_at: string }[] = []
  if (user) {
    const { data } = await supabase
      .from('cases')
      .select('id, deceased_name, status, created_at')
      .eq('user_id', user.id)
      .neq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(2)
    cases = data || []
  }

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif", background: '#F4F6F9', minHeight: '100vh', paddingBottom: 100 }}>
      {/* 헤더 */}
      <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0, textAlign: 'center' }}>내 정보</h1>
      </div>

      <div style={{ padding: '20px' }}>

        {/* ── 프로필 박스 ── */}
        {isGuest ? (
          <div style={{
            background: '#fff', borderRadius: 20, padding: '24px 20px',
            border: '1px solid #E8EAF0', marginBottom: 32, textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#F3F4F6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, margin: '0 auto 12px',
            }}>👤</div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>로그인해주세요</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 16px' }}>서비스 이용을 위해 로그인이 필요합니다</p>
          </div>
        ) : (
          <Link href="/home/myinfo/edit" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', borderRadius: 20, padding: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: '1px solid #E8EAF0', boxShadow: '0 1px 4px rgba(0,0,0,0.02)', marginBottom: 32
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: '#2563EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0
                }}>
                  {displayName.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    {displayName} 님
                  </p>
                  <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, fontWeight: 500 }}>
                    {phone !== '전화번호 미등록' ? phone : email} · 정보 수정 →
                  </p>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </Link>
        )}

        {/* ── 신청 내역 (비로그인이면 MyInfoClient에서 팝업 처리) ── */}
        {!isGuest && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>신청 내역</h2>
              <Link href="/home/orders" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none', fontWeight: 600 }}>
                전체 보기 &gt;
              </Link>
            </div>
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8EAF0', overflow: 'hidden' }}>
              {cases.length > 0 ? (
                cases.map((c, idx) => {
                  const isLast = idx === cases.length - 1
                  const isCompleted = c.status === 'completed'
                  return (
                    <Link href="/home/orders" key={c.id} style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: isLast ? 'none' : '1px solid #F3F4F6', background: '#fff'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: isCompleted ? '#F3F4F6' : '#EFF6FF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {isCompleted ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ) : (
                              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #2563EB', borderTopColor: 'transparent', transform: 'rotate(45deg)' }} />
                            )}
                          </div>
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{c.deceased_name} 님</p>
                            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                              {isCompleted ? '완료' : '진행 중'} · {new Date(c.created_at).toLocaleDateString('ko-KR')} 신청
                            </p>
                          </div>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                  진행 중인 신청 내역이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 결제/도움받기/설정 — 클라이언트 컴포넌트에서 처리 */}
        <MyInfoClient isGuest={isGuest} />
      </div>
    </div>
  )
}
