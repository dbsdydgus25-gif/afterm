export default function RefundPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: '#111827', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.02em' }}>환불정책</h1>
      <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 40 }}>시행일: 2026년 06월 15일</p>

      <p style={{ fontSize: 14, color: '#374151', marginBottom: 32, lineHeight: 1.9 }}>
        에프텀(이하 "회사")은 이용자 보호를 위해 아래와 같은 환불정책을 운영합니다. 서비스의 특성상 대행 업무의 진행 단계에 따라 환불 가능 여부 및 금액이 달라질 수 있으니 신청 전에 반드시 확인해 주시기 바랍니다.
      </p>

      <Section title="제1조 (서비스 이용 요금)">
        <ol>
          <li>① 에프텀 서비스는 <strong>서비스 1건당 4,900원 (부가세 10% 별도, 최종 결제금액 5,390원)</strong>으로 제공됩니다.</li>
          <li>② 요금은 서비스 신청 시점에 결제되며, 결제 수단은 카카오페이·토스페이 등 회사가 지원하는 수단을 이용할 수 있습니다.</li>
          <li>③ 복수의 플랫폼(예: 페이스북 삭제 + 인스타그램 추모)을 동시에 신청하는 경우 서비스 건수에 따라 각각 요금이 청구됩니다.</li>
        </ol>
      </Section>

      <Section title="제2조 (환불 원칙)">
        <ol>
          <li>① 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 이용자의 청약 철회 및 환불 요청을 처리합니다.</li>
          <li>② 서비스는 이용자의 신청을 받아 실제 대행 업무를 수행하는 용역 서비스로, 업무 진행 단계에 따라 아래 기준을 적용합니다.</li>
          <li>③ <strong>대행이 완료되지 않은 서비스(플랫폼 처리 실패)에 대해서는 해당 서비스 건의 결제금액을 전액 환불합니다.</strong></li>
        </ol>
      </Section>

      <Section title="제3조 (단계별 환불 기준)">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 8 }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['진행 단계', '환불 가능 여부', '환불 금액'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, border: '1px solid #E5E7EB' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['결제 완료 후 ~ 서류 검토 시작 전', '전액 환불 가능', '결제 금액 100%'],
              ['서류 검토 시작 후 ~ 플랫폼 제출 전', '부분 환불', '결제 금액의 50%'],
              ['플랫폼 제출 완료 후 (처리 성공)', '환불 불가', '-'],
              ['플랫폼 처리 실패 (회사 귀책 없는 경우)', '환불 불가', '-'],
              ['플랫폼 처리 실패 (회사 귀책 사유)', '전액 환불', '해당 서비스 결제금액 100%'],
              ['플랫폼 대행 미완료 (처리 불가 확정)', '전액 환불', '해당 서비스 결제금액 100%'],
            ].map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '10px 12px', border: '1px solid #E5E7EB', verticalAlign: 'top',
                    color: j === 1 ? (cell === '환불 불가' ? '#DC2626' : cell.includes('전액') ? '#16A34A' : '#D97706') : '#374151',
                    fontWeight: j === 1 ? 700 : 400,
                  }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
          ※ 복수 서비스 신청 시, 환불은 미완료된 서비스 건에 한해 개별 적용됩니다. (예: 2건 중 1건 실패 → 1건 요금만 환불)
        </p>
      </Section>

      <Section title="제4조 (환불 불가 사유)">
        다음의 경우 환불이 제한됩니다.
        <ul style={{ marginTop: 8 }}>
          <li>이용자가 제출한 서류의 오류, 허위, 누락으로 인해 플랫폼 심사가 거절된 경우</li>
          <li>각 플랫폼의 내부 정책 변경으로 인해 서비스 처리가 불가능해진 경우</li>
          <li>이용자가 제공한 고인 정보와 실제 정보가 불일치하는 경우</li>
          <li>서비스 이용약관을 위반한 경우</li>
          <li>플랫폼 제출이 완료된 경우 (처리 결과와 무관)</li>
        </ul>
      </Section>

      <Section title="제5조 (환불 신청 방법)">
        <ol>
          <li>① 환불을 원하시는 경우 <strong>afterm001@gmail.com</strong>으로 아래 정보를 포함하여 이메일을 보내주세요.
            <ul style={{ marginTop: 8 }}>
              <li>신청인 이름</li>
              <li>가입 이메일</li>
              <li>접수번호</li>
              <li>환불 사유</li>
            </ul>
          </li>
          <li>② 회사는 환불 요청 접수 후 영업일 기준 3일 이내에 검토 결과를 안내드립니다.</li>
          <li>③ 환불 승인 시 결제 수단에 따라 영업일 기준 3~5일 이내에 처리됩니다.</li>
        </ol>
      </Section>

      <Section title="제6조 (플랫폼 처리 결과에 대한 안내)">
        <ol>
          <li>① 에프텀은 고인 계정 처리 신청을 대행하는 서비스로, 각 플랫폼(Meta, Google, Kakao 등)의 최종 승인 여부는 해당 플랫폼의 정책과 심사에 따릅니다.</li>
          <li>② 플랫폼 측의 심사 거절, 처리 지연 등은 회사의 귀책 사유가 아니며, 이 경우 환불이 제공되지 않을 수 있습니다.</li>
          <li>③ 단, 회사의 서류 작성 오류나 제출 지연 등 명백한 귀책 사유가 있는 경우에는 전액 환불을 보장합니다.</li>
        </ol>
      </Section>

      <Section title="제7조 (소비자 분쟁 해결)">
        환불 관련 분쟁이 해결되지 않을 경우 한국소비자원(www.kca.go.kr) 또는 공정거래위원회(www.ftc.go.kr)에 분쟁 조정을 신청하실 수 있습니다.
      </Section>

      <Section title="문의">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          {[
            ['상호', '에프텀'],
            ['대표자', '윤용현'],
            ['사업자등록번호', '221-20-19292'],
            ['이메일', 'afterm001@gmail.com'],
            ['주소', '경기도 평택시 지산로 128, 107동 9층 901호'],
          ].map(([k, v]) => (
            <tr key={k} style={{ borderBottom: '1px solid #F3F4F6' }}>
              <td style={{ padding: '8px 12px 8px 0', color: '#6B7280', width: 160 }}>{k}</td>
              <td style={{ padding: '8px 0', fontWeight: 600 }}>{v}</td>
            </tr>
          ))}
        </table>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 12, letterSpacing: '-0.01em' }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.9 }}>{children}</div>
    </section>
  )
}
