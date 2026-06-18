'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import * as PortOne from '@portone/browser-sdk/v2'
import { Suspense } from 'react'

const PRICE_PER_SERVICE = 4900

type PayMethod = 'CARD' | 'EASY_PAY'

function PaymentInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { caseId, selectedServices } = useApplyStore()
  const [payMethod, setPayMethod] = useState<PayMethod>('CARD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(searchParams.get('error') || '')

  const count = selectedServices.length
  const totalAmount = count * PRICE_PER_SERVICE
  const vat = Math.floor(totalAmount * 0.1)
  const grandTotal = totalAmount + vat

  useEffect(() => {
    if (!caseId || selectedServices.length === 0) {
      router.push('/apply')
    }
  }, [caseId, selectedServices, router])

  const handlePay = async () => {
    setLoading(true)
    setError('')

    try {
      const paymentId = `afterm-${caseId}-${Date.now()}`

      const isKakao = payMethod === 'EASY_PAY'
      const channelKey = isKakao
        ? process.env.NEXT_PUBLIC_PORTONE_KAKAO_CHANNEL_KEY!
        : process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!

      const { data: { user } } = await (await import('@/lib/supabase/client')).createClient().auth.getUser()
      const userEmail = user?.email || 'test@afterm.co.kr'
      const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || '고객'

      const response = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey,
        paymentId,
        orderName: `에프텀 디지털 계정 정리 대행 (${count}건)`,
        totalAmount: grandTotal,
        currency: 'KRW',
        payMethod: isKakao ? 'EASY_PAY' : 'CARD',
        ...(isKakao && { easyPay: { easyPayProvider: 'KAKAOPAY' } }),
        customer: {
          fullName: userName,
          email: userEmail,
        },
        redirectUrl: `${window.location.origin}/apply/payment/complete`,
      })

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
        setError('결제 검증에 실패했습니다. 고객센터에 문의해주세요.')
        setLoading(false)
        return
      }

      router.push('/apply/confirm')
    } catch (e: any) {
      setError(e.message || '결제 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  const methods: { id: PayMethod; label: string; icon: string; desc: string }[] = [
    { id: 'CARD', label: '신용카드', icon: '💳', desc: '신용카드 · 체크카드' },
    { id: 'EASY_PAY', label: '카카오페이', icon: '💛', desc: '카카오페이 간편결제' },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 40px' }}>

      {/* 타이틀 */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 6px', letterSpacing: '-0.02em' }}>결제</h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>결제 후 신청이 접수됩니다</p>
      </div>

      {/* 서비스 내역 */}
      <div style={{ background: '#F9FAFB', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', margin: '0 0 12px', letterSpacing: '0.06em' }}>신청 서비스</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selectedServices.map((svc) => (
            <div key={svc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>
                {svc.name} ({svc.track === 'delete' ? '삭제' : '추모'})
              </span>
              <span style={{ fontSize: 14, color: '#374151', fontWeight: 700 }}>
                {PRICE_PER_SERVICE.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 금액 합계 */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '18px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>서비스 {count}건</span>
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{totalAmount.toLocaleString()}원</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>부가세 (10%)</span>
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{vat.toLocaleString()}원</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>최종 결제금액</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#0066FF', letterSpacing: '-0.02em' }}>{grandTotal.toLocaleString()}원</span>
        </div>
      </div>

      {/* 결제 수단 선택 */}
      <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 10px' }}>결제 수단</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => setPayMethod(m.id)}
            style={{
              padding: '16px 12px', borderRadius: 14, cursor: 'pointer',
              border: payMethod === m.id ? '2px solid #0066FF' : '1.5px solid #E5E7EB',
              background: payMethod === m.id ? '#EFF6FF' : '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 26 }}>{m.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: payMethod === m.id ? '#0066FF' : '#374151' }}>{m.label}</span>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{m.desc}</span>
          </button>
        ))}
      </div>

      {/* 안심 문구 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {[
          '대행 불가 시 전액 환불 보장',
          '결제 후 평균 1주일 이내 처리',
          '개인정보는 처리 완료 즉시 파기',
        ].map((txt) => (
          <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{txt}</span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#DC2626', margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {/* 결제 버튼 */}
      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          width: '100%', padding: '18px', borderRadius: 14,
          background: loading ? '#9CA3AF' : payMethod === 'EASY_PAY' ? '#FEE500' : '#0066FF',
          color: loading ? '#fff' : payMethod === 'EASY_PAY' ? '#000' : '#fff',
          border: 'none', fontSize: 16, fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '-0.01em',
          boxShadow: loading ? 'none' : payMethod === 'EASY_PAY' ? '0 4px 16px rgba(254,229,0,0.4)' : '0 4px 16px rgba(22,50,114,0.3)',
          transition: 'all 0.2s',
        }}
      >
        {loading ? '결제 처리 중...' : `${grandTotal.toLocaleString()}원 ${payMethod === 'EASY_PAY' ? '카카오페이로 결제' : '카드로 결제'}`}
      </button>

      <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.6 }}>
        결제 완료 후 신청이 자동 접수됩니다
      </p>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentInner />
    </Suspense>
  )
}
