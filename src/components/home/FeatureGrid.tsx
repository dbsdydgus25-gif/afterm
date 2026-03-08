import { cn } from "@/lib/utils";
import { Mail, Database, Heart, MessageSquareText, Search, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";

export function FeatureGrid() {
    const router = useRouter();

    const features = [
        {
            title: "메시지 남기기",
            description: "소중한 사람들에게 마지막 안부와 편지를 예약해두세요.",
            icon: <Mail className="w-8 h-8" strokeWidth={1.5} />,
            onClick: () => router.push('/create')
        },
        {
            title: "데이터 유산 남기기",
            description: "온라인 계정, 사진, 숨겨진 자산 정보를 안전하게 보관하세요.",
            icon: <Database className="w-8 h-8" strokeWidth={1.5} />,
            onClick: () => router.push('/vault/create')
        },
        {
            title: "디지털 추모관",
            description: "가족, 친지들과 함께 온라인 공간에서 고인을 추억하세요.",
            icon: <Heart className="w-8 h-8" strokeWidth={1.5} />,
            onClick: () => window.open('/space', '_blank')
        },
        {
            title: "AI 채팅",
            description: "스마트한 AI 비서가 디지털 유산 관리와 웰다잉 준비를 도와드립니다.",
            icon: <MessageSquareText className="w-8 h-8" strokeWidth={1.5} />,
            onClick: () => router.push('/ai-chat')
        },
        {
            title: "고인 유산 찾기",
            description: "가족이 남긴 숨겨진 디지털 유산과 온라인 계정을 찾아드립니다.",
            icon: <Search className="w-8 h-8" strokeWidth={1.5} />,
            onClick: () => router.push('/guardians/open')
        },
        {
            title: "사후 행정 지원금 찾기",
            description: "복잡한 사후 행정 절차와 유가족 지원금을 원스톱으로 확인하세요.",
            icon: <Landmark className="w-8 h-8" strokeWidth={1.5} />,
            onClick: () => router.push('/service/benefits/onboarding')
        },
    ];

    return (
        <section className="relative z-10 w-full flex flex-col items-center justify-center px-6 py-24 bg-white border-t border-slate-100">
            <div className="w-full max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.2] break-keep">
                        아래 서비스로<br />
                        <span className="text-blue-600">개인 웰다잉을 관리해보세요!</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10">
                    {features.map((feature, index) => (
                        <Feature key={feature.title} {...feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}

const Feature = ({
    title,
    description,
    icon,
    index,
    onClick
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    index: number;
    onClick?: () => void;
}) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex flex-col lg:border-r py-12 relative group/feature border-slate-100 cursor-pointer overflow-hidden",
                (index === 0 || index === 3) && "lg:border-l border-slate-100",
                index < 3 && "lg:border-b border-slate-100"
            )}
        >
            {index < 3 && (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-t from-blue-50/50 to-transparent pointer-events-none" />
            )}
            {index >= 3 && (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
            )}
            <div className="mb-6 relative z-10 px-8 text-slate-500 group-hover/feature:text-blue-500 transition-colors duration-200">
                {icon}
            </div>
            <div className="text-xl font-bold mb-3 relative z-10 px-8">
                <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1.5 rounded-tr-full rounded-br-full bg-slate-200 group-hover/feature:bg-blue-600 transition-all duration-200 origin-center" />
                <span className="group-hover/feature:translate-x-3 transition duration-200 inline-block text-slate-800">
                    {title}
                </span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm relative z-10 px-8 leading-relaxed">
                {description}
            </p>
        </div>
    );
};
