'use client';

import { useImageStudioStore } from '@/lib/store/image-studio-store';
import { useRef, useEffect } from 'react';

export function UnifiedCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { settings } = useImageStudioStore();

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-grid-slate-500/[0.1] relative overflow-hidden flex items-center justify-center bg-zinc-900/50"
        >
            {/* Canvas Placeholder Area */}
            <div
                className="bg-white shadow-2xl relative transition-all duration-300"
                style={{
                    width: settings.width / 2, // Scale down for view
                    height: settings.height / 2,
                }}
            >
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground opacity-50 pointer-events-none">
                    Canvas ({settings.width}x{settings.height})
                </div>
            </div>

            {/* Floating Toolbar Placeholder */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-xl flex gap-4">
                <span className="text-xs font-semibold">Toolbar Placeholder</span>
            </div>
        </div>
    );
}
