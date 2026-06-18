'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  message: string
  created_at: string
  is_admin: boolean
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const fetchNotifications = async () => {
    const res = await fetch('/api/chat')
    if (!res.ok) return
    const msgs: Notification[] = await res.json()
    // 어드민이 보낸 메시지만 알림으로 표시
    const adminMsgs = msgs.filter(m => m.is_admin).reverse()
    setNotifications(adminMsgs)
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Realtime 구독 — 새 어드민 메시지 오면 unread++
  useEffect(() => {
    const channel = supabase
      .channel('notif_bell')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        (payload) => {
          const msg = payload.new as Notification
          if (msg.is_admin) {
            setNotifications(prev => [msg, ...prev])
            if (!open) setUnread(n => n + 1)
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [open])

  // 패널 열 때 unread 초기화
  const handleOpen = () => {
    setOpen(v => !v)
    setUnread(0)
  }

  // 바깥 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        style={{
          background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0, position: 'relative',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 8, height: 8, borderRadius: '50%',
            background: '#EF4444', border: '1.5px solid #0066FF',
          }} />
        )}
      </button>

      {/* 알림 드롭다운 */}
      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0,
          width: 300, maxHeight: 380,
          background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid #E8EAF0',
          overflow: 'hidden', zIndex: 400,
        }}>
          <div style={{
            padding: '14px 16px', background: '#0066FF',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>🔔 알림</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>처리 현황 업데이트</span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 320 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>아직 알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div key={n.id} style={{
                  padding: '12px 16px',
                  borderBottom: i < notifications.length - 1 ? '1px solid #F3F4F6' : 'none',
                  background: '#fff',
                }}>
                  <p style={{ fontSize: 13, color: '#111827', margin: '0 0 4px', lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                    {formatTime(n.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
