
import PlansPageClient from "@/components/plans/PlansPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "요금제 안내 - 에프텀 | 합리적인 웰다잉 솔루션",
    description: "무료로 시작하는 디지털 유산 보관. PRO 플랜으로 더 많은 메시지와 안전한 보관 공간을 경험하세요. 지금 3개월 무료 체험 진행 중!",
    openGraph: {
        title: "요금제 안내 - 에프텀 | 합리적인 웰다잉 솔루션",
        description: "무료로 시작하는 디지털 유산 보관. PRO 플랜으로 더 많은 메시지와 안전한 보관 공간을 경험하세요. 지금 3개월 무료 체험 진행 중!",
        url: "https://afterm.co.kr/plans",
        siteName: "에프텀 AFTERM",
        images: [
            {
                url: "/opengraph-image.png",
                width: 1200,
                height: 630,
                alt: "에프텀 요금제 안내",
            },
        ],
        locale: "ko_KR",
        type: "website",
    },
};

export default function PlansPage() {
    return <PlansPageClient />;
}
