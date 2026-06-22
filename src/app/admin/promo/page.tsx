export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function PromoPage() {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_session')?.value !== 'authorized') redirect('/admin-login')

  const admin = createAdminClient()

  const { data: codes } = await admin
    .from('promo_codes')
    .select('*, promo_code_uses(case_id, used_at)')
    .order('code', { ascending: true })

  const total = codes?.length || 0
  const used = codes?.filter(c => c.used_count > 0).length || 0
  const remaining = total - used

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0 }}>베타 초대 코드 관리</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>AFTERM001 ~ AFTERM050 — 베타 테스터 무료 이용권</p>
      </div>

      {/* 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: '전체 코드', value: `${total}개`, color: '#2563EB' },
          { label: '사용됨', value: `${used}개`, color: '#DC2626' },
          { label: '남은 코드', value: `${remaining}개`, color: '#059669' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e5e9ef' }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 코드 목록 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e9ef', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0 }}>전체 코드 목록</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['코드', '상태', '사용일시', '케이스 ID', '만료일'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#6b7280', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(codes || []).map(c => {
                const use = c.promo_code_uses?.[0]
                const isUsed = c.used_count > 0
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <code style={{ fontSize: 13, fontWeight: 800, color: '#111', background: '#f3f4f6', padding: '2px 8px', borderRadius: 6 }}>
                        {c.code}
                      </code>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100,
                        background: isUsed ? '#FEF2F2' : '#ECFDF5',
                        color: isUsed ? '#DC2626' : '#059669',
                      }}>
                        {isUsed ? '사용됨' : '미사용'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280' }}>
                      {use?.used_at ? new Date(use.used_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '-'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
                      {use?.case_id ? use.case_id.slice(0, 8) + '...' : '-'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280' }}>
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString('ko-KR') : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 배포용 코드 목록 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e9ef', padding: '20px 24px', marginTop: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '0 0 12px' }}>미사용 코드 목록 (복사용)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(codes || []).filter(c => c.used_count === 0).map(c => (
            <code key={c.id} style={{
              fontSize: 12, fontWeight: 700, color: '#059669',
              background: '#ECFDF5', padding: '4px 10px', borderRadius: 6, border: '1px solid #6EE7B7',
            }}>
              {c.code}
            </code>
          ))}
        </div>
      </div>
    </div>
  )
}
