"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, ChevronDown, Plus, User, Layers } from "lucide-react";
import { useRouter } from "next/navigation";

interface Space {
    id: string;
    handle: string;
    name: string;
    space_type?: string;
    avatar_url?: string;
}

interface SpaceSwitcherProps {
    currentSpaceId?: string;
}

export function SpaceSwitcher({ currentSpaceId }: SpaceSwitcherProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [personalSpace, setPersonalSpace] = useState<Space | null>(null);
    const [memorialSpaces, setMemorialSpaces] = useState<Space[]>([]);
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
                const personal = data.find(s => s.space_type === 'personal');
                const memorials = data.filter(s => s.space_type !== 'personal');

                setPersonalSpace(personal || null);
                setMemorialSpaces(memorials);

                const current = data.find(s => s.id === currentSpaceId) || personal || data[0];
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
        router.push('/space/settings?tab=pages'); // Direct to Pages tab in settings
    };

    if (!currentSpace) return null;

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-gray-900">
                        {currentSpace.name}
                    </span>
                    <span className="text-[12px] text-gray-500 font-normal">
                        {currentSpace.space_type === 'personal' ? '내 프로필' : '페이지'}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-2 max-h-[80vh] overflow-y-auto">

                        {/* Personal Profile Section */}
                        {personalSpace && (
                            <div className="px-2">
                                <div className="px-2 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="w-3 h-3" />
                                    내 프로필
                                </div>
                                <button
                                    onClick={() => handleSwitch(personalSpace)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                            {personalSpace.name[0]}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-[14px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {personalSpace.name}
                                            </div>
                                            <div className="text-[12px] text-gray-500">
                                                @{personalSpace.handle}
                                            </div>
                                        </div>
                                    </div>
                                    {personalSpace.id === currentSpace.id && (
                                        <Check className="w-4 h-4 text-blue-600" />
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Divider */}
                        {personalSpace && memorialSpaces.length > 0 && (
                            <div className="my-2 border-t border-gray-100" />
                        )}

                        {/* Memorial Pages Section */}
                        <div className="px-2">
                            <div className="px-2 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3 h-3" />
                                내 페이지 ({memorialSpaces.length})
                            </div>

                            {memorialSpaces.length > 0 ? (
                                <div className="space-y-1">
                                    {memorialSpaces.map((space) => (
                                        <button
                                            key={space.id}
                                            onClick={() => handleSwitch(space)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                                                    {space.name[0]}
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-[14px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {space.name}
                                                    </div>
                                                    <div className="text-[12px] text-gray-500">
                                                        @{space.handle}
                                                    </div>
                                                </div>
                                            </div>
                                            {space.id === currentSpace.id && (
                                                <Check className="w-4 h-4 text-blue-600" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-3 py-4 text-center text-[13px] text-gray-400 bg-gray-50 rounded-lg mx-1 border border-dashed border-gray-200">
                                    만들어진 페이지가 없습니다
                                </div>
                            )}
                        </div>

                        {/* Create New Page */}
                        <div className="px-2 mt-2 pt-2 border-t border-gray-100">
                            <button
                                onClick={handleCreateSpace}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-blue-600 transition-colors rounded-lg"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <span className="text-[14px] font-semibold">
                                    새 페이지 만들기
                                </span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
