'use client';

import { Activity, Share2, Download, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/store/ui-store';
import { NotificationCenter } from '@/components/ui/NotificationCenter';

export function TopBar() {
    const { toggleGlobalChat, isGlobalChatOpen } = useUIStore();
    return (
        <div className="h-12 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-between px-4 z-40">
            <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-muted-foreground">My Project / <span className="text-foreground">Untitled Session</span></div>
            </div>

            <div className="flex items-center gap-3">
                {/* Compute Meter Mockup */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full border border-border">
                    <Activity size={12} className="text-green-500" />
                    <span>GPU: Ready</span>
                </div>

                <NotificationCenter />

                <div className="h-4 w-[1px] bg-border mx-1" />

                <Button
                    variant={isGlobalChatOpen ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={toggleGlobalChat}
                >
                    <MessageSquare size={14} />
                    Chat <span className="text-xs opacity-50 font-mono hidden md:inline ml-1">⌘K</span>
                </Button>

                <div className="h-4 w-[1px] bg-border mx-1" />

                <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                    <Share2 size={14} />
                    Share
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                    <Download size={14} />
                    Export
                </Button>
            </div>
        </div>
    );
}
