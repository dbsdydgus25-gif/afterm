
import LoginPageClient from "@/components/auth/LoginPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "로그인 - 에프텀 | 소중한 기억의 시작",
    description: "에프텀에 로그인하여 당신의 디지털 유산과 메시지를 관리하세요. 소중한 사람들에게 마음을 전하는 첫 걸음.",
    openGraph: {
        title: "로그인 - 에프텀 | 소중한 기억의 시작",
        description: "에프텀에 로그인하여 당신의 디지털 유산과 메시지를 관리하세요.",
        url: "https://afterm.co.kr/login",
        siteName: "에프텀 AFTERM",
        images: [
            {
                url: "/opengraph-image.png",
                width: 1200,
                height: 630,
                alt: "에프텀 로그인",
            },
        ],
        locale: "ko_KR",
        type: "website",
    },
};

export default function LoginPage() {
    return <LoginPageClient />;
}
