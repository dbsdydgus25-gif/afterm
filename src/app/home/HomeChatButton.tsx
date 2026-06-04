'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    Kakao: any
  }
}

const CHANNEL_PUBLIC_ID = '_cxfNAX'

export default function HomeChatButton() {
  useEffect(() => {
    // Kakao SDK 로드
    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
      if (jsKey && window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(jsKey)
      }
    }
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const openChat = () => {
    if (window.Kakao?.isInitialized()) {
      window.Kakao.Channel.chat({ channelPublicId: CHANNEL_PUBLIC_ID })
    } else {
      // SDK 초기화 전 fallback
      window.open(`https://pf.kakao.com/${CHANNEL_PUBLIC_ID}/chat`, '_blank')
    }
  }

  return (
    <button
      onClick={openChat}
      style={{
        width: '100%', background: 'linear-gradient(135deg, #163272 0%, #1e4db7 100%)',
        border: 'none', borderRadius: 16, padding: '18px 20px',
        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left',
      }}>
      <div style={{ fontSize: 28 }}>💬</div>
      <div>
        <p style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: '0 0 3px' }}>에프텀 담당자에게 문의하기</p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>카카오톡으로 편하게 연락하세요</p>
      </div>
      <svg style={{ marginLeft: 'auto' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  )
}
