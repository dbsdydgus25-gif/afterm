import PersonaSetupForm from '@/components/ai-chat/PersonaSetupForm';

interface PageProps {
    params: {
        id: string; // memorialId
    };
}

export default function AiChatSetupPage({ params }: PageProps) {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        AI 추모 채팅 설정
                    </h1>
                    <p className="text-lg text-gray-600">
                        고인과 생전에 나누었던 카카오톡 대화 내용을 업로드해주세요.<br />
                        AI가 대화 패턴과 말투를 분석하여 고인의 페르소나를 재현합니다.
                    </p>
                </div>

                <PersonaSetupForm memorialId={params.id} />
            </div>
        </div>
    );
}
