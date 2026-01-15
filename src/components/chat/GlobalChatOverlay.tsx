'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import { ChatOrchestrator } from './ChatOrchestrator';
import { useEffect } from 'react';
import { useUIStore } from '@/lib/store/ui-store';

export function GlobalChatOverlay() {
    const { isGlobalChatOpen, setGlobalChatOpen, toggleGlobalChat } = useUIStore();

    // Global Hotkey (Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleGlobalChat();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleGlobalChat]);

    return (
        <Sheet open={isGlobalChatOpen} onOpenChange={setGlobalChatOpen}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 border-l border-border bg-background/95 backdrop-blur-xl z-[100]">
                <div className="h-full flex flex-col">
                    <SheetHeader className="h-14 border-b border-border flex flex-row items-center justify-between px-4 bg-background/50 space-y-0">
                        <SheetTitle className="font-semibold flex items-center gap-2 text-base">
                            <MessageSquare size={16} className="text-primary" />
                            Chat Orchestrator
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-hidden relative">
                        <ChatOrchestrator />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
