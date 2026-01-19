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

    user: {
        name: string;
        email: string;
    } | null;
    setUser: (user: MemoryStore['user']) => void;

    plan: 'free' | 'pro';
    setPlan: (plan: 'free' | 'pro') => void;
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

    // User State
    user: null,
    setUser: (user: MemoryStore['user']) => set({ user }),

    // Plan State
    plan: 'free',
    setPlan: (plan: 'free' | 'pro') => set({ plan }),
}));
