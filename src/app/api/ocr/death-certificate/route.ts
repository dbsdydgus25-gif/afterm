import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: '이미지 없음' }, { status: 400 })

    let invokeUrl = process.env.CLOVA_OCR_INVOKE_URL
    const secret = process.env.CLOVA_OCR_SECRET
    if (!invokeUrl || !secret) return NextResponse.json({ error: 'OCR 설정 오류' }, { status: 500 })

    // Vercel은 HTTP 외부 호출 차단 — https로 강제
    invokeUrl = invokeUrl.replace(/^http:\/\//, 'https://')

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const mime = file.type || ''
    let ext: string
    if (mime.includes('pdf') || file.name?.toLowerCase().endsWith('.pdf')) ext = 'pdf'
    else if (mime.includes('png')) ext = 'png'
    else if (mime.includes('tiff') || mime.includes('tif')) ext = 'tiff'
    else ext = 'jpg'

    const ocrBody = {
      version: 'V2',
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      images: [{ format: ext, name: 'death-cert', data: base64 }],
    }

    const ocrRes = await fetch(invokeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-OCR-SECRET': secret },
      body: JSON.stringify(ocrBody),
    })

    if (!ocrRes.ok) {
      const txt = await ocrRes.text()
      console.error('[OCR] CLOVA 응답 오류', ocrRes.status, txt)
      return NextResponse.json({ error: `CLOVA 오류 ${ocrRes.status}: ${txt}` }, { status: 500 })
    }

    const ocrData = await ocrRes.json()
    const fields: { name: string; inferText: string }[] = ocrData.images?.[0]?.fields ?? []

    // 전체 텍스트 (디버그용)
    const allText = fields.map(f => f.inferText).join(' ')
    console.log('[OCR] 전체 텍스트:', allText)

    let name = ''
    let deathDate = ''

    // ── 이름 추출 ──────────────────────────────────────────
    // 1) 같은 필드 안에 레이블+이름이 있는 경우 (예: "성명 홍길동")
    for (const f of fields) {
      if (name) break
      const m = f.inferText.match(/(?:성\s*명|사망자\s*성명|망\s*인|이\s*름)[:\s]+([가-힣]{2,5})/)
      if (m) { name = m[1]; break }
    }

    // 2) 레이블 다음 필드에 이름이 있는 경우
    if (!name) {
      for (let i = 0; i < fields.length; i++) {
        const text = fields[i].inferText.trim().replace(/\s/g, '')
        const isNameLabel = ['성명', '사망자성명', '망인', '이름', '사망자'].includes(text)
          || text.includes('성명') || text.includes('사망자')
        if (isNameLabel) {
          for (let j = i + 1; j <= i + 4 && j < fields.length; j++) {
            const candidate = fields[j].inferText.trim()
            if (/^[가-힣]{2,5}$/.test(candidate)) { name = candidate; break }
          }
        }
        if (name) break
      }
    }

    // 3) fallback: 전체 텍스트에서 패턴 매칭
    if (!name) {
      const m = allText.match(/(?:성\s*명|사망자|망\s*인)[:\s]*([가-힣]{2,5})/)
      if (m) name = m[1]
    }

    // ── 사망 연월일 추출 ───────────────────────────────────
    for (let i = 0; i < fields.length; i++) {
      const text = fields[i].inferText.trim()
      const isDeathLabel = (text.includes('사망') && (text.includes('일') || text.includes('연월'))) || text === '사망연월일'
      if (isDeathLabel) {
        for (let j = i + 1; j <= i + 5 && j < fields.length; j++) {
          const t = fields[j].inferText.trim()
          const m1 = t.match(/(\d{4})[^\d](\d{1,2})[^\d](\d{1,2})/)
          if (m1) {
            deathDate = `${m1[1]}-${m1[2].padStart(2, '0')}-${m1[3].padStart(2, '0')}`
            break
          }
        }
      }
      if (deathDate) break
    }

      // 연-월-일 숫자 직접 패턴
      if (!deathDate) {
        const m2 = text.match(/^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})$/)
        if (m2) {
          deathDate = `${m2[1]}-${m2[2].padStart(2, '0')}-${m2[3].padStart(2, '0')}`
        }
      }
    }

    // 생년월일 추출
    let birthDate = ''
    for (let i = 0; i < fields.length; i++) {
      const text = fields[i].inferText.trim()
      if (text.includes('생년') || text === '생년월일' || text.includes('주민')) {
        for (let j = i + 1; j <= i + 5 && j < fields.length; j++) {
          const t = fields[j].inferText.trim()
          const m = t.match(/(\d{4})[^\d](\d{1,2})[^\d](\d{1,2})/)
          if (m) {
            birthDate = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
            break
          }
          // 주민번호 앞 6자리 → 19XX 또는 20XX
          const rrn = t.match(/^(\d{2})(\d{2})(\d{2})/)
          if (rrn) {
            const yy = parseInt(rrn[1])
            const yyyy = yy >= 0 && yy <= 24 ? `20${rrn[1]}` : `19${rrn[1]}`
            birthDate = `${yyyy}-${rrn[2]}-${rrn[3]}`
            break
          }
        }
      }
    }

    // 전체 텍스트 fallback
    if (!name || !deathDate) {
      const allText = fields.map(f => f.inferText).join(' ')
      if (!name) {
        const nameMatch = allText.match(/성명\s*([가-힣]{2,5})/)
        if (nameMatch) name = nameMatch[1]
      }
      if (!deathDate) {
        const dates = [...allText.matchAll(/(\d{4})[년.\-]?\s*(\d{1,2})[월.\-]?\s*(\d{1,2})/g)]
        if (dates.length >= 1) deathDate = `${dates[0][1]}-${dates[0][2].padStart(2,'0')}-${dates[0][3].padStart(2,'0')}`
        if (!birthDate && dates.length >= 2) birthDate = `${dates[1][1]}-${dates[1][2].padStart(2,'0')}-${dates[1][3].padStart(2,'0')}`
      }
    }

    return NextResponse.json({ name, deathDate, birthDate, success: true })
  } catch (e) {
    console.error('[OCR] error', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
