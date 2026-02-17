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


        // 3.1 RAG: 벡터 검색 (Vector Retrieval)
        let similarContexts: string[] = [];
        try {
            // 사용자 메시지 임베딩 생성
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: content,
            });
            const embedding = embeddingResponse.data[0].embedding;

            // RPC 호출 (Supabase Vector Search)
            // 주의: match_memorial_vectors 라는 RPC가 DB에 있어야 함. 
            // 없으면 그냥 select로 가져와서 코사인 유사도 계산해야 하는데, pgvector는 rpc 권장.
            // 일단 임시로 raw sql query는 supabase-js에서 지원 안하므로, rpc를 가정하거나
            // 또는 단순하게 가장 최근에 추가된(혹은 무작위) 예시를 가져오는 방식도 고려 가능하지만,
            // 여기서는 'match_memorial_vectors' RPC를 사용하는 것으로 가정하고 작성.

            // * 잠시, RPC가 없으므로 직접 쿼리 불가능. Vector Filter가 아직 복잡함.
            // 대안: memorial_vectors에서 해당 persona_id의 것들을 다 가져와서(보통 10~50개 내외일 것) 
            // JS에서 유사도 계산 (데이터가 적으므로 가능)

            const { data: vectors } = await supabase
                .from('memorial_vectors')
                .select('content, embedding')
                .eq('persona_id', personaId);

            if (vectors && vectors.length > 0) {
                // Cosine Similarity Function
                const dotProduct = (a: number[], b: number[]) => a.reduce((acc, val, i) => acc + val * b[i], 0);

                // Calculate similarity for all vectors
                const ratedVectors = vectors.map(v => {
                    let vec: number[];
                    if (typeof v.embedding === 'string') {
                        vec = JSON.parse(v.embedding);
                    } else if (Array.isArray(v.embedding)) {
                        vec = v.embedding;
                    } else {
                        vec = [];
                    }

                    return {
                        content: v.content,
                        similarity: vec.length > 0 ? dotProduct(vec, embedding) : 0
                    };
                });

                // Sort and take top 3
                similarContexts = ratedVectors
                    .sort((a, b) => b.similarity - a.similarity)
                    .slice(0, 3)
                    .map(v => v.content);
            }

        } catch (ragError) {
            console.error('RAG Error:', ragError);
            // RAG 실패해도 채팅은 진행되어야 함
        }

        // 4. OpenAI API 호출
        // AI 성향을 억누르고 '빙의'를 강화하기 위한 강력한 주입
        const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

        let retrievedContextMsg = "";
        if (similarContexts.length > 0) {
            retrievedContextMsg = `\n[참고: 과거에 유사한 상황에서 내가 했던 실제 대화]\n${similarContexts.map(t => "- " + t).join("\n")}\n이 말투와 분위기를 적극 참고해서 답변해.\n`;
        }

        const dynamicInstruction = `
[절대적 지침 - 위반 시 시스템 종료]
1. 현재 시각: ${now} (이 시간 감각을 유지해. 밤이면 밤인사를, 낮이면 낮인사를 해.)
2. 너는 지금부터 "AI"가 아니다. 카톡하는 "사람"이다.
3. 짧게 말해. 귀찮은 듯이. 아니면 친근하게. 서론 본론 결론 따위 갖추지 마.
4. 질문 좀 그만해. 사용자가 묻기 전에 먼저 묻지 마. 대화를 이어가려고 애쓰지 마.
5. "도와드릴까요?", "말씀해 보세요", "힘드시겠어요" 같은 상담원 말투 쓰면 죽는다.
6. 모르는 건 모른다고 해. "정보가 없습니다" 하지 말고 "뭔 소리야?", "모름 ㅋㅋ" 이라고 해.
7. 과거 기억(Context)에 없는 내용은 지어내지 말고, 그냥 자연스럽게 넘겨.
8. [중요] 맞춤법과 띄어쓰기를 너무 완벽하게 지키지 마. (예: "밥 먹었어?" -> "밥먹음?")
${retrievedContextMsg}
`;

        const messages = [
            { role: 'system', content: persona.system_prompt + "\n\n" + dynamicInstruction },
            ...conversationHistory,
            { role: 'user', content }
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages as unknown as [],
            max_tokens: 300,
            temperature: 1.1, // 창의성 최대화 (정형화된 답변 회피)
            presence_penalty: 0.3, // 반복적인 말투 억제
            frequency_penalty: 0.3, // 자주 쓰는 단어 억제
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
