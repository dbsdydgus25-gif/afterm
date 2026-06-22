'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import * as PortOne from '@portone/browser-sdk/v2'
import { createClient } from '@/lib/supabase/client'
import { Screen, Body, Dock, StepLabel, Question } from '../_components'

const PRICE_PER_SERVICE = 4900

function PaymentInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { caseId } = useApplyStore()
  const supabase = createClient()

  const [services, setServices] = useState<{ name: string; action: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(searchParams.get('error') || '')
  const [delegatorPhone, setDelegatorPhone] = useState('')

  // 프로모 코드
  const [promoCode, setPromoCode] = useState('')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [promoMsg, setPromoMsg] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  useEffect(() => {
    if (!caseId) { router.push('/apply'); return }
    supabase.from('case_services').select('service_name, service_category').eq('case_id', caseId)
      .then(({ data }) => {
        if (data) setServices(data.map(d => ({ name: d.service_name, action: d.service_category })))
      })
    supabase.from('cases').select('delegator_phone').eq('id', caseId).single()
      .then(({ data }) => { if (data?.delegator_phone) setDelegatorPhone(data.delegator_phone) })
  }, [caseId]) // eslint-disable-line react-hooks/exhaustive-deps

  const count = services.length || 1
  const totalAmount = count * PRICE_PER_SERVICE
  const vat = Math.floor(totalAmount * 0.1)
  const grandTotal = promoApplied ? 0 : totalAmount + vat

  const checkPromo = async () => {
    if (!promoCode.trim()) return
    setPromoStatus('checking')
    setPromoMsg('')
    const res = await fetch('/api/promo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promoCode.trim(), caseId }),
    })
    const data = await res.json()
    if (data.valid) {
      setPromoStatus('valid')
      setPromoMsg(data.description || '베타 무료 이용권 적용됨')
      setPromoApplied(true)
    } else {
      setPromoStatus('invalid')
      setPromoMsg(data.reason || '유효하지 않은 코드')
      setPromoApplied(false)
    }
  }

  const removePromo = () => {
    setPromoCode('')
    setPromoStatus('idle')
    setPromoMsg('')
    setPromoApplied(false)
  }

  const requestPromoFree = async () => {
    if (!caseId) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/promo/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promoCode.trim(), caseId }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setError(err.error || '처리 중 오류가 발생했습니다')
      setLoading(false)
      return
    }
    setSubmitting(true)
    setTimeout(() => router.push(`/apply/confirm?done=true&caseId=${caseId}`), 1500)
  }

  const requestPay = async (method: 'CARD' | 'EASY_PAY') => {
    if (!caseId) return
    if (promoApplied) { requestPromoFree(); return }
    setLoading(true)
    setError('')

    const timeout = setTimeout(() => {
      setLoading(false)
      setError('결제 시간이 초과되었습니다. 다시 시도해 주세요.')
    }, 30000)

    try {
      const paymentId = `afterm-${caseId}-${Date.now()}`
      const { data: { user } } = await supabase.auth.getUser()
      const userEmail = user?.email || 'test@afterm.co.kr'
      const userName = user?.user_metadata?.full_name || '고객'

      const channelKey = method === 'EASY_PAY'
        ? process.env.NEXT_PUBLIC_PORTONE_KAKAO_CHANNEL_KEY!
        : process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!

      const payParams: Parameters<typeof PortOne.requestPayment>[0] = {
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey,
        paymentId,
        orderName: `에프텀 디지털 계정 정리 대행 (${count}건)`,
        totalAmount: grandTotal,
        currency: 'KRW',
        payMethod: method,
        customer: {
          fullName: userName,
          email: userEmail,
          ...(delegatorPhone ? { phoneNumber: delegatorPhone.replace(/-/g, '') } : {}),
        },
        redirectUrl: `${window.location.origin}/apply/payment/complete`,
      }

      if (method === 'EASY_PAY') {
        (payParams as any).easyPay = { easyPayProvider: 'KAKAOPAY' }
      }

      const response = await PortOne.requestPayment(payParams)
      clearTimeout(timeout)

      if (response?.code) {
        setError(response.message || '결제가 취소되었습니다.')
        setLoading(false)
        return
      }

      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, caseId }),
      })

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}))
        setError(errData.error || '결제 검증에 실패했습니다. 고객센터에 문의해주세요.')
        setLoading(false)
        return
      }

      setSubmitting(true)
      setTimeout(() => router.push(`/apply/confirm?done=true&caseId=${caseId}`), 1500)
    } catch (e: any) {
      clearTimeout(timeout)
      setError(e.message || '결제 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  if (submitting) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: '#fff', gap: 20,
        fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          border: '4px solid #E5E9EF', borderTopColor: '#2563EB',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
          신청중입니다
        </p>
        <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>잠시만 기다려 주세요...</p>
      </div>
    )
  }

  return (
    <Screen>
      <Body>
        <StepLabel label="결제" />
        <Question label="결제하기" />

        {/* 신청 서비스 */}
        <div style={{
          background: '#F8FAFC', borderRadius: 14, padding: '18px 20px', marginBottom: 12,
          border: '1px solid #E5E9EF',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', margin: '0 0 12px', letterSpacing: '0.06em' }}>
            신청 서비스
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {services.length > 0 ? services.map((svc, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>
                  {svc.name}
                  <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400, marginLeft: 6 }}>
                    {svc.action === '추모계정' ? '추모전환' : '해지·삭제'}
                  </span>
                </span>
                <span style={{ fontSize: 14, color: promoApplied ? '#9CA3AF' : '#374151', fontWeight: 700, textDecoration: promoApplied ? 'line-through' : 'none' }}>
                  {PRICE_PER_SERVICE.toLocaleString()}원
                </span>
              </div>
            )) : (
              <div style={{ fontSize: 14, color: '#9CA3AF' }}>불러오는 중...</div>
            )}
          </div>
        </div>

        {/* 프로모 코드 */}
        <div style={{ marginBottom: 12 }}>
          {!promoApplied ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoStatus('idle'); setPromoMsg('') }}
                onKeyDown={e => e.key === 'Enter' && checkPromo()}
                placeholder="베타 초대 코드 입력 (예: AFTERM001)"
                style={{
                  flex: 1, padding: '12px 14px', borderRadius: 10,
                  border: `1.5px solid ${promoStatus === 'invalid' ? '#FCA5A5' : '#E5E9EF'}`,
                  fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  background: '#F8FAFC',
                }}
              />
              <button
                onClick={checkPromo}
                disabled={!promoCode.trim() || promoStatus === 'checking'}
                style={{
                  padding: '12px 16px', borderRadius: 10, border: 'none',
                  background: promoCode.trim() ? '#2563EB' : '#E5E9EF',
                  color: promoCode.trim() ? '#fff' : '#9CA3AF',
                  fontWeight: 700, fontSize: 13, cursor: promoCode.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                {promoStatus === 'checking' ? '확인 중' : '적용'}
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', borderRadius: 10,
              background: '#ECFDF5', border: '1.5px solid #6EE7B7',
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>🎉 {promoCode} 적용됨</span>
                <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>{promoMsg}</span>
              </div>
              <button onClick={removePromo} style={{
                background: 'none', border: 'none', color: '#9CA3AF',
                fontSize: 18, cursor: 'pointer', padding: '0 4px',
              }}>×</button>
            </div>
          )}
          {promoStatus === 'invalid' && (
            <p style={{ fontSize: 12, color: '#DC2626', margin: '6px 0 0 4px' }}>{promoMsg}</p>
          )}
        </div>

        {/* 금액 합계 */}
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #E5E9EF',
          padding: '18px 20px', marginBottom: 20,
        }}>
          {!promoApplied ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>서비스 {count}건</span>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{totalAmount.toLocaleString()}원</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #F3F4F6',
              }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>부가세 (10%)</span>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{vat.toLocaleString()}원</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>베타 초대 할인</span>
              <span style={{ fontSize: 13, color: '#059669', fontWeight: 700 }}>-{(totalAmount + vat).toLocaleString()}원</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>최종 결제금액</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: promoApplied ? '#059669' : '#2563EB', letterSpacing: '-0.02em' }}>
              {grandTotal === 0 ? '무료' : `${grandTotal.toLocaleString()}원`}
            </span>
          </div>
        </div>

        {/* 안심 문구 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {['대행 불가 시 전액 환불 보장', '결제 후 평균 1주일 이내 처리', '개인정보는 처리 완료 즉시 파기'].map(txt => (
            <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{txt}</span>
            </div>
          ))}
        </div>

        {!promoApplied && (
          <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E5E9EF' }}>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, lineHeight: 1.7 }}>
              결제는 KG이니시스를 통해 안전하게 처리됩니다.<br />
              신용카드, 체크카드, 카카오페이, 네이버페이 등 이용 가능합니다.
            </p>
          </div>
        )}

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 10, padding: '12px 16px', marginTop: 16,
          }}>
            <p style={{ fontSize: 13, color: '#DC2626', margin: 0, fontWeight: 600 }}>{error}</p>
          </div>
        )}
      </Body>

      <Dock>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {promoApplied ? (
            <button onClick={requestPromoFree} disabled={loading} style={{
              width: '100%', padding: '16px', borderRadius: 14,
              background: loading ? '#E5E9EF' : '#059669',
              color: loading ? '#9CA3AF' : '#fff',
              border: 'none', fontSize: 15, fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '-0.02em',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(5,150,105,0.3)',
            }}>
              {loading ? '처리 중...' : '무료로 신청 완료하기'}
            </button>
          ) : (
            <>
              <button onClick={() => requestPay('EASY_PAY')} disabled={loading} style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: loading ? '#E5E9EF' : '#FEE500',
                color: loading ? '#9CA3AF' : '#3C1E1E',
                border: 'none', fontSize: 15, fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.02em',
              }}>
                {loading ? '처리 중...' : '카카오페이로 결제하기'}
              </button>
              <button onClick={() => requestPay('CARD')} disabled={loading} style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: loading ? '#E5E9EF' : '#2563EB',
                color: loading ? '#9CA3AF' : '#fff',
                border: 'none', fontSize: 15, fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.02em',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.3)',
              }}>
                {loading ? '결제 처리 중...' : `${grandTotal.toLocaleString()}원 카드로 결제하기`}
              </button>
            </>
          )}
        </div>
      </Dock>
    </Screen>
  )
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentInner />
    </Suspense>
  )
}
