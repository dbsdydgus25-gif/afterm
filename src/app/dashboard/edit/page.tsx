"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { ArrowLeft, Upload, X, FileText, Loader2, Image as ImageIcon, Video } from "lucide-react";

interface Attachment {
    id: string;
    file_path: string;
    file_size: number;
    file_type: string;
}

export default function EditMessagePage() {
    const router = useRouter();
    const { message, setMessage, messageId, recipient, setRecipient, user, plan } = useMemoryStore();

    // Local state for file management
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
    const [legacyFilePath, setLegacyFilePath] = useState<string | null>(null);
    const [legacyFileSize, setLegacyFileSize] = useState<number>(0);

    const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({});
    const [isSaving, setIsSaving] = useState(false);

    // Load initial data
    useEffect(() => {
        if (!messageId) {
            router.replace('/dashboard');
            return;
        }

        const fetchCurrentMessage = async () => {
            const supabase = createClient();

            // 1. Fetch Message & Legacy File
            const { data: msg } = await supabase
                .from('messages')
                .select('file_path, file_size')
                .eq('id', messageId)
                .single();

            // 2. Fetch Attachments
            const { data: attachments } = await supabase
                .from('message_attachments')
                .select('id, file_path, file_size, file_type')
                .eq('message_id', messageId);

            setExistingAttachments(attachments || []);

            // Check legacy file (avoid duplicates)
            if (msg?.file_path) {
                const isDuplicate = attachments?.some(a => a.file_path === msg.file_path);
                if (!isDuplicate) {
                    setLegacyFilePath(msg.file_path);
                    setLegacyFileSize(msg.file_size || 0);
                }
            }

            // Generate previews for existing attachments
            if (attachments && attachments.length > 0) {
                const previews: { [key: string]: string } = {};
                for (const att of attachments) {
                    if (att.file_type?.startsWith('image/')) {
                        const { data: signedData } = await supabase.storage
                            .from('memories')
                            .createSignedUrl(att.file_path, 3600);
                        if (signedData?.signedUrl) {
                            previews[att.id] = signedData.signedUrl;
                        }
                    }
                }
                setFilePreviews(previews);
            }
        };
        fetchCurrentMessage();
    }, [messageId, router]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);

            const LIMIT = plan === 'pro' ? 1024 * 1024 * 1024 : 500 * 1024 * 1024;

            for (const file of selectedFiles) {
                if (file.size > LIMIT) {
                    alert(`파일 '${file.name}'의 크기는 ${plan === 'pro' ? '1GB' : '500MB'}를 초과할 수 없습니다.`);
                    return;
                }
            }

            setNewFiles(prev => [...prev, ...selectedFiles]);

            // Generate previews for new files
            selectedFiles.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setFilePreviews(prev => ({
                            ...prev,
                            [file.name]: e.target?.result as string
                        }));
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    };

    const removeNewFile = (index: number) => {
        const fileToRemove = newFiles[index];
        setNewFiles(prev => prev.filter((_, i) => i !== index));

        // Remove preview
        if (fileToRemove.type.startsWith('image/')) {
            setFilePreviews(prev => {
                const newPreviews = { ...prev };
                delete newPreviews[fileToRemove.name];
                return newPreviews;
            });
        }
    };

    const removeExistingAttachment = async (attachmentId: string, path: string, size: number) => {
        if (!confirm("이 파일을 삭제하시겠습니까?")) return;

        const supabase = createClient();

        // Delete from Storage
        await supabase.storage.from('memories').remove([path]);

        // Delete from DB
        await supabase.from('message_attachments').delete().eq('id', attachmentId);

        // Update UI
        setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId));
        setFilePreviews(prev => {
            const newPreviews = { ...prev };
            delete newPreviews[attachmentId];
            return newPreviews;
        });

        // Update Storage Usage
        const { data: profile } = await supabase.from('profiles').select('storage_used').eq('id', user?.id).single();
        if (profile) {
            await supabase.from('profiles').update({
                storage_used: Math.max(0, profile.storage_used - size)
            }).eq('id', user?.id);
        }

        alert("파일이 삭제되었습니다.");
    };

    const removeLegacyFile = async () => {
        if (!confirm("이 파일을 삭제하시겠습니까?")) return;
        if (!legacyFilePath) return;

        const supabase = createClient();
        await supabase.storage.from('memories').remove([legacyFilePath]);

        // Update Message
        await supabase.from('messages').update({ file_path: null, file_size: 0 }).eq('id', messageId);

        // Update Storage
        const { data: profile } = await supabase.from('profiles').select('storage_used').eq('id', user?.id).single();
        if (profile && legacyFileSize) {
            await supabase.from('profiles').update({
                storage_used: Math.max(0, profile.storage_used - legacyFileSize)
            }).eq('id', user?.id);
        }

        setLegacyFilePath(null);
        setLegacyFileSize(0);
        alert("파일이 삭제되었습니다.");
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^0-9]/g, "");
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 7) {
            value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
        } else if (value.length > 3) {
            value = `${value.slice(0, 3)}-${value.slice(3)}`;
        }
        setRecipient({ ...recipient, phone: value });
    };

    const handleSave = async () => {
        if (!message.trim()) {
            alert("메시지를 입력해주세요.");
            return;
        }
        if (!recipient.name || !recipient.phone) {
            alert("받는 분의 이름과 전화번호를 입력해주세요.");
            return;
        }

        setIsSaving(true);
        const supabase = createClient();

        try {
            // 1. Upload NEW files
            if (newFiles.length > 0) {
                const uploadedFiles: { path: string, size: number, type: string }[] = [];

                for (const file of newFiles) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const path = `${user?.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('memories')
                        .upload(path, file);

                    if (uploadError) {
                        console.error("Storage upload error:", uploadError);
                        throw new Error(`파일 업로드 실패: ${uploadError.message}`);
                    }

                    uploadedFiles.push({ path, size: file.size, type: file.type });
                }

                // Insert into message_attachments
                const attachmentsData = uploadedFiles.map(f => ({
                    message_id: messageId,
                    file_path: f.path,
                    file_size: f.size,
                    file_type: f.type
                }));

                const { error: attachError } = await supabase.from('message_attachments').insert(attachmentsData);
                if (attachError) {
                    console.error("Attachment insert error:", attachError);
                    // Rollback uploaded files
                    const filePaths = uploadedFiles.map(f => f.path);
                    await supabase.storage.from('memories').remove(filePaths);
                    throw new Error(`첨부파일 저장 실패: ${attachError.message}`);
                }

                // Update Storage Usage
                const totalNewSize = uploadedFiles.reduce((acc, f) => acc + f.size, 0);
                const { data: profile } = await supabase.from('profiles').select('storage_used').eq('id', user?.id).single();
                if (profile) {
                    await supabase.from('profiles').update({
                        storage_used: profile.storage_used + totalNewSize
                    }).eq('id', user?.id);
                }
            }

            // 2. Update Message Content
            const { error } = await supabase
                .from('messages')
                .update({
                    content: message,
                    recipient_name: recipient.name,
                    recipient_phone: recipient.phone,
                    recipient_relationship: recipient.relationship,
                    updated_at: new Date().toISOString()
                })
                .eq('id', messageId);

            if (error) {
                console.error("Message update error:", error);
                throw new Error(`메시지 업데이트 실패: ${error.message}`);
            }

            alert("메시지가 수정되었습니다.");
            router.push('/dashboard/memories');
        } catch (error: any) {
            console.error("Save error:", error);
            alert(error.message || "저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <main className="pt-24 pb-20 px-4 md:px-0 max-w-2xl mx-auto">
                <div className="mb-6 flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="sm" className="pl-0 gap-1 text-slate-500 hover:text-slate-900">
                        <ArrowLeft className="w-4 h-4" /> 취소
                    </Button>
                    <h1 className="text-xl font-bold text-slate-900">메시지와 받는 사람 수정</h1>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">

                    {/* 1. Message Content */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">남기실 말씀</label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[200px] text-lg leading-relaxed p-4 bg-slate-50 border-slate-200 resize-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                            placeholder="전하고 싶은 말을 남겨주세요..."
                        />
                    </div>

                    {/* 2. File Attachments */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-700">사진/영상 첨부</label>
                            <span className="text-xs text-slate-400">
                                {plan === 'pro' ? '최대 1GB' : '최대 500MB'}
                            </span>
                        </div>

                        {/* File Grid Preview */}
                        {(existingAttachments.length > 0 || newFiles.length > 0 || legacyFilePath) && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {/* Legacy File */}
                                {legacyFilePath && (
                                    <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileText className="w-12 h-12 text-slate-400" />
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={removeLegacyFile}
                                                className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="absolute top-2 left-2">
                                            <span className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">Legacy</span>
                                        </div>
                                    </div>
                                )}

                                {/* Existing Attachments */}
                                {existingAttachments.map(att => (
                                    <div key={att.id} className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                                        {att.file_type?.startsWith('image/') && filePreviews[att.id] ? (
                                            <img src={filePreviews[att.id]} alt="Attachment" className="w-full h-full object-cover" />
                                        ) : att.file_type?.startsWith('video/') ? (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                                <Video className="w-12 h-12 text-slate-500" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FileText className="w-12 h-12 text-slate-400" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => removeExistingAttachment(att.id, att.file_path, att.file_size)}
                                                className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-2 left-2 right-2">
                                            <span className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded block truncate">
                                                {(att.file_size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* New Files */}
                                {newFiles.map((file, idx) => (
                                    <div key={`new-${idx}`} className="relative aspect-square bg-blue-50 rounded-xl overflow-hidden border-2 border-blue-200 group">
                                        {file.type.startsWith('image/') && filePreviews[file.name] ? (
                                            <img src={filePreviews[file.name]} alt={file.name} className="w-full h-full object-cover" />
                                        ) : file.type.startsWith('video/') ? (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-100">
                                                <Video className="w-12 h-12 text-blue-500" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FileText className="w-12 h-12 text-blue-400" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => removeNewFile(idx)}
                                                className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="absolute top-2 left-2">
                                            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">NEW</span>
                                        </div>
                                        <div className="absolute bottom-2 left-2 right-2">
                                            <span className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded block truncate">
                                                {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Button */}
                        <div className="relative group">
                            <input
                                type="file"
                                onChange={handleFileSelect}
                                multiple
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                accept="image/*,video/*"
                            />
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 bg-slate-50 group-hover:bg-blue-50/50 group-hover:border-blue-200 transition-all cursor-pointer">
                                <Upload className="w-8 h-8 mb-2 text-blue-500" />
                                <span className="text-sm font-medium text-slate-600">
                                    파일 추가하기
                                </span>
                                <span className="text-xs text-slate-400 mt-1">
                                    이미지 또는 영상 파일을 선택하세요
                                </span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* 3. Recipient Info */}
                    <div className="space-y-6">
                        <label className="text-sm font-bold text-slate-700 block mb-[-10px]">받는 분 정보</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500">이름</label>
                                <input
                                    type="text"
                                    value={recipient.name}
                                    onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                    placeholder="홍길동"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500">관계</label>
                                <div className="space-y-2">
                                    <select
                                        value={['가족', '친구', '연인', '동료'].includes(recipient.relationship) ? recipient.relationship : '기타'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '기타') {
                                                setRecipient({ ...recipient, relationship: '' });
                                            } else {
                                                setRecipient({ ...recipient, relationship: val });
                                            }
                                        }}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium appearance-none"
                                    >
                                        <option value="가족">가족</option>
                                        <option value="친구">친구</option>
                                        <option value="연인">연인</option>
                                        <option value="동료">동료</option>
                                        <option value="기타">기타 (직접 입력)</option>
                                    </select>

                                    {(!['가족', '친구', '연인', '동료'].includes(recipient.relationship)) && (
                                        <input
                                            type="text"
                                            value={recipient.relationship}
                                            onChange={(e) => setRecipient({ ...recipient, relationship: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium animate-in fade-in slide-in-from-top-1"
                                            placeholder="직접 입력 (예: 이웃, 선생님)"
                                            autoFocus
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500">휴대폰 번호</label>
                            <input
                                type="tel"
                                value={recipient.phone}
                                onChange={handlePhoneChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium tracking-wide"
                                placeholder="010-0000-0000"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" /> 저장 중...
                                </span>
                            ) : (
                                "수정 완료"
                            )}
                        </Button>
                    </div>

                </div>
            </main>
        </div>
    );
}
