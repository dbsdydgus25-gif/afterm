'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  message: string
  is_admin: boolean
  created_at: string
}

export default function ChatPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 유저 ID 가져오기
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  // 메시지 불러오기
  const fetchMessages = async () => {
    const res = await fetch('/api/chat')
    if (res.ok) setMessages(await res.json())
  }

  // Supabase Realtime 구독
  useEffect(() => {
    fetchMessages()

    if (!userId) return

    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${userId}` },
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      if (res.ok) {
        const newMsg = await res.json()
        setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      background: '#F4F6F9', fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
    }}>
      {/* 헤더 */}
      <div style={{
        background: '#0066FF', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          🎧
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>에프텀 상담팀</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>평일 9:00 ~ 18:00 응대</p>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 안내 메시지 */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '14px 16px',
          border: '1px solid #E8EAF0', textAlign: 'center', margin: '8px 0',
        }}>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
            🔒 상담 내용은 안전하게 보호됩니다.<br />
            신청 관련 궁금한 점을 자유롭게 물어보세요.
          </p>
        </div>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 40, color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>무엇이든 물어보세요</p>
            <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              전문 상담사가 빠르게 답변해 드립니다.
            </p>
          </div>
        )}

        {messages.map((m, i) => {
          const isMine = !m.is_admin
          const prevMsg = messages[i - 1]
          const showDate = !prevMsg || new Date(m.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()

          return (
            <div key={m.id}>
              {showDate && (
                <div style={{ textAlign: 'center', margin: '4px 0 8px' }}>
                  <span style={{
                    fontSize: 11, color: '#9CA3AF', background: '#E5E7EB',
                    padding: '3px 10px', borderRadius: 100, fontWeight: 600,
                  }}>
                    {new Date(m.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
                {!isMine && (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, marginBottom: 2,
                  }}>
                    🎧
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 3 }}>
                  <div style={{
                    maxWidth: 260, padding: '12px 16px', borderRadius: 20,
                    background: isMine ? '#0066FF' : '#fff',
                    color: isMine ? '#fff' : '#111827',
                    border: isMine ? 'none' : '1px solid #E8EAF0',
                    fontSize: 15, lineHeight: 1.5,
                    borderBottomRightRadius: isMine ? 4 : 20,
                    borderBottomLeftRadius: isMine ? 20 : 4,
                    boxShadow: isMine ? '0 2px 8px rgba(22,50,114,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    {m.message}
                  </div>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{formatTime(m.created_at)}</span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div style={{
        padding: '12px 16px', background: '#fff', borderTop: '1px solid #E8EAF0',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
      }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            style={{
              flex: 1, padding: '13px 18px', borderRadius: 24,
              border: '1.5px solid #E8EAF0', fontSize: 15, outline: 'none',
              background: '#F9FAFB', fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = '#0066FF' }}
            onBlur={e => { e.target.style.borderColor = '#E8EAF0' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: input.trim() ? '#0066FF' : '#E5E7EB', border: 'none',
              color: '#fff', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
