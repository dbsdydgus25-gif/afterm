'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'

// 원래 5개 서비스 (SERVICE_CATALOG 기준)
const SERVICES: { id: string; name: string; desc: string; canMemorial?: boolean }[] = [
  { id: 'instagram', name: '인스타그램', desc: 'Instagram 계정', canMemorial: true },
  { id: 'facebook',  name: '페이스북',   desc: 'Facebook 계정', canMemorial: true },
  { id: 'kakaotalk', name: '카카오톡',   desc: '카카오톡, 카카오스토리', canMemorial: true },
  { id: 'google',    name: '구글',       desc: 'Gmail, 유튜브, 구글 포토' },
  { id: 'twitter',   name: 'X (트위터)', desc: 'X(구 트위터) 계정' },
]

type Action = 'delete' | 'memorial'
type SelectedService = { id: string; name: string; action: Action; accountId?: string }
type Phase = 'account_notice' | 'select' | 'action' | 'account' | 'confirm'

// ─── 공통 UI ──────────────────────────────────────
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", background: '#fff' }}>
    {children}
  </div>
)
const Body = ({ children }: { children: React.ReactNode }) => (
  <div style={{ flex: 1, padding: '40px 24px 120px' }}>{children}</div>
)
const Dock = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 430, padding: '16px 24px',
    paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
    background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 30%)', zIndex: 50,
  }}>{children}</div>
)
const PrimaryBtn = ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} style={{
    flex: 1, padding: '17px', borderRadius: 14,
    background: disabled ? '#E5E9EF' : '#2563EB',
    color: disabled ? '#9CA3AF' : '#fff',
    fontSize: 16, fontWeight: 800, border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', letterSpacing: '-0.02em',
  }}>{children}</button>
)
const BackBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} style={{
    width: 52, height: 52, borderRadius: 12, border: '1.5px solid #E5E9EF',
    background: '#fff', fontSize: 20, cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>←</button>
)
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1.35, margin: '0 0 8px' }}>
    {children}
  </h2>
)

