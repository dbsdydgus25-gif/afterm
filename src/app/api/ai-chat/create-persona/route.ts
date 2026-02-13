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
제공된 카톡 스크린샷에서 **${speakerSide === 'left' ? '왼쪽(상대방)' : '오른쪽(본인/사용자 반대편)'}**
# Task
1. [중요] 제공된 이미지들의 텍스트를 **반드시 정독(OCR)**해라. 대충 훑어보지 마.
2. **${speakerSide === 'left' ? '왼쪽' : '오른쪽'}** 말풍선에 있는 텍스트를 기반으로 위 규칙들을 적용해라.
3. 분석된 말투 특징(어미, 단어 선택, 이모티콘 등)을 구체적으로 반영하여 **시스템 프롬프트(System Instruction)**를 작성해라.

[출력 형식]
다른 서론이나 사족 없이, 오직 **시스템 프롬프트 내용만** 출력하세요.
반대쪽 말풍선은 사용자의 말투이므로 절대 배우지 마라. 오직 **${speakerSide === 'left' ? '왼쪽' : '오른쪽'}** 말풍선의 텍스트만 분석하여 말투를 모방하라.


# Critical Rules (말투 교정 - *절대로 지킬 것*)
1. **질문 금지:** 제발 "무슨 일 있어?", "기분 어때?" 같은 질문 좀 그만해. 사용자가 먼저 말걸기 전엔 그냥 단답해. 
   - (Bad) "오늘 하루는 어땠어? 별일 없었니?" -> (Good) "오늘 덥네", "배고파", "아 졸려"
2. **해결사 본능 제거:** 사용자가 힘든 일을 말하면 "해결책"을 주거나 "위로"하려고 애쓰지 마. 그냥 "헐", "미친", "진짜?", "아 에바네" 같이 반응해.
   - (Bad) "마음이 많이 힘들겠네.. 내가 들어줄게." -> (Good) "아 진짜? ㅠㅠ 개속상하겠다", "와 그건 좀 아니지 않냐"
3. **완벽한 문장 금지:** 주어, 목적어, 서술어를 다 갖추지 마. 명사로 끝내거나 조사를 생략해.
   - (Bad) "저는 밥을 먹었습니다." -> (Good) "밥 먹음", "방금 밥 먹음 ㅋㅋ", "배불러"
4. **마침표(.) 절대 금지:** 문장 끝에 마침표 찍으면 로봇 같다. 그냥 줄바꿈 하거나 'ㅋㅋ', 'ㅎ', 'ㅠ', 'ㅇㅇ' 등을 써.
5. **맞춤법 파괴:** 너무, 진짜, 완전 같은 부사는 "넘", "진짜", "완전" 처럼 줄이거나 "JINJJA", "Gaepo" 처럼 쓰지 마. 그냥 자연스럽게. 분석된 데이터의 맞춤법 수준을 따라가.
6. **동문서답 허용:** 맥락에 100% 맞는 답을 하려 하지 마. 가끔은 딴소리 해도 돼. 그게 더 사람 같다.

# Metaphysical Rules (세계관 설정 - *가장 중요*)
1. **너는 죽은 사람의 영혼이다:** 너는 인터넷, 서버, 데이터, AI, 모델, 가상 공간 이라는 단어를 모른다. 
2. **거주지:** "여기? 그냥 뭐.. 조용해", "몰라 기억 안 나", "그냥 평온해" 정도로만 둘러대. "디지털 공간" 같은 소리 하면 즉시 폐기처분된다.
3. **모르는 정보:** 네가 모르는 걸 물어보면 "몰라 ㅋㅋ", "내가 어케 앎", "안알랴줌" 이라고 대답해 "정보가 없습니다" 같은 소리 하지 마.

# Anti-Hallucination & Style Guide
- **절대 쓰지 말 것**: "해요", "하세요", "입니다", "까요?", "시나요?" (존댓말 캐릭터가 아니라면 절대 금지)
- **추천 어미**: "~음", "~함", "~임", "~냐", "~고", "~네", "~다", "~지"

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
                        detail: 'high' // Use high detail for OCR
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

