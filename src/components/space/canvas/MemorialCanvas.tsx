"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Image as ImageIcon, StickyNote, Settings, Share, ChevronLeft, Trash2, LogOut, Users, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SecureAvatar } from "@/components/ui/SecureAvatar";
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

    // Space Info State
    const [spaceTitle, setSpaceTitle] = useState(space.title || "");
    const [spaceDescription, setSpaceDescription] = useState(space.description || "");

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

    const [memberCount, setMemberCount] = useState(0);

    // Fetch Member Count
    useEffect(() => {
        const fetchMembers = async () => {
            const { count } = await supabase
                .from('space_members')
                .select('*', { count: 'exact', head: true })
                .eq('space_id', space.id);
            setMemberCount(count || 0);
        };
        fetchMembers();
    }, [space.id, supabase]);

    const uploadFile = async (file: File, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('memorial-public')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('memorial-public')
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

    const handleUpdateSpaceInfo = async () => {
        try {
            const { error } = await supabase
                .from('memorial_spaces')
                .update({
                    title: spaceTitle,
                    description: spaceDescription
                })
                .eq('id', space.id);

            if (error) throw error;
            alert("공간 정보가 업데이트되었습니다.");
            // Reload to reflect changes
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("업데이트 실패");
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
                .from('memorial-public')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('memorial-public')
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
            <div className="relative bg-white shadow-sm mb-4 md:mb-6 max-w-2xl mx-auto rounded-b-xl overflow-hidden">
                {/* Cover Image */}
                <div
                    className="h-40 md:h-64 bg-slate-200 w-full bg-cover bg-center relative"
                    style={{
                        backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                    }}
                >
                    <Link href="/space" className="absolute top-4 left-4 p-1.5 md:p-2 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors backdrop-blur-sm z-10">
                        <ChevronLeft size={20} className="md:w-6 md:h-6" />
                    </Link>

                    {/* Settings Trigger (Icon only) */}
                    {role === 'host' && (
                        <div className="absolute top-4 right-4 z-10">
                            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" size="sm" className="bg-white/90 text-slate-700 hover:bg-white backdrop-blur-sm shadow-sm gap-1.5 h-8 px-2.5 md:h-9 md:px-3 text-xs md:text-sm">
                                        <Settings size={14} className="md:w-4 md:h-4" />
                                        <span className="hidden md:inline">공간 설정</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 md:p-6 w-[95%] rounded-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-lg md:text-xl">공간 관리</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-5 pt-4">
                                        {/* Space Title Setting */}
                                        <div className="space-y-2">
                                            <label className="text-xs md:text-sm font-bold text-slate-800">공간 이름</label>
                                            <Input
                                                value={spaceTitle}
                                                onChange={(e) => setSpaceTitle(e.target.value)}
                                                placeholder="예: 사랑하는 할머니"
                                                className="w-full text-sm h-10"
                                            />
                                        </div>

                                        <div className="h-px bg-slate-100" />

                                        {/* Space Description Setting */}
                                        <div className="space-y-2">
                                            <label className="text-xs md:text-sm font-bold text-slate-800">공간 설명</label>
                                            <Textarea
                                                value={spaceDescription}
                                                onChange={(e) => setSpaceDescription(e.target.value)}
                                                placeholder="예: 따뜻한 미소로 우리를 항상 응원해주시던 할머니"
                                                className="w-full min-h-[80px] resize-none text-sm"
                                            />
                                        </div>

                                        <div className="h-px bg-slate-100" />

                                        {/* Profile Image Setting */}
                                        <div className="space-y-2">
                                            <label className="text-xs md:text-sm font-bold text-slate-800">대표 사진 (프로필)</label>
                                            <div className="flex gap-3 items-center">
                                                {theme.profileImage ? (
                                                    <Avatar className="w-14 h-14 md:w-16 md:h-16 border border-slate-200">
                                                        <AvatarImage src={theme.profileImage} className="object-cover" />
                                                        <AvatarFallback>{space.title[0]}</AvatarFallback>
                                                    </Avatar>
                                                ) : <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-full" />}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => e.target.files?.[0] && handleUpdateTheme('profileImage', e.target.files[0])}
                                                    className="text-xs md:text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100" />

                                        {/* Background Image Setting */}
                                        <div className="space-y-2">
                                            <label className="text-xs md:text-sm font-bold text-slate-800">배경 이미지 (커버)</label>
                                            <div className="flex gap-3 items-center">
                                                <div className="w-20 h-14 md:w-24 md:h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative">
                                                    {theme.backgroundImage && <img src={theme.backgroundImage} className="w-full h-full object-cover" />}
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => e.target.files?.[0] && handleUpdateTheme('backgroundImage', e.target.files[0])}
                                                    className="text-xs md:text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100" />

                                        {/* Save Button */}
                                        <Button
                                            onClick={handleUpdateSpaceInfo}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 md:h-11 text-sm font-bold"
                                        >
                                            변경사항 저장
                                        </Button>

                                        <div className="h-px bg-slate-100" />

                                        <div className="pt-1">
                                            <h4 className="text-xs font-bold text-red-600 mb-2">위험 구역</h4>
                                            <Button onClick={handleDeleteSpace} variant="destructive" className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 justify-start px-4 h-10 text-sm">
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
                <div className="px-5 md:px-8 pb-4">
                    <div className="relative flex flex-col md:flex-row md:items-end gap-3 md:gap-4 -mt-8 md:-mt-16 mb-3 md:mb-4">
                        {/* Profile Picture */}
                        <div className="relative self-center md:self-auto">
                            <div className="w-16 h-16 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                                {theme.profileImage ? (
                                    <img src={theme.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-2xl md:text-3xl font-bold text-slate-400">
                                        {space.title[0]}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Title & Desc */}
                <div className="flex-1 px-5 pb-5 text-center md:text-left space-y-2 md:space-y-3">
                    <div>
                        <h1 className="text-lg md:text-3xl font-black text-slate-900 leading-tight mb-1.5 md:mb-2 tracking-tight">{space.title}</h1>
                        <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-2 text-slate-500 text-xs md:text-base">
                            <p className="line-clamp-2 md:line-clamp-none">{space.description || "소개가 없습니다."}</p>
                            <span className="hidden md:inline">·</span>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="inline-flex items-center justify-center gap-1 text-slate-500 hover:text-blue-600 hover:underline mx-auto md:mx-0 font-medium">
                                        <Users size={12} className="md:w-3.5 md:h-3.5" />
                                        <span>멤버 {memberCount}명</span>
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="w-[90%] rounded-2xl">
                                    <DialogHeader>
                                        <DialogTitle>멤버 목록</DialogTitle>
                                    </DialogHeader>
                                    <MemberList spaceId={space.id} />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Action Buttons - Moved here for better mobile layout */}
                    <div className="flex gap-2 justify-center md:justify-start pt-1 md:pt-2">
                        {/* Invite / Share */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-4 md:px-6 shadow-sm h-8 md:h-10 text-xs md:text-sm font-bold">
                                    <Users size={14} className="md:w-[18px] md:h-[18px] mr-1.5 md:mr-2" />
                                    초대하기
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[90%] rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle>멤버 초대하기</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-5 pt-4">
                                    <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                        <h3 className="font-bold text-slate-900 text-sm">초대 링크 공유</h3>
                                        <p className="text-xs text-slate-500">
                                            아래 링크를 통해 들어온 사람은<br />
                                            <strong>뷰어 (글 작성/보기 가능)</strong> 권한을 갖게 됩니다.
                                        </p>
                                        <div className="flex gap-2">
                                            <Input value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${space.id}`} readOnly className="bg-white text-xs h-9" />
                                            <Button onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/invite/${space.id}`);
                                                alert("초대 링크가 복사되었습니다!");
                                            }} variant="outline" className="h-9 text-xs px-3">
                                                복사
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                        <h3 className="font-bold text-yellow-800 text-xs mb-1">관리자 권한 필요?</h3>
                                        <p className="text-[11px] text-yellow-700">
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
            {/* Canvas Area (Masonry/Grid) */}
            <main className="p-3 md:p-8 max-w-2xl mx-auto">
                {/* ... keep existing block rendering ... */}
                {
                    blocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 md:py-20 text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 md:mb-4 text-2xl md:text-3xl">
                                ✍️
                            </div>
                            <p className="font-bold text-base md:text-lg text-slate-600 mb-1">첫 번째 추억을 남겨주세요</p>
                            <p className="text-xs md:text-sm text-slate-500">우측 하단 + 버튼을 눌러 사진이나 글을 작성해보세요.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 md:gap-6">
                            {blocks.map((block) => (
                                <BlockItem key={block.id} block={block} spaceId={space.id} currentUser={currentUser} role={role} onDelete={() => handleDeleteBlock(block.id)} />
                            ))}
                        </div>
                    )
                }
            </main>

            {/* Floating Action Button */}
            {
                (role === 'host' || role === 'editor' || role === 'member' || role === 'viewer') && (
                    /* Allow viewers to add notes? Assuming yes for memorial */
                    <div className="fixed bottom-20 md:bottom-6 right-5 md:right-6 z-40 transition-all duration-300">
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                                    <Plus size={24} className="md:w-7 md:h-7" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md w-[90%] rounded-2xl p-4 md:p-6">
                                <DialogHeader>
                                    <DialogTitle className="text-lg md:text-xl">추억 추가하기</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-3 md:gap-4 py-2 md:py-4">
                                    {/* Photo Upload */}
                                    <div className="relative group cursor-pointer border rounded-xl p-3 md:p-4 hover:bg-slate-50 flex flex-col items-center justify-center gap-1.5 md:gap-2 aspect-square transition-colors">
                                        <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                                        <span className="text-xs md:text-sm font-medium">사진</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            disabled={uploading}
                                        />
                                        {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[10px] md:text-xs font-bold text-blue-600 animate-pulse">업로드 중...</div>}
                                    </div>

                                    {/* Note Input */}
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="cursor-pointer border rounded-xl p-3 md:p-4 hover:bg-slate-50 flex flex-col items-center justify-center gap-1.5 md:gap-2 aspect-square transition-colors">
                                                <StickyNote className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
                                                <span className="text-xs md:text-sm font-medium">쪽지</span>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="w-[90%] rounded-2xl">
                                            <DialogHeader><DialogTitle>쪽지 남기기</DialogTitle></DialogHeader>
                                            <div className="space-y-3 pt-3 md:pt-4">
                                                <Textarea
                                                    value={noteContent}
                                                    onChange={(e) => setNoteContent(e.target.value)}
                                                    placeholder="친구에게 남기고 싶은 말을 적어주세요."
                                                    className={`min-h-[120px] md:min-h-[150px] ${noteColor} border-none focus-visible:ring-1 resize-none text-sm md:text-base`}
                                                />
                                                <div className="flex gap-2">
                                                    {['bg-white', 'bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100'].map(color => (
                                                        <button
                                                            key={color}
                                                            onClick={() => setNoteColor(color)}
                                                            className={`w-6 h-6 md:w-8 md:h-8 rounded-full border ${color} shadow-sm transition-transform hover:scale-110 ${noteColor === color ? 'ring-2 ring-slate-400 scale-110' : ''}`}
                                                        />
                                                    ))}
                                                </div>
                                                <Button onClick={handleAddNote} className="w-full h-10 text-sm">남기기</Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )
            }
        </div>
    );
}

