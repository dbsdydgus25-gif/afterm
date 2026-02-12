import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ChatInterface from '@/components/ai-chat/ChatInterface';

interface PageProps {
    params: {
        id: string; // memorialId
    };
}

export default async function AiChatPage({ params }: PageProps) {
    const supabase = createClient();
    const { id: memorialId } = params;

    // 1. 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // 2. Memorial Space에 연결된 AI Persona 찾기
    const { data: persona, error: personaError } = await supabase
        .from('ai_personas')
        .select('*')
        .eq('memorial_id', memorialId)
        .single();

    // 페르소나가 없으면 설정 페이지로 리다이렉트 (공개 페이지인 경우 접근 제한 필요하지만, 일단 리다이렉트)
    if (!persona) {
        // 만약 공간 주인이거나 권한이 있다면 설정 페이지로, 아니면 접근 불가
        // 여기서는 간단하게 설정 페이지로 보냄 (권한 체크는 setup 페이지에서 다시 함)
        redirect(`/space/${memorialId}/ai-chat/setup`);
    }

    // 3. 기존 대화 내역 가져오기
    const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('persona_id', persona.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }); // 과거 -> 최신

    return (
        <ChatInterface
            memorialId={memorialId}
            personaId={persona.id}
            initialMessages={messages || []}
            personaName={persona.name}
        />
    );
}
