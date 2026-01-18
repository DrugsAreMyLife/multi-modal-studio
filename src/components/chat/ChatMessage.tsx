'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Pin, Pencil, Scissors } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageContent } from './MessageContent';
import { BranchSwitcher } from './BranchSwitcher';
import { UIMessage } from 'ai';

interface ChatMessageProps {
  message: UIMessage;
  storeNode?: any;
  index: number;
  total: number;
  isLoading: boolean;
  onNavigateToSibling: (id: string, direction: 'prev' | 'next') => void;
  onEdit: (id: string, content: string, parentId: string | null) => void;
  onTogglePin: (id: string) => void;
  onSplitThread: (id: string) => void;
  getMsgContent: (m: UIMessage) => string;
}

const ChatMessage = memo(
  ({
    message: m,
    storeNode,
    index,
    total,
    isLoading,
    onNavigateToSibling,
    onEdit,
    onTogglePin,
    onSplitThread,
    getMsgContent,
  }: ChatMessageProps) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} group`}
      >
        <Avatar className="mt-1 h-8 w-8">
          <AvatarFallback
            className={
              m.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted border-border border'
            }
          >
            {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
          </AvatarFallback>
        </Avatar>
        <div
          className={`flex max-w-[80%] flex-col space-y-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
        >
          <div
            className={`relative rounded-2xl p-3 ${
              m.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-none'
                : 'bg-muted rounded-tl-none'
            } ${storeNode?.isPinned ? 'border-2 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : ''}`}
          >
            {storeNode?.isPinned && (
              <div className="absolute -top-2 -right-2 rounded-full bg-amber-500 p-0.5 text-white shadow-sm">
                <Pin size={10} className="fill-current" />
              </div>
            )}
            <div className="text-sm leading-relaxed">
              <MessageContent content={getMsgContent(m)} />
            </div>
          </div>

          {/* Branch Switcher & Action Tools */}
          <div
            className={`flex h-6 items-center gap-2 transition-opacity ${total > 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            {total > 1 && (
              <BranchSwitcher
                current={index}
                total={total}
                onPrev={() => onNavigateToSibling(m.id, 'prev')}
                onNext={() => onNavigateToSibling(m.id, 'next')}
              />
            )}

            {!isLoading && (
              <>
                {m.role === 'user' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-5 w-5"
                    onClick={() => onEdit(m.id, getMsgContent(m), storeNode?.parentId ?? null)}
                  >
                    <Pencil size={12} />
                    <span className="sr-only">Edit</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'text-muted-foreground hover:text-foreground h-5 w-5',
                    storeNode?.isPinned && 'text-amber-500 hover:text-amber-600',
                  )}
                  title="Pin Context"
                  onClick={() => onTogglePin(m.id)}
                >
                  <Pin size={12} className={cn(storeNode?.isPinned && 'fill-current')} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-5 w-5"
                  title="Split Chat from here"
                  onClick={() => onSplitThread(m.id)}
                >
                  <Scissors size={12} />
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
);

ChatMessage.displayName = 'ChatMessage';

export { ChatMessage };
