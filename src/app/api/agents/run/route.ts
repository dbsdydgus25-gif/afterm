// ============================================================
// POST /api/agents/run
// 에이전트 파이프라인 실행 + SSE 실시간 스트리밍
// ============================================================

import { NextRequest } from 'next/server'
import { runOrchestrator } from '@agents/orchestrator'
import type { AgentEvent } from '@agents/orchestrator'

export const runtime = 'nodejs'
export const maxDuration = 300 // Vercel Pro: 5분

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { formData, uploadedFiles } = body

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AgentEvent) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(data))
        } catch {
          // 스트림이 닫혀있으면 무시
        }
      }

      // 연결 확인 핑
      send({
        type: 'agent_log',
        agent: 'system',
        stage: 0,
        message: '에이전트 파이프라인 연결됨',
        timestamp: new Date().toISOString(),
      })

      try {
        await runOrchestrator(formData, uploadedFiles, send)
      } catch (error) {
        send({
          type: 'pipeline_error',
          agent: 'system',
          stage: 0,
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          timestamp: new Date().toISOString(),
        })
      } finally {
        // 스트림 종료 신호
        const closeEvent = `data: ${JSON.stringify({ type: 'stream_close' })}\n\n`
        controller.enqueue(encoder.encode(closeEvent))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
