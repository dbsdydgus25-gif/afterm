import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SpaceProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?returnTo=/space/profile");
    }

    // Get my space
    const { data: mySpace } = await supabase
        .from("spaces")
        .select("handle")
        .eq("owner_id", user.id)
        .single();

    if (!mySpace?.handle) {
        redirect("/onboarding");
    }

    // Redirect to my @username page
    redirect(`/space/${mySpace.handle}`);
}