function CheckRow({ label, desc, checked, onToggle }: { label: string; desc: string; checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px 4px', background: 'none', border: 'none',
      borderBottom: '1px solid #F3F4F6', width: '100%', cursor: 'pointer',
      fontFamily: 'inherit', textAlign: 'left',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
        background: checked ? '#2563EB' : '#fff',
        border: `2px solid ${checked ? '#2563EB' : '#D1D5DB'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {checked && (
          <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
            <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{desc}</div>
      </div>
    </button>
  )
}

export default function ServicesPage() {
  const router = useRouter()
  const { caseId, setStep } = useApplyStore()
  const supabase = createClient()

  const [phase, setPhase] = useState<Phase>('account_notice')
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [services, setServices] = useState<SelectedService[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(false)

  const checkedList = SERVICES.filter(s => checked.has(s.id))

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startActionPhase = () => {
    const list: SelectedService[] = checkedList.map(s => ({ id: s.id, name: s.name, action: 'delete' }))
    setServices(list)
    setCurrentIdx(0)
    setPhase('action')
  }

  const setAction = (action: Action) =>
    setServices(prev => prev.map((s, i) => i === currentIdx ? { ...s, action } : s))

  const setAccountId = (accountId: string) =>
    setServices(prev => prev.map((s, i) => i === currentIdx ? { ...s, accountId } : s))

  const goNextService = () => {
    if (currentIdx < services.length - 1) {
      setCurrentIdx(i => i + 1)
      setPhase('action')
    } else {
      setPhase('confirm')
    }
  }

  const handleSubmit = async () => {
    if (!caseId) return
    setLoading(true)
    try {
      await supabase.from('case_services').delete().eq('case_id', caseId)
      await supabase.from('case_services').insert(services.map(s => ({
        case_id: caseId,
        service_id: s.id,
        service_name: s.name,
        service_category: s.action === 'memorial' ? '추모계정' : '계정삭제',
        account_id: s.accountId || null,
        status: 'pending',
      })))
      setStep(2)
      router.push('/apply/documents')
    } catch {
      alert('저장 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const cur = services[currentIdx]
  const curMeta = SERVICES.find(s => s.id === cur?.id)

  // ── Phase 0: 계정 아이디 안내 ────────────────────
  if (phase === 'account_notice') return (
    <Wrap>
      <Body>
        <H2>계정 아이디를<br />알고 계셔야 합니다</H2>
        <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 28px', lineHeight: 1.7 }}>
          서비스 처리를 위해 고인의 계정<br />아이디(이메일/전화번호)가 필요합니다
        </p>

        <div style={{ padding: '18px', borderRadius: 14, background: '#EFF6FF', border: '1px solid #BFDBFE', marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF', margin: '0 0 10px' }}>아이디를 모르는 경우</p>
          <ul style={{ fontSize: 13, color: '#374151', margin: 0, padding: '0 0 0 14px', lineHeight: 2 }}>
            <li>고인의 휴대폰에서 앱 로그인 확인</li>
            <li>이메일 받은 메일함에서 가입 메일 검색</li>
            <li>가족이나 지인에게 확인</li>
          </ul>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '10px 0 0' }}>
            아이디를 모르시면 처리 지연이 발생할 수 있습니다
          </p>
        </div>
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={() => router.back()} />
          <PrimaryBtn onClick={() => setPhase('select')}>아이디 확인했습니다</PrimaryBtn>
        </div>
      </Dock>
    </Wrap>
  )

  // ── Phase 1: 서비스 선택 ─────────────────────────
  if (phase === 'select') return (
    <Wrap>
      <Body>
        <H2>처리할 계정을<br />선택해 주세요</H2>
        <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 32px' }}>여러 개 선택 가능합니다</p>
        {SERVICES.map(svc => (
          <CheckRow key={svc.id} label={svc.name} desc={svc.desc} checked={checked.has(svc.id)} onToggle={() => toggleCheck(svc.id)} />
        ))}
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={() => setPhase('account_notice')} />
          <PrimaryBtn disabled={checked.size === 0} onClick={startActionPhase}>
            {checked.size > 0 ? `${checked.size}개 선택 · 계속하기` : '계정을 선택해 주세요'}
          </PrimaryBtn>
        </div>
      </Dock>
    </Wrap>
  )

  // ── Phase 2: 해지/추모 선택 ──────────────────────
  if (phase === 'action' && cur) return (
    <Wrap>
      <Body>
        <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600, margin: '0 0 8px' }}>
          {currentIdx + 1} / {services.length}
        </p>
        <H2>{cur.name}를<br />어떻게 처리할까요?</H2>
        <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 32px' }}>{curMeta?.desc}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => setAction('delete')} style={{
            padding: '20px', borderRadius: 14, textAlign: 'left',
            background: cur.action === 'delete' ? '#EBF3FF' : '#F8FAFC',
            border: `1.5px solid ${cur.action === 'delete' ? '#2563EB' : '#E5E9EF'}`,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: cur.action === 'delete' ? '#2563EB' : '#111827', marginBottom: 4 }}>계정 해지 / 삭제</div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>계정과 모든 데이터를 영구적으로 삭제합니다</div>
          </button>

          {curMeta?.canMemorial && (
            <button onClick={() => setAction('memorial')} style={{
              padding: '20px', borderRadius: 14, textAlign: 'left',
              background: cur.action === 'memorial' ? '#EBF3FF' : '#F8FAFC',
              border: `1.5px solid ${cur.action === 'memorial' ? '#2563EB' : '#E5E9EF'}`,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: cur.action === 'memorial' ? '#2563EB' : '#111827', marginBottom: 4 }}>추모 계정 전환</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>계정을 보존하고 추모 공간으로 전환합니다</div>
            </button>
          )}
        </div>

        {/* 아이디 입력 링크 */}
        <div style={{ marginTop: 28, padding: '14px 16px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E5E9EF' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>계정 아이디를 알고 계신가요?</p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 10px', lineHeight: 1.6 }}>
            아이디(이메일/전화번호)를 알고 계셔야 처리가 가능합니다.<br />모르시는 경우 처리가 지연될 수 있습니다.
          </p>
          <button onClick={() => setPhase('account')} style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
            아이디 입력하기 →
          </button>
          {cur.accountId && <p style={{ fontSize: 12, color: '#2563EB', margin: '6px 0 0', fontWeight: 600 }}>입력됨: {cur.accountId}</p>}
        </div>
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={() => {
            if (currentIdx === 0) setPhase('select')
            else { setCurrentIdx(i => i - 1); setPhase('action') }
          }} />
          <PrimaryBtn onClick={goNextService}>
            {currentIdx < services.length - 1 ? '다음 계정' : '계속하기'}
          </PrimaryBtn>
        </div>
      </Dock>
    </Wrap>
  )

  // ── Phase 3: 계정 아이디 입력 ────────────────────
  if (phase === 'account' && cur) return (
    <Wrap>
      <Body>
        <H2>{cur.name} 계정 아이디를<br />입력해 주세요</H2>
        <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 36px' }}>
          이메일 또는 전화번호 형태입니다.<br />모르시면 건너뛰셔도 됩니다
        </p>
        <input
          type="text"
          placeholder="예: example@gmail.com"
          defaultValue={cur.accountId || ''}
          autoFocus
          onChange={e => setAccountId(e.target.value)}
          style={{
            width: '100%', height: 52, border: 0, borderBottom: '2px solid #2563EB',
            background: 'transparent', fontSize: 18, fontWeight: 600,
            color: '#111827', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={() => setPhase('action')} />
          <PrimaryBtn onClick={() => setPhase('action')}>
            {cur.accountId ? '저장하기' : '건너뛰기'}
          </PrimaryBtn>
        </div>
      </Dock>
    </Wrap>
  )

  // ── Phase 4: 확인 ─────────────────────────────────
  if (phase === 'confirm') return (
    <Wrap>
      <Body>
        <H2>신청 내용을<br />확인해 주세요</H2>
        <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 32px' }}>총 {services.length}개 계정</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {services.map((svc, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E5E9EF',
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{svc.name}</div>
                {svc.accountId && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{svc.accountId}</div>}
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                background: svc.action === 'memorial' ? '#EBF3FF' : '#FEF2F2',
                color: svc.action === 'memorial' ? '#2563EB' : '#DC2626',
              }}>
                {svc.action === 'memorial' ? '추모 전환' : '해지 · 삭제'}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <p style={{ fontSize: 13, color: '#1E40AF', margin: 0, lineHeight: 1.7 }}>
            다음 단계에서 서류를 첨부하고 서명하면<br />신청이 완료됩니다
          </p>
        </div>
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={() => { setCurrentIdx(services.length - 1); setPhase('action') }} />
          <PrimaryBtn disabled={loading} onClick={handleSubmit}>
            {loading ? '저장 중...' : '서류 첨부하러 가기'}
          </PrimaryBtn>
        </div>
      </Dock>
    </Wrap>
  )

  return null
}
