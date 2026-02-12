import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { personaId, content } = await req.json();
        const supabase = createClient();

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
        const { data: history, error: historyError } = await supabase
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
            { role: 'system', content: persona.system_prompt },
            ...conversationHistory,
            { role: 'user', content }
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages as any,
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

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
