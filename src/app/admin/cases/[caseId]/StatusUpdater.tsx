'use client'

import { useState } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const SERVICE_STATUS = ['pending', 'dispatched', 'received', 'done', 'failed']
const SERVICE_STATUS_LABEL: Record<string, string> = {
  pending: '대기 중', dispatched: '발송 완료', received: '기업 접수', done: '처리 완료', failed: '처리 실패'
}

// 관리자 - 신청건 상세 처리 페이지
export default function AdminCaseDetailPage({ caseData }: { caseData: any }) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState('')

  const handleStatusUpdate = async (serviceId: string, newStatus: string) => {
    setUpdating(serviceId)
    try {
      const res = await fetch(`/api/admin/cases/${caseData.id}/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, status_note: statusNote }),
      })
      if (!res.ok) throw new Error('Failed')
      window.location.reload()
    } catch {
      alert('상태 업데이트 실패')
    } finally {
      setUpdating(null)
    }
  }

  return <div>{/* 클라이언트 로직 */}</div>
}
