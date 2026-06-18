'use client'

import { useState, useEffect, useRef } from 'react'

interface SupportMessage {
  id: string
  user_id: string
  message: string
  is_admin: boolean
  created_at: string
}

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
}

interface UserThread {
  userId: string
  profile: UserProfile | null
  messages: SupportMessage[]
  lastMessage: string
  lastTime: string
}

function displayName(thread: UserThread) {
  const p = thread.profile
  if (p?.name) return p.name
  if (p?.email) return p.email.split('@')[0]
  return 'User ' + thread.userId.slice(0, 8).toUpperCase()
}

export default function AdminChatPage() {
  const [threads, setThreads] = useState<UserThread[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    const [msgRes, profileRes] = await Promise.all([
      fetch('/api/admin/chat'),
      fetch('/api/admin/users'),
    ])
    if (!msgRes.ok) return
    const msgs: SupportMessage[] = await msgRes.json()
    const profiles: UserProfile[] = profileRes.ok ? await profileRes.json() : []

    const profileMap: Record<string, UserProfile> = {}
    for (const p of profiles) profileMap[p.id] = p

    // 유저별 그룹핑
    const grouped: Record<string, SupportMessage[]> = {}
    for (const m of msgs) {
      if (!grouped[m.user_id]) grouped[m.user_id] = []
      grouped[m.user_id].push(m)
    }

    const threadList: UserThread[] = Object.entries(grouped).map(([userId, messages]) => {
      const last = messages[messages.length - 1]
      return {
        userId,
        profile: profileMap[userId] || null,
        messages,
        lastMessage: last.message,
        lastTime: last.created_at,
      }
    }).sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())

    setThreads(threadList)
    setLoading(false)
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedUserId, threads])

  const handleSend = async () => {
    if (!reply.trim() || !selectedUserId || sending) return
    setSending(true)
    const res = await fetch('/api/admin/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: selectedUserId, message: reply.trim() }),
    })
    if (res.ok) {
      setReply('')
      await fetchMessages()
    }
    setSending(false)
  }

  const selectedThread = threads.find(t => t.userId === selectedUserId)

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif", height: 'calc(100vh - 40px)', display: 'flex', gap: 20 }}>
      {/* 왼쪽: 유저 목록 */}
      <div style={{
        width: 300, flexShrink: 0, background: '#fff', borderRadius: 16,
        border: '1px solid #E8EAF0', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #F0F0F0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: 0 }}>채팅 내역</h2>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>{threads.length}명의 유저</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>불러오는 중...</div>
          )}
          {!loading && threads.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>채팅 내역 없음</div>
          )}
          {threads.map(t => (
            <button
              key={t.userId}
              onClick={() => setSelectedUserId(t.userId)}
              style={{
                width: '100%', textAlign: 'left', padding: '14px 18px',
                background: selectedUserId === t.userId ? '#EFF6FF' : 'transparent',
                border: 'none', borderBottom: '1px solid #F7F7F7',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{
                  fontSize: 13, fontWeight: 800,
                  color: selectedUserId === t.userId ? '#0066FF' : '#111827',
                }}>
                  {displayName(t)}
                </span>
                <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                  {formatTime(t.lastTime)}
                </span>
              </div>
              <p style={{
                fontSize: 12, color: '#6B7280', margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {t.lastMessage}
              </p>
              <span style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, display: 'block' }}>
                메시지 {t.messages.length}개
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 오른쪽: 메시지 창 */}
      <div style={{
        flex: 1, background: '#fff', borderRadius: 16, border: '1px solid #E8EAF0',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {!selectedThread ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 40 }}>💬</div>
            <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>왼쪽에서 유저를 선택하세요</p>
          </div>
        ) : (
          <>
            {/* 헤더 */}
            <div style={{ padding: '14px 20px', background: '#0066FF', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#fff',
              }}>
                {displayName(selectedThread).charAt(0)}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>
                  {displayName(selectedThread)}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  {selectedThread.profile?.phone || selectedThread.profile?.email || selectedThread.userId}
                </p>
              </div>
            </div>

            {/* 메시지 */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '14px 16px',
              background: '#F4F6F9', display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {selectedThread.messages.map(m => {
                const isAdmin = m.is_admin
                return (
                  <div key={m.id} style={{
                    display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end', gap: 6,
                  }}>
                    {!isAdmin && (
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: '#E5E7EB', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 12, marginBottom: 2,
                      }}>👤</div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', gap: 2 }}>
                      <div style={{
                        maxWidth: 320, padding: '10px 14px', borderRadius: 16,
                        background: isAdmin ? '#0066FF' : '#fff',
                        color: isAdmin ? '#fff' : '#111827',
                        border: isAdmin ? 'none' : '1px solid #E8EAF0',
                        fontSize: 14, lineHeight: 1.5,
                        borderBottomRightRadius: isAdmin ? 4 : 16,
                        borderBottomLeftRadius: isAdmin ? 16 : 4,
                      }}>
                        {m.message}
                      </div>
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>{formatTime(m.created_at)}</span>
                    </div>
                    {isAdmin && (
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: '#0066FF', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 12, marginBottom: 2,
                      }}>🎧</div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 답장 입력 */}
            <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #E8EAF0', display: 'flex', gap: 10 }}>
              <input
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="답장을 입력하세요..."
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: 10,
                  border: '1.5px solid #E8EAF0', fontSize: 14, outline: 'none',
                  fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!reply.trim() || sending}
                style={{
                  padding: '11px 20px', borderRadius: 10, border: 'none',
                  background: reply.trim() ? '#0066FF' : '#E5E7EB',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: reply.trim() ? 'pointer' : 'default',
                }}
              >
                {sending ? '전송 중...' : '전송'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
