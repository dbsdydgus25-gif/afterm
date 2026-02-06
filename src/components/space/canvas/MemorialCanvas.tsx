"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Image as ImageIcon, StickyNote, Music, Settings, Share, ChevronLeft, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Block {
    id: string;
    type: 'photo' | 'note' | 'music' | 'guestbook';
    content: any;
    position: any;
    created_at: string;
    created_by: string;
}

interface MemorialCanvasProps {
    space: any;
    initialBlocks: Block[];
    currentUser: any;
    role: string;
}

export function MemorialCanvas({ space, initialBlocks, currentUser, role }: MemorialCanvasProps) {
    const supabase = createClient();
    const router = useRouter();
    const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Theme State
    const [theme, setTheme] = useState(space.theme || {});
    const [bgImageInput, setBgImageInput] = useState(space.theme?.backgroundImage || "");
    const [profileImageInput, setProfileImageInput] = useState(space.theme?.profileImage || "");

    // Form States
    const [noteContent, setNoteContent] = useState("");
    const [noteColor, setNoteColor] = useState("bg-yellow-100");
    const [uploading, setUploading] = useState(false);

    // Subscribe to Realtime
    useEffect(() => {
        const channel = supabase
            .channel('memorial_canvas')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'memorial_blocks', filter: `space_id=eq.${space.id}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setBlocks((prev) => [payload.new as Block, ...prev]);
                    } else if (payload.eventType === 'DELETE') {
                        setBlocks((prev) => prev.filter(b => b.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, space.id]);

    const handleUpdateTheme = async () => {
        const newTheme = { ...theme, backgroundImage: bgImageInput, profileImage: profileImageInput };
        setTheme(newTheme);

        const { error } = await supabase
            .from('memorial_spaces')
            .update({ theme: newTheme })
            .eq('id', space.id);

        if (error) {
            console.error("Theme Update Error:", error);
            alert("설정 저장에 실패했습니다.");
        } else {
            setIsSettingsOpen(false);
        }
    };

    const handleAddNote = async () => {
        if (!noteContent.trim()) return;

        const { error } = await supabase.from('memorial_blocks').insert({
            space_id: space.id,
            type: 'note',
            content: { text: noteContent, color: noteColor },
            created_by: currentUser?.id
        });

        if (error) {
            alert("오류가 발생했습니다.");
            console.error(error);
        } else {
            setNoteContent("");
            setIsAddOpen(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `memorial/${space.id}/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('user_uploads')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('user_uploads')
                .getPublicUrl(filePath);

            const { error: dbError } = await supabase.from('memorial_blocks').insert({
                space_id: space.id,
                type: 'photo',
                content: { url: publicUrl, caption: "" },
                created_by: currentUser?.id
            });

            if (dbError) throw dbError;
            setIsAddOpen(false);

        } catch (error) {
            console.error(error);
            alert("업로드 실패 (Storage 버킷을 확인해주세요)");
            // Fallback for demo if storage fails?
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteBlock = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        await supabase.from('memorial_blocks').delete().eq('id', id);
    };

    return (
        <div
            className="min-h-screen pb-20 transition-all duration-500 bg-cover bg-center bg-fixed"
            style={{
                backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                backgroundColor: theme.backgroundImage ? 'transparent' : '#f1f5f9' // slate-100
            }}
        >
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/space" className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
                        <ChevronLeft size={24} />
                    </Link>

                    {/* Space Profile Image */}
                    {theme.profileImage ? (
                        <Avatar className="w-10 h-10 border border-slate-200 shadow-sm">
                            <AvatarImage src={theme.profileImage} className="object-cover" />
                            <AvatarFallback>{space.title[0]}</AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                            {space.title[0]}
                        </div>
                    )}

                    <div>
                        <h1 className="font-bold text-slate-900 leading-tight">{space.title}</h1>
                        <p className="text-xs text-slate-500">기억 보관함</p>
                    </div>
                </div>
                <div className="flex gap-2">

                    {/* Share Dialog */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-full">
                                <Share size={20} />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>이 공간 공유하기</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 pt-4 text-center">
                                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                                    <Share className="w-8 h-8 text-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-lg">소중한 분들과 함께하세요</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        링크를 공유하여 가족, 친구들을 초대하세요.<br />
                                        함께 추억을 나누고 기억할 수 있습니다.
                                    </p>
                                </div>

                                <div className="flex gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                    <Input
                                        value={typeof window !== 'undefined' ? window.location.href : ''}
                                        readOnly
                                        className="bg-transparent border-none focus-visible:ring-0 text-slate-600 text-sm"
                                    />
                                    <Button onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert("링크가 복사되었습니다!");
                                    }} size="sm" className="shrink-0 bg-white text-blue-600 hover:bg-blue-50 border border-blue-100 shadow-sm">
                                        복사
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Settings Dialog */}
                    {(role === 'host') && (
                        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-full">
                                    <Settings size={20} />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>공간 꾸미기</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6 pt-4">
                                    {/* Profile Image Setting */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-800">대표 사진 (프로필)</label>
                                        <div className="flex items-center gap-4">
                                            {profileImageInput ? (
                                                <img src={profileImageInput} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <ImageIcon size={24} />
                                                </div>
                                            )}
                                            <div className="flex-1 space-y-2">
                                                <Input
                                                    placeholder="이미지 URL 입력 (예: https://...)"
                                                    value={profileImageInput}
                                                    onChange={(e) => setProfileImageInput(e.target.value)}
                                                    className="text-sm"
                                                />
                                                <p className="text-xs text-slate-400">고인을 기억할 수 있는 대표 사진을 등록해주세요.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100" />

                                    {/* Background Image Setting */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-800">배경 이미지</label>
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="이미지 URL 입력 (예: https://...)"
                                                value={bgImageInput}
                                                onChange={(e) => setBgImageInput(e.target.value)}
                                                className="text-sm"
                                            />
                                            <p className="text-xs text-slate-400">
                                                공간의 분위기에 맞는 배경을 설정해보세요.
                                            </p>
                                        </div>
                                    </div>

                                    <Button onClick={handleUpdateTheme} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-xl font-bold text-base shadow-lg shadow-slate-200">
                                        변경사항 저장하기
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </header>

            {/* Canvas Area (Masonry/Grid) */}
            <main className="p-4 md:p-8 max-w-5xl mx-auto">
                {blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/50 rounded-xl backdrop-blur-sm">
                        <p>아직 추억이 없습니다.</p>
                        <p className="text-sm">첫 번째 블록을 추가해보세요.</p>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {blocks.map((block) => (
                            <div key={block.id} className="break-inside-avoid relative group">
                                {block.type === 'note' && (
                                    <div className={`p-4 rounded-xl shadow-sm ${block.content.color || 'bg-white'} min-h-[100px] flex items-center justify-center text-center font-handwriting`}>
                                        <p className="text-slate-800 whitespace-pre-wrap">{block.content.text}</p>
                                    </div>
                                )}
                                {block.type === 'photo' && (
                                    <div className="rounded-xl overflow-hidden shadow-sm bg-white">
                                        <img src={block.content.url} alt="memory" className="w-full h-auto" />
                                        {block.content.caption && (
                                            <p className="p-2 text-xs text-slate-600">{block.content.caption}</p>
                                        )}
                                    </div>
                                )}

                                {/* Delete Button (Host or Owner Only) */}
                                {(role === 'host' || block.created_by === currentUser?.id) && (
                                    <button
                                        onClick={() => handleDeleteBlock(block.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Action Button */}
            {(role === 'host' || role === 'editor') && (
                <div className="fixed bottom-6 right-6 z-40">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                                <Plus size={28} />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>추억 추가하기</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                {/* Photo Upload */}
                                <div className="relative group cursor-pointer border rounded-xl p-4 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 aspect-square transition-colors">
                                    <ImageIcon className="w-8 h-8 text-blue-500" />
                                    <span className="text-sm font-medium">사진</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        disabled={uploading}
                                    />
                                    {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs font-bold text-blue-600 animate-pulse">업로드 중...</div>}
                                </div>

                                {/* Note Input */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="cursor-pointer border rounded-xl p-4 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 aspect-square transition-colors">
                                            <StickyNote className="w-8 h-8 text-yellow-500" />
                                            <span className="text-sm font-medium">쪽지</span>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>쪽지 남기기</DialogTitle></DialogHeader>
                                        <div className="space-y-4 pt-4">
                                            <Textarea
                                                value={noteContent}
                                                onChange={(e) => setNoteContent(e.target.value)}
                                                placeholder="친구에게 남기고 싶은 말을 적어주세요."
                                                className={`min-h-[150px] ${noteColor} border-none focus-visible:ring-1 resize-none`}
                                            />
                                            <div className="flex gap-2">
                                                {['bg-white', 'bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100'].map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setNoteColor(color)}
                                                        className={`w-8 h-8 rounded-full border ${color} shadow-sm transition-transform hover:scale-110 ${noteColor === color ? 'ring-2 ring-slate-400 scale-110' : ''}`}
                                                    />
                                                ))}
                                            </div>
                                            <Button onClick={handleAddNote} className="w-full">남기기</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
}
