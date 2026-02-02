import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-12 px-6 pb-24">
            <div className="space-y-8">
                {/* 서비스 링크 */}
                <div>
                    <h3 className="font-bold text-lg mb-4">에프텀</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                        <Link href="/service" className="hover:text-white transition-colors">
                            서비스 안내
                        </Link>
                        <Link href="/about" className="hover:text-white transition-colors">
                            회사소개
                        </Link>
                        <Link href="/notice" className="hover:text-white transition-colors">
                            공지사항
                        </Link>
                        <Link href="/contact" className="hover:text-white transition-colors">
                            문의하기
                        </Link>
                    </div>
                </div>

                {/* 법적 링크 */}
                <div className="flex gap-4 text-sm">
                    <Link href="/service" className="hover:text-white transition-colors">
                        이용약관
                    </Link>
                    <Link href="/privacy" className="hover:text-white font-bold transition-colors">
                        개인정보처리방침
                    </Link>
                </div>

                {/* 회사 정보 */}
                <div className="text-xs text-gray-400 leading-relaxed">
                    <p>상호명: 애프터텀 (AFTERM)</p>
                    <p>대표: 홍길동 | 사업자등록번호: 000-00-00000</p>
                    <p>주소: 서울특별시 강남구 테헤란로 123</p>
                    <p>이메일: contact@afterm.co.kr</p>
                    <p className="mt-4">© 2026 AFTERM. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
