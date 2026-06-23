import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGuide, GUIDES } from '@/lib/guide-data'

export function generateStaticParams() {
  return GUIDES.map(g => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug)
  if (!guide) return {}
  return { title: `${guide.title} | 에프텀 가이드`, description: guide.summary }
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug)
  if (!guide) notFound()

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8f9fb' }}>
      {/* 헤더 */}
      <div style={{ background: guide.accent, padding: '20px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <Link href="/home" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14, marginBottom: 20 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          홈으로
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>{guide.emoji}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 100 }}>{guide.category}</span>
        </div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.03em' }}>{guide.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>{guide.subtitle}</p>
      </div>

      <div style={{ padding: '20px 20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 요약 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '20px', border: '1px solid #E8EAF0' }}>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, margin: 0 }}>{guide.summary}</p>
        </div>

        {/* 주의사항 */}
        {guide.warning && (
          <div style={{ background: '#FFF7ED', borderRadius: 16, padding: '16px 18px', border: '1px solid #FED7AA', display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.7, margin: 0 }}>{guide.warning}</p>
          </div>
        )}

        {/* 팁 */}
        {guide.tip && (
          <div style={{ background: '#F0FDF4', borderRadius: 16, padding: '16px 18px', border: '1px solid #BBF7D0', display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: 13, color: '#14532D', lineHeight: 1.7, margin: 0 }}>{guide.tip}</p>
          </div>
        )}

        {/* 단계별 절차 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '20px', border: '1px solid #E8EAF0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>📋 단계별 절차</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {guide.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < guide.steps.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: guide.accent, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i + 1}
                  </div>
                  {i < guide.steps.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: '#E5E7EB', margin: '4px 0' }} />
                  )}
                </div>
                <div style={{ paddingBottom: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '4px 0 4px' }}>{step.title}</p>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 추가 섹션들 */}
        {guide.sections.map((section, si) => (
          <div key={si} style={{ background: '#fff', borderRadius: 20, padding: '20px', border: '1px solid #E8EAF0' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>{section.heading}</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.items.map((item, ii) => (
                <li key={ii} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: guide.accent, flexShrink: 0, marginTop: 6 }} />
                  <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* 관련 링크 */}
        {guide.links.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '20px', border: '1px solid #E8EAF0' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>🔗 관련 공식 사이트</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {guide.links.map((link, li) => (
                <a
                  key={li}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB', textDecoration: 'none', gap: 8 }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1 }}>{link.label}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 에프텀 대행 CTA */}
        <div style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)', borderRadius: 20, padding: '22px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '0 0 4px' }}>이 모든 과정을 직접 하기 어려우신가요?</p>
          <p style={{ color: '#fff', fontSize: 17, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>에프텀이 대신 처리해 드립니다</p>
          <Link
            href="/apply"
            style={{ display: 'inline-block', background: '#fff', color: '#1E40AF', fontSize: 14, fontWeight: 800, padding: '12px 28px', borderRadius: 100, textDecoration: 'none' }}
          >
            신청하기
          </Link>
        </div>
      </div>
    </div>
  )
}
