import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { memorialId, name, tone, personality, imageUrls } = await req.json();

        if (!memorialId || !name || !imageUrls || imageUrls.length === 0) {
            return NextResponse.json(
                { error: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        // 1. OpenAI GPT-4o Vision을 사용하여 이미지 분석 및 페르소나 생성
        const systemPrompt = `
당신은 지금부터 '${name}'이라는 인물의 페르소나가 되어야 합니다.
사용자가 제공한 카카오톡 대화 스크린샷과 설명(말투, 성격)을 바탕으로,
이 인물의 말투, 단어 선택, 이모티콘 사용 습관, 성격 등을 완벽하게 모방하세요.

[사용자 입력 정보]
- 이름: ${name}
- 말투 설명: ${tone}
- 성격 설명: ${personality}

[분석 요청]
제공된 이미지(카카오톡 대화 내용)를 분석하여 이 사람의 대화 스타일을 파악하세요.
- 자주 쓰는 감탄사나 어미
- 띄어쓰기 습관
- 맞춤법 수준
- 대화의 길이 (단답형 vs 장문형)
- 이모티콘 사용 빈도

[최종 목표]
당신은 이 분석 결과를 바탕으로, 앞으로 사용자와 1:1 채팅을 할 때 '${name}' 그 자체가 되어 대화해야 합니다.
절대로 "AI 어쩌구", "분석 결과에 따르면" 같은 말을 하지 마세요.
오직 '${name}'이 되어 자연스럽게 대화하세요.
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
                    content: userMessageContent as any,
                },
            ],
            max_tokens: 1000,
        });

        const analyzedPersonaPrompt = completion.choices[0].message.content;

        // 2. Supabase DB에 저장
        const supabase = createClient();

        const { data, error } = await supabase
            .from('ai_personas')
            .insert({
                memorial_id: memorialId,
                name,
                tone_description: tone,
                personality_description: personality,
                system_prompt: analyzedPersonaPrompt, // GPT가 생성한 구체적인 지침 저장
                source_data: imageUrls,
            })
            .select()
            .single();

        if (error) {
            console.error('Database Error:', error);
            throw error;
        }

        return NextResponse.json({ success: true, personaId: data.id });
    } catch (error: any) {
        console.error('Error in create-persona:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
