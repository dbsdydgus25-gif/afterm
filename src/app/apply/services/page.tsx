'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import {
  SERVICE_CATALOG, CATEGORY_ORDER,
  SERVICE_BY_CATEGORY, type ServiceItem
} from '@/lib/services-catalog'

// Step 1: 서비스 선택
// 질문형 인트로 → 타일 선택 → 계정 정보 입력 모달
export default function ServicesPage() {
  const router = useRouter()
  const { selectedServices, toggleService, setStep, caseId, updateServiceAccount } = useApplyStore()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [accountModal, setAccountModal] = useState<ServiceItem | null>(null)
  const [accountInput, setAccountInput] = useState('')
  const [accountUnknown, setAccountUnknown] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('전체')
  const [phase, setPhase] = useState<'intro' | 'select'>('intro')

  const categories = ['전체', ...CATEGORY_ORDER]
  const filtered = activeCategory === '전체'
    ? SERVICE_CATALOG
    : (SERVICE_BY_CATEGORY[activeCategory as keyof typeof SERVICE_BY_CATEGORY] || [])

  const isSelected = (id: string) => selectedServices.some(s => s.id === id)

  const handleNext = async () => {
    if (selectedServices.length === 0) return
    setLoading(true)
    try {
      if (!caseId) { router.push('/apply'); return }
      await supabase.from('case_services').delete().eq('case_id', caseId)
      const rows = selectedServices.map(s => ({
        case_id: caseId,
        service_id: s.id,
        service_name: s.name,
        service_category: s.category,
        dispatch_type: s.dispatchType,
        contact_info: s.contactInfo,
        account_id: s.accountId || null,
        account_unknown: s.accountUnknown,
        status: 'pending',
      }))
      await supabase.from('case_services').insert(rows)
      setStep(2)
      router.push('/apply/documents')
    } catch {
      alert('저장 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleAccountSave = () => {
    if (!accountModal) return
    updateServiceAccount(accountModal.id, accountInput, accountUnknown)
    setAccountModal(null)
    setAccountInput('')
    setAccountUnknown(false)
  }

  // 인트로 화면
  if (phase === 'intro') {
    return (
      <div style={{ minHeight: 'calc(100dvh - 59px)', display: 'flex', flexDirection: 'column', padding: '48px 28px 24px' }}>
        <div style={{ flex: 1 }}>
          {/* 진행 바 */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '40px' }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                height: '4px', flex: 1, borderRadius: '100px',
                background: i <= 0 ? '#3B6FE8' : '#E2E8F0',
              }} />
            ))}
          </div>

          <h2 style={{
            fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em',
            color: '#1A1A2E', marginBottom: '16px', lineHeight: 1.25,
          }}>
            고인이 이용하셨을<br />서비스를 선택해 주세요
          </h2>
          <p style={{ fontSize: '15px', color: '#9AA3B2', lineHeight: 1.7, marginBottom: '40px' }}>
            확실하지 않아도 괜찮아요.<br />
            아이디 몰라도 괜찮아요.<br />
            <strong style={{ color: '#1A1A2E' }}>생각나는 것 모두 선택</strong>해 주세요.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '🎬', label: 'OTT · 동영상', desc: '넷플릭스, 티빙, 웨이브, 쿠팡플레이 등' },
              { icon: '🎵', label: '음악 스트리밍', desc: '멜론, 지니뮤직, 플로, 스포티파이 등' },
              { icon: '📱', label: '포털 · 통신 · SNS', desc: '네이버, 카카오, SKT, 인스타그램 등' },
              { icon: '💳', label: '금융 · 결제', desc: '토스, 카카오페이, 페이코 등' },
            ].map(item => (
              <div key={item.label} style={{
                padding: '16px 18px',
                background: '#F7F8FA', borderRadius: '14px',
                display: 'flex', alignItems: 'center', gap: '14px',
              }}>
                <span style={{ fontSize: '26px' }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', color: '#9AA3B2', marginTop: '2px' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))', paddingTop: '24px' }}>
          <button
            onClick={() => setPhase('select')}
            style={{
              width: '100%', height: '52px', borderRadius: '12px', border: 'none',
              background: '#1A1A2E', color: '#fff', fontSize: '16px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            서비스 선택하기 →
          </button>
        </div>
      </div>
    )
  }

  // 서비스 선택 화면
  return (
    <div style={{ minHeight: 'calc(100dvh - 59px)', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 안내 */}
      <div style={{ padding: '24px 24px 0' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E', marginBottom: '4px' }}>
          해지할 서비스를 선택해 주세요
        </p>
        <p style={{ fontSize: '13px', color: '#9AA3B2' }}>
          {selectedServices.length > 0
            ? <><strong style={{ color: '#3B6FE8' }}>{selectedServices.length}개</strong> 선택됨 · 아이디 입력은 선택 후 버튼을 탭하세요</>
            : '아는 것만 선택해도 됩니다'
          }
        </p>
      </div>

      {/* 카테고리 탭 */}
      <div style={{
        display: 'flex', gap: '8px', overflowX: 'auto',
        padding: '16px 24px 12px', scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink: 0, padding: '7px 16px',
              borderRadius: '100px',
              border: `1.5px solid ${activeCategory === cat ? '#1A1A2E' : '#E2E8F0'}`,
              background: activeCategory === cat ? '#1A1A2E' : '#fff',
              color: activeCategory === cat ? '#fff' : '#9AA3B2',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >{cat}</button>
        ))}
      </div>

      {/* 서비스 그리드 */}
      <div style={{ flex: 1, padding: '4px 24px', paddingBottom: '100px', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {filtered.map(service => {
            const selected = isSelected(service.id)
            const sel = selectedServices.find(s => s.id === service.id)

            return (
              <div key={service.id} style={{ position: 'relative', paddingBottom: selected ? '16px' : '0' }}>
                <button
                  onClick={() => toggleService(service)}
                  style={{
                    width: '100%', minHeight: '84px',
                    borderRadius: '14px', border: `2px solid ${selected ? '#1A1A2E' : '#E2E8F0'}`,
                    background: selected ? '#1A1A2E' : '#fff',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '12px 8px',
                    transition: 'all 0.15s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ fontSize: '26px', lineHeight: 1 }}>{service.icon}</span>
                  <span style={{
                    fontSize: '12px', fontWeight: 700,
                    color: selected ? '#fff' : '#1A1A2E',
                    textAlign: 'center', lineHeight: 1.3,
                  }}>{service.name}</span>
                </button>

                {/* 계정 정보 입력 버튼 */}
                {selected && (
                  <button
                    onClick={() => {
                      setAccountModal(service)
                      setAccountInput(sel?.accountId || '')
                      setAccountUnknown(sel?.accountUnknown || false)
                    }}
                    style={{
                      position: 'absolute', bottom: '0', left: '50%',
                      transform: 'translateX(-50%)',
                      background: sel?.accountId || sel?.accountUnknown ? '#3B6FE8' : '#F0F2F5',
                      color: sel?.accountId || sel?.accountUnknown ? '#fff' : '#9AA3B2',
                      border: 'none', borderRadius: '100px',
                      padding: '3px 10px', fontSize: '10px', fontWeight: 700,
                      cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                      zIndex: 1,
                    }}
                  >
                    {sel?.accountUnknown ? '모름 ✓' : sel?.accountId ? 'ID 입력됨 ✓' : '아이디 입력'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 계정 정보 바텀시트 모달 */}
      {accountModal && (
        <div
          onClick={() => setAccountModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 200, display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '20px 20px 0 0',
              padding: '24px 24px max(24px, env(safe-area-inset-bottom))',
              width: '100%', maxWidth: '430px', margin: '0 auto',
              animation: 'slideUp 0.3s ease',
            }}
          >
            {/* 핸들 */}
            <div style={{ width: '36px', height: '4px', background: '#E2E8F0', borderRadius: '100px', margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '32px' }}>{accountModal.icon}</span>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.03em' }}>{accountModal.name}</div>
                <div style={{ fontSize: '13px', color: '#9AA3B2', marginTop: '2px' }}>계정 아이디 입력 (선택)</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="아이디 또는 이메일"
                value={accountInput}
                onChange={e => setAccountInput(e.target.value)}
                disabled={accountUnknown}
                style={{
                  height: '52px', padding: '0 16px',
                  border: '1.5px solid', borderRadius: '12px',
                  borderColor: accountUnknown ? '#E2E8F0' : '#3B6FE8',
                  fontSize: '16px', fontFamily: 'inherit', outline: 'none',
                  background: accountUnknown ? '#F7F8FA' : '#fff',
                  color: accountUnknown ? '#9AA3B2' : '#1A1A2E',
                }}
              />

              <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
                <div
                  onClick={() => setAccountUnknown(!accountUnknown)}
                  style={{
                    width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                    border: `2px solid ${accountUnknown ? '#3B6FE8' : '#E2E8F0'}`,
                    background: accountUnknown ? '#3B6FE8' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {accountUnknown && <span style={{ color: '#fff', fontSize: '13px' }}>✓</span>}
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A2E' }}>아이디를 모릅니다</span>
              </label>

              <p style={{ fontSize: '13px', color: '#9AA3B2', lineHeight: 1.6 }}>
                💡 몰라도 괜찮아요. 이름·생년월일·전화번호로 기업 CS가 계정을 조회해 처리합니다.
              </p>

              <button
                onClick={handleAccountSave}
                style={{
                  height: '52px', borderRadius: '12px', border: 'none',
                  background: '#1A1A2E', color: '#fff',
                  fontSize: '16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '430px',
        padding: '12px 24px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: '#fff', borderTop: '1px solid #F0F2F5',
      }}>
        <button
          onClick={handleNext}
          disabled={selectedServices.length === 0 || loading}
          style={{
            width: '100%', height: '52px', borderRadius: '12px', border: 'none',
            background: selectedServices.length > 0 && !loading ? '#1A1A2E' : '#E2E8F0',
            color: selectedServices.length > 0 ? '#fff' : '#9AA3B2',
            fontSize: '16px', fontWeight: 700,
            cursor: selectedServices.length > 0 && !loading ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
        >
          {loading ? '저장 중...' : selectedServices.length > 0 ? `${selectedServices.length}개 선택 완료 →` : '서비스를 선택해 주세요'}
        </button>
      </div>
    </div>
  )
}
