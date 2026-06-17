import Link from 'next/link'

export default function BusinessInfoPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFB', display:'flex', flexDirection:'column' }}>
      {/* 헤더 */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'16px 24px', display:'flex', alignItems:'center', gap:12 }}>
        <Link href="/" style={{ color:'#374151', textDecoration:'none', fontSize:14, fontWeight:600 }}>← 돌아가기</Link>
      </div>

      {/* 본문 */}
      <div style={{ flex:1, maxWidth:480, margin:'0 auto', width:'100%', padding:'40px 24px' }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:'#111', margin:'0 0 4px', letterSpacing:'-0.02em' }}>사업자등록정보</h1>
        <p style={{ fontSize:13, color:'#9CA3AF', margin:'0 0 32px' }}>통신판매업 사업자 정보 확인</p>

        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E5E7EB', overflow:'hidden' }}>
          {[
            { label:'상호명', value:'에프텀' },
            { label:'대표자', value:'윤용현' },
            { label:'사업자등록번호', value:'221-20-19292' },
            { label:'사업장 소재지', value:'경기도 평택시 지산로 128 9층' },
            { label:'업태', value:'서비스업' },
            { label:'종목', value:'디지털 유산 정리 대행' },
            { label:'이메일', value:'afterm001@gmail.com' },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display:'flex', padding:'16px 20px',
              borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
              gap:16,
            }}>
              <p style={{ fontSize:13, color:'#9CA3AF', fontWeight:600, margin:0, minWidth:120, flexShrink:0 }}>{row.label}</p>
              <p style={{ fontSize:13, color:'#111', fontWeight:600, margin:0, wordBreak:'keep-all' }}>{row.value}</p>
            </div>
          ))}
        </div>

        {/* 사업자등록증 PDF 뷰어 */}
        <div style={{ marginTop:28 }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#374151', margin:'0 0 12px' }}>사업자등록증 원본</p>
          <iframe
            src="/business-registration.pdf"
            style={{ width:'100%', height:600, borderRadius:12, border:'1px solid #E5E7EB' }}
            title="에프텀 사업자등록증"
          />
          <a
            href="/business-registration.pdf"
            download="에프텀_사업자등록증.pdf"
            style={{
              display:'block', marginTop:12, textAlign:'center',
              background:'#163272', color:'#fff', borderRadius:12,
              padding:'14px', fontSize:14, fontWeight:700, textDecoration:'none',
            }}
          >
            PDF 다운로드
          </a>
        </div>

        <p style={{ fontSize:11, color:'#9CA3AF', margin:'16px 0 0', lineHeight:1.8, textAlign:'center' }}>
          본 정보는 공정거래위원회에 신고된 사업자 정보입니다.
        </p>
      </div>
    </div>
  )
}
