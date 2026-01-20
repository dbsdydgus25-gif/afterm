"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PostItem } from "@/components/memorial/PostItem";
import { useMemorialStore } from "@/store/useMemorialStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CreatePostModal } from "@/components/memorial/CreatePostModal";

import { useMemoryStore } from "@/store/useMemoryStore";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function MemorialDetailPage({ params }: PageProps) {
    const router = useRouter();
    // Unwrap params using React.use()
    const { id } = use(params);

    const { getMemorial, addPost, addTribute } = useMemorialStore();
    const { user } = useMemoryStore();
    const memorial = getMemorial(id);

    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    const handleCreatePost = (content: string, mediaFile: File | null) => {
        if (!user) {
            alert("로그인이 필요한 서비스입니다.");
            return;
        }

        let mediaUrl = undefined;
        let mediaType: 'image' | 'video' | undefined = undefined;

        if (mediaFile) {
            // Create a fake local URL for the uploaded file (MVP style)
            mediaUrl = URL.createObjectURL(mediaFile);
            mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image';
        }

        addPost(id, {
            authorName: user.name,
            content,
            mediaUrl,
            mediaType
        });

        setIsPostModalOpen(false);
    };

    const handleTribute = () => {
        addTribute(id);
    };

    if (!memorial) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">추모관을 찾을 수 없습니다.</h1>
                    <Button onClick={() => router.push('/memorial')}>목록으로 돌아가기</Button>
                </div>
            </div>
        );
    }

    // Combine gallery images with images from posts
    const allGalleryImages = [
        ...(memorial.galleryImages || []),
        ...memorial.posts.filter(p => p.mediaType === 'image' && p.mediaUrl).map(p => p.mediaUrl!)
    ];

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <Header />

            {/* Hero Profile Section */}
            <div className="bg-white pb-8 shadow-sm relative pt-20">
                {/* Cover Image */}
                <div className="h-64 md:h-80 w-full overflow-hidden relative">
                    <img
                        src={memorial.coverImage}
                        alt="cover"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="flex flex-col md:flex-row items-end -mt-12 md:-mt-20 relative z-10 gap-6">
                        {/* Profile Image */}
                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden shrink-0">
                            <img
                                src={memorial.profileImage}
                                alt={memorial.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 pb-2 md:pb-6 text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">
                                {memorial.name}
                            </h1>
                            <p className="text-slate-500 font-medium text-lg">
                                {memorial.birthDate} - {memorial.deathDate}
                            </p>
                        </div>

                        <div className="pb-2 md:pb-6 w-full md:w-auto flex justify-center">
                            <Button
                                onClick={handleTribute}
                                className="bg-white/90 backdrop-blur text-slate-800 border border-slate-200 hover:bg-slate-50 font-bold px-6 py-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2 min-w-[100px]"
                            >
                                <span className="text-red-500 text-2xl">❤️</span>
                                <span className="text-lg font-medium text-slate-700">{memorial.tributeCount}명</span>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 max-w-3xl">
                        <h2 className="text-lg font-bold text-slate-800 mb-2">추모의 글</h2>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            {memorial.bio}
                        </p>
                    </div>

                    {/* Gallery Section */}
                    {allGalleryImages.length > 0 && (
                        <div className="mt-10 pt-8 border-t border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span>📸</span> 함께했던 추억들
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {allGalleryImages.map((img, idx) => (
                                    <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group cursor-pointer shadow-sm hover:shadow-md transition-all">
                                        <img src={img} alt={`memory-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content: Wall */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Sidebar (Info) */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
                            <h3 className="font-bold text-slate-900 mb-4 px-1">소개</h3>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex items-center gap-3">
                                    <span className="w-6 text-center">🎂</span>
                                    <span>{memorial.birthDate} 출생</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="w-6 text-center">🕊️</span>
                                    <span>{memorial.deathDate} 영면</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Content (Feed) */}
                    <div className="md:col-span-2">
                        {/* Write Post Trigger */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-xl">
                                👤
                            </div>
                            <div
                                onClick={() => setIsPostModalOpen(true)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full px-5 py-3 text-slate-500 cursor-pointer font-medium"
                            >
                                {memorial.name}님에게 남기고 싶은 추억이 있나요?
                            </div>
                            <div
                                onClick={() => setIsPostModalOpen(true)}
                                className="p-2 hover:bg-slate-100 rounded-full cursor-pointer text-slate-400 transition-colors"
                            >
                                <span className="text-xl">🖼️</span>
                            </div>
                        </div>

                        {/* Posts Feed */}
                        <div className="space-y-6">
                            {memorial.posts.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    첫 번째 추모 메시지를 남겨주세요.
                                </div>
                            ) : (
                                memorial.posts.map((post) => (
                                    <PostItem key={post.id} post={post} />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <CreatePostModal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                onSubmit={handleCreatePost}
                memorialName={memorial.name}
            />
        </div>
    );
}
