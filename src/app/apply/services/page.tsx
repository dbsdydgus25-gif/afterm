'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import {
  SERVICE_CATALOG, CATEGORY_ORDER,
  SERVICE_BY_CATEGORY, type ServiceItem
} from '@/lib/services-catalog'

// Step 1: 서비스 선택 (장바구니 타일)
export default function ServicesPage() {
  const router = useRouter()
  const { selectedServices, toggleService, setStep, caseId, updateServiceAccount } = useApplyStore()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [accountModal, setAccountModal] = useState<ServiceItem | null>(null)
  const [accountInput, setAccountInput] = useState('')
  const [accountUnknown, setAccountUnknown] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('전체')

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

      // 기존 서비스 목록 삭제 후 재삽입
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

  return (
    <div style={{ paddingBottom: '100px' }}>
      <div style={{ padding: '32px 24px 16px' }}>
        <h1 className="section-title" style={{ marginBottom: '8px' }}>해지할 서비스 선택</h1>
        <p className="section-desc">
          고인이 이용했을 서비스를 모두 선택해 주세요<br />
          <strong style={{ color: 'var(--color-accent)' }}>{selectedServices.length}개</strong> 선택됨
        </p>
      </div>

      {/* 카테고리 필터 */}
      <div style={{
        display: 'flex', gap: '8px', overflowX: 'auto',
        padding: '0 24px 16px', scrollbarWidth: 'none',
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink: 0, padding: '7px 14px',
              borderRadius: '100px', border: '1.5px solid',
              borderColor: activeCategory === cat ? 'var(--color-accent)' : 'var(--color-border)',
              background: activeCategory === cat ? 'var(--color-accent-light)' : 'transparent',
              color: activeCategory === cat ? 'var(--color-accent)' : 'var(--color-text-2)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-base)',
            }}
          >{cat}</button>
        ))}
      </div>

      {/* 서비스 그리드 */}
      <div style={{ padding: '0 24px' }}>
        <div className="service-grid">
          {filtered.map(service => {
            const selected = isSelected(service.id)
            const sel = selectedServices.find(s => s.id === service.id)
            return (
              <div key={service.id} style={{ position: 'relative' }}>
                <button
                  className={`service-tile ${selected ? 'selected' : ''}`}
                  onClick={() => toggleService(service)}
                  type="button"
                  style={{ width: '100%', fontFamily: 'var(--font-base)' }}
                >
                  <span className="tile-icon">{service.icon}</span>
                  <span className="tile-name">{service.name}</span>
                  <div className="tile-check">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
                {/* 아이디 입력 버튼 */}
                {selected && (
                  <button
                    onClick={() => {
                      setAccountModal(service)
                      setAccountInput(sel?.accountId || '')
                      setAccountUnknown(sel?.accountUnknown || false)
                    }}
                    style={{
                      position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)',
                      background: sel?.accountId || sel?.accountUnknown ? 'var(--color-accent)' : 'var(--color-border)',
                      color: '#fff', border: 'none', borderRadius: '100px',
                      padding: '3px 8px', fontSize: '10px', fontWeight: 700,
                      cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-base)',
                      zIndex: 1,
                    }}
                  >
                    {sel?.accountUnknown ? '모름' : sel?.accountId ? '입력됨' : '아이디'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 아이디 입력 모달 */}
      {accountModal && (
        <div
          onClick={() => setAccountModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 100, display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
              padding: '24px', width: '100%', maxWidth: '430px', margin: '0 auto',
              animation: 'slideUp 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '28px' }}>{accountModal.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '17px' }}>{accountModal.name} 계정 정보</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>
                  아이디를 모르셔도 괜찮아요
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">고인 아이디 (이메일 or ID)</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="아이디 입력"
                  value={accountInput}
                  onChange={e => setAccountInput(e.target.value)}
                  disabled={accountUnknown}
                />
              </div>

              <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={accountUnknown}
                  onChange={e => setAccountUnknown(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)' }}
                />
                <span style={{ fontSize: '15px', fontWeight: 600 }}>아이디를 모릅니다</span>
              </label>

              <div className="alert-banner alert-info" style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '16px' }}>💡</span>
                <span style={{ fontSize: '13px' }}>
                  아이디 몰라도 이름·생년월일·전화번호로 기업 CS가 조회해 처리해 드립니다
                </span>
              </div>

              <button className="btn btn-primary" onClick={handleAccountSave} style={{ marginTop: '8px' }}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="bottom-bar">
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={selectedServices.length === 0 || loading}
        >
          {loading ? '저장 중...' : `${selectedServices.length}개 선택 완료 →`}
        </button>
      </div>
    </div>
  )
}
