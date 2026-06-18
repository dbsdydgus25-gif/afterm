'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import * as PortOne from '@portone/browser-sdk/v2'
import { createClient } from '@/lib/supabase/client'

const PRICE_PER_SERVICE = 4900

function PaymentInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { caseId } = useApplyStore()
  const supabase = createClient()

  const [services, setServices] = useState<{ name: string; action: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(searchParams.get('error') || '')

  useEffect(() => {
    if (!caseId) { router.push('/apply'); return }
    supabase
      .from('case_services')
      .select('service_name, service_category')
      .eq('case_id', caseId)
      .then(({ data }) => {
        if (data) setServices(data.map(d => ({ name: d.service_name, action: d.service_category })))
      })
  }, [caseId])

  const count = services.length || 1
  const totalAmount = count * PRICE_PER_SERVICE
  const vat = Math.floor(totalAmount * 0.1)
  const grandTotal = totalAmount + vat

  const handlePay = async () => {
    if (!caseId) return
    setLoading(true)
    setError('')

    try {
      const paymentId = `afterm-${caseId}-${Date.now()}`
      const { data: { user } } = await supabase.auth.getUser()
      const userEmail = user?.email || 'test@afterm.co.kr'
      const userName = user?.user_metadata?.full_name || '고객'

      const response = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        paymentId,
        orderName: `에프텀 디지털 계정 정리 대행 (${count}건)`,
        totalAmount: grandTotal,
        currency: 'KRW',
        payMethod: 'CARD',
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

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100dvh',
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif", background: '#fff',
    }}>
      <div style={{ flex: 1, padding: '40px 24px 120px' }}>
        <h2 style={{
          fontSize: 26, fontWeight: 800, color: '#111827',
          letterSpacing: '-0.03em', lineHeight: 1.35, margin: '0 0 32px',
        }}>
          결제하기
        </h2>

        {/* 서비스 내역 */}
        <div style={{
          background: '#F8FAFC', borderRadius: 14, padding: '18px 20px', marginBottom: 16,
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
                <span style={{ fontSize: 14, color: '#374151', fontWeight: 700 }}>
                  {PRICE_PER_SERVICE.toLocaleString()}원
                </span>
              </div>
            )) : (
              <div style={{ fontSize: 14, color: '#374151', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                <span>서비스 로딩 중...</span>
              </div>
            )}
          </div>
        </div>

        {/* 금액 합계 */}
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #E5E9EF',
          padding: '18px 20px', marginBottom: 24,
        }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>최종 결제금액</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#2563EB', letterSpacing: '-0.02em' }}>
              {grandTotal.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 안심 문구 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[
            '대행 불가 시 전액 환불 보장',
            '결제 후 평균 1주일 이내 처리',
            '개인정보는 처리 완료 즉시 파기',
          ].map((txt) => (
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

        {/* KG이니시스 안내 */}
        <div style={{
          padding: '12px 14px', borderRadius: 10,
          background: '#F8FAFC', border: '1px solid #E5E9EF',
        }}>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, lineHeight: 1.7 }}>
            결제는 KG이니시스를 통해 안전하게 처리됩니다.<br />
            신용카드, 체크카드, 카카오페이, 네이버페이 등 이용 가능합니다.
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 10, padding: '12px 16px', marginTop: 16,
          }}>
            <p style={{ fontSize: 13, color: '#DC2626', margin: 0, fontWeight: 600 }}>{error}</p>
          </div>
        )}
      </div>

      {/* 결제 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, padding: '16px 24px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 30%)', zIndex: 50,
      }}>
        <button
          onClick={handlePay}
          disabled={loading}
          style={{
            width: '100%', padding: '17px', borderRadius: 14,
            background: loading ? '#E5E9EF' : '#2563EB',
            color: loading ? '#9CA3AF' : '#fff',
            border: 'none', fontSize: 16, fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', letterSpacing: '-0.02em',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.3)',
          }}
        >
          {loading ? '결제 처리 중...' : `${grandTotal.toLocaleString()}원 카드로 결제하기`}
        </button>
      </div>
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
