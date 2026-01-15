'use client';

import { Send, Bot, User, Pencil, LayoutGrid, Scissors, Network, Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useMemo, useState } from 'react';
import { useChatStore } from '@/lib/store/chat-store';
import { useWorkbenchStore } from '@/lib/store/workbench-store';
import { BranchSwitcher } from './BranchSwitcher';
import { getMsgContent, cn } from '@/lib/utils';
import { MultiModelSelector } from './MultiModelSelector';
import { ComparisonOverlay } from './ComparisonOverlay';
import { ArtifactPanel } from '@/components/artifacts/ArtifactPanel';
import { AIModel } from '@/lib/models';
import { UIMessage as Message } from 'ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { ChatGraphView } from './ChatGraphView';
import { ChatInputArea } from './ChatInputArea';
import { convertFilesToAttachments } from '@/lib/file-utils';
import { useChatWithModel } from '@/lib/hooks/useChatWithModel';

export function ChatOrchestrator() {
    const activeThreadId = useChatStore(state => state.activeThreadId);
    const activeThread = useChatStore(state => activeThreadId ? state.threads[activeThreadId] : null);

    const {
        addMessage,
        traverseToRoot,
        getSiblingIndex,
        navigateToSibling
    } = useChatStore();

    const currentLeafId = activeThread?.currentLeafId ?? null;
    const storeMessages = activeThread?.messages ?? {};

    const threadModelId = activeThread?.modelId || 'gpt-4.5-turbo';
    const threadProviderId = 'openai';

    const [input, setInput] = useState('');
    const [editingParentId, setEditingParentId] = useState<string | null>(null);
    const [isGraphView, setIsGraphView] = useState(false);

    // Multi-Model State
    const [isSelectingModels, setIsSelectingModels] = useState(false);
    const [isComparing, setIsComparing] = useState(false);
    const [selectedModels, setSelectedModels] = useState<AIModel[]>([]);
    const [comparisonPrompt, setComparisonPrompt] = useState('');

    // Derive the linear conversation based on the current leaf
    const thread = useMemo(() => {
        if (!currentLeafId) return [];
        return traverseToRoot(currentLeafId);
    }, [currentLeafId, storeMessages, traverseToRoot]);

    // @ts-ignore workaround for ai sdk type mismatch
    const { messages, sendMessage: append, setMessages, status } = useChatWithModel({
        id: activeThreadId || 'new-session',
        modelId: threadModelId,
        providerId: threadProviderId,
        onFinish: (message: any) => {
            addMessage({
                role: 'assistant',
                content: getMsgContent(message),
                parentId: currentLeafId
            });
        }
    });

    const isLoading = status === 'streaming' || status === 'submitted';

    // Sync Store -> AI SDK (for navigation/history restoration)
    useEffect(() => {
        if (!isLoading) {
            const aiMessages: any[] = thread.map(n => ({
                id: n.id,
                role: n.role,
                content: n.content,
                createdAt: new Date(n.createdAt),
            }));
            setMessages(aiMessages);
        }
    }, [thread, setMessages, isLoading, activeThreadId]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const { batchAddRuns } = useWorkbenchStore();

    const handleStartComparison = (models: AIModel[]) => {
        if (!input.trim()) return;
        setComparisonPrompt(input);
        setSelectedModels(models);
        setIsSelectingModels(false);
        setIsComparing(true);
        setInput('');
    };

    const handleCombineResults = (outputs: string[]) => {
        const combinedContent = `Combine the following AI responses into a single, cohesive answer:\n\n${outputs.map((o, i) => `--- Response ${i + 1} ---\n${o}`).join('\n\n')}`;
        setIsComparing(false);

        const parentId = currentLeafId;
        addMessage({
            role: 'user',
            content: "Synthesize the best parts of the model comparison results.",
            parentId: parentId
        });

        const ancestors = traverseToRoot(parentId || '');
        const aiAncestors: any[] = ancestors.map(n => ({
            id: n.id,
            role: n.role,
            content: n.content,
        }));
        setMessages(aiAncestors);

        append({
            text: combinedContent
        });
    };

    const handleCustomSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userContent = input;
        setInput('');

        // Slash Commands
        if (userContent.startsWith('/sweep')) {
            addMessage({ role: 'user', content: userContent, parentId: currentLeafId });
            setTimeout(() => {
                addMessage({
                    role: 'assistant',
                    content: "Running a variant sweep based on your last prompt... Check the Workbench!",
                    parentId: currentLeafId
                });
                batchAddRuns([
                    { prompt: "Variant A: Cinematic lighting", modelId: 'SDXL', assets: [{ id: 's1', type: 'image', url: 'https://picsum.photos/seed/s1/400/400', createdAt: Date.now() }] },
                    { prompt: "Variant B: Studio lighting", modelId: 'SDXL', assets: [{ id: 's2', type: 'image', url: 'https://picsum.photos/seed/s2/400/400', createdAt: Date.now() }] },
                    { prompt: "Variant C: Neon atmosphere", modelId: 'Flux', assets: [{ id: 's3', type: 'image', url: 'https://picsum.photos/seed/s3/400/400', createdAt: Date.now() }] },
                    { prompt: "Variant D: Monochrome", modelId: 'DALL-E', assets: [{ id: 's4', type: 'image', url: 'https://picsum.photos/seed/s4/400/400', createdAt: Date.now() }] },
                ]);
            }, 600);
            return;
        }

        const parentId = editingParentId !== null ? editingParentId : currentLeafId;
        setEditingParentId(null);

        addMessage({
            role: 'user',
            content: userContent,
            parentId: parentId
        });

        const ancestors = traverseToRoot(parentId || '');
        const aiAncestors: any[] = ancestors.map(n => ({
            id: n.id,
            role: n.role,
            content: n.content,
        }));

        setMessages(aiAncestors);

        await append({
            text: userContent
        });
    };

    return (
        <div className="flex flex-row h-full w-full max-w-[1400px] mx-auto relative overflow-hidden">
            {/* History Sidebar */}
            <ChatHistorySidebar />

            <div className="flex-1 flex flex-col h-full relative px-4">
                {/* Comparison Overlay */}
                <AnimatePresence>
                    {isComparing && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 z-20 bg-background"
                        >
                            <ComparisonOverlay
                                prompt={comparisonPrompt}
                                models={selectedModels}
                                baseHistory={messages as Message[]}
                                onExit={() => setIsComparing(false)}
                                onCombine={handleCombineResults}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Model Selector Modal */}
                <AnimatePresence>
                    {isSelectingModels && (
                        <MultiModelSelector
                            onStartComparison={handleStartComparison}
                            onCancel={() => setIsSelectingModels(false)}
                        />
                    )}
                </AnimatePresence>
                <Card className="flex-1 overflow-hidden border-none shadow-none bg-transparent flex flex-col min-h-0">
                    {/* Header with View Toggle and Model Indicator */}
                    <div className="flex justify-between items-center pr-2 pt-2 px-2">
                        <div className="text-xs text-muted-foreground">
                            Model: <span className="font-semibold text-foreground">{threadModelId}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
                            <Button
                                variant={!isGraphView ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setIsGraphView(false)}
                                title="List View"
                            >
                                <LayoutGrid size={14} className="rotate-0" />
                            </Button>
                            <Button
                                variant={isGraphView ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setIsGraphView(true)}
                                title="Graph View"
                            >
                                <Network size={14} />
                            </Button>
                        </div>
                    </div>

                    {isGraphView ? (
                        <div className="flex-1 min-h-0 p-2">
                            <ChatGraphView
                                messages={Object.values(storeMessages).map(n => ({
                                    ...n,
                                    id: n.id,
                                    role: n.role,
                                    content: n.content,
                                    createdAt: new Date(n.createdAt),
                                    parts: [{ type: 'text', text: n.content }] as any
                                })) as unknown as any[]}
                                onNodeClick={(id) => {
                                    // Navigate to this node
                                    // This is a bit complex as we need to find the leaf path that contains this node
                                    // For now, let's just log it or maybe jump to it if we can find a leaf
                                    console.log("Clicked node", id);
                                }}
                            />
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-6 pb-4 pt-4">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-2 mt-20">
                                        <Bot size={48} />
                                        <p>Start a conversation...</p>
                                        <p className="text-xs text-muted-foreground">Branching enabled. Edit messages to fork!</p>
                                    </div>
                                )}
                                <AnimatePresence initial={false}>
                                    {messages.map((m: any) => {
                                        const storeNode = storeMessages[m.id];
                                        const { index, total } = storeNode ? getSiblingIndex(m.id) : { index: 0, total: 1 };

                                        return (
                                            <motion.div
                                                key={m.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3 }}
                                                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} group`}
                                            >
                                                <Avatar className="h-8 w-8 mt-1">
                                                    <AvatarFallback className={m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border'}>
                                                        {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className={`flex flex-col max-w-[80%] space-y-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                    <div className={`p-3 rounded-2xl relative ${m.role === 'user'
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                        : 'bg-muted rounded-tl-none'
                                                        } ${storeNode?.isPinned ? 'border-2 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : ''}`}>

                                                        {storeNode?.isPinned && (
                                                            <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-0.5 shadow-sm">
                                                                <Pin size={10} className="fill-current" />
                                                            </div>
                                                        )}
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{getMsgContent(m)}</p>
                                                    </div>

                                                    {/* Branch Switcher & Action Tools */}
                                                    <div className={`flex items-center gap-2 h-6 transition-opacity ${total > 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                        {total > 1 && (
                                                            <BranchSwitcher
                                                                current={index}
                                                                total={total}
                                                                onPrev={() => navigateToSibling(m.id, 'prev')}
                                                                onNext={() => navigateToSibling(m.id, 'next')}
                                                            />
                                                        )}

                                                        {!isLoading && (
                                                            <>
                                                                {m.role === 'user' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                                                        onClick={() => {
                                                                            setInput(getMsgContent(m));
                                                                            setEditingParentId(storeNode?.parentId ?? null);
                                                                        }}
                                                                    >
                                                                        <Pencil size={12} />
                                                                        <span className="sr-only">Edit</span>
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={cn("h-5 w-5 text-muted-foreground hover:text-foreground", storeNode?.isPinned && "text-amber-500 hover:text-amber-600")}
                                                                    title="Pin Context"
                                                                    onClick={() => {
                                                                        if (activeThreadId) {
                                                                            useChatStore.getState().togglePin(activeThreadId, m.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Pin size={12} className={cn(storeNode?.isPinned && "fill-current")} />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                                                    title="Split Chat from here"
                                                                    onClick={() => {
                                                                        if (activeThreadId) {
                                                                            useChatStore.getState().splitThread(activeThreadId, m.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Scissors size={12} />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                    )}
                </Card>

                <div className="mt-8 mb-4 max-w-3xl mx-auto w-full">
                    <ChatInputArea
                        value={input}
                        onChange={setInput}
                        onSendMessage={async (content, files) => {
                            if (isLoading) return;

                            // Handle Slash Commands (Simplified for now, file attachments ignored for slash commands generally)
                            if (content.startsWith('/sweep')) {
                                addMessage({ role: 'user', content: content, parentId: currentLeafId });
                                setTimeout(() => {
                                    addMessage({
                                        role: 'assistant',
                                        content: "Running a variant sweep based on your last prompt... Check the Workbench!",
                                        parentId: currentLeafId
                                    });
                                    batchAddRuns([
                                        { prompt: "Variant A: Cinematic lighting", modelId: 'SDXL', assets: [{ id: 's1', type: 'image', url: 'https://picsum.photos/seed/s1/400/400', createdAt: Date.now() }] },
                                        { prompt: "Variant B: Studio lighting", modelId: 'SDXL', assets: [{ id: 's2', type: 'image', url: 'https://picsum.photos/seed/s2/400/400', createdAt: Date.now() }] },
                                        { prompt: "Variant C: Neon atmosphere", modelId: 'Flux', assets: [{ id: 's3', type: 'image', url: 'https://picsum.photos/seed/s3/400/400', createdAt: Date.now() }] },
                                        { prompt: "Variant D: Monochrome", modelId: 'DALL-E', assets: [{ id: 's4', type: 'image', url: 'https://picsum.photos/seed/s4/400/400', createdAt: Date.now() }] },
                                    ]);
                                }, 600);
                                return;
                            }

                            const parentId = editingParentId !== null ? editingParentId : currentLeafId;
                            setEditingParentId(null);
                            setInput('');

                            // Optimistic update
                            addMessage({
                                role: 'user',
                                content: content,
                                parentId: parentId,
                                // We don't have attachments in store message node yet for display, 
                                // but we could add them if we update Types. For now, just sending to AI.
                            });

                            const ancestors = traverseToRoot(parentId || '');
                            const aiAncestors: any[] = ancestors.map(n => ({
                                id: n.id,
                                role: n.role,
                                content: n.content,
                            }));

                            setMessages(aiAncestors);

                            const attachments = await convertFilesToAttachments(files);

                            await append({
                                text: content,
                                ...(attachments && attachments.length > 0 && { experimental_attachments: attachments })
                            } as any);
                        }}
                        onStartComparison={() => {
                            if (input.trim()) setIsSelectingModels(true);
                        }}
                        isLoading={isLoading}
                        placeholder={editingParentId !== null ? "Edit your message to fork..." : "Type your message..."}
                        isEditing={editingParentId !== null}
                    />
                </div>
            </div>
            {/* Artifact Panel Sideview */}
            <ArtifactPanel />
        </div>
    );
}
