"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Space {
    id: string;
    handle: string;
    name: string;
    space_type?: string;
}

interface SpaceSwitcherProps {
    currentSpaceId?: string;
}

export function SpaceSwitcher({ currentSpaceId }: SpaceSwitcherProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [currentSpace, setCurrentSpace] = useState<Space | null>(null);

    useEffect(() => {
        const fetchSpaces = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { data } = await supabase
                .from('spaces')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: true });

            if (data) {
                setSpaces(data);
                const current = data.find(s => s.id === currentSpaceId) || data[0];
                setCurrentSpace(current);
            }
        };

        fetchSpaces();
    }, [currentSpaceId]);

    const handleSwitch = (space: Space) => {
        setIsOpen(false);
        router.push(`/space/${space.handle}`);
    };

    const handleCreateSpace = () => {
        setIsOpen(false);
        router.push('/space/create');
    };

    const getSpaceLabel = (space: Space) => {
        return space.space_type === 'memorial' ? '기억공간' : '내 공간';
    };

    if (!currentSpace) return null;

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <span className="text-[15px] font-semibold text-gray-900">
                    {getSpaceLabel(currentSpace)}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                        {spaces.map((space) => (
                            <button
                                key={space.id}
                                onClick={() => handleSwitch(space)}
                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                            >
                                <div className="text-left">
                                    <div className="text-[14px] font-semibold text-gray-900">
                                        {getSpaceLabel(space)}
                                    </div>
                                    <div className="text-[12px] text-gray-500">
                                        {space.name}
                                    </div>
                                </div>
                                {space.id === currentSpace.id && (
                                    <Check className="w-4 h-4 text-blue-600" />
                                )}
                            </button>
                        ))}

                        {/* Create New Memorial Space */}
                        <div className="border-t border-gray-100 mt-2 pt-2">
                            <button
                                onClick={handleCreateSpace}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-blue-600 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-[14px] font-semibold">
                                    새 기억공간 만들기
                                </span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
