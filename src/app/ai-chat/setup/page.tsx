import StandalonePersonaSetupForm from '@/components/ai-chat/StandalonePersonaSetupForm';

export default function AiChatSetupPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        새로운 AI 대화 시작하기
                    </h1>
                    <p className="text-lg text-gray-600">
                        고인과 생전에 나누었던 대화 내용을 업로드해주세요.<br />
                        AI가 말투와 성격을 분석하여 대화를 재현합니다.
                    </p>
                </div>

                <StandalonePersonaSetupForm />
            </div>
        </div>
    );
}
