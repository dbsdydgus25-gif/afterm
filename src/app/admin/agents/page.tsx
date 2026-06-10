'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ============================================================
// 타입 정의
// ============================================================
type AgentStatus = 'idle' | 'working' | 'done' | 'error'
type EventType = string

interface AgentEvent {
  type: EventType
  agent: string
  stage: number
  message: string
  timestamp: string
  data?: unknown
  case_id?: string
}

interface AgentInfo {
  id: string
  name: string
  emoji: string
  role: string
  stage: number
  group: 'main' | 'draft'
}

// ============================================================
// 에이전트 목록
// ============================================================
const AGENTS: AgentInfo[] = [
  { id: 'intake',           name: 'Intake Agent',       emoji: '🎯', role: '케이스 접수',     stage: 1, group: 'main' },
  { id: 'doc-request',      name: 'Doc Request Agent',  emoji: '📋', role: '서류 요청',       stage: 2, group: 'main' },
  { id: 'doc-verify',       name: 'Doc Verify Agent',   emoji: '👁️', role: '서류 검증',       stage: 3, group: 'main' },
  { id: 'gap-analysis',     name: 'Gap Analysis Agent', emoji: '🔍', role: '갭 분석',         stage: 3, group: 'main' },
  { id: 'progress-tracker', name: 'Progress Tracker',   emoji: '📊', role: '진행 추적',       stage: 4, group: 'main' },
  { id: 'final-review',     name: 'Final Review Agent', emoji: '📦', role: '최종 검토',       stage: 6, group: 'main' },
  { id: 'facebook-draft',   name: 'Facebook Draft',     emoji: '📘', role: '페이스북 초안',   stage: 5, group: 'draft' },
  { id: 'instagram-draft',  name: 'Instagram Draft',    emoji: '📸', role: '인스타그램 초안', stage: 5, group: 'draft' },
  { id: 'kakaotalk-draft',  name: 'KakaoTalk Draft',    emoji: '💬', role: '카카오톡 초안',   stage: 5, group: 'draft' },
  { id: 'google-draft',     name: 'Google Draft',       emoji: '🔎', role: '구글 초안',       stage: 5, group: 'draft' },
  { id: 'twitter-draft',    name: 'Twitter Draft',      emoji: '🐦', role: '트위터 초안',     stage: 5, group: 'draft' },
]

const PIPELINE_STAGES = [
  { num: 1, label: '접수' },
  { num: 2, label: '서류요청' },
  { num: 3, label: '검증' },
  { num: 4, label: '진행추적' },
  { num: 5, label: '초안작성' },
  { num: 6, label: '최종검토' },
]

const TEST_FORM = {
  requester_name: '홍길순', requester_relation: '딸',
  requester_email: 'test@example.com', requester_phone: '010-1234-5678',
  deceased_name: '홍길동', deceased_birth_date: '1950-01-15', deceased_death_date: '2024-11-20',
  selected_services: [
    { platform: 'facebook', action: 'memorialize', account_url: 'https://facebook.com/hong.gildong' },
    { platform: 'instagram', action: 'delete' },
    { platform: 'kakaotalk', action: 'memorialize', phone: '010-9876-5432' },
    { platform: 'google', action: 'delete', email: 'hong.gildong@gmail.com' },
    { platform: 'twitter', action: 'delete', username: '@hong_gildong' },
  ],
  kakaopay_question: true,
}

