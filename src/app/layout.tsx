import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '에프텀 AFTERM | 디지털 유산 행정 대행',
  description: '고인의 디지털 구독·계정 해지를 에프텀이 대신 처리해드립니다. 사망진단서 한 장으로 모든 행정을 해결하세요.',
  keywords: ['디지털유산', '구독해지대행', '사망후처리', '디지털추모', '에프텀', '유가족'],
  authors: [{ name: '에프텀 AFTERM' }],
  metadataBase: new URL('https://afterm.vercel.app'),
  openGraph: {
    title: '에프텀 AFTERM | 디지털 유산 행정 대행',
    description: '고인의 디지털 구독·계정 해지를 에프텀이 대신 처리해드립니다.',
    locale: 'ko_KR',
    type: 'website',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
}

// viewport는 별도 export로 분리 (Next.js 15+ 요구사항)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard — preload로 빠르게, display=swap으로 블로킹 방지 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net/gh" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          media="print"
          onLoad="this.media='all'"
        />
        {/* Nanum Pen Script — 서명 폰트, 비차단 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap"
          rel="stylesheet"
          media="print"
          onLoad="this.media='all'"
        />
        {/* 폰트 로드 전 fallback: 시스템 폰트 즉시 표시 */}
        <style>{`body { font-family: -apple-system, "Apple SD Gothic Neo", sans-serif; }`}</style>
        {/* 카카오 주소 검색 */}
        <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" async />
      </head>
      <body>
        <div className="mobile-container">
          {children}
        </div>
      </body>
    </html>
  )
}
