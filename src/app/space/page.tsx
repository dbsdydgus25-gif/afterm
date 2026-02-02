import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MemoryFeed } from "@/components/space/MemoryFeed";

export default async function SpaceHome() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?returnTo=/space");
    }

    // Get my space
    const { data: mySpace } = await supabase
        .from("spaces")
        .select("*")
        .eq("owner_id", user.id)
        .single();

    if (!mySpace) {
        redirect("/onboarding");
    }

    // Get friend spaces (mutual relationships)
    const { data: friendships } = await supabase
        .from("relationships")
        .select("following_id")
        .eq("follower_id", mySpace.id)
        .eq("status", "accepted");

    const friendIds = friendships?.map(f => f.following_id) || [];
    const allSpaceIds = [mySpace.id, ...friendIds];

    // Get memories from me and friends
    const { data: memories } = await supabase
        .from("memories")
        .select(`
            *,
            writer:writer_id (
                handle,
                name,
                avatar_url
            ),
            recipient:recipient_id (
                handle,
                name
            )
        `)
        .in("space_id", allSpaceIds)
        .order("created_at", { ascending: false })
        .limit(50);

    return (
        <div className="max-w-[430px] mx-auto">
            {/* Header with AFTERM Logo */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
                <div className="px-4 py-3 flex items-center justify-center">
                    <a
                        href="/"
                        className="text-[18px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        AFTERM
                    </a>
                </div>
            </div>

            {/* Feed */}
            <MemoryFeed
                memories={memories || []}
                mySpaceId={mySpace.id}
            />
        </div>
    );
}
