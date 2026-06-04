'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MyInfoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setNewName(data.user?.user_metadata?.full_name || data.user?.user_metadata?.name || '')
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSaveName = async () => {
    setSaving(true)
    await supabase.auth.updateUser({ data: { full_name: newName } })
    setUser((u: any) => ({ ...u, user_metadata: { ...u?.user_metadata, full_name: newName } }))
    setEditMode(false)
    setSaving(false)
    setMsg('이름이 변경되었습니다.')
    setTimeout(() => setMsg(''), 2000)
  }

  const handleDeleteAccount = async () => {
    // 실제 삭제는 서버사이드에서 admin API로 처리 필요
    alert('계정 삭제는 고객센터(카카오톡 채널)를 통해 요청해주세요.')
    setShowDeleteConfirm(false)
  }

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '회원'
  const provider = user?.app_metadata?.provider || 'email'

  const MENU_SECTIONS = [
    {
      title: '서비스 이용',
      items: [
        { label: '신청 내역', icon: '📋', onClick: () => router.push('/home/myinfo/orders') },
        { label: '담당자 채팅', icon: '💬', onClick: () => router.push('/home/chat') },
      ],
    },
    {
      title: '계정 설정',
      items: [
        {
          label: '이름 변경',
          icon: '✏️',
          onClick: () => setEditMode(true),
          value: displayName,
        },
        {
          label: '로그인 방식',
          icon: '🔐',
          value: provider === 'google' ? 'Google' : provider === 'kakao' ? '카카오' : '이메일',
          readonly: true,
        },
      ],
    },
    {
      title: '알림',
      items: [
        { label: '서비스 진행 알림', icon: '🔔', toggle: true },
        { label: '마케팅 정보 수신', icon: '📣', toggle: true },
      ],
    },
    {
      title: '고객지원',
      items: [
        { label: '자주 묻는 질문', icon: '❓', onClick: () => {} },
        { label: '이용약관', icon: '📜', onClick: () => {} },
        { label: '개인정보처리방침', icon: '🔒', onClick: () => {} },
      ],
    },
  ]

  if (loading) return null

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
      {/* 프로필 헤더 */}
      <div style={{ background: '#fff', padding: '24px 24px 20px', borderBottom: '8px solid #f8f9fb' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 20px' }}>내정보</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#163272',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#fff', fontWeight: 800, flexShrink: 0,
          }}>
            {displayName.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: '0 0 3px' }}>
              {displayName}님
            </p>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{user?.email || user?.phone}</p>
          </div>
        </div>
      </div>

      {/* 이름 편집 모달 */}
      {editMode && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
        }}
          onClick={() => setEditMode(false)}
        >
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '28px 24px 48px', width: '100%', maxWidth: 480 }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: '0 0 20px' }}>이름 변경</h3>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="이름을 입력해주세요"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                border: '2px solid #163272', fontSize: 16, outline: 'none', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleSaveName}
              disabled={saving || !newName.trim()}
              style={{
                width: '100%', marginTop: 16, padding: '16px', background: '#163272',
                border: 'none', borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      {msg && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#111', color: '#fff', padding: '12px 20px', borderRadius: 100,
          fontSize: 14, fontWeight: 600, zIndex: 300, whiteSpace: 'nowrap',
        }}>{msg}</div>
      )}

      {/* 메뉴 섹션들 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
        {MENU_SECTIONS.map(section => (
          <div key={section.title} style={{ background: '#fff', padding: '4px 0' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#aaa', padding: '14px 24px 8px', margin: 0, letterSpacing: '0.05em' }}>
              {section.title.toUpperCase()}
            </p>
            {section.items.map((item: any) => (
              <button
                key={item.label}
                onClick={item.onClick}
                disabled={item.readonly}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: item.readonly ? 'default' : 'pointer',
                  padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#111' }}>{item.label}</span>
                {item.value && (
                  <span style={{ fontSize: 13, color: '#999' }}>{item.value}</span>
                )}
                {item.toggle && (
                  <div style={{ width: 44, height: 24, borderRadius: 12, background: '#e0e0e0', position: 'relative' }}>
                    <div style={{ width: 20, height: 20, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                )}
                {!item.toggle && !item.readonly && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        ))}

        {/* 로그아웃 / 탈퇴 */}
        <div style={{ background: '#fff', padding: '4px 0 16px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 20 }}>🚪</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>로그아웃</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 20 }}>🗑️</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#ef4444' }}>회원 탈퇴</span>
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#ccc', padding: '8px 0 16px' }}>
          AFTERM v1.0 · afterm.co.kr
        </p>
      </div>

      {/* 탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24,
        }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 360 }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: '0 0 10px' }}>정말 탈퇴하시겠어요?</h3>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: '0 0 24px' }}>
              탈퇴하면 모든 신청 내역과<br />데이터가 삭제됩니다.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{
                flex: 1, padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#555',
              }}>취소</button>
              <button onClick={handleDeleteAccount} style={{
                flex: 1, padding: '14px', background: '#ef4444', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#fff',
              }}>탈퇴하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
