'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window { Kakao: any }
}

const CHANNEL_PUBLIC_ID = '_cxfNAX'
type Relation = 'ADDED' | 'BLOCKED' | 'NONE' | 'unknown'

export default function HomeChatButton({ kakaoToken }: { kakaoToken: string | null }) {
  const [relation, setRelation] = useState<Relation>('unknown')
  const [sdkReady, setSdkReady] = useState(false)

  // ── 1) Kakao JS SDK 로드 & 초기화 ──
  useEffect(() => {
    const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (!jsKey) return

    if (window.Kakao?.isInitialized()) {
      if (kakaoToken) window.Kakao.Auth.setAccessToken(kakaoToken)
      setSdkReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      window.Kakao.init(jsKey)
      if (kakaoToken) window.Kakao.Auth.setAccessToken(kakaoToken)
      setSdkReady(true)
    }
    document.head.appendChild(script)
  }, [kakaoToken])

  // ── 2) REST API로 채널 관계 조회 ──
  useEffect(() => {
    if (!kakaoToken) return
    fetch(
      `https://kapi.kakao.com/v2/api/talk/channels?channel_ids=${CHANNEL_PUBLIC_ID}&channel_id_type=channel_public_id`,
      { headers: { Authorization: `Bearer ${kakaoToken}` } }
    )
      .then(r => r.json())
      .then(data => {
        const ch = data?.channels?.find((c: any) => c.channel_public_id === CHANNEL_PUBLIC_ID)
        setRelation((ch?.relation as Relation) ?? 'NONE')
      })
      .catch(() => setRelation('NONE'))
  }, [kakaoToken])

  // ── 3) 채팅 열기 ──
  const openChat = () => {
    if (sdkReady && window.Kakao?.Channel) {
      window.Kakao.Channel.chat({ channelPublicId: CHANNEL_PUBLIC_ID })
    } else {
      window.open(`https://pf.kakao.com/${CHANNEL_PUBLIC_ID}/chat`, '_blank')
    }
  }

  // ── 4) 채널 추가 (NONE 상태) — addChannel로 브릿지 페이지 열기 ──
  const addChannel = () => {
    if (sdkReady && window.Kakao?.Channel) {
      // addChannel: 브릿지 페이지 열기 (로그인 필요 없음, PC/모바일 모두 동작)
      window.Kakao.Channel.addChannel({ channelPublicId: CHANNEL_PUBLIC_ID })
    } else {
      window.open(`https://pf.kakao.com/${CHANNEL_PUBLIC_ID}`, '_blank')
    }
  }

  // NONE 또는 BLOCKED → 채널 추가 유도
  if (relation === 'NONE' || relation === 'BLOCKED') {
    return (
      <div style={{
        background: '#FFF9E6', border: '1.5px solid #FEE500',
        borderRadius: 16, padding: '18px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28 }}>💬</div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: '0 0 3px' }}>에프텀 채널을 추가해주세요</p>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>채널 추가 후 담당자와 바로 채팅할 수 있어요</p>
          </div>
        </div>
        <button
          onClick={addChannel}
          style={{
            width: '100%', background: '#FEE500', border: 'none', borderRadius: 12,
            padding: '14px', fontSize: 15, fontWeight: 800, color: '#111', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#111">
            <path d="M12 3C6.477 3 2 6.582 2 11c0 2.742 1.55 5.17 3.938 6.672-.133.447-.855 2.837-.886 3.015-.04.22.08.437.29.437.115 0 .22-.058.305-.138l3.558-2.37C10.345 18.87 11.16 19 12 19c5.523 0 10-3.582 10-8S17.523 3 12 3z"/>
          </svg>
          카카오톡 채널 추가하기
        </button>
      </div>
    )
  }

  // ADDED 또는 unknown → 채팅 버튼
  return (
    <button
      onClick={openChat}
      style={{
        width: '100%', background: 'linear-gradient(135deg, #163272 0%, #1e4db7 100%)',
        border: 'none', borderRadius: 16, padding: '18px 20px',
        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left',
      }}
    >
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
