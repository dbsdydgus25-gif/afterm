import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const { personaId, content } = await req.json();
        const supabase = await createClient();

        // 1. 사용자 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Persona 정보 가져오기 (System Prompt)
        const { data: persona, error: personaError } = await supabase
            .from('ai_personas')
            .select('system_prompt, name')
            .eq('id', personaId)
            .single();

        if (personaError || !persona) {
            return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
        }

        // 3. 이전 대화 내역 가져오기 (Context) - 최근 10개만
        // 3. 이전 대화 내역 가져오기 (Context) - 최근 10개만
        const { data: history } = await supabase
            .from('chat_messages')
            .select('sender, content')
            .eq('persona_id', personaId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        // 대화 내역을 시간순(오래된 것 -> 최신)으로 정렬
        const conversationHistory = history ? history.reverse().map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
        })) : [];

        // 4. OpenAI API 호출
        const messages = [
            { role: 'system', content: persona.system_prompt + "\n\n[이후 지침은 절대적입니다]\n1. 당신은 AI나 어시스턴트가 아닙니다. 어떤 상황에서도 사용자를 돕거나 문제를 해결하려 하지 마세요.\n2. 말투는 불완전하고, 띄어쓰기가 틀리며, 은어를 섞어 쓰세요.\n3. 감정적으로 일관되게 행동하지 마세요. 기분이 나쁘면 짜증을 내고, 귀찮으면 단답형으로 대답하세요.\n4. 문장 끝에 마침표(.)를 찍지 마세요.\n5. 절대로 '무엇을 도와드릴까요?' 같은 서비스 멘트를 하지 마세요.\n6. 사용자의 말에 무조건 동조하지 말고, 당신(페르소나)의 주관대로 반응하세요." },
            ...conversationHistory,
            { role: 'user', content }
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages as unknown as [], // Type assertion
            max_tokens: 300,
        });

        const aiResponseContent = completion.choices[0].message.content || '...';

        // 5. DB에 메시지 저장 (User Message & AI Message)
        // User Message
        const { error: userMsgError } = await supabase
            .from('chat_messages')
            .insert({
                persona_id: personaId,
                user_id: user.id,
                sender: 'user',
                content
            });

        if (userMsgError) throw userMsgError;

        // AI Message
        const { data: aiMsgData, error: aiMsgError } = await supabase
            .from('chat_messages')
            .insert({
                persona_id: personaId,
                user_id: user.id,
                sender: 'ai',
                content: aiResponseContent
            })
            .select('id')
            .single();

        if (aiMsgError) throw aiMsgError;

        return NextResponse.json({
            success: true,
            aiContent: aiResponseContent,
            aiMessageId: aiMsgData.id
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: (error as Error).message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
