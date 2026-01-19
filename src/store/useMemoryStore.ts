import { create } from 'zustand';

interface MemoryStore {
    message: string;
    setMessage: (message: string) => void;
    recipient: {
        name: string;
        phone: string;
        relationship: string;
    };
    setRecipient: (recipient: Partial<MemoryStore['recipient']>) => void;
}

export const useMemoryStore = create<MemoryStore>((set) => ({
    message: '',
    setMessage: (message) => set({ message }),
    recipient: {
        name: '',
        phone: '',
        relationship: '',
    },
    setRecipient: (recipient) =>
        set((state) => ({
            recipient: { ...state.recipient, ...recipient }
        })),
}));
