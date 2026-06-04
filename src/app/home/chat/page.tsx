'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  message: string
  is_admin: boolean
  created_at: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat')
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
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
        body: JSON.stringify({ message: msg, isAdmin: false }),
      })
      if (res.ok) {
        const newMsg = await res.json()
        setMessages(prev => [...prev, newMsg])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F4F6F9', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* 헤더 */}
      <div style={{
        background: '#fff', padding: '16px 20px', borderBottom: '1px solid #F0F0F0',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>상담 채팅</h1>
      </div>

      {/* 메시지 영역 */}
      <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 60, color: '#9CA3AF' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>무엇이든 물어보세요</p>
            <p style={{ fontSize: 13, margin: 0 }}>전문 상담사가 답변해 드립니다.</p>
          </div>
        )}
        {messages.map(m => {
          const isMine = !m.is_admin
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '12px 16px', borderRadius: 20,
                background: isMine ? '#163272' : '#fff',
                color: isMine ? '#fff' : '#111827',
                border: isMine ? 'none' : '1px solid #E8EAF0',
                fontSize: 15, lineHeight: 1.4,
                borderBottomRightRadius: isMine ? 4 : 20,
                borderBottomLeftRadius: isMine ? 20 : 4,
                boxShadow: isMine ? 'none' : '0 1px 2px rgba(0,0,0,0.02)'
              }}>
                {m.message}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 (탭바를 가리지 않도록 위치) */}
      <div style={{ padding: '12px 20px 24px', background: '#fff', borderTop: '1px solid #E8EAF0' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="메시지를 입력하세요"
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 24, border: '1px solid #E8EAF0',
              fontSize: 15, outline: 'none', background: '#F9FAFB'
            }}
          />
          <button type="submit" disabled={loading || !input.trim()} style={{
            width: 48, height: 48, borderRadius: '50%', background: input.trim() ? '#163272' : '#E8EAF0',
            border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'background 0.2s', flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
