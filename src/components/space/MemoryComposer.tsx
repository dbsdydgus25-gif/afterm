"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Image as ImageIcon, Mic, Lock } from "lucide-react";

interface MemoryComposerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function MemoryComposer({ isOpen, onClose, onSuccess }: MemoryComposerProps) {
    const [content, setContent] = useState("");
    const [isSecret, setIsSecret] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert("로그인이 필요합니다");
            setLoading(false);
            return;
        }

        // Get my space
        const { data: mySpace } = await supabase
            .from("spaces")
            .select("id")
            .eq("owner_id", user.id)
            .single();

        if (!mySpace) {
            alert("Space를 찾을 수 없습니다");
            setLoading(false);
            return;
        }

        // Create memory
        const { error } = await supabase
            .from("memories")
            .insert({
                space_id: mySpace.id,
                writer_id: mySpace.id,
                content,
                is_secret: isSecret,
                allowed_viewers: []
            });

        setLoading(false);

        if (error) {
            alert("작성 실패: " + error.message);
        } else {
            setContent("");
            setIsSecret(false);
            onClose();
            if (onSuccess) onSuccess();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full max-w-[430px] rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-[16px] font-bold">새 글 작성</h2>
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || loading}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-[14px] font-semibold rounded-lg transition-colors"
                    >
                        {loading ? "작성중..." : "완료"}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 overflow-y-auto">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="무슨 일이 있었나요?"
                        className="w-full h-40 text-[15px] resize-none outline-none placeholder-gray-400"
                        autoFocus
                    />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 space-y-3">
                    {/* Secret Toggle */}
                    <button
                        onClick={() => setIsSecret(!isSecret)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isSecret ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-600"
                            }`}
                    >
                        <Lock className="w-4 h-4" />
                        <span className="text-[13px] font-medium">
                            {isSecret ? "시크릿 모드" : "공개 모드"}
                        </span>
                    </button>

                    {/* Media Options (Placeholder) */}
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                            <Mic className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
