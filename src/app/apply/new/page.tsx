'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'

export default function ApplyNewPage() {
  const router = useRouter()
  const resetStore = useApplyStore(s => s.resetStore)

  useEffect(() => {
    resetStore()
    router.replace('/apply')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
