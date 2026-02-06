"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Image as ImageIcon, StickyNote, Settings, Share, ChevronLeft, Trash2, LogOut, Users } from "lucide-react";
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
    // Removed old url state inputs

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

    const uploadFile = async (file: File, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('user_uploads')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('user_uploads')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleUpdateTheme = async (field: 'backgroundImage' | 'profileImage', file: File) => {
        try {
            setUploading(true);
            const publicUrl = await uploadFile(file, `spaces/${space.id}/${field}`);

            const newTheme = { ...theme, [field]: publicUrl };
            setTheme(newTheme);

            const { error } = await supabase
                .from('memorial_spaces')
                .update({ theme: newTheme })
                .eq('id', space.id);

            if (error) throw error;
        } catch (error) {
            console.error(error);
            alert("업로드 실패");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteSpace = async () => {
        if (!confirm("정말 이 추모 공간을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;

        const { error } = await supabase.from('memorial_spaces').delete().eq('id', space.id);
        if (error) {
            alert("삭제 실패");
        } else {
            window.location.href = '/space';
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

            // Add Block
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
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteBlock = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        await supabase.from('memorial_blocks').delete().eq('id', id);
    };

    return (
        <div className="min-h-screen pb-20 bg-slate-50">
            {/* Facebook-style Header */}
            <div className="relative bg-white shadow-sm mb-6">
                {/* Cover Image */}
                <div
                    className="h-48 md:h-64 bg-slate-200 w-full bg-cover bg-center relative"
                    style={{
                        backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                    }}
                >
                    <Link href="/space" className="absolute top-4 left-4 p-2 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors backdrop-blur-sm z-10">
                        <ChevronLeft size={24} />
                    </Link>

                    {/* Settings Trigger (Icon only) */}
                    {role === 'host' && (
                        <div className="absolute top-4 right-4 z-10">
                            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" size="sm" className="bg-white/90 text-slate-700 hover:bg-white backdrop-blur-sm shadow-sm gap-2">
                                        <Settings size={16} />
                                        <span className="hidden md:inline">공간 설정</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>공간 관리</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-6 pt-4">
                                        {/* Profile Image Setting */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-slate-800">대표 사진 (프로필)</label>
                                            <div className="flex gap-4 items-center">
                                                {theme.profileImage ? (
                                                    <Avatar className="w-16 h-16 border border-slate-200">
                                                        <AvatarImage src={theme.profileImage} className="object-cover" />
                                                        <AvatarFallback>{space.title[0]}</AvatarFallback>
                                                    </Avatar>
                                                ) : <div className="w-16 h-16 bg-slate-100 rounded-full" />}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => e.target.files?.[0] && handleUpdateTheme('profileImage', e.target.files[0])}
                                                    className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100" />

                                        {/* Background Image Setting */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-slate-800">배경 이미지 (커버)</label>
                                            <div className="flex gap-4 items-center">
                                                <div className="w-24 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative">
                                                    {theme.backgroundImage && <img src={theme.backgroundImage} className="w-full h-full object-cover" />}
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => e.target.files?.[0] && handleUpdateTheme('backgroundImage', e.target.files[0])}
                                                    className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100" />

                                        <div className="pt-2">
                                            <h4 className="text-sm font-bold text-red-600 mb-2">위험 구역</h4>
                                            <Button onClick={handleDeleteSpace} variant="destructive" className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 justify-start px-4">
                                                <LogOut size={16} className="mr-2" />
                                                공간 삭제하기
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </div>

                {/* Profile Info Area */}
                <div className="px-4 md:px-8 pb-6">
                    <div className="relative flex flex-col md:flex-row md:items-end gap-4 -mt-12 md:-mt-16 mb-4">
                        {/* Profile Picture */}
                        <div className="relative">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                                {theme.profileImage ? (
                                    <img src={theme.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-3xl font-bold text-slate-400">
                                        {space.title[0]}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title & Desc */}
                        <div className="flex-1 pt-2 md:pt-0 md:pb-2 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-1">{space.title}</h1>
                            <p className="text-slate-500 text-sm md:text-base">{space.description || "소개가 없습니다."}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 justify-center md:justify-end pb-2">
                            {/* Invite / Share */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-6 shadow-sm">
                                        <Users size={18} className="mr-2" />
                                        초대하기
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>멤버 초대하기</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-6 pt-4">
                                        <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                                            <h3 className="font-bold text-slate-900 text-sm">초대 링크 공유</h3>
                                            <p className="text-xs text-slate-500">
                                                아래 링크를 통해 들어온 사람은<br />
                                                <strong>뷰어 (글 작성/보기 가능)</strong> 권한을 갖게 됩니다.
                                            </p>
                                            <div className="flex gap-2">
                                                <Input value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${space.id}`} readOnly className="bg-white" />
                                                <Button onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/invite/${space.id}`);
                                                    alert("초대 링크가 복사되었습니다!");
                                                }} variant="outline">
                                                    복사
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                            <h3 className="font-bold text-yellow-800 text-sm mb-1">관리자 권한 필요?</h3>
                                            <p className="text-xs text-yellow-700">
                                                편집자(관리자) 권한은 이메일 초대를 통해 부여할 수 있습니다.<br />
                                                (추후 업데이트 예정)
                                            </p>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </div>

            {/* Canvas Area (Masonry/Grid) */}
            <main className="p-4 md:p-8 max-w-5xl mx-auto">
                {/* ... keep existing block rendering ... */}
                {blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-3xl">
                            ✍️
                        </div>
                        <p className="font-bold text-lg text-slate-600 mb-1">첫 번째 추억을 남겨주세요</p>
                        <p className="text-sm text-slate-500">우측 하단 + 버튼을 눌러 사진이나 글을 작성해보세요.</p>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {blocks.map((block) => (
                            <div key={block.id} className="break-inside-avoid relative group mb-4">
                                {block.type === 'note' && (
                                    <div className={`p-4 rounded-xl shadow-sm ${block.content.color || 'bg-white'} min-h-[100px] flex items-center justify-center text-center font-handwriting transition-transform hover:-translate-y-1 duration-300`}>
                                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{block.content.text}</p>
                                    </div>
                                )}
                                {block.type === 'photo' && (
                                    <div className="rounded-xl overflow-hidden shadow-sm bg-white hover:-translate-y-1 transition-transform duration-300">
                                        <img src={block.content.url} alt="memory" className="w-full h-auto" />
                                        {block.content.caption && (
                                            <p className="p-3 text-xs text-slate-600 font-medium">{block.content.caption}</p>
                                        )}
                                    </div>
                                )}
                                {/* Delete Overlay for Host */}
                                {(role === 'host' || block.created_by === currentUser?.id) && (
                                    <button
                                        onClick={() => handleDeleteBlock(block.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} className="rotate-0" /> {/* Using Trash2 */}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Action Button */}
            {(role === 'host' || role === 'editor' || role === 'member' || role === 'viewer') && (
                /* Allow viewers to add notes? Assuming yes for memorial */
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
