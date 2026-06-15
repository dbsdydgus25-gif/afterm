'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  message: string
  is_admin: boolean
  created_at: string
}

export default function AdminChatPanel({ userId, deceasedName }: { userId: string, deceasedName: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  // 직접 유저가 보낸 경우에만 스크롤 (폴링으로 받아온 경우 스크롤 금지)
  const shouldScrollRef = useRef(false)

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [userId])

  // 직접 메시지를 보낸 직후에만 채팅창 내부 스크롤
  useEffect(() => {
    if (!shouldScrollRef.current) return
    shouldScrollRef.current = false
    // 페이지 전체가 아닌 채팅 컨테이너 내부만 스크롤
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    const msg = input
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, targetUserId: userId, isAdmin: true }),
      })
      if (res.ok) {
        const newMsg = await res.json()
        shouldScrollRef.current = true // 내가 보낸 경우만 스크롤
        setMessages(prev => [...prev, newMsg])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e9ef', display: 'flex', flexDirection: 'column', height: 500 }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#374151', margin: 0 }}>💬 {deceasedName}님 유족과의 1:1 채팅</h3>
      </div>

      {/* 메시지 영역 */}
      <div ref={chatContainerRef} style={{ flex: 1, padding: 16, overflowY: 'auto', background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 40 }}>채팅 내역이 없습니다.</p>
        )}
        {messages.map(m => {
          const isMine = m.is_admin
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '10px 14px', borderRadius: 16,
                background: isMine ? '#163272' : '#fff',
                color: isMine ? '#fff' : '#111827',
                border: isMine ? 'none' : '1px solid #e5e9ef',
                fontSize: 14, lineHeight: 1.4,
                borderBottomRightRadius: isMine ? 4 : 16,
                borderBottomLeftRadius: isMine ? 16 : 4,
              }}>
                {m.message}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <form onSubmit={handleSend} style={{ padding: 12, borderTop: '1px solid #e5e9ef', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="답변을 입력하세요"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e9ef',
            fontSize: 14, outline: 'none'
          }}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{
          padding: '0 20px', borderRadius: 8, background: input.trim() ? '#163272' : '#e5e9ef',
          border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          transition: 'background 0.2s'
        }}>
          전송
        </button>
      </form>
    </div>
  )
}
