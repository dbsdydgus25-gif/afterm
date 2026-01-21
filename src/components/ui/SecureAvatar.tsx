"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecureAvatarProps {
    src?: string | null;
    alt: string;
    className?: string;
    fallback?: React.ReactNode;
    onBlobLoad?: (blobUrl: string) => void;
}

export function SecureAvatar({ src, alt, className, fallback, onBlobLoad }: SecureAvatarProps) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!src) {
            setIsLoading(false);
            return;
        }

        const fetchSignedUrl = async () => {
            try {
                // Scenario 1: It's already a blob/data URL or external (Google/DiceBear)
                if (src.startsWith('blob:') || src.startsWith('data:') || src.includes('dicebear') || src.includes('googleusercontent')) {
                    setSignedUrl(src);
                    setIsLoading(false);
                    return;
                }

                // Scenario 2: It is a Supabase Storage URL (Public format)
                // Format: .../storage/v1/object/public/avatars/folder/file.ext
                // OR custom domain: .../storage/v1/object/public/avatars/...

                let path = src;
                const publicMarker = "/storage/v1/object/public/avatars/";

                if (src.includes(publicMarker)) {
                    path = src.split(publicMarker)[1];
                } else if (src.includes("/storage/v1/object/public/")) {
                    // Fallback for other buckets if needed or slight variations
                    try {
                        const url = new URL(src);
                        if (url.pathname.includes('/avatars/')) {
                            path = url.pathname.split('/avatars/')[1];
                        }
                    } catch (e) {
                        // ignore
                    }
                } else if (src.startsWith('http')) {
                    // It is an external URL (Google, etc.) or unknown.
                    setSignedUrl(src);
                    setIsLoading(false);
                    return;
                }

                // If we have a path (either parsed or raw filename), get a signed URL
                const supabase = createClient();
                const { data, error } = await supabase.storage
                    .from('avatars')
                    .createSignedUrl(path, 3600); // 1 hour validity

                if (error || !data?.signedUrl) {
                    console.warn("Failed to sign avatar URL:", path, error);
                    setHasError(true);
                } else {
                    setSignedUrl(data.signedUrl);
                    if (onBlobLoad) onBlobLoad(data.signedUrl);
                }
            } catch (e) {
                console.error(e);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSignedUrl();
    }, [src]);

    if (!src || hasError) {
        return (
            <span className={cn("flex items-center justify-center bg-slate-100 text-slate-400", className)}>
                {fallback || <User className="w-1/2 h-1/2" />}
            </span>
        );
    }

    if (isLoading) {
        return (
            <span className={cn("flex items-center justify-center bg-slate-50 animate-pulse", className)}>
            </span>
        );
    }

    return (
        <img
            src={signedUrl || ""}
            alt={alt}
            className={cn("object-cover", className)}
            onError={() => setHasError(true)}
        />
    );
}
