/**
 * 네이버 클라우드 CLOVA OCR API 클라이언트
 * 문서 이미지에서 텍스트를 추출합니다.
 */

interface OCRResult {
  text: string;
  success: boolean;
  error?: string;
}

export async function extractTextFromImage(imageUrl: string, fileExt: string = 'jpg'): Promise<OCRResult> {
  const invokeUrl = process.env.CLOVA_OCR_INVOKE_URL;
  const secretKey = process.env.CLOVA_OCR_SECRET;

  if (!invokeUrl || !secretKey) {
    console.warn('[CLOVA OCR] API 키가 설정되지 않았습니다.');
    return { text: '', success: false, error: 'API Key missing' };
  }

  // Clova OCR은 파일 포맷(확장자)을 필수로 요구합니다.
  let format = fileExt.toLowerCase().replace('.', '');
  if (format === 'jpeg') format = 'jpg';
  
  // 지원하는 포맷: jpg, jpeg, png, pdf, tiff
  if (!['jpg', 'png', 'pdf', 'tiff'].includes(format)) {
    format = 'jpg'; // 기본값 폴백
  }

  const requestId = `req-${Date.now()}`;
  const payload = {
    images: [
      {
        format,
        name: `doc-${Date.now()}`,
        url: imageUrl,
      }
    ],
    requestId,
    version: 'V2',
    timestamp: Date.now(),
  };

  try {
    const res = await fetch(invokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OCR-SECRET': secretKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[CLOVA OCR] API 에러:', errText);
      return { text: '', success: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    
    // OCR 결과 텍스트를 하나의 문자열로 결합
    let extractedText = '';
    if (data.images && data.images[0] && data.images[0].fields) {
      const fields = data.images[0].fields;
      extractedText = fields.map((f: any) => f.inferText).join(' ');
    }

    return {
      text: extractedText.trim(),
      success: true,
    };

  } catch (error: any) {
    console.error('[CLOVA OCR] 통신 에러:', error);
    return { text: '', success: false, error: error.message };
  }
}
