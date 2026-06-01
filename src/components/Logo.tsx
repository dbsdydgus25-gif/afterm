'use client'

// 공통 로고 컴포넌트
// - mix-blend-mode: multiply → 흰 배경 제거 효과
// - Link로 감싸서 홈으로 이동
// - dark 모드 (어두운 배경)에서는 invert 처리

import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  dark?: boolean   // 어두운 배경에 올라갈 때 true
  width?: number
  height?: number
}

export default function Logo({ dark = false, width = 100, height = 30 }: LogoProps) {
  return (
    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
      <Image
        src="/logo.jpg"
        alt="AFTERM"
        width={width}
        height={height}
        style={{
          objectFit: 'contain',
          objectPosition: 'left center',
          // 밝은 배경: multiply로 흰 배경(jpg) 투명화
          // 어두운 배경: brightness(0) invert(1)로 로고를 흰색으로 변환 후 multiply
          mixBlendMode: 'multiply',
          filter: dark ? 'brightness(0) invert(1)' : 'none',
        }}
      />
    </Link>
  )
}
