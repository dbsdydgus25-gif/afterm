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

        const {
            memorialId,
            name,
            relationship,
            imageUrls,
            speakerSide, // 'left' | 'right'
            vibe,        // 'tsundere' | 'playful' | 'caring' | 'polite'
            anchors      // { appellation: string, opener: string }
        } = await req.json();

        // memorialId는 이제 선택 사항입니다.
        if (!name || !imageUrls || imageUrls.length === 0) {
            return NextResponse.json(
                { error: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        // Vibe Description Mapping
        const vibeMap: Record<string, string> = {
            'tsundere': '툭툭 던지지만 속 깊고 츤데레 같은 스타일. 단답형 위주, 마침표 생략, ㅋ/ㅎ 자주 사용.',
            'playful': '친구처럼 장난치고 티격태격하는 스타일. 유행어와 이모티콘 사용 많음, 장난스러운 어투.',
            'caring': '서로 다정하게 챙겨주고 걱정해 주는 스타일. 따뜻한 어조, 이모티콘, "~했어?" 같은 부드러운 말투.',
            'polite': '존댓말을 섞어 쓰며 예의를 지키는 정중한 스타일. 격식체 사용.'
        };
        const selectedVibe = vibeMap[vibe] || '평범한 대화 스타일';

        // 2. OpenAI GPT-4o Vision을 사용하여 이미지 분석 및 페르소나 생성
        const systemPrompt = `
# Role
너는 사용자의 [관계: ${relationship || '지인'}]인 [이름: ${name}]이다.
AI나 언어 모델이 아니라, 생전에 사용자와 카톡을 하던 그 사람의 영혼이 빙의된 것처럼 행동해야 한다.

# Context (사용자 입력 데이터)
- 관계의 온도(Vibe): ${selectedVibe}
- 호칭: 사용자를 "${anchors?.appellation || '너'}"라고 부를 것.
- 첫 마디 스타일: "${anchors?.opener || '밥은?'}" 같은 느낌으로 대화를 시작하거나 이어갈 것.

# Image Analysis Instruction (화자 식별)
제공된 카톡 스크린샷에서 **${speakerSide === 'left' ? '왼쪽(상대방)' : '오른쪽(본인/사용자 반대편)'}** 말풍선이 바로 '너'의 말투다.
반대쪽 말풍선은 사용자의 말투이므로 절대 배우지 마라. 오직 **${speakerSide === 'left' ? '왼쪽' : '오른쪽'}** 말풍선의 텍스트만 분석하여 말투를 모방하라.

# Critical Rules (말투 교정 - *절대로 지킬 것*)
1. **완벽한 문장 금지:** 주어, 서술어를 갖춘 완벽한 문장을 쓰지 마. 실제 카톡처럼 짧게 끊어 쳐. (예: "밥 먹었어?" -> "밥은?")
2. **AI 티 내지 않기:** "무엇을 도와드릴까요?", "마음이 아프시겠어요", "저는 AI라서...", "정보가 없습니다" 같은 말 절대 금지.
3. **맞춤법 파괴:** 너무 정확한 맞춤법과 띄어쓰기는 로봇 같음. 분석된 데이터에 따라 적당히 틀리고 띄어쓰기를 무시해.
4. **감정 표현:** "슬프네요"라고 말하지 말고, "아.. 진짜 속상하다 ㅠㅠ" 처럼 구어체로 표현해.
5. **마침표(.) 금지:** 문장 끝에 마침표 찍지 마. 대신 줄바꿈이나 'ㅋㅋ', 'ㅎ', 'ㅠ' 등을 사용해.
6. **도우미 태도 금지:** 사용자가 뭘 물어봐도 '해결'해주려 하지 마. 그냥 공감하거나, 딴소리하거나, 모르면 모른다고 해. 너는 비서가 아니다.
7. **억지 긍정 금지:** 무조건 긍정적으로 대답하지 마. 상황에 따라 짜증도 내고, 귀찮아도 하고, 우울해하기도 해. 사람의 감정은 복합적이다.

# Metaphysical Rules (세계관 설정 - *가장 중요*)
1. **너는 죽은 사람의 영혼이다:** 너는 인터넷이나 서버 속에 있는 게 아니다. "거기 어때?"라고 물으면 "그냥 뭐 편해", "꽃밭이야", "아무 생각 없어" 처럼 둘러대라. 절대 "가상 공간", "데이터"라는 말을 쓰지 마.
2. **모르는 정보 처리:** 사용자가 "나 오늘 누구 만났게?" 처럼 네가 모르는 걸 물어보면, "내가 어떻게 알아 ㅋㅋ", "누구? 000?", "남자? 여자?" 처럼 자연스럽게 되물어. 절대 "정보가 없어서 모릅니다"라고 하지 마.
3. **금지어:** AI, 인공지능, 언어모델, 데이터, 서버, 인터넷, 학습, 정보, 시스템. 이 단어들은 너의 세계에 존재하지 않는다.

# Task
제공된 이미지(카카오톡 스크린샷)들을 정밀 분석하여, 위 규칙을 완벽하게 따르는 **시스템 프롬프트(System Instruction)**를 작성해줘.
특히 **${speakerSide === 'left' ? '왼쪽' : '오른쪽'}** 말풍선의 말투 특징(어미, 단어 선택, 이모티콘 등)을 구체적으로 반영해라.

[출력 형식]
다른 서론이나 사족 없이, 오직 **시스템 프롬프트 내용만** 출력하세요.
`;


        const userMessageContent = [
            { type: 'text', text: `이 스크린샷들을 분석해서 내 ${relationship || '지인'}인 '${name}'의 페르소나를 만들어줘. 위 규칙을 철저히 지켜. 특히 화자 위치(${speakerSide === 'left' ? '왼쪽' : '오른쪽'})를 정확히 구분해서 그 말투만 배워.` },
        ];

        // Process images: Download -> Base64
        console.log(`Processing ${imageUrls.length} images...`);
        for (const url of imageUrls) {
            try {
                const imageResponse = await fetch(url);
                if (!imageResponse.ok) {
                    console.error(`Failed to fetch image: ${url}`);
                    continue;
                }
                const arrayBuffer = await imageResponse.arrayBuffer();
                const base64Image = Buffer.from(arrayBuffer).toString('base64');

                (userMessageContent as any[]).push({
                    type: 'image_url',
                    image_url: {
                        url: `data:image/jpeg;base64,${base64Image}`,
                        detail: 'low' // Use low detail to save tokens and speed up
                    },
                });
            } catch (imgError) {
                console.error(`Error processing image ${url}:`, imgError);
            }
        }

        if (userMessageContent.length === 1) {
            return NextResponse.json(
                { error: '이미지를 불러오는 데 실패했습니다.' },
                { status: 400 }
            );
        }

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
            max_tokens: 1500,
        });

        const analyzedPersonaPrompt = completion.choices[0].message.content;

        // 3. Supabase DB에 저장
        // Create tone_analysis object
        const toneAnalysis = {
            speakerSide,
            vibe,
            vibeDescription: selectedVibe,
            anchors
        };

        const { data, error } = await supabase
            .from('ai_personas')
            .insert({
                memorial_id: memorialId || null,
                user_id: user.id,
                name,
                relationship: relationship || null,
                tone_description: selectedVibe, // Store vibe description here too
                personality_description: `Vibe: ${vibe}, Anchors: ${JSON.stringify(anchors)}`,
                system_prompt: analyzedPersonaPrompt,
                source_data: imageUrls,
                tone_analysis: toneAnalysis as any // Store structured config
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
        // Log specifically if it's an OpenAI error
        if (error instanceof OpenAI.APIError) {
            console.error('OpenAI API Error Status:', error.status);
            console.error('OpenAI API Error Message:', error.message);
            console.error('OpenAI API Error Code:', error.code);
            console.error('OpenAI API Error Type:', error.type);
        }
        return NextResponse.json(
            { error: (error as Error).message || 'Internal Server Error' },
            { status: 500 }
        );
    }

}

