'use client';

import { useState, useEffect, useRef } from 'react';
import { useDetachedChatStore } from '@/lib/store/detached-chat-store';
import { SelectionChatPopup } from './SelectionChatPopup';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function DetachedChatManager() {
    const { popups, addPopup } = useDetachedChatStore();
    const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseUp = (e: MouseEvent) => {
            // Ignore if clicking inside the tooltip or popups
            if (tooltipRef.current?.contains(e.target as Node)) return;

            // Check if clicking inside an existing popup
            if ((e.target as HTMLElement).closest('.SelectionChatPopup')) return;

            const sel = window.getSelection();
            const text = sel?.toString().trim();

            if (text && text.length > 3) {
                const range = sel?.getRangeAt(0);
                const rect = range?.getBoundingClientRect();
                if (rect) {
                    setSelection({
                        text,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                    });
                }
            } else {
                setSelection(null);
            }
        };

        const handleMouseDown = () => {
            // Optional: Hide tooltip on mouse down to avoid floating during drag
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    const handleAskAI = () => {
        if (selection) {
            addPopup(selection.text, { x: selection.x - 160, y: selection.y + 40 });
            setSelection(null);
            // Clear browser selection
            window.getSelection()?.removeAllRanges();
        }
    };

    return (
        <>
            {/* Selection Tooltip */}
            {selection && (
                <div
                    ref={tooltipRef}
                    className="fixed z-[300] -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in zoom-in duration-200"
                    style={{ left: selection.x, top: selection.y }}
                >
                    <Button
                        size="sm"
                        onClick={handleAskAI}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg border border-primary-foreground/20 flex items-center gap-2 px-3 py-1 text-xs font-semibold"
                    >
                        <Sparkles size={14} className="animate-pulse" />
                        Ask AI
                    </Button>
                </div>
            )}

            {/* Active Popups */}
            {popups.map(p => (
                <SelectionChatPopup
                    key={p.id}
                    id={p.id}
                    context={p.context}
                    initialPosition={p.position}
                />
            ))}
        </>
    );
}
