'use client';

import { useState, useMemo, useCallback } from 'react';
import { Search, X, MessageSquare, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useChatStore, ChatThread } from '@/lib/store/chat-store';
import { cn } from '@/lib/utils';

interface SearchResult {
  threadId: string;
  threadTitle: string;
  messageId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  matchStart: number;
  matchEnd: number;
}

interface ConversationSearchProps {
  onResultClick?: (threadId: string, messageId: string) => void;
  className?: string;
}

export function ConversationSearch({ onResultClick, className }: ConversationSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const threads = useChatStore((state) => state.threads);
  const switchThread = useChatStore((state) => state.switchThread);

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 2) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    Object.values(threads).forEach((thread: ChatThread) => {
      // Search in thread title
      if (thread.title.toLowerCase().includes(lowerQuery)) {
        // Add thread as a result
      }

      // Search in messages
      Object.values(thread.messages).forEach((message) => {
        const lowerContent = message.content.toLowerCase();
        const matchIndex = lowerContent.indexOf(lowerQuery);

        if (matchIndex !== -1) {
          results.push({
            threadId: thread.id,
            threadTitle: thread.title,
            messageId: message.id,
            content: message.content,
            role: message.role as 'user' | 'assistant',
            timestamp: message.createdAt,
            matchStart: matchIndex,
            matchEnd: matchIndex + query.length,
          });
        }
      });
    });

    // Sort by timestamp (newest first)
    return results.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }, [query, threads]);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      switchThread(result.threadId);
      onResultClick?.(result.threadId, result.messageId);
      setIsOpen(false);
      setQuery('');
    },
    [switchThread, onResultClick],
  );

  const highlightMatch = (text: string, start: number, end: number) => {
    const before = text.slice(Math.max(0, start - 30), start);
    const match = text.slice(start, end);
    const after = text.slice(end, end + 50);

    return (
      <span className="text-sm">
        {start > 30 && '...'}
        {before}
        <span className="bg-yellow-200 font-medium dark:bg-yellow-800">{match}</span>
        {after}
        {after.length === 50 && '...'}
      </span>
    );
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search conversations..."
          className="pr-9 pl-9"
        />
        {query && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
          >
            <X size={14} />
          </Button>
        )}
      </div>

      {isOpen && searchResults.length > 0 && (
        <Card className="absolute top-full right-0 left-0 z-50 mt-1 max-h-80 overflow-hidden shadow-lg">
          <div className="bg-muted/50 text-muted-foreground border-b p-2 text-xs">
            {searchResults.length} result{searchResults.length !== 1 && 's'} found
          </div>
          <ScrollArea className="max-h-64">
            <div className="p-1">
              {searchResults.map((result) => (
                <button
                  key={`${result.threadId}-${result.messageId}`}
                  className="hover:bg-muted w-full rounded p-2 text-left transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <MessageSquare size={12} className="text-muted-foreground" />
                    <span className="flex-1 truncate text-xs font-medium">
                      {result.threadTitle}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                      <Calendar size={10} />
                      {new Date(result.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-muted-foreground pl-5">
                    {highlightMatch(result.content, result.matchStart, result.matchEnd)}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {isOpen && query.length >= 2 && searchResults.length === 0 && (
        <Card className="text-muted-foreground absolute top-full right-0 left-0 z-50 mt-1 p-4 text-center text-sm">
          No results found for "{query}"
        </Card>
      )}
    </div>
  );
}
