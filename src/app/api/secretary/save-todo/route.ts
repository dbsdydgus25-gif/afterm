// 김비서 — 오늘 할일 저장 (내일 모닝브리핑에 사용)
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { content, type = 'tomorrow_todo' } = await req.json()
  if (!content) return NextResponse.json({ error: 'content 필요' }, { status: 400 })

  const adminClient = createAdminClient()
  await adminClient.from('secretary_notes').insert({ type, content, created_at: new Date().toISOString() })

  return NextResponse.json({ ok: true })
}
