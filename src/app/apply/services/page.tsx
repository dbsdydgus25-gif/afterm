'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import { SERVICE_CATALOG } from '@/lib/services-catalog'
import type { TrackType } from '@/lib/services-catalog'
import Button from '@/components/ui/Button'

// 트랙별 플랫폼 정의
const TRACK_PLATFORMS: Record<TrackType, string[]> = {
  memorial: ['facebook', 'instagram', 'kakaotalk'],
  delete:   ['google', 'facebook', 'twitter'],
}

// 브랜드 아이콘
function ServiceIcon({ id, size = 44 }: { id: string; size?: number }) {
  const s = size * 0.55
  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig2)" />
        <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="white" />
        <defs><linearGradient id="ig2" x1="2" y1="22" x2="22" y2="2">
          <stop stopColor="#FFDC80"/><stop offset="0.3" stopColor="#FCAF45"/>
          <stop offset="0.6" stopColor="#F77737"/><stop offset="0.8" stopColor="#C13584"/>
          <stop offset="1" stopColor="#833AB4"/>
        </linearGradient></defs>
      </svg>
    ),
    facebook: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    kakaotalk: (
      <svg width={s} height={s} viewBox="0 0 24 24">
        <rect width="24" height="24" rx="6" fill="#FEE500"/>
        <ellipse cx="12" cy="11" rx="8.5" ry="7" fill="#3C1E1E"/>
        <path d="M8.5 14l1.2-2M12 8.5v4M15.5 14l-1.2-2" stroke="#FEE500" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    google: (
      <svg width={s} height={s} viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    twitter: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="black">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  }
  return <>{icons[id] || null}</>
}

export default function ServicesPage() {
  const router = useRouter()
  const { selectedTrack, selectedServices, setSelectedTrack, toggleService, setStep, caseId } = useApplyStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  // phase: 'track' | 'platforms'
  const [phase, setPhase] = useState<'track' | 'platforms'>(selectedTrack ? 'platforms' : 'track')

  const currentTrack = selectedTrack
  const platformIds = currentTrack ? TRACK_PLATFORMS[currentTrack] : []
  const availablePlatforms = SERVICE_CATALOG.filter(s => platformIds.includes(s.id))

  const isSelected = (id: string) => selectedServices.some(s => s.id === id)

  const handleTrackSelect = (track: TrackType) => {
    setSelectedTrack(track)
    setPhase('platforms')
  }

  const handleToggle = (id: string) => {
    if (!currentTrack) return
    const svc = SERVICE_CATALOG.find(s => s.id === id)!
    toggleService(svc, currentTrack)
  }

  const handleNext = async () => {
    if (selectedServices.length === 0 || !caseId) return
    setLoading(true)
    try {
      await supabase.from('case_services').delete().eq('case_id', caseId)
      const rows = selectedServices.map(s => ({
        case_id: caseId,
        service_id: s.id,
        service_name: s.name,
        service_category: s.track === 'delete' ? '계정삭제' : '추모계정',
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

  // ── Phase 1: 트랙 선택 ──
  if (phase === 'track') {
    return (
      <div className="screen-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111', margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1.3 }}>
          어떻게 처리하실<br />건가요?
        </h2>
        <p style={{ fontSize: 15, color: '#6B7280', margin: '0 0 40px', lineHeight: 1.6 }}>
          고인의 디지털 계정을 어떻게 할지 선택해주세요
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 추모 */}
          <button
            onClick={() => handleTrackSelect('memorial')}
            style={{
              padding: '28px 24px', borderRadius: 20,
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 8px 24px rgba(37,99,235,0.25)',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🕯️</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 6 }}>추모 계정으로 전환</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
              계정을 보존하고 추모 공간으로 만들어요<br />
              <span style={{ fontSize: 12, opacity: 0.6 }}>페이스북 · 인스타그램 · 카카오톡</span>
            </div>
          </button>

          {/* 삭제 */}
          <button
            onClick={() => handleTrackSelect('delete')}
            style={{
              padding: '28px 24px', borderRadius: 20,
              background: '#fff', border: '2px solid #E5E7EB',
              cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 6 }}>계정 완전 삭제</div>
            <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
              계정과 모든 데이터를 영구 삭제해요<br />
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>구글 · 페이스북 · 트위터X</span>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ── Phase 2: 플랫폼 선택 ──
  const trackLabel = currentTrack === 'memorial' ? '🕯️ 추모 계정' : '🗑️ 계정 삭제'
  const trackColor = currentTrack === 'memorial' ? '#2563EB' : '#DC2626'

  return (
    <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '28px 24px 20px' }}>
        {/* 트랙 변경 버튼 */}
        <button
          onClick={() => setPhase('track')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>← 다시 선택</span>
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: currentTrack === 'memorial' ? '#EFF6FF' : '#FEF2F2', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: trackColor }}>{trackLabel}</span>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111', margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
          어떤 서비스를<br />처리할까요?
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
          여러 개 선택 가능해요
        </p>
      </div>

      <div style={{ flex: 1, padding: '0 24px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {availablePlatforms.map(svc => {
            const selected = isSelected(svc.id)
            return (
              <button
                key={svc.id}
                onClick={() => handleToggle(svc.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px', borderRadius: 16,
                  border: `2px solid ${selected ? trackColor : '#E8EAF0'}`,
                  background: selected
                    ? (currentTrack === 'memorial' ? '#EFF6FF' : '#FFF5F5')
                    : '#fff',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F8FAFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ServiceIcon id={svc.id} size={44} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>{svc.name}</div>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${selected ? trackColor : '#D1D5DB'}`,
                  background: selected ? trackColor : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {selected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        <div style={{ height: 100 }} />
      </div>

      <div className="cta-dock">
        <Button block disabled={selectedServices.length === 0 || loading} onClick={handleNext}>
          {loading ? '저장 중...' : selectedServices.length > 0
            ? `${selectedServices.length}개 선택 · 다음`
            : '서비스를 선택해 주세요'}
        </Button>
      </div>
    </div>
  )
}
