
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MemorialCanvas } from "@/components/space/canvas/MemorialCanvas";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function SpaceCanvasPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch Space Info
    const { data: space, error: spaceError } = await supabase
        .from("memorial_spaces")
        .select("*")
        .eq("id", id)
        .single();

    if (spaceError || !space) {
        console.error("Space Fetch Error:", spaceError);
        return <div className="p-10 text-center">Space Not Found or Access Denied</div>;
    }

    // 2. Fetch Blocks
    const { data: blocks, error: blocksError } = await supabase
        .from("memorial_blocks")
        .select("*")
        .eq("space_id", id);
    // .order("created_at", { ascending: true }); // Order by creation for now, later position

    /*
    // 3. Check Membership (Optional for now, but good for permissions)
    let role = 'viewer';
    if (user) {
        if (space.owner_id === user.id) {
            role = 'host';
        } else {
            const { data: member } = await supabase
                .from("space_members")
                .select("role")
                .eq("space_id", id)
                .eq("user_id", user.id)
                .single();
            if (member) role = member.role;
        }
    }
    */
    const role = (user?.id === space.owner_id) ? 'host' : 'viewer'; // Simplified for MVP

    return (
        <div className="min-h-screen bg-slate-100">
            <MemorialCanvas
                space={space}
                initialBlocks={blocks || []}
                currentUser={user}
                role={role}
            />
        </div>
    );
}
