'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LoginBottomSheet } from '@/components/ui/LoginBottomSheet'

type ModalType = 'notification' | 'privacy' | 'terms' | 'payments' | null

type PaymentCase = {
  id: string
  deceased_name: string
  status: string
  payment_status: string
  paid_amount: number | null
  paid_at: string | null
  refunded_at: string | null
  case_services: { service_name: string }[]
}

export default function MyInfoClient({ isGuest = false }: { isGuest?: boolean }) {
  const supabase = createClient()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [paymentCases, setPaymentCases] = useState<PaymentCase[]>([])
  const [paymentLoading, setPaymentLoading] = useState(false)

  const openPayments = async () => {
    if (isGuest) { setLoginOpen(true); return }
    setActiveModal('payments')
    setPaymentLoading(true)
    const { data } = await supabase
      .from('cases')
      .select('id, deceased_name, status, payment_status, paid_amount, paid_at, refunded_at, case_services(service_name)')
      .in('payment_status', ['paid', 'refunded'])
      .order('paid_at', { ascending: false })
    setPaymentCases((data as PaymentCase[]) || [])
    setPaymentLoading(false)
  }

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

  const MenuItem = ({ icon: _icon, title, desc, onClick, bgColor: _bgColor }: {
    icon?: string; title: string; desc?: string;
    onClick: () => void; bgColor?: string;
  }) => (
    <div onClick={onClick} style={{
      padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: '#fff',
    }}>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: desc ? '0 0 2px' : 0 }}>{title}</p>
        {desc && <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{desc}</p>}
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 310,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setActiveModal(null)}>
          <div style={{
            background: '#fff', borderRadius: '24px 24px 0 0', padding: `24px 20px calc(48px + env(safe-area-inset-bottom))`,
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
                <p style={{ fontSize: 13, color: '#2563EB', margin: 0, fontWeight: 600 }}>
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

            {activeModal === 'payments' && (<>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>🧾 결제 내역</h3>
              {paymentLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>불러오는 중...</div>
              ) : paymentCases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontSize: 15, color: '#9CA3AF' }}>결제 내역이 없습니다</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {paymentCases.map(c => {
                    const isRefunded = c.payment_status === 'refunded'
                    const services = c.case_services?.map(s => s.service_name).join(', ') || '-'
                    const paidDate = c.paid_at ? new Date(c.paid_at).toLocaleDateString('ko-KR') : '-'
                    const refundDate = c.refunded_at ? new Date(c.refunded_at).toLocaleDateString('ko-KR') : null
                    return (
                      <div key={c.id} style={{
                        borderRadius: 16, border: `1px solid ${isRefunded ? '#FECACA' : '#DBEAFE'}`,
                        background: isRefunded ? '#FFF5F5' : '#F0F7FF', overflow: 'hidden',
                      }}>
                        {/* 상태 바 */}
                        <div style={{
                          padding: '10px 14px',
                          background: isRefunded ? '#FEE2E2' : '#DBEAFE',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: isRefunded ? '#DC2626' : '#1D4ED8' }}>
                            {isRefunded ? '🔄 환불 완료' : '✅ 결제 완료'}
                          </span>
                          <span style={{ fontSize: 11, color: isRefunded ? '#EF4444' : '#2563EB', fontWeight: 700 }}>
                            {c.paid_amount?.toLocaleString()}원
                          </span>
                        </div>
                        {/* 상세 */}
                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, color: '#6B7280' }}>고인</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{c.deceased_name}님</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, color: '#6B7280' }}>신청 서비스</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', textAlign: 'right', maxWidth: '60%' }}>{services}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, color: '#6B7280' }}>결제일</span>
                            <span style={{ fontSize: 12, color: '#374151' }}>{paidDate}</span>
                          </div>
                          {isRefunded && refundDate && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 12, color: '#6B7280' }}>환불일</span>
                              <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>{refundDate}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, color: '#6B7280' }}>접수번호</span>
                            <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>#{c.id.slice(0,8).toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
              background: '#2563EB', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}>확인</button>
          </div>
        </div>
      )}

      {/* 결제 */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>결제</h2>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8EAF0', overflow: 'hidden' }}>
          <div style={{ borderBottom: 'none' }}>
            <MenuItem icon="🧾" title="결제 내역" desc="결제 및 환불 내역 확인" onClick={openPayments} />
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
              padding: '18px 20px', display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#fff',
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#EF4444', margin: 0 }}>로그아웃</p>
            </div>
          )}
          {isGuest && (
            <div onClick={() => setLoginOpen(true)} style={{
              padding: '18px 20px', display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#fff',
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2563EB', margin: 0 }}>로그인하기</p>
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
