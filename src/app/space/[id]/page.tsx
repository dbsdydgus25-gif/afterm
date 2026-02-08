
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
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
        return <div className="p-20 text-center text-slate-500">존재하지 않거나 삭제된 공간입니다.</div>;
    }

    // 2. Determine Role
    let role = 'none';

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

            if (member) {
                role = member.role;
            }
        }
    }

    // 3. Check Access
    if (role === 'none') {
        if (space.is_public) {
            role = 'viewer';
        } else {
            // Private space and not a member
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            🔒
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">비공개 공간입니다</h2>
                        <p className="text-slate-500 mb-6">
                            이 공간은 초대받은 멤버만 입장할 수 있습니다.<br />
                            호스트에게 초대를 요청해보세요.
                        </p>
                        <a href="/space" className="text-blue-600 font-bold hover:underline">
                            내 공간으로 돌아가기
                        </a>
                    </div>
                </div>
            );
        }
    }

    // 4. Fetch Blocks (only if access granted)
    const { data: blocks, error: blocksError } = await supabase
        .from("memorial_blocks")
        .select("*")
        .eq("space_id", id)
        .order("created_at", { ascending: false }); // Newest first

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
