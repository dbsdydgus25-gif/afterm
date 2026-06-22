'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface DocScannerProps {
  onCapture: (file: File) => void
  onClose: () => void
  label?: string
}

export default function DocScanner({ onCapture, onClose, label = '문서' }: DocScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [captured, setCaptured] = useState<string | null>(null)
  const [error, setError] = useState('')

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play()
          setReady(true)
        }
      }
    } catch {
      setError('카메라 접근 권한이 필요합니다.\n설정에서 카메라 권한을 허용해 주세요.')
    }
  }, [])

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [startCamera])

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const vw = video.videoWidth
    const vh = video.videoHeight

    // 화면에서 스캔 프레임 비율 계산 (세로 화면 기준 A4 비율)
    const frameW = Math.round(vw * 0.88)
    const frameH = Math.round(frameW * 1.414)
    const frameX = Math.round((vw - frameW) / 2)
    const frameY = Math.round((vh - frameH) / 2)

    canvas.width = frameW
    canvas.height = frameH
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, frameX, frameY, frameW, frameH, 0, 0, frameW, frameH)

    // 스캔 효과: 그레이스케일 + 대비 강화
    const imageData = ctx.getImageData(0, 0, frameW, frameH)
    const d = imageData.data
    for (let i = 0; i < d.length; i += 4) {
      const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114
      // 대비 강화 (대비 1.4 × 밝기 1.05)
      const v = Math.min(255, Math.max(0, (gray - 128) * 1.4 + 128 + 13))
      d[i] = v; d[i + 1] = v; d[i + 2] = v
    }
    ctx.putImageData(imageData, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setCaptured(dataUrl)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const retake = () => {
    setCaptured(null)
    setReady(false)
    startCamera()
  }

  const confirm = () => {
    if (!captured) return
    fetch(captured)
      .then(r => r.blob())
      .then(blob => {
        const file = new File([blob], `scan_${label}_${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
      })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: '#000',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
    }}>
      {/* 상단 바 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: 'env(safe-area-inset-top, 16px) 20px 16px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
          width: 40, height: 40, color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
        <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{label} 스캔</span>
        <div style={{ width: 40 }} />
      </div>

      {!captured ? (
        <>
          {/* 카메라 영상 */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* 스캔 프레임 오버레이 */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {/* 어두운 마스크 4방향 */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

            {/* 스캔 프레임 (A4 비율) */}
            <div style={{
              position: 'relative',
              width: '88%',
              aspectRatio: '1 / 1.414',
              zIndex: 2,
            }}>
              {/* 프레임 내부 투명 박스로 마스크 오버라이드 */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'transparent',
                boxShadow: '0 0 0 2000px rgba(0,0,0,0.55)',
                borderRadius: 8,
                border: '2px solid rgba(255,255,255,0.8)',
              }} />
              {/* 네 모서리 가이드 */}
              {[
                { top: -2, left: -2, borderTop: '3px solid #38BDF8', borderLeft: '3px solid #38BDF8' },
                { top: -2, right: -2, borderTop: '3px solid #38BDF8', borderRight: '3px solid #38BDF8' },
                { bottom: -2, left: -2, borderBottom: '3px solid #38BDF8', borderLeft: '3px solid #38BDF8' },
                { bottom: -2, right: -2, borderBottom: '3px solid #38BDF8', borderRight: '3px solid #38BDF8' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 28, height: 28, borderRadius: 2, ...s }} />
              ))}
              {/* 안내 텍스트 */}
              <div style={{
                position: 'absolute', bottom: -44, left: 0, right: 0, textAlign: 'center',
                color: '#fff', fontSize: 13, fontWeight: 600,
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}>
                {label}을(를) 프레임 안에 맞춰주세요
              </div>
            </div>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 16, padding: 32,
            }}>
              <div style={{ fontSize: 48 }}>📷</div>
              <p style={{ color: '#fff', textAlign: 'center', lineHeight: 1.6, fontSize: 15 }}>{error}</p>
              <button onClick={onClose} style={{
                background: '#2563EB', color: '#fff', border: 'none', borderRadius: 12,
                padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}>닫기</button>
            </div>
          )}

          {/* 하단 컨트롤 */}
          {ready && !error && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
              padding: '20px 32px calc(env(safe-area-inset-bottom, 0px) + 32px)',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* 촬영 버튼 */}
              <button onClick={capture} style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#fff', border: '4px solid rgba(255,255,255,0.5)',
                cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.1s',
              }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '3px solid #000' }} />
              </button>
            </div>
          )}
        </>
      ) : (
        /* 촬영 결과 확인 */
        <>
          <img
            src={captured}
            alt="촬영 결과"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            padding: '20px 24px calc(env(safe-area-inset-bottom, 0px) + 24px)',
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
            display: 'flex', gap: 12,
          }}>
            <button onClick={retake} style={{
              flex: 1, padding: '15px', borderRadius: 14,
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            }}>다시 찍기</button>
            <button onClick={confirm} style={{
              flex: 2, padding: '15px', borderRadius: 14,
              background: '#2563EB', border: 'none',
              color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            }}>이 사진 사용하기</button>
          </div>
        </>
      )}

      {/* 숨겨진 캔버스 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
