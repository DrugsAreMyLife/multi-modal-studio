'use client';

import { useChat } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { X, Send, CornerDownLeft, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useState, useRef, useEffect } from 'react';
import { useDetachedChatStore } from '@/lib/store/detached-chat-store';
import { useChatStore } from '@/lib/store/chat-store';
import { getMsgContent } from '@/lib/utils';

interface SelectionChatPopupProps {
  id: string;
  context: string;
  initialPosition: { x: number; y: number };
}

export function SelectionChatPopup({ id, context, initialPosition }: SelectionChatPopupProps) {
  const removePopup = useDetachedChatStore((state) => state.removePopup);
  const updatePosition = useDetachedChatStore((state) => state.updatePopupPosition);
  const { addMessage, createNewThread } = useChatStore();

  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat();
  const isLoading = status === 'streaming' || status === 'submitted';

  // Context is now passed via the first message instead of initialMessages

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    // Include context in first message
    const messageText =
      messages.length === 0 ? `Context: "${context}"\n\nQuestion: ${input}` : input;
    sendMessage({ text: messageText });
    setInput('');
  };

  const handleDropInChat = () => {
    // 1. Create a new thread (or use current)
    const threadId = createNewThread();

    // 2. Add context as a system/user note
    addMessage({
      role: 'user',
      content: `[Context from Selection]: ${context}\n\nLet's continue our conversation about this.`,
      parentId: null,
    });

    // 3. Add all current messages from the popup to the main store
    messages.forEach((m) => {
      addMessage({
        role: m.role as any,
        content: getMsgContent(m),
        parentId: null, // Simplified for now, could be chained
      });
    });

    // 4. Remove this popup
    removePopup(id);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => {
        const newPos = {
          x: initialPosition.x + info.offset.x,
          y: initialPosition.y + info.offset.y,
        };
        updatePosition(id, newPos);
      }}
      initial={{ opacity: 0, scale: 0.9, x: initialPosition.x, y: initialPosition.y }}
      animate={{ opacity: 1, scale: 1 }}
      className="pointer-events-auto fixed z-[200] h-96 w-80 shadow-2xl"
    >
      <Card className="border-primary/20 bg-background/95 ring-primary/10 flex h-full flex-col overflow-hidden ring-1 backdrop-blur-xl">
        {/* Header */}
        <div className="border-border bg-muted/50 group flex cursor-move items-center justify-between border-b p-2">
          <div className="flex items-center gap-2">
            <GripVertical
              size={14}
              className="text-muted-foreground opacity-50 group-hover:opacity-100"
            />
            <span className="text-primary text-xs font-semibold tracking-wider uppercase">
              Ask AI
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 hover:text-primary h-6 w-6 transition-colors"
              onClick={handleDropInChat}
              title="Drop in Chat"
            >
              <CornerDownLeft size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-destructive/10 hover:text-destructive h-6 w-6 transition-colors"
              onClick={() => removePopup(id)}
            >
              <X size={14} />
            </Button>
          </div>
        </div>

        {/* Context Tip */}
        <div className="bg-primary/5 border-primary/10 border-b px-3 py-1.5">
          <p className="text-muted-foreground truncate text-[10px] italic">Context: "{context}"</p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3">
          <div ref={scrollRef} className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-2 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted border-border border'
                  }`}
                >
                  {getMsgContent(m)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-border bg-muted/30 border-t p-2">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask follow up..."
              className="bg-background ring-border focus-visible:ring-primary h-8 border-none text-xs shadow-none ring-1"
            />
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-md"
              disabled={isLoading || !input.trim()}
            >
              <Send size={14} />
            </Button>
          </form>
        </div>
      </Card>
    </motion.div>
  );
}
