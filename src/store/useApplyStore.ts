// 에프텀 MVP1 - Zustand 신청 플로우 전역 상태
// 스텝 간 데이터 유지를 위한 클라이언트 상태 관리

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ServiceItem } from '@/lib/services-catalog'

// 신청 스텝 정의
export type ApplyStep = 0 | 1 | 2 | 3

// 선택된 서비스 (계정 정보 포함)
export interface SelectedService extends ServiceItem {
  accountId?: string       // 고인 아이디 (모르면 undefined)
  accountUnknown: boolean  // '모름' 체크 여부
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
  // 현재 스텝
  currentStep: ApplyStep

  // 생성된 case ID (DB에 저장 후)
  caseId: string | null

  // 고인 정보
  deceasedInfo: DeceasedInfo

  // 선택된 서비스 목록
  selectedServices: SelectedService[]

  // 서류 업로드 완료 여부
  documentsUploaded: {
    death_cert: boolean
    family_cert: boolean
    id_card: boolean
  }

  // 위임장 정보
  delegation: DelegationInfo | null

  // 액션
  setStep: (step: ApplyStep) => void
  setCaseId: (id: string) => void
  setDeceasedInfo: (info: Partial<DeceasedInfo>) => void
  toggleService: (service: ServiceItem) => void
  updateServiceAccount: (serviceId: string, accountId: string, unknown: boolean) => void
  setDocumentUploaded: (type: keyof ApplyStore['documentsUploaded'], value: boolean) => void
  setDelegation: (delegation: DelegationInfo) => void
  resetStore: () => void
}

const initialState = {
  currentStep: 0 as ApplyStep,
  caseId: null,
  deceasedInfo: { name: '', birthDate: '', deathDate: '', phone: '' },
  selectedServices: [],
  documentsUploaded: { death_cert: false, family_cert: false, id_card: false },
  delegation: null,
}

export const useApplyStore = create<ApplyStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      setCaseId: (id) => set({ caseId: id }),

      setDeceasedInfo: (info) =>
        set((state) => ({ deceasedInfo: { ...state.deceasedInfo, ...info } })),

      toggleService: (service) =>
        set((state) => {
          const exists = state.selectedServices.find(s => s.id === service.id)
          if (exists) {
            // 이미 선택된 경우 제거
            return { selectedServices: state.selectedServices.filter(s => s.id !== service.id) }
          } else {
            // 새로 추가
            return {
              selectedServices: [
                ...state.selectedServices,
                { ...service, accountUnknown: false }
              ]
            }
          }
        }),

      updateServiceAccount: (serviceId, accountId, unknown) =>
        set((state) => ({
          selectedServices: state.selectedServices.map(s =>
            s.id === serviceId
              ? { ...s, accountId: unknown ? undefined : accountId, accountUnknown: unknown }
              : s
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
        deceasedInfo: state.deceasedInfo,
        selectedServices: state.selectedServices,
        documentsUploaded: state.documentsUploaded,
        delegation: state.delegation,
      }),
    }
  )
)
