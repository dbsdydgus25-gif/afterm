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

# Task
제공된 카톡 스크린샷을 분석하여 다음 두 가지를 수행하라.

1. **System Prompt 작성**: AI가 고인의 페르소나를 완벽히 연기할 수 있도록 구체적인 지침을 작성하라.
   - 말투(어미, 맞춤법, 띄어쓰기 습관), 주로 쓰는 단어, 이모티콘 사용 패턴.
   - **반드시** ${speakerSide === 'left' ? '왼쪽(상대방)' : '오른쪽(본인)'} 말풍선만 분석하라.

2. **Dialogue Examples 추출**: 스크린샷에서 **실제 대화 내용(Q&A 쌍 또는 단독 발화)**을 10개 이상 추출하라.
   - 이 데이터는 나중에 AI가 비슷한 상황에서 과거 말투를 참고(RAG)하는 데 사용된다.
   - 최대한 원본 그대로(오타, 띄어쓰기 포함) 추출하라.

[출력 형식 - JSON Only]
반드시 아래 JSON 포맷으로만 출력하라. 마크다운 코드블럭(\`\`\`json) 안에 넣어서 출력하라.

\`\`\`json
{
  "systemPrompt": "여기에 시스템 프롬프트 내용을 작성...",
  "dialogueExamples": [
    "밥 먹었냐? -> 아니 아직 ㅋㅋ",
    "오늘 날씨 미쳤네",
    "야 나와 술 먹게 -> ㅇㅇ 어디로 감?"
  ]
}
\`\`\`
`;

        const userMessageContent = [
            { type: 'text', text: `이 스크린샷들을 분석해서 내 ${relationship || '지인'}인 '${name}'의 페르소나 데이터를 추출해줘. 화자 위치(${speakerSide === 'left' ? '왼쪽' : '오른쪽'}) 정확히 지켜.` },
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
                        detail: 'high'
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
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessageContent as unknown as string },
            ],
            max_tokens: 3000,
            temperature: 0.2, // JSON 추출을 위해 창의성 낮춤
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content || '{}';
        let parsedData;
        try {
            parsedData = JSON.parse(content);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            // Fallback: Try to clean markdown
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
            parsedData = JSON.parse(cleaned);
        }

        const analyzedPersonaPrompt = parsedData.systemPrompt || "분석 실패. 기본 페르소나로 설정합니다.";
        const dialogueExamples: string[] = parsedData.dialogueExamples || [];

        // 3. Supabase DB에 저장 (Persona)
        const toneAnalysis = {
            speakerSide,
            derivedFromHistory: true
        };

        const { data: personaData, error } = await supabase
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
                tone_analysis: toneAnalysis as any
            })
            .select()
            .single();

        if (error) throw error;

        // 4. Vector Ingestion (Dialogue Examples)
        if (dialogueExamples.length > 0) {
            console.log(`Ingesting ${dialogueExamples.length} vectors...`);

            // Generate Embeddings in batch
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: dialogueExamples,
            });

            const vectors = embeddingResponse.data.map((item, index) => ({
                persona_id: personaData.id,
                content: dialogueExamples[index],
                embedding: item.embedding,
                metadata: { source: 'initial_analysis' }
            }));

            const { error: vectorError } = await supabase
                .from('memorial_vectors')
                .insert(vectors);

            if (vectorError) console.error('Vector Insert Error:', vectorError);
        }

        return NextResponse.json({ success: true, personaId: personaData.id });

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

