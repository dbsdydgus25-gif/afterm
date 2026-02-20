import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // 사용자 인증 확인 (필수)
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin 클라이언트 (벡터 INSERT에 필요 - RLS 우회)
        const adminClient = createAdminClient();

        const {
            memorialId,
            name,
            relationship,
            birthDate,
            deathDate,
            imageUrls,
            speakerSide, // 'left' | 'right'
        } = await req.json();

        if (!name || !imageUrls || imageUrls.length === 0) {
            return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
        }

        // ① GPT-4o Vision 분석용 System Prompt
        const analysisSystemPrompt = `
너는 카카오톡 대화 스크린샷을 분석하는 전문가다.
분석 대상: ${speakerSide === 'left' ? '왼쪽' : '오른쪽'} 말풍선의 화자 "${name}" (${relationship || '지인'})
${birthDate ? `생년월일: ${birthDate}` : ''}
${deathDate ? `기일: ${deathDate}` : ''}

다음 두 가지를 수행하라.

1. **system_prompt 작성** (이 사람을 완벽히 흉내 내는 AI 지침):
   - 말끝 어미 패턴 (예: "~임", "~냐", "ㅇㅇ 알겠어")
   - ㅋㅋ/ㅎㅎ/ㅠ 등 감탄사/이모티콘 패턴
   - 맞춤법 습관 (띄어쓰기 없이 씀, 오타 많음 등)
   - 자주 쓰는 단어와 표현
   - 대화 길이 패턴 (짧게 끊어서 말함, 길게 말함)
   - 이 사람이 절대로 안 쓸 표현도 명시

2. **dialogue_examples 추출** (이미지에서 실제 발화 10개 이상):
   - 상대방 질문 -> 이 사람의 답 형식으로 추출
   - 이 사람의 단독 발화도 포함
   - 오타, 띄어쓰기 실수까지 원본 그대로 보존

출력 형식 (JSON만 출력, 설명 없이):
{
  "system_prompt": "여기에 페르소나 지침...",
  "dialogue_examples": [
    "상대: 밥 먹었어? -> 나: 아니 아직 ㅋㅋ 배고파",
    "나: ㅇㅇ 알겠음",
    "상대: 어디야? -> 나: 집 왜"
  ]
}
`;

        // ② 이미지를 Base64로 변환
        const userMessageContent: any[] = [
            { type: 'text', text: `이 스크린샷들을 분석해서 ${speakerSide === 'left' ? '왼쪽' : '오른쪽'} 화자 "${name}"의 페르소나 데이터를 추출해줘.` }
        ];

        console.log(`Processing ${imageUrls.length} images...`);
        let successCount = 0;
        for (const url of imageUrls) {
            try {
                const imageResponse = await fetch(url);
                if (!imageResponse.ok) {
                    console.error(`Failed to fetch image: ${url}`);
                    continue;
                }
                const arrayBuffer = await imageResponse.arrayBuffer();
                const base64Image = Buffer.from(arrayBuffer).toString('base64');
                const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

                userMessageContent.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${contentType};base64,${base64Image}`,
                        detail: 'high'
                    }
                });
                successCount++;
            } catch (imgError) {
                console.error(`Error processing image ${url}:`, imgError);
            }
        }

        if (successCount === 0) {
            return NextResponse.json({ error: '이미지를 불러오는 데 실패했습니다.' }, { status: 400 });
        }

        // ③ GPT-4o 분석 실행
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: analysisSystemPrompt },
                { role: 'user', content: userMessageContent }
            ],
            max_tokens: 3000,
            temperature: 0.1, // 분석의 일관성을 위해 낮게
            response_format: { type: 'json_object' }
        });

        const rawContent = completion.choices[0].message.content || '{}';
        let parsedData: { system_prompt?: string; dialogue_examples?: string[] } = {};
        try {
            parsedData = JSON.parse(rawContent);
        } catch {
            // JSON 파싱 실패 시 마크다운 제거 후 재시도
            const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            try { parsedData = JSON.parse(cleaned); } catch { /* 무시 */ }
        }

        const analyzedPrompt = parsedData.system_prompt || '분석 실패. 기본 페르소나로 설정합니다.';
        const dialogueExamples: string[] = parsedData.dialogue_examples || [];

        console.log(`Analysis complete. Got ${dialogueExamples.length} dialogue examples.`);

        // ④ ai_personas DB에 저장
        const { data: personaData, error: personaInsertError } = await supabase
            .from('ai_personas')
            .insert({
                memorial_id: memorialId || null,
                user_id: user.id,
                name,
                relationship: relationship || null,
                birth_date: birthDate || null,
                death_date: deathDate || null,
                tone_description: 'Analyzed from Chat History',
                personality_description: 'Analyzed from Chat History',
                system_prompt: analyzedPrompt,
                source_data: imageUrls,
                tone_analysis: { speakerSide, derivedFromHistory: true }
            })
            .select()
            .single();

        if (personaInsertError) throw personaInsertError;

        // ⑤ 대화 예시 → Embedding → memorial_vectors에 저장 (Admin client 사용)
        if (dialogueExamples.length > 0) {
            console.log(`Generating embeddings for ${dialogueExamples.length} examples...`);
            try {
                const embeddingResponse = await openai.embeddings.create({
                    model: 'text-embedding-3-small',
                    input: dialogueExamples,
                    dimensions: 1536,
                });

                const vectorRows = embeddingResponse.data.map((item, index) => ({
                    persona_id: personaData.id,
                    content: dialogueExamples[index],
                    embedding: JSON.stringify(item.embedding), // pgvector 호환 형식
                    metadata: { source: 'initial_analysis', index }
                }));

                // Admin 클라이언트로 INSERT (RLS 우회 필수!)
                const { error: vectorError } = await adminClient
                    .from('memorial_vectors')
                    .insert(vectorRows);

                if (vectorError) {
                    console.error('Vector Insert Error:', vectorError);
                } else {
                    console.log(`✅ ${vectorRows.length} vectors saved successfully.`);
                }
            } catch (embeddingError) {
                // Embedding 실패해도 페르소나 생성은 완료로 처리
                console.error('Embedding generation failed (non-fatal):', embeddingError);
            }
        }

        return NextResponse.json({
            success: true,
            personaId: personaData.id,
            debug: {
                dialogueExamplesCount: dialogueExamples.length,
                imagesProcessed: successCount
            }
        });

    } catch (error) {
        console.error('Error in create-persona:', error);
        if (error instanceof OpenAI.APIError) {
            console.error('OpenAI API Error:', error.status, error.message);
        }
        return NextResponse.json(
            { error: (error as Error).message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
