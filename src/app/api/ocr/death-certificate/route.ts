import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: '이미지 없음' }, { status: 400 })

    const invokeUrl = process.env.CLOVA_OCR_INVOKE_URL
    const secret = process.env.CLOVA_OCR_SECRET
    if (!invokeUrl || !secret) return NextResponse.json({ error: 'OCR 설정 오류' }, { status: 500 })

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
      return NextResponse.json({ error: `CLOVA 오류: ${txt}` }, { status: 500 })
    }

    const ocrData = await ocrRes.json()
    const fields: { name: string; inferText: string }[] = ocrData.images?.[0]?.fields ?? []

    // 사망진단서에서 성명, 사망 연월일 추출
    let name = ''
    let deathDate = ''

    for (let i = 0; i < fields.length; i++) {
      const text = fields[i].inferText.trim()
      const nextText = fields[i + 1]?.inferText?.trim() ?? ''

      // 성명 패턴 — "성명", "사망자" 다음 줄의 한글 이름
      if ((text === '성명' || text === '사망자' || text.includes('성명')) && !name) {
        if (/^[가-힣]{2,5}$/.test(nextText)) name = nextText
      }

      // 사망 연월일 패턴
      if ((text.includes('사망') && text.includes('일')) || text === '사망연월일') {
        // 다음 몇 개 필드에서 날짜 형태 찾기
        for (let j = i + 1; j <= i + 5 && j < fields.length; j++) {
          const t = fields[j].inferText.trim()
          // YYYY년 MM월 DD일 또는 YYYY-MM-DD
          const m1 = t.match(/(\d{4})[^\d](\d{1,2})[^\d](\d{1,2})/)
          if (m1) {
            deathDate = `${m1[1]}-${m1[2].padStart(2, '0')}-${m1[3].padStart(2, '0')}`
            break
          }
        }
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
