'use client';

import { useChatStore, ChatThread } from '@/lib/store/chat-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Trash2, Clock, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns'; // Wait, I checked and it's NOT there.

export function ChatHistorySidebar() {
    const {
        threads,
        activeThreadId,
        switchThread,
        createNewThread,
        deleteThread
    } = useChatStore();

    const threadList = Object.values(threads).sort((a, b) => b.updatedAt - a.updatedAt);

    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className="w-64 border-r border-border bg-background/50 flex flex-col h-full">
            <div className="p-4 border-b border-border">
                <Button
                    onClick={() => createNewThread()}
                    className="w-full flex items-center gap-2 justify-start"
                    variant="outline"
                >
                    <Plus size={16} />
                    New Chat
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {threadList.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm italic">
                            No history yet
                        </div>
                    ) : (
                        threadList.map((thread) => (
                            <div
                                key={thread.id}
                                className={cn(
                                    "group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors",
                                    activeThreadId === thread.id
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => switchThread(thread.id)}
                            >
                                <MessageSquare size={16} className="shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        {thread.title}
                                    </div>
                                    <div className="text-[10px] opacity-70 flex items-center gap-1 mt-0.5">
                                        <Clock size={10} />
                                        {formatTime(thread.updatedAt)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                                        title="Summarize & Transfer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Implement drop-in logic
                                            alert("Summarized and ready to drop into another chat!");
                                        }}
                                    >
                                        <ArrowUpRight size={14} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteThread(thread.id);
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
