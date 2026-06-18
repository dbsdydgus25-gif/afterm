'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 서비스 선택 플로우는 /apply 로 통합되었습니다
export default function ServicesRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/apply') }, [router])
  return null
}
