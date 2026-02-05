
import HomePageClient from "@/components/home/HomePageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "에프텀 - 당신의 기억을 영원히 | 개인 웰다잉 플랫폼",
    description: "갑자기 떠나도 괜찮습니다. 1분이면 됩니다. 소중한 사람들에게 남길 메시지와 디지털 유산을 미리 준비하세요.",
    openGraph: {
        title: "에프텀 - 당신의 기억을 영원히 | 개인 웰다잉 플랫폼",
        description: "갑자기 떠나도 괜찮습니다. 1분이면 됩니다. 소중한 사람들에게 남길 메시지와 디지털 유산을 미리 준비하세요.",
        url: "https://afterm.co.kr",
        siteName: "에프텀 AFTERM",
        images: [
            {
                url: "/opengraph-image.png", // Ensure this image exists in public folder
                width: 1200,
                height: 630,
                alt: "에프텀 AFTERM",
            },
        ],
        locale: "ko_KR",
        type: "website",
    },
};

export default function AppEntryPage() {
    return <HomePageClient />;
}
