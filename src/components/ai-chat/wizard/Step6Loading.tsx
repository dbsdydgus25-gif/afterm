
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Step6Props {
    name: string;
    onComplete: () => void;
    onError: (msg: string) => void;
    // API Call Function
    createPersona: () => Promise<void>;
}

export default function Step6Loading({ name, onComplete, onError, createPersona }: Step6Props) {
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("추억을 읽어오는 중입니다...");

    useEffect(() => {
        // Simulated progress messages
        const messages = [
            "추억을 읽어오는 중입니다...",
            `${name}님의 말투를 배우고 있어요...`,
            "따뜻한 온기를 담는 중입니다...",
            "잠시만 기다려주세요..."
        ];

        let msgIdx = 0;
        const msgInterval = setInterval(() => {
            msgIdx = (msgIdx + 1) % messages.length;
            setMessage(messages[msgIdx]);
        }, 2500);

        // Progress bar simulation
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + (Math.random() * 10), 90));
        }, 500);

        // Trigger API Call
        createPersona()
            .then(() => {
                setProgress(100);
                setTimeout(onComplete, 1000); // Wait a bit at 100%
            })
            .catch((err) => {
                onError(err.message || "생성 중 오류가 발생했습니다.");
            });

        return () => {
            clearInterval(msgInterval);
            clearInterval(progressInterval);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-1000">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl animate-pulse opacity-50"></div>
                <div className="relative bg-white p-6 rounded-full shadow-xl">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center animate-pulse">
                {message}
            </h2>
            <p className="text-sm text-gray-500 text-center max-w-xs leading-relaxed">
                완벽하진 않겠지만,<br />
                이 공간이 조금이나마 위로가 되기를 바랍니다.
            </p>

            <div className="w-64 h-2 bg-gray-100 rounded-full mt-8 overflow-hidden">
                <div
                    className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
