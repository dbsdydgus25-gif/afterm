"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useMemoryStore } from "@/store/useMemoryStore";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function EditProfilePage() {
    const router = useRouter();
    const { user, setUser } = useMemoryStore();
    const [name, setName] = useState(user?.name || "");

    const handleSave = () => {
        if (!name) return;
        setUser({ ...user, name, email: user?.email || "" });
        alert("회원 정보가 수정되었습니다.");
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <main className="pt-32 pb-20 px-6 lg:px-8 max-w-2xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> 돌아가기
                </button>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-900 mb-8">내 정보 수정</h1>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">이름</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">이메일</label>
                            <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-400">이메일은 변경할 수 없습니다.</p>
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={handleSave}
                                className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                            >
                                저장하기
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
