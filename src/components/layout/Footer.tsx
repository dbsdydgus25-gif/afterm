import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-100 py-8 px-6 pb-24">
            <div className="flex flex-col gap-6">
                <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">AFTERM</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        떠난 후에도 당신이 기억되도록.<br />
                        가장 개인적인 생애 데이터 플랫폼, 애프터텀.
                    </p>
                </div>

                <div className="flex gap-4 text-xs font-medium text-gray-600">
                    <Link href="/service" className="hover:text-blue-600 transition-colors">
                        이용약관
                    </Link>
                    <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                        개인정보처리방침
                    </Link>
                    <Link href="/contact" className="hover:text-blue-600 transition-colors">
                        문의하기
                    </Link>
                </div>

                <div className="text-[10px] text-gray-400 leading-relaxed font-light">
                    <p>상호명: 애프터텀 (AFTERM)</p>
                    <p>대표: 홍길동 | 사업자등록번호: 000-00-00000</p>
                    <p>주소: 서울특별시 강남구 테헤란로 123</p>
                    <p>이메일: contact@afterm.co.kr</p>
                    <p className="mt-2">Copyright © 2026 AFTERM. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
