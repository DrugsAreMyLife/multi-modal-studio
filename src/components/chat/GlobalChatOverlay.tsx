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
      <SheetContent
        side="right"
        className="border-border bg-background/95 z-[100] w-[400px] border-l p-0 backdrop-blur-xl sm:w-[540px]"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-border bg-background/50 flex h-14 flex-row items-center justify-between space-y-0 border-b px-4">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold">
              <MessageSquare size={16} className="text-primary" />
              Chat Orchestrator
            </SheetTitle>
          </SheetHeader>
          <div className="relative flex-1 overflow-hidden">
            <ChatOrchestrator />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
