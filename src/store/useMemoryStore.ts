import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MemoryStore {
    message: string;
    messageId: string | null; // For tracking edits
    setMessage: (message: string) => void;
    setMessageId: (id: string | null) => void;
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

    file: File | null;
    setFile: (file: File | null) => void;
}

export const useMemoryStore = create<MemoryStore>()(
    persist(
        (set) => ({
            message: '',
            messageId: null,
            setMessage: (message) => set({ message }),
            setMessageId: (messageId) => set({ messageId }),
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

            // File State (Not persisted to localStorage to avoid serialize issues)
            file: null,
            setFile: (file) => set({ file }),
        }),
        {
            name: 'memory-storage', // unique name
            partialize: (state) => ({ message: state.message, recipient: state.recipient, messageId: state.messageId }), // Only persist draft data (exclude file)
        }
    )
);
