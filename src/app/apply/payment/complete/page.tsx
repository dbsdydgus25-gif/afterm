'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { Suspense } from 'react'

function CompleteInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { caseId } = useApplyStore()

  useEffect(() => {
    const paymentId = params.get('paymentId')
    const code = params.get('code') // 실패 시 에러코드

    if (code) {
      // 결제 실패/취소
      router.replace('/apply/payment?error=' + encodeURIComponent(params.get('message') || '결제가 취소되었습니다.'))
      return
    }

    if (!paymentId || !caseId) {
      router.replace('/apply/payment')
      return
    }

    // 서버 검증
    fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, caseId }),
    }).then(res => {
      if (res.ok) {
        router.replace('/apply/confirm')
      } else {
        router.replace('/apply/payment?error=결제 검증 실패')
      }
    }).catch(() => {
      router.replace('/apply/payment?error=네트워크 오류')
    })
  }, [params, caseId, router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTop: '3px solid #2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 600 }}>결제 확인 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function PaymentCompletePage() {
  return (
    <Suspense>
      <CompleteInner />
    </Suspense>
  )
}
