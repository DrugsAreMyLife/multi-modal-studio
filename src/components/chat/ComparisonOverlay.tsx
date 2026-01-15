'use client';

import { useState, useEffect } from 'react';
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
    isFinished
}: {
    model: AIModel;
    prompt: string;
    baseHistory: Message[];
    onComplete: (content: string) => void;
    isSelected: boolean;
    onToggleSelect: () => void;
    isFinished: boolean;
}) {
    const { messages, sendMessage: append, status, setMessages } = useChat({
        id: `comparison-${model.id}-${Date.now()}`,
        onFinish: (result) => onComplete(getMsgContent(result.message))
    });

    const isLoading = status === 'streaming' || status === 'submitted';

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
        <Card className={cn("flex flex-col h-full overflow-hidden border-2 transition-all", isSelected ? "border-primary ring-2 ring-primary/20" : "border-border")}>
            <CardHeader className="p-3 bg-muted/30 flex flex-row items-center justify-between space-y-0 text-sm">
                <div className="font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ opacity: isLoading ? 1 : 0 }} />
                    {model.name}
                </div>
                {isFinished && (
                    <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
                )}
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0 relative">
                <ScrollArea className="h-full p-4">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {content}
                        {isLoading && <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary animate-pulse" />}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export function ComparisonOverlay({ prompt, models, baseHistory, onExit, onCombine }: ComparisonOverlayProps) {
    const [results, setResults] = useState<Record<string, string>>({});
    const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());

    const handleComplete = (modelId: string, content: string) => {
        setResults(prev => ({ ...prev, [modelId]: content }));
    };

    const toggleSelection = (modelId: string) => {
        const newSet = new Set(selectedModelIds);
        if (newSet.has(modelId)) newSet.delete(modelId);
        else newSet.add(modelId);
        setSelectedModelIds(newSet);
    };

    const handleCombineClick = () => {
        const selectedOutputs = Array.from(selectedModelIds).map(id => results[id]);
        onCombine(selectedOutputs);
    };

    const allFinished = models.every(m => results[m.id]);
    const hasSelection = selectedModelIds.size > 0;

    return (
        <div className="flex flex-col h-full bg-background/95 backdrop-blur-sm">
            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between bg-card shadow-sm z-10">
                <div className="flex-1 max-w-2xl mx-auto text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">User Prompt</div>
                    <p className="font-medium text-lg leading-tight truncate px-4" title={prompt}>
                        "{prompt}"
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={onExit} className="shrink-0 gap-2">
                    <X size={16} /> Exit Comparison
                </Button>
            </div>

            {/* Grid */}
            <div className="flex-1 min-h-0 p-4 overflow-hidden">
                <div
                    className="grid h-full gap-4"
                    style={{
                        gridTemplateColumns: `repeat(${models.length}, minmax(300px, 1fr))`,
                    }}
                >
                    {models.map(model => (
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
            <div className="border-t p-4 bg-card flex justify-center gap-4">
                {hasSelection ? (
                    <Button
                        onClick={handleCombineClick}
                        size="lg"
                        className="gap-2 shadow-lg animate-in slide-in-from-bottom-5"
                    >
                        <Merge size={18} />
                        Combine {selectedModelIds.size} Selected {selectedModelIds.size === 1 ? 'Response' : 'Responses'}
                    </Button>
                ) : (
                    <div className="text-sm text-muted-foreground flex items-center h-10 italic">
                        {allFinished ? "Select responses above to combine them" : "Streaming responses..."}
                    </div>
                )}
            </div>
        </div>
    );
}
