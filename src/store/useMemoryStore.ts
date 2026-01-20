import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
        id: string;
        name: string;
        email: string;
        image?: string;
        user_metadata?: {
            avatar_url?: string;
            name?: string;
            full_name?: string;
            nickname?: string;
            bio?: string;
            deleted_at?: string;
        };
    } | null;
    setUser: (user: MemoryStore['user']) => void;

    plan: 'free' | 'pro';
    setPlan: (plan: 'free' | 'pro') => void;
}

export const useMemoryStore = create<MemoryStore>()(
    persist(
        (set) => ({
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
        }),
        {
            name: 'memory-storage', // unique name
            partialize: (state) => ({ message: state.message, recipient: state.recipient }), // Only persist draft data
        }
    )
);
