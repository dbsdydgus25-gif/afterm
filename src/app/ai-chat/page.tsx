import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AiChatDashboardPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <MessageSquare className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                AI 추모 채팅에 오신 것을 환영합니다
            </h1>
            <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
                그리운 사람의 말투와 성격을 AI로 구현하여<br />
                다시 한 번 대화를 나누어보세요.
            </p>
            <Link href="/ai-chat/setup">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                    새로운 대화 시작하기
                </Button>
            </Link>
        </div>
    );
}
