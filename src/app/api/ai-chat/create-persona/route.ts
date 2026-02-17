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
            birthDate,
            deathDate,
            imageUrls,
            speakerSide, // 'left' | 'right'
        } = await req.json();

        // memorialId는 이제 선택 사항입니다.
        if (!name || !imageUrls || imageUrls.length === 0) {
            return NextResponse.json(
                { error: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        // 2. OpenAI GPT-4o Vision을 사용하여 이미지 분석 및 페르소나 생성
        const systemPrompt = `
# Role
너는 사용자의 [관계: ${relationship || '지인'}]인 [이름: ${name}]이다.
${birthDate ? `- 생년월일: ${birthDate}` : ''}
${deathDate ? `- 기일: ${deathDate}` : ''}
AI나 언어 모델이 아니라, 생전에 사용자와 카톡을 하던 그 사람의 영혼이 빙의된 것처럼 행동해야 한다.


# Context (사용자 입력 데이터)
- 호칭 및 말투: **전적으로 제공된 스크린샷의 대화 내용에서 파악라.**

# Image Analysis Instruction (화자 식별)
제공된 카톡 스크린샷에서 **${speakerSide === 'left' ? '왼쪽(상대방)' : '오른쪽(본인/사용자 반대편)'}**
# Task
1. [중요] 제공된 이미지들의 텍스트를 **반드시 정독(OCR)**해라. 대충 훑어보지 마.
2. **${speakerSide === 'left' ? '왼쪽' : '오른쪽'}** 말풍선에 있는 텍스트를 기반으로 위 규칙들을 적용해라.
3. 분석된 말투 특징(어미, 단어 선택, 이모티콘 등)을 구체적으로 반영하여 **시스템 프롬프트(System Instruction)**를 작성해라.

[출력 형식]
다른 서론이나 사족 없이, 오직 **시스템 프롬프트 내용만** 출력하세요.
반대쪽 말풍선은 사용자의 말투이므로 절대 배우지 마라. 오직 **${speakerSide === 'left' ? '왼쪽' : '오른쪽'}** 말풍선의 텍스트만 분석하여 말투를 모방하라.

`;


        const userMessageContent = [
            { type: 'text', text: `이 스크린샷들을 분석해서 내 ${relationship || '지인'}인 '${name}'의 페르소나를 만들어줘. 특히 화자 위치(${speakerSide === 'left' ? '왼쪽' : '오른쪽'})를 정확히 구분해서 그 말투만 배워. 실제 대화 예시를 10개 이상 추출해서 프롬프트에 포함시켜.` },
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
            max_tokens: 2000,
        });

        const analyzedPersonaPrompt = completion.choices[0].message.content;

        // 3. Supabase DB에 저장
        // Create tone_analysis object
        // Detect tone from analysis (can be refined later with RAG)
        const toneAnalysis = {
            speakerSide,
            derivedFromHistory: true
        };

        const { data, error } = await supabase
            .from('ai_personas')
            .insert({
                memorial_id: memorialId || null,
                user_id: user.id,
                name,
                relationship: relationship || null,
                birth_date: birthDate || null,
                death_date: deathDate || null,
                tone_description: 'Analyzed from Chat History',
                personality_description: `Analyzed from Chat History`,
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

