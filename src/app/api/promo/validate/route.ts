import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { code, caseId } = await req.json()
  if (!code) return NextResponse.json({ valid: false, reason: '코드를 입력해주세요' })

  const admin = createAdminClient()
  const { data: promo } = await admin
    .from('promo_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (!promo) return NextResponse.json({ valid: false, reason: '존재하지 않는 코드입니다' })
  if (!promo.is_active) return NextResponse.json({ valid: false, reason: '사용 불가능한 코드입니다' })
  if (promo.expires_at && new Date(promo.expires_at) < new Date())
    return NextResponse.json({ valid: false, reason: '만료된 코드입니다' })
  if (promo.used_count >= promo.max_uses)
    return NextResponse.json({ valid: false, reason: '이미 사용된 코드입니다' })

  // 동일 케이스에 이미 사용됐는지
  if (caseId) {
    const { data: used } = await admin
      .from('promo_code_uses')
      .select('id')
      .eq('case_id', caseId)
      .limit(1)
      .single()
    if (used) return NextResponse.json({ valid: false, reason: '이미 이 신청에 사용된 코드입니다' })
  }

  return NextResponse.json({ valid: true, description: promo.description })
}
