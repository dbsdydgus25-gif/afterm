export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{10,}$/;

export const validatePassword = (password: string, email: string): { isValid: boolean; message: string } => {
    if (password.length < 10) return { isValid: false, message: "비밀번호는 10자 이상이어야 합니다." };
    if (!/[A-Z]/.test(password)) return { isValid: false, message: "영문 대문자를 포함해야 합니다." };
    if (!/[a-z]/.test(password)) return { isValid: false, message: "영문 소문자를 포함해야 합니다." };
    if (!/[0-9]/.test(password)) return { isValid: false, message: "숫자를 포함해야 합니다." };
    if (!/[!@#$%^&*]/.test(password)) return { isValid: false, message: "특수문자를 포함해야 합니다." };

    // Continuous User ID check
    const idPart = email.split('@')[0];
    if (password.includes(idPart)) return { isValid: false, message: "아이디(이기)를 포함할 수 없습니다." };

    // Continuous number check (simple version: 3 consecutive same or sequential)
    if (/(012|123|234|345|456|567|678|789|890|901)/.test(password)) return { isValid: false, message: "연속된 숫자를 3자 이상 사용할 수 없습니다." };
    if (/(\w)\1\1/.test(password)) return { isValid: false, message: "동일한 문자를 3번 이상 반복할 수 없습니다." };

    return { isValid: true, message: "" };
};

export const TERMS_OF_SERVICE = `
제1조 (목적)
이 약관은 에프텀(이하 "회사")이 제공하는 디지털 메시지 저장 및 사후 전송 서비스인 AFTERM(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "회원"이라 함은 서비스에 접속하여 이 약관에 동의하고 회사와 이용계약을 체결한 자를 말합니다.
2. "수신인"이라 함은 회원이 지정하여 사후에 메시지를 전달받게 될 제3자를 말합니다.
3. "디지털 유언/메시지"라 함은 회원이 지정된 시점에 전송하기 위해 작성하여 서버에 저장한 텍스트, 이미지, 영상 등의 데이터를 말합니다.

제3조 (책임의 한계)
회사는 회원이 작성한 메시지의 내용에 관여하지 않으며, 회원이 부정확한 수신인 정보(전화번호 오기입, 번호 변경 등)를 제공하여 메시지가 전송되지 않거나 오전송된 경우에 대해서는 책임을 지지 않습니다.

제4조 (서비스 이용 및 데이터 보관)
1. 회원은 본인의 생존 여부 확인을 위한 "생존 신호" 주기를 직접 설정해야 합니다.
2. 회사는 회원이 설정한 기간 동안 생존 신호가 감지되지 않을 경우, 설정된 절차에 따라 수신인에게 메시지를 발송합니다.
3. 메시지 발송이 완료된 후, 회원의 데이터는 [1년]간 보관 후 영구 삭제됩니다.
`;

export const PRIVACY_POLICY = `
**[에프텀]**은 원활한 서비스 제공을 위해 다음과 같이 개인정보를 수집·이용합니다.

1. 수집 항목
- 필수: 이름, 이메일, 휴대폰 번호, 비밀번호, 연계정보(CI/DI)
- 메시지 작성 시: [수신인 정보] 이름, 휴대폰 번호, 이메일
- 유료 결제 시: 신용카드 정보, 은행 계좌 정보, 결제 기록

2. 수집 및 이용 목적
- 본인 확인, 서비스 이용 식별, 생존 여부 확인
- 사후 메시지 전송 및 알림
- 서비스 이용 요금 결제

3. 보유 및 이용 기간
- 회원 탈퇴 시까지 (단, 관계 법령에 따름)
- 메시지 발송 완료 후 1년까지
`;

export const THIRD_PARTY_PROVISION = `
[안내] 에프텀은 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
1. 이용자가 사전에 동의한 경우 (예: 수신인에게 메시지를 전달하는 행위 자체는 서비스의 본질적 기능임)
2. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우
`;

export const ENTRUSTMENT = `
**[에프텀]**은 서비스 향상을 위해 아래와 같이 외부 전문 업체에 개인정보 처리를 위탁하고 있습니다.

- (주)솔라피 (Solapi): 카카오톡 알림톡 및 SMS/LMS 문자 메시지 발송 대행
- Supabase: 서비스 데이터베이스 저장 및 클라우드 서버 운영
- 토스페이먼츠 (또는 사용 예정 PG사): 유료 서비스 결제 처리 및 에스크로 서비스
- Amazon Web Services (AWS): 이미지/영상 파일 스토리지 저장
`;
