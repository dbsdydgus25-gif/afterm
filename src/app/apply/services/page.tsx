'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import { SERVICE_CATALOG } from '@/lib/services-catalog'
import type { TrackType } from '@/lib/services-catalog'
import Button from '@/components/ui/Button'

// 브랜드 아이콘 SVG
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
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
        <rect width="24" height="24" rx="6" fill="#FEE500"/>
        <ellipse cx="12" cy="11" rx="8.5" ry="7" fill="#3C1E1E"/>
        <path d="M8.5 14l1.2-2M12 8.5v4M15.5 14l-1.2-2" stroke="#FEE500" strokeWidth="1.6" strokeLinecap="round"/>
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
  const { selectedServices, toggleService, updateServiceTrack, setStep, caseId } = useApplyStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  // 트랙 선택 모달 상태
  const [showTrackModal, setShowTrackModal] = useState<string | null>(null)

  const getSelected = (id: string) => selectedServices.find(s => s.id === id)

  const handleServiceClick = (serviceId: string) => {
    const selected = getSelected(serviceId)
    if (selected) {
      // 이미 선택됨 → 제거
      const svc = SERVICE_CATALOG.find(s => s.id === serviceId)!
      toggleService(svc, selected.track)
    } else {
      // 선택 안 됨 → 트랙 선택 모달
      setShowTrackModal(serviceId)
    }
  }

  const handleTrackSelect = (serviceId: string, track: TrackType) => {
    const svc = SERVICE_CATALOG.find(s => s.id === serviceId)!
    const cfg = svc.tracks[track]
    if (!cfg) return
    toggleService(svc, track)
    setShowTrackModal(null)
  }

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
        service_category: s.track === 'delete' ? '계정삭제' : '추모계정',
        contact_info: null,
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

  const modalService = showTrackModal ? SERVICE_CATALOG.find(s => s.id === showTrackModal) : null

  return (
    <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* 헤더 */}
      <div className="animate-slide-up" style={{ padding: '32px 24px 20px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '26px', fontWeight: 800,
          letterSpacing: '-0.02em', color: 'var(--color-label-strong)',
          marginBottom: '8px', lineHeight: 1.3,
        }}>
          처리할 서비스를<br />선택해 주세요
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-label-alternative)', lineHeight: 1.6 }}>
          각 서비스마다 <strong>삭제</strong> 또는 <strong>추모 계정 전환</strong> 중 선택합니다.
        </p>
      </div>

      {/* 트랙 안내 배너 */}
      <div style={{ padding: '0 24px 16px', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: '#FEF2F2', borderRadius: 12, padding: '12px 14px', border: '1px solid #FECACA' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', marginBottom: 2 }}>🗑️ 계정 삭제</div>
          <div style={{ fontSize: 12, color: '#7F1D1D', lineHeight: 1.5 }}>계정 완전 삭제<br/>데이터 영구 삭제</div>
        </div>
        <div style={{ flex: 1, background: '#EFF6FF', borderRadius: 12, padding: '12px 14px', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', marginBottom: 2 }}>🕯️ 추모 계정</div>
          <div style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 1.5 }}>계정 보존<br/>추모 공간으로 전환</div>
        </div>
      </div>

      {/* 서비스 카드 목록 */}
      <div style={{ flex: 1, padding: '0 24px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SERVICE_CATALOG.map(service => {
            const selected = getSelected(service.id)
            const hasDelete = !!service.tracks.delete
            const hasMemorial = !!service.tracks.memorial

            return (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service.id)}
                style={{
                  borderRadius: 16,
                  border: `2px solid ${selected ? (selected.track === 'delete' ? '#DC2626' : '#2563EB') : '#E8EAF0'}`,
                  background: selected
                    ? (selected.track === 'delete' ? '#FFF5F5' : '#EFF6FF')
                    : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
                  {/* 아이콘 */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: '#F8FAFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <ServiceIcon id={service.id} size={48} />
                  </div>

                  {/* 서비스 정보 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 4 }}>
                      {service.name}
                    </div>
                    {/* 가능한 트랙 뱃지 */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {hasDelete && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: service.tracks.delete!.agentCanHandle ? '#ECFDF5' : '#FEF2F2',
                          color: service.tracks.delete!.agentCanHandle ? '#059669' : '#DC2626',
                        }}>
                          🗑️ 삭제 {service.tracks.delete!.agentCanHandle ? '대행가능' : '직접신청'}
                        </span>
                      )}
                      {hasMemorial && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: service.tracks.memorial!.agentCanHandle ? '#ECFDF5' : '#FEF2F2',
                          color: service.tracks.memorial!.agentCanHandle ? '#059669' : '#DC2626',
                        }}>
                          🕯️ 추모 {service.tracks.memorial!.agentCanHandle ? '대행가능' : '직접신청'}
                        </span>
                      )}
                      {!hasMemorial && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F3F4F6', color: '#9CA3AF', fontWeight: 600 }}>
                          추모 없음
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 선택 상태 */}
                  {selected ? (
                    <div style={{ flexShrink: 0, textAlign: 'center' }}>
                      <div style={{
                        fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                        background: selected.track === 'delete' ? '#DC2626' : '#2563EB',
                        color: '#fff', marginBottom: 4,
                      }}>
                        {selected.track === 'delete' ? '🗑️ 삭제' : '🕯️ 추모'}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>탭하면 취소</div>
                    </div>
                  ) : (
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      border: '2px solid #E5E7EB',
                      flexShrink: 0,
                    }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ height: 100 }} />
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

      {/* 트랙 선택 바텀시트 모달 */}
      {modalService && (
        <div
          onClick={() => setShowTrackModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 100, display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '20px 20px 0 0',
              padding: '24px 20px 40px', width: '100%',
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            }}
          >
            {/* 핸들 */}
            <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 2, margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F8FAFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ServiceIcon id={modalService.id} size={44} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>{modalService.name}</div>
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>어떻게 처리하시겠어요?</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 삭제 트랙 */}
              {modalService.tracks.delete ? (
                <button
                  onClick={() => handleTrackSelect(modalService.id, 'delete')}
                  style={{
                    width: '100%', padding: '18px', borderRadius: 14,
                    border: '2px solid #FECACA', background: '#FFF5F5',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#DC2626', marginBottom: 4 }}>🗑️ 계정 삭제</div>
                      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
                        계정과 모든 데이터를 영구 삭제합니다
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                        신청 가능: {modalService.tracks.delete.who}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                      background: modalService.tracks.delete.agentCanHandle ? '#ECFDF5' : '#FEF2F2',
                      color: modalService.tracks.delete.agentCanHandle ? '#059669' : '#DC2626',
                      flexShrink: 0, marginLeft: 8,
                    }}>
                      {modalService.tracks.delete.agentCanHandle ? '✅ 대행 가능' : '⚠️ 직접 신청'}
                    </span>
                  </div>
                  {!modalService.tracks.delete.agentCanHandle && (
                    <div style={{ marginTop: 10, padding: '8px 10px', background: '#FEF2F2', borderRadius: 8, fontSize: 12, color: '#B91C1C', lineHeight: 1.5 }}>
                      ⚠️ {modalService.tracks.delete.agentCanHandleNote}
                    </div>
                  )}
                </button>
              ) : (
                <div style={{ padding: '16px', borderRadius: 14, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>
                  🗑️ 삭제 — 이 플랫폼은 삭제 기능을 지원하지 않습니다
                </div>
              )}

              {/* 추모 트랙 */}
              {modalService.tracks.memorial ? (
                <button
                  onClick={() => handleTrackSelect(modalService.id, 'memorial')}
                  style={{
                    width: '100%', padding: '18px', borderRadius: 14,
                    border: '2px solid #BFDBFE', background: '#EFF6FF',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#2563EB', marginBottom: 4 }}>🕯️ 추모 계정 전환</div>
                      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
                        계정을 보존하여 추모 공간으로 전환합니다
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                        신청 가능: {modalService.tracks.memorial.who}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                      background: modalService.tracks.memorial.agentCanHandle ? '#ECFDF5' : '#FEF2F2',
                      color: modalService.tracks.memorial.agentCanHandle ? '#059669' : '#DC2626',
                      flexShrink: 0, marginLeft: 8,
                    }}>
                      {modalService.tracks.memorial.agentCanHandle ? '✅ 대행 가능' : '⚠️ 직접 신청'}
                    </span>
                  </div>
                </button>
              ) : (
                <div style={{ padding: '16px', borderRadius: 14, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>
                  🕯️ 추모 — 이 플랫폼은 추모 계정 전환을 지원하지 않습니다
                </div>
              )}
            </div>

            <button
              onClick={() => setShowTrackModal(null)}
              style={{ width: '100%', marginTop: 14, padding: '14px', borderRadius: 12, border: 'none', background: '#F3F4F6', color: '#6B7280', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
