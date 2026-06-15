export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: '#111827', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.02em' }}>이용약관</h1>
      <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 40 }}>시행일: 2026년 06월 15일</p>

      <Section title="제1조 (목적)">
        이 약관은 에프텀(이하 "회사")이 운영하는 에프텀 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
      </Section>

      <Section title="제2조 (정의)">
        <ol>
          <li>① "서비스"란 회사가 제공하는 고인 디지털 계정 삭제·추모 전환 대행 및 관련 행정 안내 서비스를 의미합니다.</li>
          <li>② "이용자"란 이 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자를 의미합니다.</li>
          <li>③ "유료서비스"란 회사가 유료로 제공하는 각종 서비스를 의미합니다.</li>
        </ol>
      </Section>

      <Section title="제3조 (약관의 효력 및 변경)">
        <ol>
          <li>① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
          <li>② 회사는 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위 내에서 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.</li>
          <li>③ 이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원탈퇴를 요청할 수 있습니다. 변경된 약관의 효력 발생일 이후에도 서비스를 계속 이용할 경우 약관 변경에 동의한 것으로 봅니다.</li>
        </ol>
      </Section>

      <Section title="제4조 (서비스의 내용)">
        <ol>
          <li>① 회사는 다음의 서비스를 제공합니다.
            <ul style={{ marginTop: 8 }}>
              <li>고인의 SNS 계정(페이스북, 인스타그램, 카카오톡, X 등) 삭제 신청 대행</li>
              <li>고인의 SNS 계정 추모 전환 신청 대행</li>
              <li>고인의 구글 계정 삭제 신청 대행</li>
              <li>관련 행정 절차 안내 및 서류 준비 지원</li>
            </ul>
          </li>
          <li>② 회사는 서비스 대행을 위해 이용자가 제출한 서류를 해당 플랫폼에 제출합니다. 단, 각 플랫폼의 심사 결과 및 처리 기간은 회사가 보장할 수 없습니다.</li>
          <li>③ 서비스의 제공 시간은 24시간, 연중무휴를 원칙으로 하되, 시스템 점검·장애 등의 사유로 일시 중단될 수 있습니다.</li>
        </ol>
      </Section>

      <Section title="제5조 (회원가입 및 관리)">
        <ol>
          <li>① 이용자는 회사가 정한 양식에 따라 정보를 기입한 후 이 약관에 동의함으로써 회원 가입을 신청합니다.</li>
          <li>② 회사는 다음 각 호에 해당하는 신청에 대해서는 승인하지 않거나 사후에 이용계약을 해지할 수 있습니다.
            <ul style={{ marginTop: 8 }}>
              <li>타인의 명의를 이용한 경우</li>
              <li>허위 정보를 기재한 경우</li>
              <li>관계법령에 위배되는 경우</li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section title="제6조 (개인정보 보호)">
        회사는 이용자의 개인정보를 보호하기 위해 개인정보 처리방침을 수립하고 이를 준수합니다. 자세한 사항은 개인정보처리방침을 확인하시기 바랍니다.
      </Section>

      <Section title="제7조 (이용자의 의무)">
        <ol>
          <li>① 이용자는 다음 행위를 하여서는 안 됩니다.
            <ul style={{ marginTop: 8 }}>
              <li>타인의 정보 도용 또는 허위 정보 제출</li>
              <li>회사의 서비스를 이용하여 법령 또는 이 약관이 금지하는 행위</li>
              <li>고인과의 관계를 허위로 기재하여 서비스를 이용하는 행위</li>
              <li>회사의 운영을 방해하는 행위</li>
            </ul>
          </li>
          <li>② 이용자는 고인과의 관계(직계가족, 배우자 등)를 진실되게 기재해야 하며, 허위 기재로 발생한 모든 법적 책임은 이용자에게 있습니다.</li>
        </ol>
      </Section>

      <Section title="제8조 (서비스 이용 제한)">
        회사는 이용자가 이 약관을 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고·일시 정지·이용 계약 해지 등의 조치를 취할 수 있습니다.
      </Section>

      <Section title="제9조 (유료서비스 및 결제)">
        <ol>
          <li>① 이용자는 회사가 정한 방법으로 유료서비스 이용요금을 납부합니다.</li>
          <li>② 환불에 관한 사항은 별도의 환불정책에 따릅니다.</li>
        </ol>
      </Section>

      <Section title="제10조 (책임의 한계)">
        <ol>
          <li>① 회사는 각 플랫폼(페이스북, 인스타그램, 구글 등)의 내부 정책 변경, 심사 거절, 처리 지연 등으로 인한 결과에 대해 책임을 지지 않습니다.</li>
          <li>② 회사는 이용자가 제출한 서류의 허위 또는 불일치로 인한 결과에 대해 책임을 지지 않습니다.</li>
          <li>③ 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적 사유로 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.</li>
        </ol>
      </Section>

      <Section title="제11조 (분쟁해결)">
        <ol>
          <li>① 회사와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 법원에 제기합니다.</li>
          <li>② 이 약관은 대한민국 법령에 따라 규율되고 해석됩니다.</li>
        </ol>
      </Section>

      <Section title="사업자 정보">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          {[
            ['상호', '에프텀'],
            ['대표자', '윤용현'],
            ['사업자등록번호', '221-20-19292'],
            ['사업장 소재지', '경기도 평택시 지산로 128, 107동 9층 901호'],
            ['이메일', 'afterm001@gmail.com'],
            ['개업일', '2026년 04월 27일'],
          ].map(([k, v]) => (
            <tr key={k} style={{ borderBottom: '1px solid #F3F4F6' }}>
              <td style={{ padding: '8px 12px 8px 0', color: '#6B7280', width: 160, verticalAlign: 'top' }}>{k}</td>
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
