'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import { SERVICE_CATALOG } from '@/lib/services-catalog'
import type { TrackType } from '@/lib/services-catalog'

// ─── apply/page.tsx 와 동일한 디자인 컴포넌트 ──────────
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100dvh',
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif", background: '#fff',
    }}>
      {children}
    </div>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return <div style={{ flex: 1, padding: '40px 24px 120px' }}>{children}</div>
}

function Dock({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, padding: '16px 24px',
      paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 30%)', zIndex: 50,
    }}>
      {children}
    </div>
  )
}

function PrimaryBtn({ children, onClick, disabled }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '17px', borderRadius: 14,
      background: disabled ? '#E5E9EF' : '#2563EB',
      color: disabled ? '#9CA3AF' : '#fff',
      fontSize: 16, fontWeight: 800, border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', letterSpacing: '-0.02em', transition: 'background 0.15s',
    }}>
      {children}
    </button>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 52, height: 52, borderRadius: 12, border: '1.5px solid #E5E9EF',
      background: '#fff', fontSize: 20, cursor: 'pointer', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>←</button>
  )
}

function Question({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{
        fontSize: 26, fontWeight: 800, color: '#111827',
        letterSpacing: '-0.03em', lineHeight: 1.35, margin: 0, whiteSpace: 'pre-line',
      }}>{label}</h2>
      {sub && <p style={{ fontSize: 14, color: '#9CA3AF', margin: '8px 0 0', lineHeight: 1.6 }}>{sub}</p>}
    </div>
  )
}

// ─── 트랙별 플랫폼 정의 ─────────────────────────────────
const TRACK_PLATFORMS: Record<TrackType, string[]> = {
  memorial: ['facebook', 'instagram', 'kakaotalk'],
  delete:   ['google', 'facebook', 'twitter'],
}

type Phase = 'account_notice' | 'track' | 'platforms'

export default function ServicesPage() {
  const router = useRouter()
  const { selectedTrack, selectedServices, setSelectedTrack, toggleService, setStep, caseId } = useApplyStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('account_notice')

  const platformIds = selectedTrack ? TRACK_PLATFORMS[selectedTrack] : []
  const availablePlatforms = SERVICE_CATALOG.filter(s => platformIds.includes(s.id))
  const isSelected = (id: string) => selectedServices.some(s => s.id === id)

  const handleTrackSelect = (track: TrackType) => {
    setSelectedTrack(track)
    setPhase('platforms')
  }

  const handleToggle = (id: string) => {
    if (!selectedTrack) return
    const svc = SERVICE_CATALOG.find(s => s.id === id)!
    toggleService(svc, selectedTrack)
  }

  const handleNext = async () => {
    if (selectedServices.length === 0 || !caseId) return
    setLoading(true)
    try {
      await supabase.from('case_services').delete().eq('case_id', caseId)
      await supabase.from('case_services').insert(selectedServices.map(s => ({
        case_id: caseId,
        service_id: s.id,
        service_name: s.name,
        service_category: s.track === 'delete' ? '계정삭제' : '추모계정',
        status: 'pending',
      })))
      setStep(1)
      router.push('/apply/service-info')
    } catch {
      alert('저장 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // ── Phase 0: 계정 아이디 안내 ─────────────────────────
  if (phase === 'account_notice') return (
    <Screen>
      <Body>
        <Question
          label={'계정 아이디를\n알고 계셔야 합니다'}
          sub="서비스 처리를 위해 고인의 계정 아이디(이메일/전화번호)가 필요합니다"
        />
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          background: '#EBF3FF', border: '1.5px solid #BFDBFE',
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8', margin: '0 0 10px' }}>아이디를 모르는 경우</p>
          <ul style={{ fontSize: 13, color: '#374151', margin: 0, padding: '0 0 0 16px', lineHeight: 2.2 }}>
            <li>고인의 휴대폰에서 앱 로그인 확인</li>
            <li>이메일 받은 메일함에서 가입 메일 검색</li>
            <li>가족이나 지인에게 확인</li>
          </ul>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '10px 0 0', lineHeight: 1.6 }}>
            아이디를 모르시면 처리 지연이 발생할 수 있습니다
          </p>
        </div>
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={() => router.back()} />
          <div style={{ flex: 1 }}>
            <PrimaryBtn onClick={() => setPhase('track')}>아이디 확인했습니다</PrimaryBtn>
          </div>
        </div>
      </Dock>
    </Screen>
  )

  // ── Phase 1: 트랙 선택 (추모 / 해지) ──────────────────
  if (phase === 'track') return (
    <Screen>
      <Body>
        <Question
          label={'어떤 서비스를\n원하시나요?'}
          sub="고인의 디지털 계정을 어떻게 할지 선택해 주세요"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 추모계정 전환 */}
          <button onClick={() => handleTrackSelect('memorial')} style={{
            padding: '24px 22px', borderRadius: 16, textAlign: 'left',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(37,99,235,0.2)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>추모계정 전환</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
              계정을 보존하고 추모 공간으로 만들어요
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>페이스북 · 인스타그램 · 카카오톡</div>
          </button>

          {/* 계정 삭제 */}
          <button onClick={() => handleTrackSelect('delete')} style={{
            padding: '24px 22px', borderRadius: 16, textAlign: 'left',
            background: '#F8FAFC', border: '1.5px solid #E5E9EF',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 6 }}>계정 삭제</div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
              계정과 모든 데이터를 영구 삭제해요
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>구글 · 페이스북 · 트위터X</div>
          </button>
        </div>
      </Body>
      <Dock>
        <BackBtn onClick={() => setPhase('account_notice')} />
      </Dock>
    </Screen>
  )

  // ── Phase 2: 플랫폼 선택 체크리스트 ───────────────────
  const trackColor = selectedTrack === 'memorial' ? '#2563EB' : '#DC2626'
  const trackLabel = selectedTrack === 'memorial' ? '추모계정 전환' : '계정 삭제'

  return (
    <Screen>
      <Body>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '4px 12px', borderRadius: 20, marginBottom: 16,
          background: selectedTrack === 'memorial' ? '#EBF3FF' : '#FEF2F2',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: trackColor }}>{trackLabel}</span>
        </div>
        <Question
          label={'어떤 서비스를\n처리할까요?'}
          sub="여러 개 선택 가능해요"
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {availablePlatforms.map(svc => {
            const selected = isSelected(svc.id)
            return (
              <button key={svc.id} onClick={() => handleToggle(svc.id)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 4px', background: 'none', border: 'none',
                borderBottom: '1px solid #F3F4F6', width: '100%',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: selected ? trackColor : '#fff',
                  border: `2px solid ${selected ? trackColor : '#D1D5DB'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {selected && (
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{svc.name}</div>
                </div>
              </button>
            )
          })}
        </div>
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={() => setPhase('track')} />
          <div style={{ flex: 1 }}>
            <PrimaryBtn disabled={selectedServices.length === 0 || loading} onClick={handleNext}>
              {loading ? '저장 중...' : selectedServices.length > 0
                ? `${selectedServices.length}개 선택 · 다음`
                : '서비스를 선택해 주세요'}
            </PrimaryBtn>
          </div>
        </div>
      </Dock>
    </Screen>
  )
}
