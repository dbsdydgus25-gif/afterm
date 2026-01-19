import { create } from 'zustand';

export interface Post {
    id: string;
    authorName: string;
    content: string;
    date: string;
    likes: number;
}

export interface Memorial {
    id: string;
    name: string;
    birthDate: string;
    deathDate: string;
    bio: string;
    profileImage: string;
    coverImage: string;
    posts: Post[];
}

interface MemorialStore {
    memorials: Memorial[];
    getMemorial: (id: string) => Memorial | undefined;
    addPost: (memorialId: string, post: Omit<Post, 'id' | 'date' | 'likes'>) => void;
}

const MOCK_MEMORIALS: Memorial[] = [
    {
        id: '1',
        name: '김철수',
        birthDate: '1980.05.12',
        deathDate: '2025.12.10',
        bio: '따뜻한 미소로 언제나 우리 곁을 지켜주었던 당신을 기억합니다.',
        profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        coverImage: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=2070&auto=format&fit=crop',
        posts: [
            {
                id: 'p1',
                authorName: '이영희',
                content: '철수야, 네가 떠난 지 벌써 한 달이 지났네. 아직도 믿기지가 않아. 하늘에서는 아프지 말고 행복해라.',
                date: '2025.12.20',
                likes: 5,
            },
            {
                id: 'p2',
                authorName: '박민수',
                content: '형, 지난번 같이 갔던 낚시터 기억나? 거기서 형이 잡아줬던 매운탕 진짜 맛있었는데.. 보고싶다 형.',
                date: '2025.12.25',
                likes: 12,
            }
        ]
    },
    {
        id: '2',
        name: '이미영',
        birthDate: '1992.08.20',
        deathDate: '2026.01.05',
        bio: '세상에서 가장 밝게 빛나던 별, 영원히 우리 마음에.',
        profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        coverImage: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b0?q=80&w=2560&auto=format&fit=crop',
        posts: [
            {
                id: 'p3',
                authorName: '김지훈',
                content: '미영아, 너의 웃음소리가 아직도 귓가에 맴돌아. 사랑해, 영원히 잊지 않을게.',
                date: '2026.01.10',
                likes: 8,
            }
        ]
    }
];

export const useMemorialStore = create<MemorialStore>((set, get) => ({
    memorials: MOCK_MEMORIALS,
    getMemorial: (id) => get().memorials.find((m) => m.id === id),
    addPost: (memorialId, post) => set((state) => ({
        memorials: state.memorials.map((m) => {
            if (m.id === memorialId) {
                return {
                    ...m,
                    posts: [
                        {
                            id: Math.random().toString(36).substr(2, 9),
                            date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
                            likes: 0,
                            ...post
                        },
                        ...m.posts
                    ]
                };
            }
            return m;
        })
    }))
}));
