'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ModalType = 'notification' | 'privacy' | 'terms' | null

export default function MyInfoClient() {
  const router = useRouter()
  const supabase = createClient()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const MENU_ITEMS = [
    { icon: '🔔', title: '알림 설정', modal: 'notification' as ModalType },
    { icon: '🔒', title: '개인정보 보호', modal: 'privacy' as ModalType },
    { icon: '📄', title: '이용약관 및 정책', modal: 'terms' as ModalType },
  ]

  return (
    <>
      {/* 모달 */}
      {activeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setActiveModal(null)}>
          <div style={{
            background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px',
            width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 99, margin: '0 auto 20px' }} />

            {activeModal === 'notification' && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>🔔 알림 설정</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: '0 0 20px' }}>
                  에프텀은 행정 처리 현황이 업데이트될 때마다 앱 내 알림을 통해 실시간으로 안내드립니다.<br /><br />
                  알림은 홈 화면 우측 상단 🔔 벨 아이콘을 통해 확인하실 수 있습니다.
                </p>
                <div style={{ background: '#EBF3FF', borderRadius: 14, padding: '14px 16px' }}>
                  <p style={{ fontSize: 13, color: '#163272', margin: 0, fontWeight: 600 }}>
                    📱 카카오 채널을 추가하시면 카카오톡으로도 알림을 받으실 수 있습니다.
                  </p>
                </div>
              </>
            )}

            {activeModal === 'privacy' && (
              <>
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
              </>
            )}

            {activeModal === 'terms' && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>📄 이용약관 및 정책</h3>
                <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>
                  <p style={{ fontWeight: 700, margin: '0 0 8px' }}>서비스 이용약관</p>
                  <p style={{ color: '#6B7280', margin: '0 0 16px' }}>에프텀은 사망 이후 발생하는 행정 업무를 대행하는 서비스입니다. 서비스 이용 시 고객님의 위임을 받아 각 기관에 해지·신고·청구 등의 업무를 처리합니다.</p>
                  <p style={{ fontWeight: 700, margin: '0 0 8px' }}>면책 조항</p>
                  <p style={{ color: '#6B7280', margin: '0 0 16px' }}>에프텀은 각 기관의 내부 정책 변경, 처리 지연 등 에프텀의 귀책이 아닌 사유로 발생한 결과에 대해서는 책임을 지지 않습니다.</p>
                  <p style={{ fontWeight: 700, margin: '0 0 8px' }}>문의</p>
                  <p style={{ color: '#6B7280', margin: 0 }}>카카오 채널 또는 이메일(afterm001@gmail.com)로 문의해 주세요.</p>
                </div>
              </>
            )}

            <button onClick={() => setActiveModal(null)} style={{
              width: '100%', marginTop: 24, padding: '14px', borderRadius: 14,
              background: '#163272', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}>확인</button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8EAF0', overflow: 'hidden' }}>
        {MENU_ITEMS.map((item) => (
          <div key={item.title} onClick={() => setActiveModal(item.modal)} style={{
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
