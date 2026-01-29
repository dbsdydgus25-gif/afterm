
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
        <div className="min-h-screen bg-[#FDFBF7] text-slate-800">
            {/* Header removed from here, handled in layout */}


            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 animate-fade-in">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-3xl md:text-4xl font-serif text-stone-800">
                        기억의 공간
                    </h1>
                    <p className="text-stone-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                        나의 삶을 기록하고, 소중한 사람을 추억하는 공간입니다.<br />
                        당신의 이야기는 이곳에서 영원히 기억됩니다.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                    {/* 1. My Personal Space */}
                    <div className="group relative bg-white rounded-3xl p-8 shadow-sm border border-stone-100 hover:shadow-xl hover:border-stone-200 transition-all duration-500">
                        <div className="absolute top-6 right-6 text-stone-300 group-hover:text-stone-800 transition-colors">
                            <ArrowRight size={24} />
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-[#F5F0E6] flex items-center justify-center mb-6 text-stone-600 group-hover:scale-110 transition-transform duration-500">
                            <User size={32} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-stone-800">나의 공간</h2>
                        <p className="text-stone-500 text-sm leading-relaxed mb-8 h-10">
                            나의 일상과 생각을 차곡차곡 쌓아가는<br />
                            사적인 아카이브입니다.
                        </p>

                        {mySpaceId ? (
                            <Link href={`/space/${mySpaceId}`}>
                                <Button className="w-full py-6 text-lg bg-stone-800 hover:bg-stone-700 text-[#FDFBF7] rounded-xl shadow-lg shadow-stone-200">
                                    입장하기
                                </Button>
                            </Link>
                        ) : (
                            <Button disabled className="w-full py-6 text-lg bg-stone-200 text-stone-400 rounded-xl">
                                생성 중...
                            </Button>
                        )}
                    </div>

                    {/* 2. Remembrance Space */}
                    <div className="group relative bg-white rounded-3xl p-8 shadow-sm border border-stone-100 hover:shadow-xl hover:border-blue-100 transition-all duration-500">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform duration-500">
                            <Heart size={32} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-stone-800">기억 공간</h2>
                        <p className="text-stone-500 text-sm leading-relaxed mb-8 h-10">
                            그리운 누군가를 위해 만든<br />
                            특별한 추모의 공간입니다.
                        </p>

                        {remembranceSpace ? (
                            <div className="space-y-3">
                                <Link href={`/space/${remembranceSpace.id}`}>
                                    <Button className="w-full py-6 text-lg bg-white border-2 border-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-xl">
                                        {remembranceSpace.name} 방문하기
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <Link href="/space/create">
                                <Button className="w-full py-6 text-lg bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300 rounded-xl flex items-center justify-center gap-2">
                                    <PlusCircle size={20} />
                                    공간 만들기
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Social Feed Link */}
                <div className="mt-16 text-center">
                    <Link href="/feed" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors font-medium border-b border-transparent hover:border-stone-800 pb-0.5">
                        친구들의 소식 둘러보기 <ArrowRight size={16} />
                    </Link>
                </div>

            </main>
        </div>
    );
}
