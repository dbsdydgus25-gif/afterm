'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import {
  SERVICE_CATALOG, CATEGORY_ORDER,
  SERVICE_BY_CATEGORY, type ServiceItem
} from '@/lib/services-catalog'
import Button from '@/components/ui/Button'
import ServiceLogo from '@/components/ui/ServiceLogo'

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

  if (phase === 'intro') {
    return (
      <div className="screen-body" style={{ display: 'flex', flexDirection: 'column', padding: '32px 24px' }}>
        <div style={{ flex: 1 }} className="animate-slide-up">
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800,
            letterSpacing: '-0.02em', color: 'var(--color-label-strong)',
            marginBottom: '16px', lineHeight: 1.3,
          }}>
            이용하셨던 서비스를<br />모두 선택해 주세요
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', lineHeight: 1.6, marginBottom: '40px' }}>
            확실하지 않아도, 아이디를 몰라도 괜찮아요.<br />
            생각나는 것 모두 선택해 주세요.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '🎬', label: 'OTT · 동영상', desc: '넷플릭스, 티빙, 웨이브 등' },
              { icon: '🎵', label: '음악 스트리밍', desc: '멜론, 지니뮤직, 플로 등' },
              { icon: '📱', label: '포털 · 통신 · SNS', desc: '네이버, 카카오, SKT, 인스타그램 등' },
              { icon: '💳', label: '금융 · 결제', desc: '토스, 카카오페이 등' },
            ].map(item => (
              <div key={item.label} className="card-soft" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '28px' }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-label-strong)', letterSpacing: '-0.02em' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-label-alternative)', marginTop: '4px' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cta-dock">
          <Button block onClick={() => setPhase('select')}>서비스 선택하기</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ padding: '24px 24px 0' }} className="animate-slide-up">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--color-label-strong)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          해지할 서비스를 선택하세요
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-label-alternative)' }}>
          {selectedServices.length > 0
            ? <><strong style={{ color: 'var(--color-primary-normal)' }}>{selectedServices.length}개</strong> 선택됨 · 계정 정보는 선택된 타일을 다시 누르세요</>
            : '목록에서 해당하는 아이콘을 탭하세요'
          }
        </p>
      </div>

      {/* 카테고리 탭 */}
      <div style={{
        display: 'flex', gap: '8px', overflowX: 'auto',
        padding: '24px 24px 16px', scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink: 0, padding: '8px 18px',
              borderRadius: 'var(--radius-pill)',
              border: `1.5px solid ${activeCategory === cat ? 'var(--color-label-strong)' : 'var(--color-line-normal-normal)'}`,
              background: activeCategory === cat ? 'var(--color-label-strong)' : 'var(--color-background-normal-normal)',
              color: activeCategory === cat ? 'var(--color-background-normal-normal)' : 'var(--color-label-alternative)',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
            }}
          >{cat}</button>
        ))}
      </div>

      {/* 서비스 그리드 */}
      <div style={{ flex: 1, padding: '0 24px', overflowY: 'auto' }} className="animate-slide-up">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {filtered.map(service => {
            const selected = isSelected(service.id)
            const sel = selectedServices.find(s => s.id === service.id)

            return (
              <div key={service.id} style={{ position: 'relative' }}>
                <div
                  className={`service-tile ${selected ? 'is-selected' : ''}`}
                  onClick={() => toggleService(service)}
                  style={{ padding: '16px 8px 24px' }}
                >
                  <ServiceLogo serviceId={service.id} name={service.name} size={44} radius={12} />
                  <span className="name">{service.name}</span>
                </div>

                {selected && (
                  <button
                    onClick={() => {
                      setAccountModal(service)
                      setAccountInput(sel?.accountId || '')
                      setAccountUnknown(sel?.accountUnknown || false)
                    }}
                    style={{
                      position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)',
                      background: sel?.accountId || sel?.accountUnknown ? 'var(--color-primary-normal)' : 'var(--color-coolNeutral-94)',
                      color: sel?.accountId || sel?.accountUnknown ? '#fff' : 'var(--color-label-strong)',
                      border: 'none', borderRadius: 'var(--radius-pill)',
                      padding: '4px 12px', fontSize: '11px', fontWeight: 700,
                      cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)',
                      zIndex: 10, boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {sel?.accountUnknown ? '모름 ✓' : sel?.accountId ? '입력됨 ✓' : '+ 아이디'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 계정 정보 모달 */}
      {accountModal && (
        <div
          onClick={() => setAccountModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-background-normal-normal)', borderRadius: '24px 24px 0 0',
              padding: '24px 24px max(24px, env(safe-area-inset-bottom))',
              width: '100%', maxWidth: 'var(--max-w-mobile)', margin: '0 auto',
              animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ width: '40px', height: '4px', background: 'var(--color-line-solid-normal)', borderRadius: 'var(--radius-pill)', margin: '0 auto 24px' }} />

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
              <ServiceLogo serviceId={accountModal.id} name={accountModal.name} size={48} radius={14} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-label-strong)' }}>{accountModal.name}</div>
                <div style={{ fontSize: '14px', color: 'var(--color-label-alternative)', marginTop: '2px' }}>아이디를 입력해주세요 (선택)</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <input
                type="text"
                placeholder="아이디 또는 이메일"
                value={accountInput}
                onChange={e => setAccountInput(e.target.value)}
                disabled={accountUnknown}
                className="input"
              />

              <div className="card-soft" onClick={() => setAccountUnknown(!accountUnknown)} style={{
                padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                borderColor: accountUnknown ? 'var(--color-primary-normal)' : 'var(--color-line-normal-alternative)',
                background: accountUnknown ? 'var(--color-blue-99)' : 'var(--color-coolNeutral-99)'
              }}>
                <div className={`checkbox ${accountUnknown ? 'checked' : ''}`}>
                  {accountUnknown && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-label-strong)' }}>아이디를 모릅니다</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-label-alternative)', marginTop: '2px' }}>기업 CS가 전화번호로 조회합니다</div>
                </div>
              </div>

              <Button block onClick={handleAccountSave} style={{ marginTop: '8px' }}>
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="cta-dock">
        <Button block disabled={selectedServices.length === 0 || loading} onClick={handleNext}>
          {loading ? '저장 중...' : selectedServices.length > 0 ? `${selectedServices.length}개 선택 완료` : '서비스를 선택해 주세요'}
        </Button>
      </div>
    </div>
  )
}
