'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  message: string
  is_admin: boolean
  created_at: string
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
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
    if (isOpen) {
      fetchMessages()
      const interval = setInterval(fetchMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

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
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: 90, right: 20, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%', background: '#2563EB',
          border: 'none', boxShadow: '0 4px 12px rgba(22,50,114,0.3)',
          display: isOpen ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </button>

      {/* 채팅 윈도우 */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 90, right: 20, width: 320, height: 480,
          background: '#fff', borderRadius: 20, boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          zIndex: 1001, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid #E8EAF0'
        }}>
          {/* 헤더 */}
          <div style={{
            background: '#2563EB', padding: '16px 20px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>에프텀 1:1 상담</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>무엇이든 물어보세요</p>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>
              &times;
            </button>
          </div>

          {/* 메시지 영역 */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', background: '#F4F6F9', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map(m => {
              const isMine = !m.is_admin
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: 16,
                    background: isMine ? '#2563EB' : '#fff',
                    color: isMine ? '#fff' : '#111827',
                    border: isMine ? 'none' : '1px solid #E8EAF0',
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
          <form onSubmit={handleSend} style={{ padding: 12, background: '#fff', borderTop: '1px solid #E8EAF0', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="메시지를 입력하세요"
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 20, border: '1px solid #E8EAF0',
                fontSize: 14, outline: 'none', background: '#F9FAFB'
              }}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{
              width: 40, height: 40, borderRadius: '50%', background: input.trim() ? '#2563EB' : '#E8EAF0',
              border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'background 0.2s'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
