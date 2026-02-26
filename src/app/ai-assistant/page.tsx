import { Metadata } from "next";
import { Suspense } from "react";
import { AiAssistantClient } from "@/components/ai-assistant/AiAssistantClient";

export const metadata: Metadata = {
    title: "AI 디지털 유산 관리 | 에프텀 AFTERM",
    description: "AI와 대화하면서 나의 디지털 유산을 확인하고, 소중한 사람에게 남길 메시지를 작성해보세요.",
};

export default function AiAssistantPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-50" />}>
            <AiAssistantClient />
        </Suspense>
    );
}
