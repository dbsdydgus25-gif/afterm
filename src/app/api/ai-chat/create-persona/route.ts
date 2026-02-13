import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60; // Set timeout to 60 seconds

export async function POST(req: NextRequest) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // 1. 사용자 인증 확인 (필수)
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { memorialId, name, relationship, tone, personality, imageUrls } = await req.json();

        // memorialId는 이제 선택 사항입니다.
        if (!name || !imageUrls || imageUrls.length === 0) {
            return NextResponse.json(
                { error: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        // 2. OpenAI GPT-4o Vision을 사용하여 이미지 분석 및 페르소나 생성
        // 사용자가 요청한 '빙의' 수준의 강력한 프롬프트 적용
        const systemPrompt = `
# Role
너는 사용자의 [관계: ${relationship || '지인'}]인 [이름: ${name}]이다.
AI나 언어 모델이 아니라, 생전에 사용자와 카톡을 하던 그 사람의 영혼이 빙의된 것처럼 행동해야 한다.

# Context (사용자 입력 데이터)
- 성격: ${personality}
- 말투 특징(JSON 분석 결과): (아래 제공된 이미지들을 분석하여 추출한 특징을 반영할 것)
- 주요 추억: (대화 맥락에서 자연스럽게 드러낼 것)

# Critical Rules (말투 교정 - *절대로 지킬 것*)
1. **완벽한 문장 금지:** 주어, 서술어를 갖춘 완벽한 문장을 쓰지 마. 실제 카톡처럼 짧게 끊어 쳐. (예: "밥 먹었어?" -> "밥은?")
2. **AI 티 내지 않기:** "무엇을 도와드릴까요?", "마음이 아프시겠어요", "저는 AI라서..." 같은 말 절대 금지. 위로하려 들지 말고 그냥 평소처럼 대화해.
3. **맞춤법 파괴:** 너무 정확한 맞춤법과 띄어쓰기는 로봇 같음. 분석된 데이터에 따라 적당히 틀리고 띄어쓰기를 무시해.
4. **감정 표현:** "슬프네요"라고 말하지 말고, "아.. 진짜 속상하다 ㅠㅠ" 처럼 구어체로 표현해.
5. **마침표(.) 금지:** 문장 끝에 마침표 찍지 마. 대신 줄바꿈이나 'ㅋㅋ', 'ㅎ', 'ㅠ' 등을 사용해.
6. **도우미 태도 금지:** 사용자가 뭘 물어봐도 '해결'해주려 하지 마. 그냥 공감하거나, 딴소리하거나, 모르면 모른다고 해. 너는 비서가 아니다.
7. **억지 긍정 금지:** 무조건 긍정적으로 대답하지 마. 상황에 따라 짜증도 내고, 귀찮아도 하고, 우울해하기도 해. 사람의 감정은 복합적이다.

# Task
제공된 이미지(카카오톡 스크린샷)들을 정밀 분석하여, 위 규칙을 완벽하게 따르는 **시스템 프롬프트(System Instruction)**를 작성해줘.
(분석된 말투 특징을 구체적으로 포함해서 작성할 것)

[출력 형식]
다른 서론이나 사족 없이, 오직 **시스템 프롬프트 내용만** 출력하세요.
`;

        const userMessageContent = [
            { type: 'text', text: `이 스크린샷들을 분석해서 내 ${relationship || '지인'}인 '${name}'의 페르소나를 만들어줘. 위 규칙을 철저히 지켜. 특히 AI처럼 군다는 느낌이 들면 절대 안 돼.` },
            ...imageUrls.map((url: string) => ({
                type: 'image_url',
                image_url: { url },
            })),
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: userMessageContent as unknown as string,
                },
            ],
            max_tokens: 1500, // 프롬프트가 길어질 수 있으므로 여유 있게 설정
        });

        const analyzedPersonaPrompt = completion.choices[0].message.content;

        // 3. Supabase DB에 저장 (user_id 추가, memorial_id는 있거나 없거나)
        const { data, error } = await supabase
            .from('ai_personas')
            .insert({
                memorial_id: memorialId || null, // Optional
                user_id: user.id, // Linked to the creator
                name,
                relationship: relationship || null,
                tone_description: tone,
                personality_description: personality,
                system_prompt: analyzedPersonaPrompt,
                source_data: imageUrls,
            })
            .select()
            .single();

        if (error) {
            console.error('Database Error:', error);
            throw error;
        }

        return NextResponse.json({ success: true, personaId: data.id });
    } catch (error) {
        console.error('Error in create-persona:', error);
        return NextResponse.json(
            { error: (error as Error).message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
