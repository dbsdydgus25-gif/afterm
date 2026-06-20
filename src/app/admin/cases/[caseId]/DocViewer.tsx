'use client'

import { useState } from 'react'

interface DocumentItem {
  doc_type: string
  file_name?: string
  storage_path: string
  public_url: string
}

interface DocViewerProps {
  documents: DocumentItem[]
  signatureData?: string
  delegatorName?: string
  delegatorRelation?: string
}

const DOC_NAMES: Record<string, string> = {
  death_cert: '사망진단서',
  family_cert: '가족관계증명서',
  id_card: '신청인 신분증',
  signature: '위임장 전자서명',
}

export default function DocViewer({ documents, signatureData, delegatorName, delegatorRelation }: DocViewerProps) {
  const [activeTab, setActiveTab] = useState<string>('death_cert')
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  // 사망진단서, 가족관계증명서, 신분증, 전자서명 리스트 구성
  const tabs = [
    { key: 'death_cert', label: DOC_NAMES.death_cert, type: 'file' },
    { key: 'family_cert', label: DOC_NAMES.family_cert, type: 'file' },
    { key: 'id_card', label: DOC_NAMES.id_card, type: 'file' },
    { key: 'signature', label: DOC_NAMES.signature, type: 'signature' },
  ]

  const activeDoc = documents.find(d => d.doc_type === activeTab)

  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-line-normal-normal)', paddingBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-label-strong)', margin: 0 }}>
          📁 증빙 서류 및 위임장 검토
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--color-label-alternative)', fontWeight: 600 }}>이미지 클릭 시 전체화면 확대</span>
      </div>

      {/* ── 탭 메뉴 ── */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--color-line-solid-normal)', paddingBottom: '8px' }}>
        {tabs.map(tab => {
          const hasData = tab.key === 'signature' ? !!signatureData : documents.some(d => d.doc_type === tab.key)
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 14px', borderRadius: '8px', border: 'none',
                background: isActive ? 'var(--color-coolNeutral-96)' : 'transparent',
                color: isActive ? 'var(--color-primary-normal)' : hasData ? 'var(--color-label-neutral)' : 'var(--color-label-disable)',
                fontSize: '13px', fontWeight: isActive || hasData ? 700 : 500,
                cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>{hasData ? '●' : '○'}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── 탭 본문 (이미지 노출 영역) ── */}
      <div style={{
        background: 'var(--color-coolNeutral-99)', borderRadius: '12px',
        border: '1px solid var(--color-line-normal-alternative)',
        height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative'
      }}>
        {/* 다운로드 버튼 */}
        {activeTab !== 'signature' && activeDoc && (
          <a
            href={activeDoc.public_url}
            download={activeDoc.file_name || `${DOC_NAMES[activeTab]}.jpg`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'absolute', top: 12, right: 12, zIndex: 10,
              background: '#2563EB', color: '#fff', borderRadius: 8,
              padding: '7px 14px', fontSize: 12, fontWeight: 700,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ⬇ 다운로드
          </a>
        )}

        {activeTab === 'signature' ? (
          signatureData ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{
                background: '#fff', border: '1px solid var(--color-line-solid-normal)',
                padding: '24px', borderRadius: '12px', maxWidth: '300px', margin: '0 auto', boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ fontSize: '13px', color: 'var(--color-label-alternative)', marginBottom: '8px', fontWeight: 600 }}>
                  위임 서명 사본
                </div>
                <img
                  src={signatureData}
                  alt="전자 서명"
                  onClick={() => setLightboxImg(signatureData)}
                  style={{ width: '150px', height: 'auto', display: 'block', margin: '0 auto', cursor: 'zoom-in' }}
                />
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-label-strong)', marginTop: '16px' }}>
                  위임인: {delegatorName || '-'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-label-alternative)', marginTop: '4px' }}>
                  관계: {delegatorRelation || '-'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--color-label-alternative)', fontSize: '14px', fontWeight: 600 }}>
              전자 서명이 존재하지 않습니다.
            </div>
          )
        ) : (
          activeDoc ? (
            <img
              src={activeDoc.public_url}
              alt={DOC_NAMES[activeTab]}
              onClick={() => setLightboxImg(activeDoc.public_url)}
              style={{
                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'zoom-in',
                transition: 'transform 0.2s',
                filter: activeTab === 'death_cert' ? 'grayscale(100%) contrast(1.4) brightness(1.05)' : 'none',
              }}
            />
          ) : (
            <div style={{ color: 'var(--color-label-alternative)', fontSize: '14px', fontWeight: 600 }}>
              업로드된 {DOC_NAMES[activeTab]} 파일이 존재하지 않습니다.
            </div>
          )
        )}
      </div>

      {/* ── 라이트박스 (전체화면 모달) ── */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out', padding: '24px'
          }}
        >
          <img
            src={lightboxImg}
            alt="원본 서류 확대"
            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: '8px',
              filter: activeTab === 'death_cert' ? 'grayscale(100%) contrast(1.4) brightness(1.05)' : 'none',
            }}
          />
          <button
            onClick={() => setLightboxImg(null)}
            style={{
              position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none',
              color: '#fff', fontSize: '32px', cursor: 'pointer', fontWeight: 300
            }}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  )
}
