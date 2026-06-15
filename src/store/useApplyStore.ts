// 에프텀 MVP1 - Zustand 신청 플로우 전역 상태
// 스텝 간 데이터 유지를 위한 클라이언트 상태 관리

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ServiceItem, TrackType } from '@/lib/services-catalog'

// 신청 스텝 정의
export type ApplyStep = 0 | 1 | 2 | 3

// 선택된 서비스 (트랙 + 계정 정보 포함)
export interface SelectedService extends ServiceItem {
  track: TrackType             // 'delete' | 'memorial'
  fieldValues: Record<string, string>  // 트랙별 입력값
  // 레거시 호환
  accountId?: string
  accountUnknown: boolean
  selectedAction?: string
}

// 고인 기본 정보
export interface DeceasedInfo {
  name: string
  birthDate: string   // YYYY-MM-DD
  deathDate: string   // YYYY-MM-DD
  phone: string
}

// 위임장 정보
export interface DelegationInfo {
  delegatorName: string       // 유족 이름
  delegatorRelation: string   // 고인과의 관계
  signatureData: string       // base64 서명 이미지
}

interface ApplyStore {
  currentStep: ApplyStep
  caseId: string | null
  selectedTrack: TrackType | null   // 'delete' | 'memorial' — 먼저 선택
  deceasedInfo: DeceasedInfo
  selectedServices: SelectedService[]
  documentsUploaded: Record<string, boolean>
  delegation: DelegationInfo | null

  setStep: (step: ApplyStep) => void
  setSelectedTrack: (track: TrackType) => void
  setCaseId: (id: string) => void
  setDeceasedInfo: (info: Partial<DeceasedInfo>) => void
  toggleService: (service: ServiceItem, track: TrackType) => void
  updateServiceTrack: (serviceId: string, track: TrackType) => void
  updateServiceAccount: (serviceId: string, accountId: string, unknown: boolean) => void
  updateServiceField: (serviceId: string, key: string, value: string) => void
  updateServiceAction: (serviceId: string, action: string) => void
  setDocumentUploaded: (type: string, value: boolean) => void
  setDelegation: (delegation: DelegationInfo) => void
  resetStore: () => void
}

const initialState = {
  currentStep: 0 as ApplyStep,
  caseId: null,
  selectedTrack: null as TrackType | null,
  deceasedInfo: { name: '', birthDate: '', deathDate: '', phone: '' },
  selectedServices: [],
  documentsUploaded: {},
  delegation: null,
}

export const useApplyStore = create<ApplyStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      setSelectedTrack: (track) => set({ selectedTrack: track, selectedServices: [] }),
      setCaseId: (id) => set({ caseId: id }),

      setDeceasedInfo: (info) =>
        set((state) => ({ deceasedInfo: { ...state.deceasedInfo, ...info } })),

      toggleService: (service, track) =>
        set((state) => {
          const exists = state.selectedServices.find(s => s.id === service.id)
          if (exists) {
            return { selectedServices: state.selectedServices.filter(s => s.id !== service.id) }
          } else {
            return {
              selectedServices: [
                ...state.selectedServices,
                { ...service, track, accountUnknown: false, fieldValues: {} }
              ]
            }
          }
        }),

      updateServiceTrack: (serviceId, track) =>
        set((state) => ({
          selectedServices: state.selectedServices.map(s =>
            s.id === serviceId ? { ...s, track, fieldValues: {} } : s
          )
        })),

      updateServiceAccount: (serviceId, accountId, unknown) =>
        set((state) => ({
          selectedServices: state.selectedServices.map(s =>
            s.id === serviceId
              ? { ...s, accountId: unknown ? undefined : accountId, accountUnknown: unknown }
              : s
          )
        })),

      updateServiceField: (serviceId, key, value) =>
        set((state) => ({
          selectedServices: state.selectedServices.map(s =>
            s.id === serviceId
              ? { ...s, fieldValues: { ...s.fieldValues, [key]: value } }
              : s
          )
        })),

      updateServiceAction: (serviceId, action) =>
        set((state) => ({
          selectedServices: state.selectedServices.map(s =>
            s.id === serviceId ? { ...s, selectedAction: action } : s
          )
        })),

      setDocumentUploaded: (type, value) =>
        set((state) => ({
          documentsUploaded: { ...state.documentsUploaded, [type]: value }
        })),

      setDelegation: (delegation) => set({ delegation }),

      resetStore: () => set(initialState),
    }),
    {
      name: 'afterm-apply-store', // localStorage 키
      // caseId가 있으면 persist, 없으면 초기화
      partialize: (state) => ({
        currentStep: state.currentStep,
        caseId: state.caseId,
        selectedTrack: state.selectedTrack,
        deceasedInfo: state.deceasedInfo,
        selectedServices: state.selectedServices,
        documentsUploaded: state.documentsUploaded,
        delegation: state.delegation,
      }),
    }
  )
)
