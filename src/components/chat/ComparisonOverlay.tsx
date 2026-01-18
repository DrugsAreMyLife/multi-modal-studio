'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { AIModel } from '@/lib/models';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Maximize2, Minimize2, X, RefreshCw, Merge, ArrowRight } from 'lucide-react';
import { cn, getMsgContent } from '@/lib/utils';
import { UIMessage as Message } from 'ai';

interface ComparisonOverlayProps {
  prompt: string;
  models: AIModel[];
  baseHistory: Message[]; // The conversation history prior to this comparison
  onExit: () => void;
  onCombine: (selectedOutputs: string[]) => void;
}

// Sub-component for a single column to isolate useChat hook
function ComparisonColumn({
  model,
  prompt,
  baseHistory,
  onComplete,
  isSelected,
  onToggleSelect,
  isFinished,
}: {
  model: AIModel;
  prompt: string;
  baseHistory: Message[];
  onComplete: (content: string) => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  isFinished: boolean;
}) {
  const { messages, sendMessage: append, status, setMessages } = useChat();
  const isLoading = status === 'streaming' || status === 'submitted';
  const prevStatusRef = useRef(status);

  // Track completion
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status === 'ready') {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant') {
        onComplete(getMsgContent(lastMsg));
      }
    }
    prevStatusRef.current = status;
  }, [status, messages, onComplete]);

  // Trigger generation on mount
  useEffect(() => {
    setMessages(baseHistory);
    // Only trigger if we don't have the response yet (messages length == base + 1 user + 1 assistant)
    // Actually, initialMessages includes base.
    // We need to append the USER prompt.
    // wait for next tick?

    // Actually, we can just append. append() will append to current messages.
    // But we need to make sure baseHistory is set first.
    // The setMessages might be async in effect or we need to wait.

    // Simpler: Just rely on append to start the conversation off the base?
    // No, we need context.
  }, []);

  useEffect(() => {
    if (messages.length === baseHistory.length) {
      append({ text: prompt });
    }
  }, [messages.length, baseHistory.length, prompt]);

  const lastMessage = messages[messages.length - 1];
  const content = lastMessage?.role === 'assistant' ? getMsgContent(lastMessage) : '';

  return (
    <Card
      className={cn(
        'flex h-full flex-col overflow-hidden border-2 transition-all',
        isSelected ? 'border-primary ring-primary/20 ring-2' : 'border-border',
      )}
    >
      <CardHeader className="bg-muted/30 flex flex-row items-center justify-between space-y-0 p-3 text-sm">
        <div className="flex items-center gap-2 font-bold">
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-green-500"
            style={{ opacity: isLoading ? 1 : 0 }}
          />
          {model.name}
        </div>
        {isFinished && <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />}
      </CardHeader>
      <CardContent className="relative min-h-0 flex-1 p-0">
        <ScrollArea className="h-full p-4">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
            {isLoading && (
              <span className="bg-primary ml-1 inline-block h-4 w-1.5 animate-pulse align-middle" />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function ComparisonOverlay({
  prompt,
  models,
  baseHistory,
  onExit,
  onCombine,
}: ComparisonOverlayProps) {
  const [results, setResults] = useState<Record<string, string>>({});
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());

  const handleComplete = (modelId: string, content: string) => {
    setResults((prev) => ({ ...prev, [modelId]: content }));
  };

  const toggleSelection = (modelId: string) => {
    const newSet = new Set(selectedModelIds);
    if (newSet.has(modelId)) newSet.delete(modelId);
    else newSet.add(modelId);
    setSelectedModelIds(newSet);
  };

  const handleCombineClick = () => {
    const selectedOutputs = Array.from(selectedModelIds).map((id) => results[id]);
    onCombine(selectedOutputs);
  };

  const allFinished = models.every((m) => results[m.id]);
  const hasSelection = selectedModelIds.size > 0;

  return (
    <div className="bg-background/95 flex h-full flex-col backdrop-blur-sm">
      {/* Header */}
      <div className="bg-card z-10 flex items-center justify-between border-b p-4 shadow-sm">
        <div className="mx-auto max-w-2xl flex-1 text-center">
          <div className="text-muted-foreground mb-1 text-xs font-bold tracking-widest uppercase">
            User Prompt
          </div>
          <p className="truncate px-4 text-lg leading-tight font-medium" title={prompt}>
            "{prompt}"
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit} className="shrink-0 gap-2">
          <X size={16} /> Exit Comparison
        </Button>
      </div>

      {/* Grid */}
      <div className="min-h-0 flex-1 overflow-hidden p-4">
        <div
          className="grid h-full gap-4"
          style={{
            gridTemplateColumns: `repeat(${models.length}, minmax(300px, 1fr))`,
          }}
        >
          {models.map((model) => (
            <ComparisonColumn
              key={model.id}
              model={model}
              prompt={prompt}
              baseHistory={baseHistory}
              onComplete={(c) => handleComplete(model.id, c)}
              isSelected={selectedModelIds.has(model.id)}
              onToggleSelect={() => toggleSelection(model.id)}
              isFinished={!!results[model.id]}
            />
          ))}
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="bg-card flex justify-center gap-4 border-t p-4">
        {hasSelection ? (
          <Button
            onClick={handleCombineClick}
            size="lg"
            className="animate-in slide-in-from-bottom-5 gap-2 shadow-lg"
          >
            <Merge size={18} />
            Combine {selectedModelIds.size} Selected{' '}
            {selectedModelIds.size === 1 ? 'Response' : 'Responses'}
          </Button>
        ) : (
          <div className="text-muted-foreground flex h-10 items-center text-sm italic">
            {allFinished ? 'Select responses above to combine them' : 'Streaming responses...'}
          </div>
        )}
      </div>
    </div>
  );
}
