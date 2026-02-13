import PersonaWizard from '@/components/ai-chat/wizard/PersonaWizard';

export default function AiChatSetupPage() {
    return (
        <div className="min-h-full bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <PersonaWizard />
            </div>
        </div>
    );
}
