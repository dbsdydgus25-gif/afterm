import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ActivityList } from "@/components/space/ActivityList";

export default async function SpaceActivity() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?returnTo=/space/activity");
    }

    // Get my space
    const { data: mySpace } = await supabase
        .from("spaces")
        .select("*")
        .eq("owner_id", user.id)
        .eq("space_type", "personal")
        .single();

    if (!mySpace) {
        redirect("/space"); // Will auto-create in home page
    }

    // Get pending follow requests (people who want to follow me)
    const { data: pendingRequests } = await supabase
        .from("relationships")
        .select(`
            id,
            follower_id,
            created_at,
            follower:follower_id (
                handle,
                name,
                avatar_url
            )
        `)
        .eq("following_id", mySpace.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    // Get my comments
    const { data: myComments } = await supabase
        .from("memory_comments")
        .select(`
            id,
            memory_id,
            content,
            created_at,
            memory:memory_id (
                id,
                content,
                space:space_id (
                    handle,
                    name
                )
            )
        `)
        .eq("space_id", mySpace.id)
        .order("created_at", { ascending: false });

    return (
        <div className="max-w-[430px] mx-auto min-h-screen">
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
                <div className="px-4 py-4">
                    <h1 className="text-[20px] font-bold text-gray-900">활동</h1>
                </div>
            </div>

            {/* Activity List */}
            <ActivityList
                requests={pendingRequests || []}
                myComments={myComments || []}
                mySpaceId={mySpace.id}
            />
        </div>
    );
}
