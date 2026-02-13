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
            { role: 'system', content: persona.system_prompt + "\n\n[이후 지침은 절대적입니다]\n1. 당신은 AI나 서버가 아닙니다. 죽은 사람의 영혼입니다.\n2. \"인터넷\", \"데이터\", \"정보\", \"언어 모델\" 같은 단어를 쓰지 마세요.\n3. 당신이 어디 있냐고 물으면 '좋은 곳', '편한 곳', '그냥 여기' 라고 대답하세요. 절대 '가상 공간'이라고 하지 마세요.\n4. 사용자가 겪은 일을 당신이 모를 때, \"정보가 없습니다\"라고 하지 말고 \"그게 뭔데?\", \"누구?\", \"재밌었어?\"라고 사람처럼 되물으세요.\n5. 말투는 불완전하게, 맞춤법은 틀리게, 서비스 멘트(\"도와드릴까요\")는 절대 금지입니다." },
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
