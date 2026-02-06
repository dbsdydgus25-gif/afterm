"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const spaceId = params.spaceId as string;
    const [status, setStatus] = useState<"checking" | "joining" | "success" | "error">("checking");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const joinSpace = async () => {
            if (!spaceId) return;

            // 1. Check Auth
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Not logged in -> Redirect to Login with return URL
                // Using a simple query param method or local storage is better, but here we just redirect
                // The middleware or auth provider should handle returnTo logic ideally.
                // For now, we'll force login and hope the user comes back manually or we implement better redirect logic later.
                // Actually, let's redirect to login page with a return param?
                // Assuming standard Auth UI doesn't support complex return flows easily without customization.
                // We'll just ask them to login.
                alert("초대를 수락하려면 로그인이 필요합니다.");
                router.push('/login'); // Or wherever login is
                return;
            }

            setStatus("joining");

            // 2. Check if already member
            const { data: existingMember } = await supabase
                .from('space_members')
                .select('id')
                .eq('space_id', spaceId)
                .eq('user_id', user.id)
                .single();

            if (existingMember) {
                setStatus("success");
                router.push(`/space/${spaceId}`);
                return;
            }

            // 3. Join as Viewer (Default)
            const { error } = await supabase
                .from('space_members')
                .insert({
                    space_id: spaceId,
                    user_id: user.id,
                    role: 'viewer', // Default role for link invites
                    status: 'active'
                });

            if (error) {
                console.error(error);
                setStatus("error");
                setErrorMsg("입장에 실패했습니다. 관리자에게 문의하세요.");
            } else {
                setStatus("success");
                router.push(`/space/${spaceId}`);
            }
        };

        joinSpace();
    }, [spaceId, supabase, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="text-center space-y-4 bg-white p-8 rounded-2xl shadow-sm max-w-sm w-full">
                {status === "checking" || status === "joining" ? (
                    <>
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                        <p className="text-slate-600 font-medium">초대장 확인 중...</p>
                    </>
                ) : status === "error" ? (
                    <>
                        <div className="text-red-500 font-bold text-lg mb-2">오류 발생</div>
                        <p className="text-slate-500 text-sm">{errorMsg}</p>
                        <Button onClick={() => router.push('/space')} className="mt-4 w-full">
                            홈으로 돌아가기
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="text-blue-600 font-bold text-lg">입장 성공!</div>
                        <p className="text-slate-500 text-sm">추모 공간으로 이동합니다...</p>
                    </>
                )}
            </div>
        </div>
    );
}
