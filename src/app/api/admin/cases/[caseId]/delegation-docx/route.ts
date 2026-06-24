// GET /api/admin/cases/[caseId]/delegation-docx
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import JSZip from 'jszip'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (session?.value !== 'authorized') {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  const { caseId } = await params
  const adminClient = createAdminClient()

  const { data: caseData } = await adminClient
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single()

  if (!caseData) return NextResponse.json({ error: '케이스 없음' }, { status: 404 })

  const { data: delegation } = await adminClient
    .from('delegations')
    .select('*')
    .eq('case_id', caseId)
    .single()

  const d = delegation || {}

  const templatePath = path.join(process.cwd(), 'public', 'templates', '위임장_에프텀.docx')
  if (!fs.existsSync(templatePath)) {
    return NextResponse.json({ error: '위임장 템플릿 없음' }, { status: 500 })
  }

  const templateBytes = fs.readFileSync(templatePath)
  const zip = await JSZip.loadAsync(templateBytes)

  const docXml = await zip.file('word/document.xml')!.async('string')

  const today = new Date()
  const yyyy = String(today.getFullYear())
  const mm = String(today.getMonth() + 1)
  const dd = String(today.getDate())

  const deceasedName   = caseData.deceased_name || ''
  const deceasedBirth  = caseData.deceased_birth ? String(caseData.deceased_birth).slice(0, 10) : ''
  const deceasedDeath  = caseData.deceased_death ? String(caseData.deceased_death).slice(0, 10) : ''
  const deceasedPhone  = caseData.deceased_phone || ''
  const delegatorName  = (d as any).delegator_name || ''
  const delegatorRel   = (d as any).delegator_relation || ''
  const delegatorPhone = (d as any).delegator_phone || ''
  const delegatorAddr  = (d as any).delegator_address || ''

  // 빈 셀 순서: 위임인성명, 위임인생년월일, 위임인주소, 위임인연락처, 고인과의관계,
  //            고인성명, 고인생년월일, 고인사망일, 고인연락처
  const values = [
    delegatorName,
    '-',           // 위임인 생년월일 (미수집)
    delegatorAddr,
    delegatorPhone,
    delegatorRel,
    deceasedName,
    deceasedBirth,
    deceasedDeath,
    deceasedPhone,
  ]

  const EMPTY_CELL = '<w:t xml:space="preserve"></w:t>'
  let filled = docXml
  for (const val of values) {
    filled = filled.replace(EMPTY_CELL, `<w:t xml:space="preserve">${val}</w:t>`)
  }

  // 위임일자 날짜 채우기
  filled = filled.replace(
    /위임일자 :(\s+)년(\s+)월(\s+)일/,
    `위임일자 : ${yyyy}년 ${mm}월 ${dd}일`
  )

  zip.file('word/document.xml', filled)

  const outBytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  const fileName = `위임장_${deceasedName || 'unknown'}_${caseId.slice(0, 8)}.docx`

  return new NextResponse(outBytes, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
