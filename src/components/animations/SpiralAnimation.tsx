'use client';
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

gsap.registerPlugin(ScrollTrigger);

const SpiralAnimation: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const router = useRouter();

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // We will use standard colored shapes if icons missing, to prevent loading block.
        // However, trying to load generic icons from external URLs or use shapes is safer.
        // Let's use simple drawing to represent "digital items" to prevent broken images.

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        resize();

        const params = {
            progress: 0
        };

        const initAnimation = () => {
            ScrollTrigger.create({
                trigger: container,
                start: "top top",
                end: "+=1500",
                pin: true,
                scrub: 1,
                onUpdate: (self) => {
                    params.progress = self.progress;
                    draw();
                }
            });

            draw();
        };

        const drawItem = (ctx: CanvasRenderingContext2D, size: number, type: number) => {
            ctx.beginPath();
            if (type % 3 === 0) {
                ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                ctx.fillStyle = '#3b82f6';
            } else if (type % 3 === 1) {
                ctx.roundRect(-size / 2, -size / 2, size, size, 8);
                ctx.fillStyle = '#10b981';
            } else {
                ctx.moveTo(0, -size / 2);
                ctx.lineTo(size / 2, size / 2);
                ctx.lineTo(-size / 2, size / 2);
                ctx.fillStyle = '#f59e0b';
            }
            ctx.fill();
            ctx.closePath();
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            const centerX = width / 2;
            const centerY = height / 2;
            const numIcons = 15;

            for (let i = 0; i < numIcons; i++) {
                const angle = (i / numIcons) * Math.PI * 2;
                const startRadius = Math.min(width, height) * 0.9 + (i * 10);

                const startX = centerX + Math.cos(angle) * startRadius;
                const startY = centerY + Math.sin(angle) * startRadius;

                const endRadius = 40 + (i * 2);
                const endX = centerX + Math.cos(angle * 5) * endRadius;
                const endY = centerY + Math.sin(angle * 5) * endRadius;

                // Elastic ease effect manual calculation
                const p = params.progress;

                const currentX = startX + (endX - startX) * p;
                const currentY = startY + (endY - startY) * p;

                const scale = 1 - (p * 0.4);
                const size = 45 * scale;

                ctx.save();
                ctx.translate(currentX, currentY);
                ctx.rotate(p * Math.PI * 4 * (i % 2 === 0 ? 1 : -1) + (i * 0.2));

                ctx.globalAlpha = 0.2 + (p * 0.8);
                drawItem(ctx, size, i);
                ctx.restore();
            }
        };

        initAnimation();

        return () => {
            window.removeEventListener('resize', resize);
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-screen bg-slate-900 overflow-hidden flex items-center justify-center border-t border-slate-800">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full z-0 pointer-events-none"
            />

            <div className="relative z-10 flex flex-col items-center justify-center pointer-events-auto px-6">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.4)] mb-6 md:mb-8 border border-blue-400/20">
                    <Search className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 text-center leading-tight">
                    흩어져 있는 고인의<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">데이터 유산</span>을 한 곳에
                </h2>
                <p className="text-slate-400 text-sm md:text-lg mb-8 md:mb-10 text-center max-w-md mx-auto leading-relaxed">
                    여기저기 흩어진 구독 서비스, 계정 정보들을<br className="hidden md:block" /> 가디언즈가 한눈에 안전하게 모아볼 수 있습니다.
                </p>
                <button onClick={() => router.push('/vault')} className="px-8 py-4 bg-white text-slate-900 text-sm md:text-lg font-bold rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] inline-flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    고인 데이터 유산 찾기
                </button>
            </div>
        </div>
    );
};

export default SpiralAnimation;