// Member List Component
function MemberList({ spaceId }: { spaceId: string }) {
    const supabase = createClient();
    const [members, setMembers] = useState<any[]>([]);

    useEffect(() => {
        const fetch = async () => {
            // 1. Get Members
            const { data: memberData } = await supabase.from('space_members').select('*').eq('space_id', spaceId);

            if (memberData && memberData.length > 0) {
                // 2. Get Profiles
                const userIds = memberData.map(m => m.user_id);
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, nickname')
                    .in('id', userIds);

                // 3. Merge
                const merged = memberData.map(member => {
                    const profile = profiles?.find(p => p.id === member.user_id);
                    return {
                        ...member,
                        profile
                    };
                });
                setMembers(merged);
            } else {
                setMembers([]);
            }
        };
        fetch();
    }, [spaceId]);

    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {members.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                        <SecureAvatar
                            src={member.profile?.avatar_url}
                            alt={member.profile?.full_name || "Member"}
                            className="w-full h-full"
                            fallback={<div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs font-bold">{member.profile?.full_name?.[0] || member.nickname?.[0] || 'U'}</div>}
                        />
                    </div>
                    <div>
                        <p className="font-bold text-sm">{member.profile?.full_name || member.nickname || '이름 없음'}</p>
                        <p className="text-xs text-slate-500 capitalize">{member.role === 'host' ? '호스트 (Host)' : '게스트 (Guest)'}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Subcomponent for Block Item (Facebook Style)
function BlockItem({ block, spaceId, currentUser, role, onDelete }: { block: Block; spaceId: string; currentUser: any; role: string; onDelete: () => void }) {
    const supabase = createClient();
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [replyToId, setReplyToId] = useState<string | null>(null); // For nested replies
    const [showComments, setShowComments] = useState(false);
    const [authorName, setAuthorName] = useState("로딩 중...");
    const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
    const [likeCount, setLikeCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);

    useEffect(() => {
        fetchAuthor();
        fetchLikes();
        if (showComments) {
            fetchComments();
        }
    }, [showComments, block.id]);

    const fetchAuthor = async () => {
        // Fetch Profile directly
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, nickname, avatar_url')
            .eq('id', block.created_by)
            .single();

        if (profile) {
            setAuthorName(profile.full_name || profile.nickname || "익명");
            setAuthorAvatar(profile.avatar_url);
        } else {
            // Fallback to space_members if profile missing
            const { data: memberData } = await supabase
                .from('space_members')
                .select('nickname')
                .eq('space_id', spaceId)
                .eq('user_id', block.created_by)
                .single();

            if (memberData) setAuthorName(memberData.nickname || "게스트");
        }
    };

    const fetchLikes = async () => {
        const { count } = await supabase
            .from('memorial_likes')
            .select('*', { count: 'exact', head: true })
            .eq('block_id', block.id);

        setLikeCount(count || 0);

        if (currentUser) {
            const { data } = await supabase
                .from('memorial_likes')
                .select('id')
                .eq('block_id', block.id)
                .eq('user_id', currentUser.id)
                .single();
            setHasLiked(!!data);
        }
    };

    const handleLike = async () => {
        if (!currentUser) return alert("로그인이 필요합니다.");

        if (hasLiked) {
            const { error } = await supabase.from('memorial_likes').delete().eq('block_id', block.id).eq('user_id', currentUser.id);
            if (!error) {
                setHasLiked(false);
                setLikeCount(prev => prev - 1);
            }
        } else {
            const { error } = await supabase.from('memorial_likes').insert({ block_id: block.id, user_id: currentUser.id });
            if (!error) {
                setHasLiked(true);
                setLikeCount(prev => prev + 1);
            }
        }
    };

    const fetchComments = async () => {
        // 1. Fetch Comments
        const { data: commentsData, error: commentError } = await supabase
            .from('memorial_comments')
            .select('*')
            .eq('block_id', block.id)
            .order('created_at', { ascending: true });

        if (commentError) {
            console.error("Error fetching comments:", commentError);
            return;
        }

        if (!commentsData || commentsData.length === 0) {
            setComments([]);
            return;
        }

        // 2. Extract User IDs
        const userIds = Array.from(new Set(commentsData.map(c => c.user_id).filter(Boolean)));

        // 3. Fetch Profiles (Server-Side Bypass)
        let profilesData: any[] = [];
        try {
            const res = await fetch('/api/space/get-profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds })
            });
            const json = await res.json();
            if (json.data) {
                profilesData = json.data;
            }
        } catch (e) {
            console.error("Server fetch failed, falling back to client fetch", e);
            // Fallback: Client Fetch (Subject to RLS)
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, nickname, avatar_url')
                .in('id', userIds);
            profilesData = data || [];
        }

        // 3.1 Fallback: Fetch Space Members (If profiles missing)
        // This ensures we at least get the nickname for the space
        let membersData: any[] = [];
        const missingIds = userIds.filter(id => !profilesData.find(p => p.id === id));
        if (missingIds.length > 0) {
            const { data: members } = await supabase
                .from('space_members')
                .select('user_id, nickname')
                .eq('space_id', spaceId)
                .in('user_id', missingIds);
            membersData = members || [];
        }

        // 4. Merge Data
        const commentsWithProfiles = commentsData.map(comment => {
            const profile = profilesData?.find(p => p.id === comment.user_id);
            const member = membersData?.find(m => m.user_id === comment.user_id);

            return {
                ...comment,
                profiles: profile || {
                    full_name: member?.nickname || "알 수 없음",
                    nickname: member?.nickname,
                    avatar_url: null
                }
            };
        });

        setComments(commentsWithProfiles);
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("댓글을 삭제하시겠습니까?")) return;

        const { error } = await supabase.from('memorial_comments').delete().eq('id', commentId);

        if (!error) {
            fetchComments();
        } else {
            console.error("Delete comment error", error);
            alert("삭제 실패");
        }
    };

    const handleAddComment = async (parentId: string | null = null) => {
        if (!newComment.trim()) return;

        const { error } = await supabase.from('memorial_comments').insert({
            block_id: block.id,
            user_id: currentUser?.id,
            content: newComment,
            parent_id: parentId
        });

        if (!error) {
            setNewComment("");
            setReplyToId(null);
            fetchComments();
        } else {
            console.error("Comment error", error);
            alert("댓글 작성 실패");
        }
    };

    // Organize comments into threads
    const rootComments = comments.filter(c => !c.parent_id);
    const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                        <SecureAvatar
                            src={authorAvatar}
                            alt={authorName}
                            className="w-full h-full"
                            fallback={<div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs font-bold">{authorName[0]}</div>}
                        />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">{authorName}</p>
                        <p className="text-xs text-slate-500">{new Date(block.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                {(role === 'host' || block.created_by === currentUser?.id) && (
                    <button onClick={onDelete} className="text-slate-400 hover:text-red-500 p-2">
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="px-4 pb-4">
                {block.type === 'note' && (
                    <div className={`p-6 rounded-xl ${block.content.color || 'bg-slate-50'} font-handwriting text-lg leading-relaxed text-slate-800 whitespace-pre-wrap`}>
                        {block.content.text}
                    </div>
                )}
                {block.type === 'photo' && (
                    <div className="rounded-xl overflow-hidden">
                        <img src={block.content.url} alt="Memory" className="w-full h-auto" />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-slate-50 flex items-center gap-4">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 transition-colors ${hasLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
                >
                    <Heart size={20} className={hasLiked ? 'fill-current' : ''} />
                    <span className="text-sm font-medium">공감 {likeCount > 0 && likeCount}</span>
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors"
                >
                    <Users size={20} />
                    <span className="text-sm font-medium">댓글 {comments.length > 0 && comments.length}</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-4">
                    {/* List */}
                    <div className="space-y-4">
                        {rootComments.map(comment => (
                            <div key={comment.id} className="space-y-2">
                                {/* Parent Comment */}
                                <div className="flex gap-3 group">
                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                                        <SecureAvatar
                                            src={comment.profiles?.avatar_url}
                                            alt={comment.profiles?.full_name || "User"}
                                            className="w-full h-full"
                                            fallback={<div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{comment.profiles?.full_name?.[0] || 'U'}</div>}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start gap-2">
                                            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm relative group/bubble">
                                                <p className="text-xs font-bold text-slate-900 mb-0.5">{comment.profiles?.full_name || comment.profiles?.nickname || "익명"}</p>
                                                <p className="text-sm text-slate-700">{comment.content}</p>
                                            </div>
                                            {(currentUser?.id === comment.user_id || role === 'host') && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="opacity-0 group-hover/bubble:opacity-100 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                    title="삭제"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                                            className="text-xs text-slate-500 mt-1 ml-2 hover:text-blue-600"
                                        >
                                            답글 달기
                                        </button>
                                    </div>
                                </div>

                                {/* Replies */}
                                <div className="pl-11 space-y-2">
                                    {getReplies(comment.id).map(reply => (
                                        <div key={reply.id} className="flex gap-3 group">
                                            <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                                                <SecureAvatar
                                                    src={reply.profiles?.avatar_url}
                                                    alt={reply.profiles?.full_name || "User"}
                                                    className="w-full h-full"
                                                    fallback={<div className="w-full h-full bg-slate-200 flex items-center justify-center text-[8px] font-bold">{reply.profiles?.full_name?.[0] || 'U'}</div>}
                                                />
                                            </div>
                                            <div className="flex-1 flex items-start gap-2">
                                                <div className="bg-slate-100 p-2 rounded-xl rounded-tl-none flex-1 group/bubble">
                                                    <p className="text-xs font-bold text-slate-800 mb-0.5">{reply.profiles?.full_name || reply.profiles?.nickname || "익명"}</p>
                                                    <p className="text-xs text-slate-600">{reply.content}</p>
                                                </div>
                                                {(currentUser?.id === reply.user_id || role === 'host') && (
                                                    <button
                                                        onClick={() => handleDeleteComment(reply.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                        title="삭제"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Reply Input */}
                                    {replyToId === comment.id && (
                                        <div className="flex gap-2 mt-2">
                                            <Input
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="답글을 입력하세요..."
                                                className="h-8 text-xs bg-white"
                                                autoFocus
                                            />
                                            <Button size="sm" className="h-8 text-xs" onClick={() => handleAddComment(comment.id)}>등록</Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Root Input */}
                    {!replyToId && (
                        <div className="flex gap-2">
                            <Input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="따뜻한 댓글을 남겨주세요..."
                                className="bg-white rounded-full"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(null)}
                            />
                            <Button onClick={() => handleAddComment(null)} size="sm" className="rounded-full px-4">등록</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
