'use client'

interface ServiceLogoProps {
  serviceId: string
  name: string
  size?: number
  radius?: number
}

const COLORS: Record<string, string> = {
  skt: '#FF0000', kt: '#00C3C9', lgu: '#E6007E',
  netflix: '#E50914', youtube: '#FF0000', instagram: '#E1306C',
  naver: '#03C75A', kakao: '#FEE500', facebook: '#1877F2',
  default: 'var(--color-coolNeutral-86)'
}

export default function ServiceLogo({ serviceId, name, size = 40, radius = 10 }: ServiceLogoProps) {
  const bgColor = COLORS[serviceId] || COLORS.default
  // Extract initial, if 'kakao' then 'K'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: bgColor === '#FEE500' ? '#000' : '#fff',
      fontSize: size * 0.45,
      fontWeight: 800,
      flexShrink: 0,
      boxShadow: 'var(--shadow-sm)',
      fontFamily: 'var(--font-display)'
    }}>
      {initial}
    </div>
  )
}
