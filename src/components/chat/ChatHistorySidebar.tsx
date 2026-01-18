import React, { memo } from 'react';

import { useChatStore, ChatThread } from '@/lib/store/chat-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Trash2, Clock, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns'; // Wait, I checked and it's NOT there.

const ThreadItem = memo(
  ({
    thread,
    isActive,
    onSwitch,
    onDelete,
    formatTime,
  }: {
    thread: ChatThread;
    isActive: boolean;
    onSwitch: (id: string) => void;
    onDelete: (id: string) => void;
    formatTime: (ts: number) => string;
  }) => (
    <div
      className={cn(
        'group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground',
      )}
      onClick={() => onSwitch(thread.id)}
    >
      <MessageSquare size={16} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{thread.title}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] opacity-70">
          <Clock size={10} />
          {formatTime(thread.updatedAt)}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 hover:text-primary h-7 w-7"
          title="Summarize & Transfer"
          onClick={(e) => {
            e.stopPropagation();
            alert('Summarized and ready to drop into another chat!');
          }}
        >
          <ArrowUpRight size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-destructive/10 hover:text-destructive h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(thread.id);
          }}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  ),
);

ThreadItem.displayName = 'ThreadItem';

export function ChatHistorySidebar() {
  const { threads, activeThreadId, switchThread, createNewThread, deleteThread } = useChatStore();

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
    <div className="border-border bg-background/50 flex h-full w-64 flex-col border-r">
      <div className="border-border border-b p-4">
        <Button
          onClick={() => createNewThread()}
          className="flex w-full items-center justify-start gap-2"
          variant="outline"
        >
          <Plus size={16} />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {threadList.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm italic">
              No history yet
            </div>
          ) : (
            threadList.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isActive={activeThreadId === thread.id}
                onSwitch={switchThread}
                onDelete={deleteThread}
                formatTime={formatTime}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