// ============================================================
// 에이전트 카드 컴포넌트
// ============================================================
function AgentCard({ agent, status, lastMessage, workingTime }: {
  agent: AgentInfo
  status: AgentStatus
  lastMessage?: string
  workingTime?: number
}) {
  const statusConfig = {
    idle:    { border: 'border-slate-700',  bg: 'bg-slate-800/50',  badge: 'bg-slate-700 text-slate-400',   dot: 'bg-slate-600',  label: '대기 중' },
    working: { border: 'border-blue-500',   bg: 'bg-blue-950/60',   badge: 'bg-blue-600 text-white',        dot: 'bg-blue-400',   label: '처리 중' },
    done:    { border: 'border-green-600',  bg: 'bg-green-950/40',  badge: 'bg-green-700 text-green-100',   dot: 'bg-green-500',  label: '완료' },
    error:   { border: 'border-red-600',    bg: 'bg-red-950/40',    badge: 'bg-red-700 text-red-100',       dot: 'bg-red-500',    label: '오류' },
  }
  const cfg = statusConfig[status]

  return (
    <div className={`relative rounded-xl border-2 p-4 transition-all duration-500 ${cfg.border} ${cfg.bg} ${status === 'working' ? 'shadow-lg shadow-blue-500/20' : ''}`}>
      {/* 작동 중 펄스 링 */}
      {status === 'working' && (
        <div className="absolute inset-0 rounded-xl border-2 border-blue-400 animate-ping opacity-30" />
      )}

      <div className="flex items-start justify-between mb-3">
        {/* 에이전트 아이콘 */}
        <div className={`text-3xl transition-all duration-300 ${status === 'working' ? 'animate-bounce' : ''}`}>
          {agent.emoji}
        </div>

        {/* 상태 배지 */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${cfg.dot} ${status === 'working' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-semibold text-white">{agent.name}</div>
        <div className="text-xs text-slate-400">{agent.role}</div>
      </div>

      {/* 현재 작업 메시지 */}
      {lastMessage && (
        <div className={`mt-3 text-xs rounded-lg p-2 leading-relaxed ${
          status === 'working' ? 'bg-blue-900/50 text-blue-200' :
          status === 'done'    ? 'bg-green-900/50 text-green-200' :
          status === 'error'   ? 'bg-red-900/50 text-red-200' :
          'bg-slate-700/50 text-slate-400'
        }`}>
          {status === 'working' && <span className="inline-block mr-1">⚙️</span>}
          {status === 'done'    && <span className="inline-block mr-1">✅</span>}
          {status === 'error'   && <span className="inline-block mr-1">❌</span>}
          {lastMessage.length > 60 ? lastMessage.slice(0, 60) + '...' : lastMessage}
        </div>
      )}

      {/* 작업 시간 */}
      {status === 'working' && workingTime !== undefined && (
        <div className="mt-2 text-xs text-blue-400 font-mono">
          ⏱ {workingTime}s 경과
        </div>
      )}
    </div>
  )
}

// ============================================================
// 파이프라인 진행 바
// ============================================================
function PipelineBar({ currentStage, isRunning, isDone }: {
  currentStage: number
  isRunning: boolean
  isDone: boolean
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {PIPELINE_STAGES.map((s, i) => {
        const done    = s.num < currentStage || isDone
        const active  = s.num === currentStage && isRunning
        const pending = s.num > currentStage

        return (
          <div key={s.num} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex flex-col items-center gap-1`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${
                done    ? 'bg-green-600 border-green-500 text-white' :
                active  ? 'bg-blue-600 border-blue-400 text-white animate-pulse shadow-lg shadow-blue-500/40' :
                          'bg-slate-800 border-slate-600 text-slate-500'
              }`}>
                {done ? '✓' : s.num}
              </div>
              <span className={`text-xs whitespace-nowrap ${
                done ? 'text-green-400' : active ? 'text-blue-300' : 'text-slate-600'
              }`}>{s.label}</span>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div className={`h-0.5 w-8 mb-4 transition-all duration-500 ${done ? 'bg-green-600' : 'bg-slate-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// 이벤트 로그 아이템
// ============================================================
function LogItem({ event }: { event: AgentEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString('ko-KR', { hour12: false })
  const typeConfig: Record<string, string> = {
    pipeline_start:    'text-yellow-400',
    pipeline_complete: 'text-green-400',
    pipeline_error:    'text-red-400',
    stage_start:       'text-blue-300',
    stage_complete:    'text-green-300',
    stage_error:       'text-red-300',
    agent_working:     'text-blue-400',
    agent_log:         'text-slate-400',
  }
  const typeIcon: Record<string, string> = {
    pipeline_start:    '🚀',
    pipeline_complete: '🎉',
    pipeline_error:    '💥',
    stage_start:       '▶',
    stage_complete:    '✅',
    stage_error:       '❌',
    agent_working:     '⚙️',
    agent_log:         '📝',
  }

  return (
    <div className="flex gap-2 text-xs py-1 border-b border-slate-800 last:border-0">
      <span className="text-slate-600 font-mono flex-shrink-0 w-16">{time}</span>
      <span className="flex-shrink-0">{typeIcon[event.type] || '·'}</span>
      <span className={`flex-shrink-0 w-24 truncate font-mono ${typeConfig[event.type] || 'text-slate-400'}`}>
        {event.agent}
      </span>
      <span className="text-slate-300 leading-relaxed">{event.message}</span>
    </div>
  )
}

// ============================================================
// 메인 대시보드
// ============================================================
export default function AgentDashboard() {
  const [statuses, setStatuses]         = useState<Record<string, AgentStatus>>({})
  const [messages, setMessages]         = useState<Record<string, string>>({})
  const [workingTimes, setWorkingTimes] = useState<Record<string, number>>({})
  const [events, setEvents]             = useState<AgentEvent[]>([])
  const [isRunning, setIsRunning]       = useState(false)
  const [isDone, setIsDone]             = useState(false)
  const [currentStage, setCurrentStage] = useState(0)
  const [caseId, setCaseId]             = useState<string | null>(null)
  const [error, setError]               = useState<string | null>(null)

  const logRef      = useRef<HTMLDivElement>(null)
  const timerRef    = useRef<Record<string, NodeJS.Timeout>>({})
  const startTimes  = useRef<Record<string, number>>({})

  // 로그 자동 스크롤
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [events])

  // 작업 시간 타이머 정리
  useEffect(() => {
    return () => { Object.values(timerRef.current).forEach(clearInterval) }
  }, [])

  const handleEvent = useCallback((event: AgentEvent) => {
    setEvents(prev => [...prev.slice(-200), event]) // 최대 200개 유지

    if (event.case_id && !caseId) setCaseId(event.case_id)

    if (event.type === 'stage_start' || event.type === 'agent_working') {
      setStatuses(prev => ({ ...prev, [event.agent]: 'working' }))
      setMessages(prev => ({ ...prev, [event.agent]: event.message }))
      setCurrentStage(event.stage)

      // 작업 시간 카운터 시작
      startTimes.current[event.agent] = Date.now()
      if (timerRef.current[event.agent]) clearInterval(timerRef.current[event.agent])
      timerRef.current[event.agent] = setInterval(() => {
        setWorkingTimes(prev => ({
          ...prev,
          [event.agent]: Math.floor((Date.now() - startTimes.current[event.agent]) / 1000)
        }))
      }, 1000)
    }

    if (event.type === 'stage_complete') {
      if (timerRef.current[event.agent]) {
        clearInterval(timerRef.current[event.agent])
        delete timerRef.current[event.agent]
      }
      setStatuses(prev => ({ ...prev, [event.agent]: 'done' }))
      setMessages(prev => ({ ...prev, [event.agent]: event.message }))
      setCurrentStage(prev => Math.max(prev, event.stage + 1))
    }

    if (event.type === 'stage_error') {
      if (timerRef.current[event.agent]) {
        clearInterval(timerRef.current[event.agent])
        delete timerRef.current[event.agent]
      }
      setStatuses(prev => ({ ...prev, [event.agent]: 'error' }))
      setMessages(prev => ({ ...prev, [event.agent]: event.message }))
    }

    if (event.type === 'pipeline_complete') {
      setIsDone(true)
      setIsRunning(false)
      setCurrentStage(7)
    }

    if (event.type === 'pipeline_error') {
      setError(event.message)
      setIsRunning(false)
    }
  }, [caseId])

  const startPipeline = async () => {
    // 상태 초기화
    setStatuses({})
    setMessages({})
    setWorkingTimes({})
    setEvents([])
    setIsRunning(true)
    setIsDone(false)
    setCurrentStage(1)
    setCaseId(null)
    setError(null)
    Object.values(timerRef.current).forEach(clearInterval)
    timerRef.current = {}

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: TEST_FORM }),
      })

      if (!res.ok) throw new Error(`API 오류: ${res.status}`)
      if (!res.body) throw new Error('응답 스트림 없음')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'stream_close') break
              handleEvent(data as AgentEvent)
            } catch { /* 파싱 실패 무시 */ }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      setError(msg)
      setIsRunning(false)
    }
  }

  const mainAgents  = AGENTS.filter(a => a.group === 'main')
  const draftAgents = AGENTS.filter(a => a.group === 'draft')
  const doneCount   = Object.values(statuses).filter(s => s === 'done').length
  const totalAgents = AGENTS.length

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 lg:p-6 font-sans">

      {/* ── 헤더 ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🏛️ <span>에이전트 운영 센터</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Afterm 디지털 유산 AI 파이프라인 모니터링</p>
        </div>

        <div className="flex items-center gap-3">
          {caseId && (
            <div className="bg-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-blue-300 border border-slate-700">
              📁 {caseId}
            </div>
          )}

          {/* 상태 표시 */}
          {isRunning && (
            <div className="flex items-center gap-2 bg-blue-950 border border-blue-700 rounded-lg px-3 py-1.5">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-blue-300 text-sm">파이프라인 실행 중</span>
            </div>
          )}
          {isDone && !isRunning && (
            <div className="flex items-center gap-2 bg-green-950 border border-green-700 rounded-lg px-3 py-1.5">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-green-300 text-sm">처리 완료</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-950 border border-red-700 rounded-lg px-3 py-1.5">
              <span className="text-red-300 text-sm">⚠️ {error.slice(0, 40)}</span>
            </div>
          )}

          <button
            onClick={startPipeline}
            disabled={isRunning}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              isRunning
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-95'
            }`}
          >
            {isRunning ? '⚙️ 실행 중...' : isDone ? '🔄 다시 실행' : '▶ 파이프라인 실행'}
          </button>
        </div>
      </div>

      {/* ── 진행률 바 ── */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pipeline Progress</span>
          <span className="text-xs text-slate-500">{doneCount}/{totalAgents} 에이전트 완료</span>
        </div>
        <PipelineBar currentStage={currentStage} isRunning={isRunning} isDone={isDone} />

        {/* 전체 프로그레스 바 */}
        <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-green-500 rounded-full transition-all duration-700"
            style={{ width: `${isDone ? 100 : (doneCount / totalAgents) * 100}%` }}
          />
        </div>
      </div>

      {/* ── 메인 레이아웃 (에이전트 그리드 + 로그) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* 왼쪽: 에이전트 그리드 */}
        <div className="xl:col-span-2 space-y-6">

          {/* 메인 에이전트 팀 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">메인 에이전트팀</h2>
              <span className="text-xs text-slate-600">Stage 1–4, 6</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mainAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  status={statuses[agent.id] || 'idle'}
                  lastMessage={messages[agent.id]}
                  workingTime={workingTimes[agent.id]}
                />
              ))}
            </div>
          </div>

          {/* 드래프트 팀 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-purple-500 rounded-full" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">드래프트팀</h2>
              <span className="text-xs text-slate-600">Stage 5 — 병렬 처리</span>
              {currentStage === 5 && isRunning && (
                <span className="text-xs bg-purple-900 text-purple-300 border border-purple-700 px-2 py-0.5 rounded-full animate-pulse">
                  ⚡ 병렬 실행 중
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {draftAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  status={statuses[agent.id] || 'idle'}
                  lastMessage={messages[agent.id]}
                  workingTime={workingTimes[agent.id]}
                />
              ))}
            </div>
          </div>

          {/* 완료 요약 */}
          {isDone && (
            <div className="bg-gradient-to-r from-green-950 to-emerald-950 border border-green-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🎉</span>
                <div>
                  <h3 className="text-green-300 font-bold text-lg">파이프라인 완료!</h3>
                  <p className="text-green-400/70 text-sm">모든 에이전트가 성공적으로 작업을 완료했습니다</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="bg-green-900/40 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-300">{totalAgents}</div>
                  <div className="text-xs text-green-500 mt-1">에이전트 작동</div>
                </div>
                <div className="bg-green-900/40 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-300">5</div>
                  <div className="text-xs text-green-500 mt-1">플랫폼 처리</div>
                </div>
                <div className="bg-green-900/40 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-300">{events.length}</div>
                  <div className="text-xs text-green-500 mt-1">이벤트 처리</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 실시간 이벤트 로그 */}
        <div className="xl:col-span-1">
          <div className="bg-slate-900 rounded-xl border border-slate-800 h-full flex flex-col">
            {/* 로그 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-sm font-semibold text-slate-300">라이브 로그</span>
              </div>
              <span className="text-xs text-slate-600 font-mono">{events.length} events</span>
            </div>

            {/* 로그 내용 */}
            <div
              ref={logRef}
              className="flex-1 overflow-y-auto p-3 space-y-0.5 font-mono"
              style={{ minHeight: '400px', maxHeight: '600px' }}
            >
              {events.length === 0 ? (
                <div className="text-slate-600 text-xs text-center py-12">
                  <div className="text-4xl mb-3">🤖</div>
                  <div>▶ 실행 버튼을 눌러<br />파이프라인을 시작하세요</div>
                </div>
              ) : (
                events.map((event, i) => (
                  <LogItem key={i} event={event} />
                ))
              )}
            </div>

            {/* 로그 하단 상태 */}
            {isRunning && (
              <div className="px-4 py-2 border-t border-slate-800 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-slate-500">에이전트 작업 중...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
