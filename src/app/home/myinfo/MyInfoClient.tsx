'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LoginBottomSheet } from '@/components/ui/LoginBottomSheet'

type ModalType = 'notification' | 'privacy' | 'terms' | null

export default function MyInfoClient({ isGuest = false }: { isGuest?: boolean }) {
  const supabase = createClient()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)

  const requireLogin = (fn: () => void) => {
    if (isGuest) { setLoginOpen(true); return }
    fn()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const MenuItem = ({ icon, title, desc, onClick, bgColor = '#F3F4F6' }: {
    icon: string; title: string; desc?: string;
    onClick: () => void; bgColor?: string;
  }) => (
    <div onClick={onClick} style={{
      padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: desc ? '0 0 2px' : 0 }}>{title}</p>
          {desc && <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{desc}</p>}
        </div>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  )

  return (
    <>
      <LoginBottomSheet open={loginOpen} onClose={() => setLoginOpen(false)} redirectTo="/home/myinfo" />

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 13, fontWeight: 600,
          padding: '10px 20px', borderRadius: 99, zIndex: 500, whiteSpace: 'nowrap',
        }}>{toast}</div>
      )}

      {/* 바텀시트 모달 */}
      {activeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setActiveModal(null)}>
          <div style={{
            background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 48px',
            width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 99, margin: '0 auto 20px' }} />

            {activeModal === 'notification' && (<>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>🔔 알림 설정</h3>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: '0 0 20px' }}>
                에프텀은 행정 처리 현황이 업데이트될 때마다 앱 내 알림을 통해 실시간으로 안내드립니다.<br /><br />
                알림은 홈 화면 우측 상단 🔔 벨 아이콘을 통해 확인하실 수 있습니다.
              </p>
              <div style={{ background: '#EBF3FF', borderRadius: 14, padding: '14px 16px' }}>
                <p style={{ fontSize: 13, color: '#0066FF', margin: 0, fontWeight: 600 }}>
                  📱 카카오 채널을 추가하시면 카카오톡으로도 알림을 받으실 수 있습니다.
                </p>
              </div>
            </>)}

            {activeModal === 'privacy' && (<>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>🔒 개인정보 보호</h3>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>
                <p style={{ fontWeight: 700, margin: '0 0 8px' }}>수집하는 개인정보</p>
                <p style={{ color: '#6B7280', margin: '0 0 16px' }}>이름, 이메일, 전화번호, 고인 정보, 서비스 신청 내역</p>
                <p style={{ fontWeight: 700, margin: '0 0 8px' }}>이용 목적</p>
                <p style={{ color: '#6B7280', margin: '0 0 16px' }}>상속·해지 등 행정 대행 서비스 제공 및 처리 현황 안내</p>
                <p style={{ fontWeight: 700, margin: '0 0 8px' }}>보관 기간</p>
                <p style={{ color: '#6B7280', margin: '0 0 16px' }}>서비스 완료 후 3년간 보관 (관련 법령에 따름)</p>
                <p style={{ fontWeight: 700, margin: '0 0 8px' }}>제3자 제공</p>
                <p style={{ color: '#6B7280', margin: 0 }}>서비스 처리에 필요한 기관(금융사, 통신사 등)에 한해 제공되며, 그 외 제3자에게 제공하지 않습니다.</p>
              </div>
            </>)}

            {activeModal === 'terms' && (<>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 20px' }}>📄 이용약관 및 정책</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '이용약관', href: '/terms' },
                  { label: '개인정보처리방침', href: '/privacy' },
                  { label: '환불정책', href: '/refund' },
                ].map(item => (
                  <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 18px', borderRadius: 14, border: '1px solid #E5E7EB', background: '#FAFAFA',
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{item.label}</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </>)}

            <button onClick={() => setActiveModal(null)} style={{
              width: '100%', marginTop: 24, padding: '14px', borderRadius: 14,
              background: '#0066FF', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}>확인</button>
          </div>
        </div>
      )}

      {/* 결제 */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>결제</h2>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8EAF0', overflow: 'hidden' }}>
          <MenuItem icon="💳" title="결제 정보" desc="서비스 완료 후 청구됩니다" onClick={() => requireLogin(() => showToast('서비스 준비 중입니다'))} />
          <div style={{ borderBottom: 'none' }}>
            <MenuItem icon="🧾" title="결제 내역" desc="처리 완료 건 확인" onClick={() => requireLogin(() => showToast('서비스 준비 중입니다'))} />
          </div>
        </div>
      </div>

      {/* 도움 받기 */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>도움 받기</h2>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8EAF0', overflow: 'hidden' }}>
          <MenuItem icon="💬" title="1:1 상담" desc="카카오 채널로 문의하기" bgColor="#FEE500"
            onClick={() => window.open('https://pf.kakao.com/_cxfNAX', '_blank')} />
          <MenuItem icon="❓" title="자주 묻는 질문" desc="비용·서류·처리 기간" onClick={() => requireLogin(() => showToast('서비스 준비 중입니다'))} />
          <MenuItem icon="📖" title="상속 절차 안내서" onClick={() => requireLogin(() => showToast('서비스 준비 중입니다'))} />
          <div style={{ borderBottom: 'none' }}>
            <MenuItem icon="📞" title="긴급 연락처 등록" onClick={() => requireLogin(() => showToast('서비스 준비 중입니다'))} />
          </div>
        </div>
      </div>

      {/* 설정 */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>설정</h2>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8EAF0', overflow: 'hidden' }}>
          <MenuItem icon="🔔" title="알림 설정" onClick={() => setActiveModal('notification')} />
          <MenuItem icon="🔒" title="개인정보 보호" onClick={() => setActiveModal('privacy')} />
          <MenuItem icon="📄" title="이용약관 및 정책" onClick={() => setActiveModal('terms')} />
          {!isGuest && (
            <div onClick={() => setShowLogoutConfirm(true)} style={{
              padding: '20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', background: '#fff',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#EF4444', margin: 0 }}>로그아웃</p>
            </div>
          )}
          {isGuest && (
            <div onClick={() => setLoginOpen(true)} style={{
              padding: '20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', background: '#fff',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0066FF', margin: 0 }}>로그인하기</p>
            </div>
          )}
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }} onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 320 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 8px', textAlign: 'center' }}>로그아웃</h3>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', textAlign: 'center' }}>정말 로그아웃 하시겠습니까?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#F3F4F6', color: '#374151', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                취소
              </button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#EF4444', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
