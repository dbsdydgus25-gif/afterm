'use client'

import { useEffect } from 'react'

// 카카오톡 채널 링크 — 실제 링크로 교체 필요
const KAKAO_CHANNEL_URL = 'http://pf.kakao.com/_cxfNAX/chat'

export default function ChatPage() {
  useEffect(() => {
    window.location.href = KAKAO_CHANNEL_URL
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '80vh', padding: '0 24px', textAlign: 'center',
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
    }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>💬</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 10px' }}>
        카카오톡으로 연결 중...
      </h2>
      <p style={{ color: '#888', fontSize: 15, lineHeight: 1.7, margin: '0 0 28px' }}>
        에프텀 담당자와 카카오톡으로<br />편하게 문의하실 수 있어요.
      </p>
      <a
        href={KAKAO_CHANNEL_URL}
        style={{
          background: '#FEE500', color: '#111', fontWeight: 700, fontSize: 16,
          padding: '14px 28px', borderRadius: 14, textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#111">
          <path d="M12 3C6.477 3 2 6.582 2 11c0 2.742 1.55 5.17 3.938 6.672-.133.447-.855 2.837-.886 3.015-.04.22.08.437.29.437.115 0 .22-.058.305-.138l3.558-2.37C10.345 18.87 11.16 19 12 19c5.523 0 10-3.582 10-8S17.523 3 12 3z"/>
        </svg>
        카카오톡 채널 열기
      </a>
      <p style={{ color: '#bbb', fontSize: 13, marginTop: 12 }}>자동으로 열리지 않으면 위 버튼을 눌러주세요</p>
    </div>
  )
}
