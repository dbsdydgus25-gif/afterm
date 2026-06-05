'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import { SERVICE_CATALOG } from '@/lib/services-catalog'
import Button from '@/components/ui/Button'

// 서비스 아이콘 SVG 컴포넌트 (브랜드 컬러 적용)
function ServiceIcon({ id, size = 48 }: { id: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig)" />
        <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="white" />
        <defs>
          <linearGradient id="ig" x1="2" y1="22" x2="22" y2="2">
            <stop stopColor="#FFDC80" /><stop offset="0.3" stopColor="#FCAF45" />
            <stop offset="0.6" stopColor="#F77737" /><stop offset="0.8" stopColor="#C13584" />
            <stop offset="1" stopColor="#833AB4" />
          </linearGradient>
        </defs>
      </svg>
    ),
    facebook: (
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    kakaotalk: (
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="#3A1D1D">
        <ellipse cx="12" cy="10.5" rx="10" ry="8" fill="#FEE500" />
        <path d="M7.5 13.5c-.8-1.2-.8-2.8 0-4M16.5 13.5c.8-1.2.8-2.8 0-4M12 7.5v3" stroke="#3A1D1D" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M8 17l1.5-2.5" stroke="#FEE500" strokeWidth="1.5" fill="none" />
      </svg>
    ),
    google: (
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    twitter: (
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="black">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  }
  return <>{icons[id] || <span style={{ fontSize: size * 0.5 }}>🔍</span>}</>
}

export default function ServicesPage() {
  const router = useRouter()
  const { selectedServices, toggleService, setStep, caseId } = useApplyStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const isSelected = (id: string) => selectedServices.some(s => s.id === id)

  const handleNext = async () => {
    if (selectedServices.length === 0) return
    setLoading(true)
    try {
      if (!caseId) { router.push('/apply'); return }

      // 기존 서비스 삭제 후 임시 저장 (계정 정보는 service-info 단계에서 확정)
      await supabase.from('case_services').delete().eq('case_id', caseId)
      const rows = selectedServices.map(s => ({
        case_id: caseId,
        service_id: s.id,
        service_name: s.name,
        service_category: s.category,
        dispatch_type: s.dispatchType,
        contact_info: s.contactInfo,
        status: 'pending',
      }))
      await supabase.from('case_services').insert(rows)
      setStep(1)
      router.push('/apply/service-info')
    } catch {
      alert('저장 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* 헤더 영역 */}
      <div className="animate-slide-up" style={{ padding: '32px 24px 24px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '26px', fontWeight: 800,
          letterSpacing: '-0.02em', color: 'var(--color-label-strong)',
          marginBottom: '8px', lineHeight: 1.3,
        }}>
          해지할 서비스를<br />선택해 주세요
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', lineHeight: 1.6 }}>
          확실하지 않아도, 아이디를 몰라도 괜찮아요.<br />
          {selectedServices.length > 0
            ? <><strong style={{ color: 'var(--color-primary-normal)' }}>{selectedServices.length}개 선택됨</strong></>
            : '생각나는 서비스 모두 선택해 주세요.'
          }
        </p>
      </div>

      {/* 서비스 선택 카드 목록 */}
      <div style={{ flex: 1, padding: '0 24px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {SERVICE_CATALOG.map(service => {
            const selected = isSelected(service.id)
            return (
              <div
                key={service.id}
                onClick={() => toggleService(service)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '20px',
                  borderRadius: 'var(--radius-16)',
                  border: `2px solid ${selected ? 'var(--color-primary-normal)' : 'var(--color-line-normal-normal)'}`,
                  background: selected ? 'var(--color-blue-99)' : 'var(--color-background-normal-normal)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* 브랜드 아이콘 */}
                <div style={{
                  width: '52px', height: '52px',
                  borderRadius: 'var(--radius-12)',
                  background: 'var(--color-coolNeutral-98)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  <ServiceIcon id={service.id} size={52} />
                </div>

                {/* 서비스 정보 */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '17px', fontWeight: 700,
                    color: 'var(--color-label-strong)',
                    letterSpacing: '-0.02em',
                    marginBottom: '3px',
                  }}>
                    {service.name}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--color-label-alternative)',
                  }}>
                    {service.description}
                  </div>
                </div>

                {/* 선택 체크박스 */}
                <div style={{
                  width: '24px', height: '24px',
                  borderRadius: '50%',
                  border: `2px solid ${selected ? 'var(--color-primary-normal)' : 'var(--color-line-solid-normal)'}`,
                  background: selected ? 'var(--color-primary-normal)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}>
                  {selected && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ height: '100px' }} /> {/* 하단 버튼 공간 */}
      </div>

      {/* 하단 CTA */}
      <div className="cta-dock">
        <Button
          block
          disabled={selectedServices.length === 0 || loading}
          onClick={handleNext}
        >
          {loading ? '저장 중...' : selectedServices.length > 0
            ? `${selectedServices.length}개 선택 완료 · 다음`
            : '서비스를 선택해 주세요'
          }
        </Button>
      </div>
    </div>
  )
}
