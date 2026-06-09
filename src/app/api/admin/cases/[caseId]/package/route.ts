import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import JSZip from 'jszip'

// POST /api/admin/cases/[caseId]/package
// 케이스의 모든 서류와 AI 신청서 초안을 ZIP으로 묶어 반환합니다.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params

  // 어드민 인증
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (session?.value !== 'authorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const adminClient = createAdminClient()

    // 케이스 전체 데이터 조회
    const { data: caseData, error } = await adminClient
      .from('cases')
      .select(`*, case_services(*), delegations(*), case_documents(*)`)
      .eq('id', caseId)
      .single()

    if (error || !caseData) {
      return NextResponse.json({ error: '케이스를 찾을 수 없습니다.' }, { status: 404 })
    }

    const zip = new JSZip()
    const caseNo = `CASE-${caseId.slice(0, 8).toUpperCase()}`
    const deceasedName = caseData.deceased_name || '고인'
    const delegatorName = caseData.delegations?.[0]?.delegator_name || '신청인'
    const delegatorRelation = caseData.delegations?.[0]?.delegator_relation || '관계'

    // ── 폴더 1: 첨부 서류 ──
    const docsFolder = zip.folder('01_첨부서류')!
    const docTypeLabel: Record<string, string> = {
      death_cert: '사망진단서',
      family_cert: '가족관계증명서',
      id_card: '신분증',
    }

    for (const doc of caseData.case_documents || []) {
      try {
        // Supabase Storage에서 파일 다운로드
        const { data: fileData, error: fileError } = await adminClient.storage
          .from('case-documents')
          .download(doc.storage_path)

        if (!fileError && fileData) {
          const label = docTypeLabel[doc.doc_type] || doc.doc_type
          const ext = doc.file_name?.split('.').pop() || 'jpg'
          const fileName = `${label}.${ext}`
          const arrayBuffer = await fileData.arrayBuffer()
          docsFolder.file(fileName, arrayBuffer)
        }
      } catch (e) {
        console.error(`[package] 서류 다운로드 실패: ${doc.storage_path}`, e)
      }
    }

    // 위임장 서명 추가
    const signatureData = caseData.delegations?.[0]?.signature_data
    if (signatureData) {
      // base64 데이터 URI 포맷 지원 (data:image/png;base64,...)
      const base64Content = signatureData.split(',')[1] || signatureData
      docsFolder.file('위임장_전자서명.png', base64Content, { base64: true })
    }

    // ── 폴더 2: 신청서 초안 ──
    const draftsFolder = zip.folder('02_신청서_초안')!
    const services = caseData.case_services || []

    // AI 초안 가져오기
    const { data: drafts } = await adminClient.from('case_drafts').select('*').eq('case_id', caseId)

    if (drafts && drafts.length > 0) {
      // AI가 작성한 초안 사용
      for (const draft of drafts) {
        const platformLabel = draft.platform.toUpperCase()
        let draftText = `[${platformLabel} 신청서 초안 (AI 작성)]\n━━━━━━━━━━━━━━━━━━━━━━━━\n`
        
        if (draft.content.submit_url) draftText += `신청 URL: ${draft.content.submit_url}\n\n`
        
        if (draft.content.form_fields && Object.keys(draft.content.form_fields).length > 0) {
          draftText += `■ 양식 입력값\n`
          for (const [key, val] of Object.entries(draft.content.form_fields)) {
            draftText += `- ${key}: ${val}\n`
          }
          draftText += '\n'
        }

        if (draft.content.email_body) {
          draftText += `■ 요청서 본문 (복사 후 붙여넣기)\n──────────────────────────────\n${draft.content.email_body}\n──────────────────────────────\n\n`
        }

        if (draft.content.notes) draftText += `📌 어드민 참고: ${draft.content.notes}\n`

        draftsFolder.file(`${platformLabel}_신청서.txt`, draftText)
      }
    } else {
      // AI 초안이 아직 없는 경우 기존 로직 사용 (Fallback)
      const SERVICE_PLATFORM_MAP: Record<string, string> = {
        facebook: 'Facebook', instagram: 'Instagram', kakaotalk: '카카오톡', google: 'Google', twitter: 'Twitter(X)',
      }
      for (const svc of services) {
        const platform = svc.service_category?.toLowerCase() || svc.service_name?.toLowerCase() || ''
        const draft = generateDraft(platform, svc, caseData, delegatorName, delegatorRelation)
        if (draft) {
          const platformLabel = SERVICE_PLATFORM_MAP[platform] || svc.service_name || platform
          draftsFolder.file(`${platformLabel}_신청서.txt`, draft)
        }
      }
    }

    // ── 파일 3: 케이스 요약 ──
    const summary = generateCaseSummary(caseData, delegatorName, delegatorRelation, caseNo)
    zip.file('00_케이스_요약.txt', summary)

    // ZIP 생성
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(`${caseNo}_${deceasedName}님_패키지`)}.zip"`,
        'Content-Length': String(zipBuffer.length),
      },
    })

  } catch (err: any) {
    console.error('[package] ZIP 생성 오류:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── 케이스 요약 텍스트 생성 ──
function generateCaseSummary(caseData: any, delegatorName: string, delegatorRelation: string, caseNo: string): string {
  const services = caseData.case_services || []
  const docs = caseData.case_documents || []

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
케이스 번호: ${caseNo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ 신청인 (유족) 정보
  - 성명: ${delegatorName}
  - 고인과의 관계: ${delegatorRelation}

■ 고인 정보
  - 성명: ${caseData.deceased_name}
  - 생년월일: ${caseData.deceased_birth || '미기재'}
  - 사망일: ${caseData.deceased_death || '미기재'}
  - 전화번호: ${caseData.deceased_phone || '미기재'}

■ 접수 정보
  - 접수일시: ${new Date(caseData.created_at).toLocaleString('ko-KR')}
  - 케이스 상태: ${caseData.status}

■ 신청 서비스 목록 (${services.length}개)
${services.map((s: any, i: number) => `  ${i + 1}. ${s.service_name} (${s.service_category}) — ${s.dispatch_type || '미지정'}`).join('\n')}

■ 첨부 서류 현황 (${docs.length}/3종)
${docs.map((d: any) => `  ✅ ${d.doc_type === 'death_cert' ? '사망진단서' : d.doc_type === 'family_cert' ? '가족관계증명서' : '신분증'}`).join('\n')}
${3 - docs.length > 0 ? Array(3 - docs.length).fill('  ❌ 미제출').join('\n') : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
생성일시: ${new Date().toLocaleString('ko-KR')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
}

// ── 서비스별 신청서 초안 생성 ──
function generateDraft(platform: string, svc: any, caseData: any, delegatorName: string, delegatorRelation: string): string | null {
  const deceased = caseData.deceased_name
  const deceasedBirth = caseData.deceased_birth || '____-__-__'
  const deceasedDeath = caseData.deceased_death || '____-__-__'
  const accountId = svc.contact_info || svc.account_id || '계정정보 미기재'

  if (platform.includes('facebook') || platform.includes('페이스북')) {
    return `[Facebook 신청서]
━━━━━━━━━━━━━━━━━━━━━━━━
처리 방식: ${svc.dispatch_type === 'memorialize' ? '추모 계정 전환' : '계정 삭제'}
신청 URL: ${svc.dispatch_type === 'memorialize'
  ? 'https://www.facebook.com/special/contact/deceased'
  : 'https://www.facebook.com/help/contact/228813257197480'}

■ 양식 입력값
- Deceased's full name: ${deceased}
- Facebook profile URL: ${accountId}
- Your full name: ${delegatorName}
- Your relationship: ${delegatorRelation}
- Date of passing: ${deceasedDeath}

■ 첨부 파일: 01_첨부서류 폴더의 사망진단서, 신분증, 가족관계증명서 3종 첨부`
  }

  if (platform.includes('instagram') || platform.includes('인스타그램')) {
    return `[Instagram 신청서]
━━━━━━━━━━━━━━━━━━━━━━━━
처리 방식: ${svc.dispatch_type === 'memorialize' ? '추모 계정 전환' : '계정 삭제'}
신청 URL: ${svc.dispatch_type === 'memorialize'
  ? 'https://help.instagram.com/contact/452224988254813'
  : 'https://help.instagram.com/contact/1474899482730688'}

■ 양식 입력값
- Deceased's Instagram username: ${accountId}
- Your full name: ${delegatorName}
- Your relationship: ${delegatorRelation}

■ 첨부 파일: 01_첨부서류 폴더의 3종 첨부
⚠️ 주의: Meta 심사 중 추가 서류 요청 가능성 있음`
  }

  if (platform.includes('kakao') || platform.includes('카카오')) {
    return `[카카오톡 요청서]
━━━━━━━━━━━━━━━━━━━━━━━━
처리 방식: ${svc.dispatch_type === 'memorialize' ? '추모 계정 전환' : '계정 해지'}
신청 방법: cs.kakao.com → 1:1 문의

■ 요청서 본문 (복사 후 붙여넣기)
──────────────────────────────
안녕하세요.
저는 고인 ${deceased}(생년월일: ${deceasedBirth})의
${delegatorRelation} ${delegatorName}입니다.
고인의 카카오 계정(등록 전화번호: ${accountId})에 대해
${svc.dispatch_type === 'memorialize' ? '추모 계정 전환' : '계정 해지'}을 요청드립니다.

첨부 서류:
1. 사망진단서
2. 가족관계증명서
3. 신청인 신분증 사본
──────────────────────────────

■ 첨부 파일: 01_첨부서류 폴더의 3종 첨부`
  }

  if (platform.includes('google') || platform.includes('구글')) {
    return `[Google 신청서]
━━━━━━━━━━━━━━━━━━━━━━━━
처리 방식: 계정 삭제
신청 URL: https://support.google.com/accounts/troubleshooter/6357590

■ 양식 입력값
- Deceased person's Gmail address: ${accountId}
- Your name: ${delegatorName}
- Your relationship to the deceased: ${delegatorRelation}
- Country: South Korea

■ 첨부 파일: 01_첨부서류 폴더의 3종 첨부
📌 참고: Google 검토 기간 2~6주 소요될 수 있음`
  }

  if (platform.includes('twitter') || platform.includes('x') || platform.includes('트위터')) {
    return `[Twitter/X 이메일 초안]
━━━━━━━━━━━━━━━━━━━━━━━━
수신: privacy@x.com
제목: Request for Account Deactivation of Deceased User - ${accountId}

■ 이메일 본문 (복사 후 붙여넣기)
──────────────────────────────
Dear X Privacy Team,

I am writing to request the deactivation and removal of the
following account belonging to my deceased ${delegatorRelation}.

Account Information:
- Username: ${accountId}
- Account holder's name: ${deceased}
- Date of passing: ${deceasedDeath}

Requester Information:
- Name: ${delegatorName}
- Relationship to deceased: ${delegatorRelation}

I have attached the following documents:
1. Death Certificate
2. Government-issued ID of the requester
3. Family Relationship Certificate (Korean official document)

Please process this request at your earliest convenience.

Sincerely,
${delegatorName}
──────────────────────────────

■ 첨부 파일: 01_첨부서류 폴더의 3종 첨부`
  }

  return null
}
