
import SignupPageClient from "@/components/auth/SignupPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "회원가입 - 에프텀 | 웰다잉의 시작",
    description: "에프텀 회원가입을 통해 당신만의 디지털 기억 공간을 만들어보세요. 1분이면 완료됩니다.",
    openGraph: {
        title: "회원가입 - 에프텀 | 웰다잉의 시작",
        description: "에프텀 회원가입을 통해 당신만의 디지털 기억 공간을 만들어보세요.",
        url: "https://afterm.co.kr/signup",
        siteName: "에프텀 AFTERM",
        images: [
            {
                url: "/opengraph-image.png",
                width: 1200,
                height: 630,
                alt: "에프텀 회원가입",
            },
        ],
        locale: "ko_KR",
        type: "website",
    },
};

export default function SignupPage() {
    return <SignupPageClient />;
}
