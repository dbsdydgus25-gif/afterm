
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Heart, ArrowRight } from "lucide-react";

export default async function SpaceDashboard() {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login?returnTo=/space");
    }

    // 1. Fetch User's Spaces
    const { data: spaces, error } = await supabase
        .from("life_spaces")
        .select("*")
        .eq("owner_id", user.id);

    const personalSpace = spaces?.find((s) => s.space_type === "PERSONAL");

    // 2. [Pivot Logic] If "My Space" (Profile) doesn't exist -> Force Setup
    if (!personalSpace) {
        redirect("/space/create?type=PERSONAL");
    }

    // 3. Home Feed View
    // For MVP: We just show the list of spaces (as per original design but simplified) OR a unified feed.
    // Given the request "Home Feed", let's show a "Feed" style UI.
    // Ideally we fetch recent memories from ALL spaces (My space + Remembrance + Friend spaces).
    // For now, let's keep it simple: Show "My Profile" at top, and "Feed" below.

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <main className="max-w-2xl mx-auto px-4 py-8 md:py-12 animate-fade-in">

                {/* 1. Profile / Status Section */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                        {personalSpace.profile_image ? (
                            <img src={personalSpace.profile_image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            "👤"
                        )}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900 mb-1">{personalSpace.name}</h1>
                        <p className="text-sm text-slate-500 mb-4">{personalSpace.intro_text || "나의 이야기를 기록합니다."}</p>
                        <div className="flex gap-2">
                            <Link href={`/space/${personalSpace.id}`} className="flex-1">
                                <Button variant="outline" className="w-full text-xs h-8 border-slate-200 text-slate-700">
                                    프로필 편집
                                </Button>
                            </Link>
                            <Link href={`/space/${personalSpace.id}`} className="flex-1">
                                <Button className="w-full text-xs h-8 bg-slate-900 text-white hover:bg-slate-800">
                                    나의 공간 보기
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 2. Feed Section (Placeholder for MVP) */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-slate-900 px-2">최신 소식</h2>

                    {/* Placeholder Feed Card */}
                    <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 py-20">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">아직 새로운 소식이 없어요</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            나만의 이야기를 기록하거나<br />
                            소중한 사람을 위한 공간을 만들어보세요.
                        </p>
                        <Link href={`/space/${personalSpace.id}`}>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8">
                                첫 번째 기록 남기기
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
