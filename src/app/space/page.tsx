import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SpaceRedirect() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 로그인 안 한 경우 → 로그인 페이지로
    if (!user) {
        redirect("/login?returnTo=/space");
    }

    // 로그인한 경우 → 내 Space 가져오기
    const { data: mySpace } = await supabase
        .from("spaces")
        .select("handle")
        .eq("owner_id", user.id)
        .single();

    // Space가 있으면 내 Space로 리다이렉트
    if (mySpace?.handle) {
        redirect(`/space/${mySpace.handle}`);
    }

    // Space가 없으면 생성 페이지로 (fallback)
    redirect("/onboarding");
}
