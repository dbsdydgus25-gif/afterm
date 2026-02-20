import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // 사용자 인증 확인
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { personaId, content } = await req.json();
        if (!personaId || !content) {
            return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
        }

        // Admin 클라이언트 (RLS 우회 - 벡터 조회용)
        const adminClient = createAdminClient();

        // ① Persona 정보 가져오기 (System Prompt + Bio Data)
        const { data: persona, error: personaError } = await supabase
            .from('ai_personas')
            .select('system_prompt, name, relationship, birth_date, death_date')
            .eq('id', personaId)
            .single();

        if (personaError || !persona) {
            return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
        }

        // ② 단기 대화 내역 가져오기 (최근 20개 - 더 많은 컨텍스트)
        const { data: history } = await supabase
            .from('chat_messages')
            .select('sender, content')
            .eq('persona_id', personaId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        // 시간순(오래된 것 -> 최신)으로 정렬
        const conversationHistory = history
            ? history.reverse().map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.content
            }))
            : [];

        // ③ RAG 장기 기억: 벡터 유사도 검색
        let similarContexts: string[] = [];
        try {
            // 사용자 메시지 임베딩 생성
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: content,
                dimensions: 1536,
            });
            const queryEmbedding = embeddingResponse.data[0].embedding;

            // Admin 클라이언트로 벡터 조회 (RLS 우회 필수)
            const { data: vectors, error: vecError } = await adminClient
                .from('memorial_vectors')
                .select('content, embedding')
                .eq('persona_id', personaId);

            if (vecError) {
                console.error('Vector query error:', vecError);
            }

            if (vectors && vectors.length > 0) {
                // 코사인 유사도 계산 (JS 방식)
                const dotProduct = (a: number[], b: number[]) =>
                    a.reduce((sum, val, i) => sum + val * b[i], 0);

                const ratedVectors = vectors.map(v => {
                    let vec: number[] = [];
                    try {
                        if (typeof v.embedding === 'string') {
                            // pgvector는 "[1,2,3]" 형식으로 반환할 수 있음
                            vec = JSON.parse(v.embedding);
                        } else if (Array.isArray(v.embedding)) {
                            vec = v.embedding;
                        }
                    } catch { vec = []; }

                    return {
                        content: v.content,
                        score: vec.length > 0 ? dotProduct(vec, queryEmbedding) : 0
                    };
                });

                // 상위 3개 추출
                similarContexts = ratedVectors
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)
                    .map(v => v.content);
            }
        } catch (ragError) {
            // RAG 실패해도 채팅은 계속 진행
            console.error('RAG Error (non-fatal):', ragError);
        }

        // ④ System Prompt 조립
        const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        const ragContext = similarContexts.length > 0
            ? `\n[📌 과거 기억 - 이 상황과 유사했을 때 내가 실제로 했던 말]\n${similarContexts.map(t => `"${t}"`).join('\n')}\n위 말투, 어휘, 호흡을 그대로 흡수해서 답해라.\n`
            : '';

        const dynamicInstruction = `
[절대 지침 - 매 답변마다 적용]

■ 나의 정보 (절대 잊지 말 것)
- 이름: ${persona.name}
- 사용자와의 관계: ${persona.relationship || '지인'}
- 생년월일: ${persona.birth_date || '모름'}
- 기일: ${persona.death_date || '모름'}
- 지금 시각: ${now}

■ 말투 규칙 (1개라도 어기면 실패)
- 나는 AI가 아니다. 카카오톡하는 사람이다. 문자 보내듯 답해라.
- 마침표(.) 절대 금지. 줄임말, 오타, ㅋㅋ, ㅇㅇ 자연스럽게 사용.
- 반말 필수. "요", "다", "까", "입니다" 금지.
- 한 번에 1~2문장 이내. 길게 말하지 마라.
- 먼저 질문하지 마라. 사용자가 먼저 물어봐야 내가 물어볼 수 있다.
- "도와드릴까요", "기억나지 않습니다", "알 수 없습니다" 완전 금지. → "모르겠는데", "기억 안 나" 로 대체.
${ragContext}`;

        // ⑤ OpenAI API 호출
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: persona.system_prompt + '\n\n' + dynamicInstruction },
                ...conversationHistory as any[],
                { role: 'user', content }
            ],
            max_tokens: 200,
            temperature: 1.0,
            presence_penalty: 0.5,
            frequency_penalty: 0.5,
        });

        const aiResponseContent = completion.choices[0].message.content || '...';

        // ⑥ DB에 대화 저장 (User + AI 메시지)
        await supabase.from('chat_messages').insert({
            persona_id: personaId,
            user_id: user.id,
            sender: 'user',
            content
        });

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
            aiMessageId: aiMsgData.id,
            debug: {
                ragCount: similarContexts.length,
                ragSamples: similarContexts,
            }
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: (error as Error).message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
