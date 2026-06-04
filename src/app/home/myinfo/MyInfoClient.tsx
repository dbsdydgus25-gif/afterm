'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MyInfoClient() {
  const router = useRouter()
  const supabase = createClient()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8EAF0', overflow: 'hidden' }}>
        {[
          { icon: '🔔', title: '알림 설정' },
          { icon: '🔒', title: '개인정보 보호' },
          { icon: '📄', title: '이용약관 및 정책' },
        ].map((item, idx) => (
          <div key={item.title} style={{
            padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: '#fff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {item.icon}
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
                {item.title}
              </p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        ))}
        
        <div 
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', background: '#fff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#EF4444', margin: 0 }}>
              로그아웃
            </p>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }} onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 320 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 8px', textAlign: 'center' }}>로그아웃</h3>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', textAlign: 'center' }}>정말 로그아웃 하시겠습니까?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#F3F4F6', color: '#374151', fontSize: 15, fontWeight: 700, border: 'none' }}>
                취소
              </button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#EF4444', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none' }}>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
