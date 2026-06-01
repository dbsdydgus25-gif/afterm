'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

const TABS = [
  { value: 'all', label: '전체' },
  { value: 'draft', label: '작성 중' },
  { value: 'submitted', label: '접수 완료' },
  { value: 'processing', label: '처리 중' },
  { value: 'completed', label: '완료됨' },
  { value: 'cancelled', label: '취소됨' },
]

export default function AdminFilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentStatus = searchParams.get('status') || 'all'
  const currentSearch = searchParams.get('search') || ''

  const [searchInput, setSearchInput] = useState(currentSearch)

  const updateFilters = (statusValue: string, searchValue: string) => {
    const params = new URLSearchParams()
    if (statusValue && statusValue !== 'all') {
      params.set('status', statusValue)
    }
    if (searchValue) {
      params.set('search', searchValue)
    }
    
    startTransition(() => {
      router.push(`/admin/cases?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters(currentStatus, searchInput)
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: '20px', marginBottom: '24px', background: 'var(--color-common-100)',
      padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--color-line-normal-normal)',
      flexWrap: 'wrap'
    }}>
      {/* ── 상태 탭 필터 ── */}
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
        {TABS.map(tab => {
          const isActive = currentStatus === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => updateFilters(tab.value, currentSearch)}
              style={{
                padding: '8px 16px', borderRadius: '100px', border: 'none',
                background: isActive ? 'var(--color-primary-normal)' : 'transparent',
                color: isActive ? '#fff' : 'var(--color-label-alternative)',
                fontSize: '13px', fontWeight: isActive ? 700 : 600,
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── 검색 필드 ── */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', minWidth: '300px' }}>
        <input
          type="text"
          placeholder="고인명 또는 연락처 검색"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          style={{
            flex: 1, height: '40px', padding: '0 14px', borderRadius: '8px',
            border: '1.5px solid var(--color-line-solid-normal)', fontSize: '13px',
            fontFamily: 'var(--font-sans)', outline: 'none', transition: 'border-color 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--color-primary-normal)'}
          onBlur={e => e.target.style.borderColor = 'var(--color-line-solid-normal)'}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{
            height: '40px', padding: '0 18px', borderRadius: '8px', border: 'none',
            background: 'var(--color-label-neutral)', color: '#fff', fontSize: '13px',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
            whiteSpace: 'nowrap', transition: 'background 0.2s'
          }}
        >
          {isPending ? '검색 중...' : '검색'}
        </button>
      </form>
    </div>
  )
}
