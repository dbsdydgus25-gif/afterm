
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

    if (error) {
        console.error("Error fetching spaces:", error);
        // If table doesn't exist yet, we might want to show a friendly error or just empty
    }

    const personalSpace = spaces?.find((s) => s.space_type === "PERSONAL");
    const remembranceSpace = spaces?.find((s) => s.space_type === "REMEMBRANCE");

    // 2. Auto-Create Personal Space if missing
    let mySpaceId = personalSpace?.id;

    if (!personalSpace) {
        const { data: newSpace, error: createError } = await supabase
            .from("life_spaces")
            .insert({
                owner_id: user.id,
                space_type: "PERSONAL",
                name: user.user_metadata?.name ? `${user.user_metadata.name}의 공간` : "나의 기록 공간",
                intro_text: "나의 소중한 순간들을 기록합니다.",
                theme_color: "warm-beige",
            })
            .select()
            .single();

        if (createError) {
            console.error("Failed to create personal space:", createError);
        } else if (newSpace) {
            mySpaceId = newSpace.id;
        }
    }

    return (
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Header removed from here, handled in layout */}


            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 animate-fade-in">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        기억의 공간
                    </h1>
                    <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                        나의 삶을 기록하고, 소중한 사람을 추억하는 디지털 아카이브.<br />
                        당신의 이야기는 이곳에서 영원히 기억됩니다.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                    {/* 1. My Personal Space */}
                    <div className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                        <div className="absolute top-6 right-6 text-slate-300 group-hover:text-blue-600 transition-colors">
                            <ArrowRight size={24} />
                        </div>
                        <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                            <User size={28} strokeWidth={2} />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-slate-900">나의 공간</h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8 h-10 break-keep">
                            나의 일상과 생각을 기록하는<br />
                            프라이빗 아카이브
                        </p>

                        {mySpaceId ? (
                            <Link href={`/space/${mySpaceId}`}>
                                <Button className="w-full py-6 text-base font-bold bg-slate-900 hover:bg-blue-600 text-white rounded-xl transition-all shadow-md shadow-slate-200 hover:shadow-blue-200">
                                    입장하기
                                </Button>
                            </Link>
                        ) : (
                            <Button disabled className="w-full py-6 text-base font-bold bg-slate-100 text-slate-400 rounded-xl">
                                생성 중...
                            </Button>
                        )}
                    </div>

                    {/* 2. Remembrance Space */}
                    <div className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all duration-300">
                        <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                            <Heart size={28} strokeWidth={2} />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-slate-900">기억 공간</h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8 h-10 break-keep">
                            그리운 누군가를 추억하는<br />
                            소셜 메모리얼
                        </p>

                        {remembranceSpace ? (
                            <div className="space-y-3">
                                <Link href={`/space/${remembranceSpace.id}`}>
                                    <Button className="w-full py-6 text-base font-bold bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl shadow-sm">
                                        {remembranceSpace.name} 방문하기
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <Link href="/space/create">
                                <Button className="w-full py-6 text-base font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 rounded-xl flex items-center justify-center gap-2 transition-all">
                                    <PlusCircle size={20} />
                                    공간 만들기
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Social Feed Link */}
                <div className="mt-16 text-center">
                    <Link href="/space/activity" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-medium text-sm">
                        친구들의 소식 둘러보기 <ArrowRight size={14} />
                    </Link>
                </div>

            </main>
        </div>
    );
}
