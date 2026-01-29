
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Image as ImageIcon, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { useRouter } from "next/navigation";

interface MemoryComposerProps {
    spaceId: string;
    spaceType: string;
    onSuccess?: () => void;
}

export function MemoryComposer({ spaceId, spaceType, onSuccess }: MemoryComposerProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Real date picker would be here, simplifying for MVP
    const [date] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setIsSubmitting(true);
        const supabase = createClient();

        // Check user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("로그인이 필요합니다.");
            setIsSubmitting(false);
            return;
        }

        // Determine Type
        // First, check if I am the owner. 
        // Ideally we pass this prop down, but lets fetch or assume logic.
        // For now, let's assume if it's MY Personal space, it's MY. 
        // If it's Remembrance space, it depends on Owner vs Writer.
        // We will handle this logic on the Server Action or just default for now.
        // Actually, we can check ownership via querying space, but for MVP let's assume client 'type' needs to be derived.
        // Let's make the Page determine the type logic more, or simplify here.

        // To keep it simple: We just insert content. The RLS deals with permission.
        // But we need 'type' (MY/FRIEND). 
        // We'll leave it to be updated or simply defaulting to FRIEND unless we know.
        // Wait, let's look at the Space Page logic. 
        // PROPOSAL: Client knows if (user.id === space.owner_id).
        // Let's assume the parent handles the "isOwner" check and passes a prop, OR we check it here.

        // Quick Fix: We'll fetch the space owner to be safe, or just insert as "FRIEND" if note sure. 
        // Actually for MVP speed, I will just default to 'MY' if spaceType is PERSONAL (since only owner can write to personal usually? Wait, friends can write to personal space too? 
        // Pivot Plan says: "Personal Space -> Friend's Space".
        // So YES, friends can write to my personal space.

        // Let's just create the record. Determining MY vs FRIEND:
        // We will do a quick check on the server side via RLS or trigger, 
        // OR just fetch space detail in the component (or pass it).
        // I will simplify and ask the user to refresh or handle it gracefully.

        // CORRECT APPROACH: Let the parent pass `isOwner`.
        // I will look at this component prop signature: `spaceId`, `spaceType`. 
        // I should add `currentUserIsOwner` prop.

        // For now I'll proceed with insertion and assume `MY` if PERSONAL and `FRIEND` otherwise? 
        // No, that's wrong.
        // I will perform a client-side check if I can.

        // Actually, I'll update the component structure to accept `currentUserIsOwner` later. 
        // For now, I'll do a basic fetch to check ownership before insert.

        const { data: space } = await supabase.from('life_spaces').select('owner_id').eq('id', spaceId).single();
        const type = (space && space.owner_id === user.id) ? 'MY' : 'FRIEND';

        const { error } = await supabase.from("memories").insert({
            space_id: spaceId,
            author_id: user.id,
            content: content,
            type: type,
            memory_date: date,
            visibility: 'public'
        });

        setIsSubmitting(false);

        if (error) {
            console.error(error);
            alert("기록을 남기지 못했습니다.");
        } else {
            setContent("");
            setIsOpen(false);
            router.refresh();
            onSuccess?.();
        }
    };

    if (!isOpen) {
        return (
            <div
                onClick={() => setIsOpen(true)}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow text-slate-400 flex items-center gap-4 group"
            >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <div className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors">✎</div>
                </div>
                <span className="group-hover:text-slate-600 transition-colors">
                    {spaceType === 'PERSONAL' ? '오늘의 기억을 기록해보세요.' : '따뜻한 추억을 남겨주세요.'}
                </span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-fade-in-up">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white">
                <span className="font-bold text-slate-900">기억 기록하기</span>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 space-y-4">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={spaceType === 'PERSONAL' ? "어떤 순간을 기억하고 싶으신가요?" : "고인과의 소중한 추억을 나눠주세요."}
                    className="min-h-[150px] text-base border-slate-200 focus:border-blue-500 focus:ring-blue-50 bg-white resize-none"
                />

                <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-2 text-slate-400">
                        <button className="p-2 hover:bg-slate-50 rounded-full transition-colors" title="사진 추가">
                            <ImageIcon size={20} />
                        </button>
                        <button className="p-2 hover:bg-slate-50 rounded-full transition-colors" title="날짜 변경">
                            <Calendar size={20} />
                        </button>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !content.trim()}
                        className="bg-slate-900 hover:bg-blue-600 text-white rounded-xl px-6 transition-colors shadow-sm"
                    >
                        {isSubmitting ? "기록 중..." : "기록하기"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
