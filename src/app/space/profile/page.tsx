
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfileRedirectPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Find Personal Space
    const { data: space } = await supabase
        .from("life_spaces")
        .select("id")
        .eq("owner_id", user.id)
        .eq("space_type", "PERSONAL")
        .single();

    if (space) {
        redirect(`/space/${space.id}`);
    } else {
        // If no profile, go to create
        redirect("/space/create?type=PERSONAL");
    }
}
