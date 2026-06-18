'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  message: string
  is_admin: boolean
  created_at: string
}

// 컬러 오브 SVG (framer-motion 애니메이션)
function ColorOrb({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="orb-grad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="40%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#818CF8" />
        </radialGradient>
      </defs>
      <circle cx="14" cy="14" r="13" fill="url(#orb-grad)" />
      <circle cx="10" cy="10" r="4" fill="rgba(255,255,255,0.25)" />
    </svg>
  )
}

export default function AfterChat() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // 유저 ID 가져오기
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  // 메시지 불러오기
  const fetchMessages = useCallback(async () => {
    const res = await fetch('/api/chat')
    if (res.ok) setMessages(await res.json())
  }, [])

  // Realtime 구독
  useEffect(() => {
    fetchMessages()
    if (!userId) return

    const channel = supabase
      .channel('after_chat_panel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${userId}` },
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            const newMsg = payload.new as Message
            // 패널 닫혀있으면 읽지 않은 알림
            if (!open && newMsg.is_admin) setHasUnread(true)
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // 열릴 때 스크롤 + 읽음 처리
  useEffect(() => {
    if (open) {
      setHasUnread(false)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
        inputRef.current?.focus()
      }, 300)
    }
  }, [open])

  // 새 메시지 올 때 스크롤
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (open && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') setOpen(false)
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      {/* 오버레이 (패널 열릴 때 배경 dim) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 200, backdropFilter: 'blur(2px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* 채팅 패널 + 버튼 — 하단 고정 */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          pointerEvents: 'none',
        }}
      >
        {/* 채팅 패널 (슬라이드업) */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="chat-panel"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 38, mass: 0.8 }}
              style={{
                background: '#fff',
                borderRadius: '24px 24px 0 0',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
                display: 'flex',
                flexDirection: 'column',
                height: '72dvh',
                pointerEvents: 'all',
                overflow: 'hidden',
              }}
            >
              {/* 패널 헤더 */}
              <div style={{
                padding: '14px 20px 12px',
                borderBottom: '1px solid #F0F0F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#0066FF',
                borderRadius: '24px 24px 0 0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>🎧</div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>에프텀 상담팀</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>평일 9:00 ~ 18:00 응대</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                    width: 32, height: 32, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 메시지 영역 */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
                display: 'flex', flexDirection: 'column', gap: 12,
                background: '#F4F6F9',
              }}>
                {/* 안내 */}
                <div style={{
                  background: '#fff', borderRadius: 14, padding: '12px 14px',
                  border: '1px solid #E8EAF0', textAlign: 'center',
                }}>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                    🔒 상담 내용은 안전하게 보호됩니다.<br />
                    신청 관련 궁금한 점을 자유롭게 물어보세요.
                  </p>
                </div>

                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', marginTop: 24, color: '#9CA3AF' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 4px' }}>무엇이든 물어보세요</p>
                    <p style={{ fontSize: 12, margin: 0, lineHeight: 1.6 }}>전문 상담사가 빠르게 답변해 드립니다.</p>
                  </div>
                )}

                {messages.map((m, i) => {
                  const isMine = !m.is_admin
                  const prevMsg = messages[i - 1]
                  const showDate = !prevMsg ||
                    new Date(m.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()

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
                      <div style={{
                        display: 'flex',
                        justifyContent: isMine ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-end', gap: 6,
                      }}>
                        {!isMine && (
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            background: '#0066FF', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 14, marginBottom: 2,
                          }}>🎧</div>
                        )}
                        <div style={{
                          display: 'flex', flexDirection: 'column',
                          alignItems: isMine ? 'flex-end' : 'flex-start', gap: 3,
                        }}>
                          <div style={{
                            maxWidth: 240, padding: '10px 14px', borderRadius: 18,
                            background: isMine ? '#0066FF' : '#fff',
                            color: isMine ? '#fff' : '#111827',
                            border: isMine ? 'none' : '1px solid #E8EAF0',
                            fontSize: 14, lineHeight: 1.5,
                            borderBottomRightRadius: isMine ? 4 : 18,
                            borderBottomLeftRadius: isMine ? 18 : 4,
                            boxShadow: isMine ? '0 2px 8px rgba(22,50,114,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
                          }}>
                            {m.message}
                          </div>
                          <span style={{ fontSize: 10, color: '#9CA3AF' }}>{formatTime(m.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* 입력창 */}
              <div style={{
                padding: '10px 12px',
                paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
                background: '#fff', borderTop: '1px solid #E8EAF0',
              }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="메시지를 입력하세요..."
                    rows={1}
                    style={{
                      flex: 1, padding: '11px 14px', borderRadius: 20,
                      border: '1.5px solid #E8EAF0', fontSize: 14, outline: 'none',
                      background: '#F9FAFB', resize: 'none', lineHeight: 1.5,
                      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                      maxHeight: 90, overflowY: 'auto',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#0066FF' }}
                    onBlur={e => { e.target.style.borderColor = '#E8EAF0' }}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: input.trim() ? '#0066FF' : '#E5E7EB', border: 'none',
                      color: '#fff', cursor: input.trim() ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                  >
                    {loading ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" opacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AFTERM Chat 플로팅 버튼 */}
        <motion.div
          animate={{
            y: open ? 0 : 0,
            paddingBottom: open ? 0 : 'env(safe-area-inset-bottom, 0px)',
          }}
          style={{
            padding: open ? '0' : '0 0 calc(70px + env(safe-area-inset-bottom, 0px))',
            display: 'flex', justifyContent: 'center',
            pointerEvents: 'all',
          }}
        >
          <AnimatePresence mode="wait">
            {!open && (
              <motion.button
                key="chat-btn"
                initial={{ opacity: 0, scale: 0.85, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 12 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                onClick={() => setOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#fff',
                  border: '1.5px solid #E8EDF5',
                  borderRadius: 28, padding: '10px 22px 10px 14px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.14), 0 1px 6px rgba(0,0,0,0.08)',
                  cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#111827',
                  fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                  position: 'relative',
                  marginBottom: 12,
                }}
              >
                <ColorOrb size={30} />
                <span>AFTERM Chat</span>
                {hasUnread && (
                  <span style={{
                    position: 'absolute', top: 6, right: 8,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#EF4444', border: '2px solid #fff',
                  }} />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}
