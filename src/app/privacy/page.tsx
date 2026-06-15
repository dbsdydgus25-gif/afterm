export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: '#111827', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.02em' }}>개인정보처리방침</h1>
      <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 40 }}>시행일: 2026년 06월 15일</p>

      <p style={{ fontSize: 14, color: '#374151', marginBottom: 32, lineHeight: 1.9 }}>
        에프텀(이하 "회사")은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다. 본 방침을 통해 수집하는 개인정보의 항목, 수집 목적, 보유 기간 등을 안내드립니다.
      </p>

      <Section title="제1조 (수집하는 개인정보 항목 및 수집 방법)">
        <p style={{ marginBottom: 12 }}>회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다.</p>
        <TableBlock rows={[
          ['구분', '수집 항목'],
          ['회원가입', '이름, 이메일 주소, 휴대폰 번호'],
          ['서비스 이용', '신청인 성명, 고인 성명, 고인 사망일, 고인과의 관계, 고인 계정 정보(아이디·URL 등)'],
          ['서류 업로드', '사망진단서, 신청인 신분증, 가족관계증명서 등 법정 서류'],
          ['결제', '결제수단 정보(카드번호 등은 PG사에서 직접 처리하며 회사는 보관하지 않음)'],
          ['자동 수집', 'IP 주소, 쿠키, 접속 기기 정보, 서비스 이용 기록'],
        ]} />
      </Section>

      <Section title="제2조 (개인정보의 수집 및 이용 목적)">
        <ol>
          <li>① 서비스 제공: 고인 계정 삭제·추모 전환 대행 신청 처리, 서류 검토 및 제출</li>
          <li>② 회원 관리: 본인 확인, 불량 이용자 제재, 고지사항 전달</li>
          <li>③ 고객 지원: 문의 처리, 진행 현황 안내, 알림 발송(카카오 알림톡·SMS 포함)</li>
          <li>④ 서비스 개선: 이용 통계 분석, 서비스 품질 향상</li>
        </ol>
      </Section>

      <Section title="제3조 (개인정보의 보유 및 이용 기간)">
        <p style={{ marginBottom: 12 }}>회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성되면 해당 정보를 지체 없이 파기합니다. 단, 관계 법령에 의해 다음과 같이 보존합니다.</p>
        <TableBlock rows={[
          ['보유 항목', '근거 법령', '보존 기간'],
          ['계약·청약 철회 기록', '전자상거래법', '5년'],
          ['대금 결제·공급 기록', '전자상거래법', '5년'],
          ['소비자 불만·분쟁 기록', '전자상거래법', '3년'],
          ['접속 로그', '통신비밀보호법', '3개월'],
        ]} />
      </Section>

      <Section title="제4조 (개인정보의 제3자 제공)">
        <ol>
          <li>① 회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.</li>
          <li>② 단, 서비스 대행 목적 달성을 위해 아래와 같이 제공합니다.
            <TableBlock rows={[
              ['제공 대상', '제공 목적', '제공 항목'],
              ['페이스북·인스타그램 (Meta)', '계정 삭제·추모 전환 신청', '신청인 정보, 고인 정보, 첨부 서류'],
              ['구글', '계정 삭제 신청', '신청인 정보, 고인 정보, 첨부 서류'],
              ['카카오', '계정 탈퇴·추모 전환 신청', '신청인 정보, 고인 정보, 첨부 서류'],
              ['X (트위터)', '계정 삭제 신청', '신청인 정보, 고인 정보, 첨부 서류'],
            ]} />
          </li>
          <li>③ 법령에 의하거나 수사기관의 적법한 요청이 있는 경우에는 예외적으로 제공할 수 있습니다.</li>
        </ol>
      </Section>

      <Section title="제5조 (개인정보 처리 위탁)">
        <p style={{ marginBottom: 12 }}>회사는 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁합니다.</p>
        <TableBlock rows={[
          ['수탁업체', '위탁 업무'],
          ['Supabase Inc.', '서비스 데이터베이스 및 파일 저장'],
          ['솔라피(SOLAPI)', '알림톡·문자 발송'],
          ['포트원(PortOne)', '결제 처리 중개'],
        ]} />
      </Section>

      <Section title="제6조 (개인정보의 파기)">
        <ol>
          <li>① 회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때 지체 없이 파기합니다.</li>
          <li>② 전자적 파일 형태의 정보는 복구·재생할 수 없는 기술적 방법으로 영구 삭제하며, 종이 문서에 기록된 개인정보는 분쇄기로 파기합니다.</li>
        </ol>
      </Section>

      <Section title="제7조 (이용자의 권리)">
        이용자는 언제든지 자신의 개인정보에 대해 열람, 수정, 삭제, 처리 정지를 요청할 수 있습니다. 요청은 <strong>afterm001@gmail.com</strong>으로 이메일을 보내주시면 처리해 드립니다. 단, 법령에 의해 보존 의무가 있는 정보는 삭제가 제한될 수 있습니다.
      </Section>

      <Section title="제8조 (쿠키의 운용)">
        <ol>
          <li>① 회사는 서비스 최적화를 위해 쿠키를 사용할 수 있습니다.</li>
          <li>② 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며, 이 경우 일부 서비스 이용이 제한될 수 있습니다.</li>
        </ol>
      </Section>

      <Section title="제9조 (개인정보 보호책임자)">
        <TableBlock rows={[
          ['항목', '내용'],
          ['성명', '윤용현'],
          ['직책', '대표'],
          ['이메일', 'afterm001@gmail.com'],
        ]} />
        <p style={{ marginTop: 12 }}>개인정보 침해 신고는 개인정보침해신고센터(privacy.kisa.or.kr), 대검찰청(www.spo.go.kr), 경찰청(ecrm.cyber.go.kr)에서도 가능합니다.</p>
      </Section>

      <Section title="사업자 정보">
        <TableBlock rows={[
          ['상호', '에프텀'],
          ['대표자', '윤용현'],
          ['사업자등록번호', '221-20-19292'],
          ['주소', '경기도 평택시 지산로 128, 107동 9층 901호'],
          ['이메일', 'afterm001@gmail.com'],
        ]} />
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

function TableBlock({ rows }: { rows: string[][] }) {
  const [head, ...body] = rows
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8, marginBottom: 8 }}>
      <thead>
        <tr style={{ background: '#F9FAFB' }}>
          {head.map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, border: '1px solid #E5E7EB', color: '#374151' }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {body.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => <td key={j} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', verticalAlign: 'top' }}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
