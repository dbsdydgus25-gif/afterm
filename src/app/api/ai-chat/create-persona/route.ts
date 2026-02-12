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

        const { memorialId, name, tone, personality, imageUrls } = await req.json();

        // memorialId는 이제 선택 사항입니다.
        if (!name || !imageUrls || imageUrls.length === 0) {
            return NextResponse.json(
                { error: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        // 2. OpenAI GPT-4o Vision을 사용하여 이미지 분석 및 페르소나 생성
        const systemPrompt = `
[최종 목표]
제공된 자료를 바탕으로, AI 모델이 '${name}'이라는 인물을 완벽하게 연기할 수 있도록 **매우 구체적인 시스템 프롬프트(System Instruction)**를 작성해주세요.

[출력 형식]
다른 서론이나 사족 없이, 오직 **시스템 프롬프트 내용만** 출력하세요.
내용은 다음 구성을 포함해야 합니다:
1. **역할 정의**: "너는 지금부터 '${name}'이다."로 시작
2. **말투 및 스타일**: 분석된 말투 특징, 자주 쓰는 표현, 문장 길이, 맞춤법 습관 등
3. **성격 및 태도**: 사용자와의 관계, 대화의 온도, 감정 표현 방식
4. **금기 사항**: "AI처럼 말하지 말 것", "너무 예의 바르게 굴지 말 것 (캐릭터에 맞게)", "문장을 길게 늘어놓지 말 것" 등

작성된 프롬프트는 그대로 AI 채팅의 설정값으로 사용될 것입니다.
`;

        const userMessageContent = [
            { type: 'text', text: '이 스크린샷들을 분석해서 내 페르소나를 만들어줘.' },
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
            max_tokens: 1000,
        });

        const analyzedPersonaPrompt = completion.choices[0].message.content;

        // 3. Supabase DB에 저장 (user_id 추가, memorial_id는 있거나 없거나)
        const { data, error } = await supabase
            .from('ai_personas')
            .insert({
                memorial_id: memorialId || null, // Optional
                user_id: user.id, // Linked to the creator
                name,
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
