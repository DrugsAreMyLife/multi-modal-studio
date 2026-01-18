'use client';

import { Bot, User, Pencil, LayoutGrid, Scissors, Network, Pin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useMemo, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { useChatStore } from '@/lib/store/chat-store';
import { useWorkbenchStore } from '@/lib/store/workbench-store';
import { BranchSwitcher } from './BranchSwitcher';
import { getMsgContent, cn } from '@/lib/utils';
import { MultiModelSelector } from './MultiModelSelector';
import { ComparisonOverlay } from './ComparisonOverlay';
import { ArtifactPanel } from '@/components/artifacts/ArtifactPanel';
import { AIModel } from '@/lib/models';
import { UIMessage } from 'ai';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { ChatGraphView } from './ChatGraphView';
import { ChatInputArea } from './ChatInputArea';
import { MessageContent } from './MessageContent';
import { useChatWithModel } from '@/lib/hooks/useChatWithModel';
import { MessageNode } from '@/lib/types';
import { GenerationRun } from '@/lib/types/workbench';
import { AutoPullOverlay } from '@/components/shared/AutoPullOverlay';

export function ChatOrchestrator() {
  const activeThreadId = useChatStore((state) => state.activeThreadId);
  const activeThread = useChatStore((state) =>
    activeThreadId ? state.threads[activeThreadId] : null,
  );

  const { addMessage, traverseToRoot, getSiblingIndex, navigateToSibling, setThreadModel } =
    useChatStore();

  const currentLeafId = activeThread?.currentLeafId ?? null;
  const storeMessages: Record<string, MessageNode> = activeThread?.messages ?? {};

  const threadModelId = activeThread?.modelId || 'gpt-4.5-turbo';
  const threadProviderId = activeThread?.providerId || 'openai';

  const [input, setInput] = useState('');
  const [editingParentId, setEditingParentId] = useState<string | null>(null);
  const [isGraphView, setIsGraphView] = useState(false);

  // Multi-Model State
  const [isSelectingModels, setIsSelectingModels] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedModels, setSelectedModels] = useState<AIModel[]>([]);
  const [comparisonPrompt, setComparisonPrompt] = useState('');

  // Auto-Pull State
  const [pendingAction, setPendingAction] = useState<{
    content: string;
    attachments: any[];
  } | null>(null);
  const [modelToPull, setModelToPull] = useState<{ id: string; pullString: string } | null>(null);

  // Derive the linear conversation based on the current leaf
  const thread = useMemo(() => {
    if (!currentLeafId) return [];
    return traverseToRoot(currentLeafId);
  }, [currentLeafId, storeMessages, traverseToRoot]);

  // Using the simplified useChatWithModel hook
  const {
    messages,
    sendMessage: append,
    setMessages,
    status,
    modelId,
    providerId,
  } = useChatWithModel({
    modelId: threadModelId,
    providerId: threadProviderId,
  });
  const prevStatusRef = useRef(status);

  // Handle message completion - add to store when streaming finishes
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status === 'ready') {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant') {
        addMessage({
          role: 'assistant',
          content: getMsgContent(lastMsg),
          parentId: currentLeafId,
        });
      }
    }
    prevStatusRef.current = status;
  }, [status, messages, currentLeafId, addMessage]);

  const isLoading = status === 'streaming' || status === 'submitted';

  // Sync Store -> AI SDK (for navigation/history restoration)
  useEffect(() => {
    if (!isLoading) {
      // Map MessageNode to UIMessage structure
      const aiMessages: UIMessage[] = thread.map((n) => ({
        id: n.id,
        role: n.role as any,
        content: n.content,
        createdAt: new Date(n.createdAt),
        parts: [{ type: 'text', text: n.content }],
        // Map attachments if present in MessageNode (future proofing)
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
      content: 'Synthesize the best parts of the model comparison results.',
      parentId: parentId,
    });

    const ancestors = traverseToRoot(parentId || '');
    const aiAncestors: UIMessage[] = ancestors.map((n) => ({
      id: n.id,
      role: n.role as any,
      content: n.content,
      createdAt: new Date(n.createdAt),
      parts: [{ type: 'text', text: n.content }],
    }));
    setMessages(aiAncestors);

    append({
      text: combinedContent,
    });
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // This logic moved to ChatInputArea but kept here just in case direct form is used (unlikely now)
  };

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[1400px] flex-row overflow-hidden">
      {/* History Sidebar */}
      <ChatHistorySidebar />

      <div className="relative flex h-full flex-1 flex-col px-4">
        {/* Comparison Overlay */}
        <AnimatePresence>
          {isComparing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background absolute inset-0 z-20"
            >
              <ComparisonOverlay
                prompt={comparisonPrompt}
                models={selectedModels}
                baseHistory={messages as UIMessage[]}
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
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-none bg-transparent shadow-none">
          {/* Header with View Toggle and Model Selector */}
          <div className="flex items-center justify-between px-2 pt-2 pr-2">
            {/* Model Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-7 gap-1 text-xs"
                >
                  Model:{' '}
                  <span className="text-foreground font-semibold">
                    {SUPPORTED_MODELS.find((m) => m.modelId === threadModelId)?.name ||
                      threadModelId}
                  </span>
                  <ChevronDown size={12} className="opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[280px]">
                <DropdownMenuLabel>Select Model</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SUPPORTED_MODELS.filter((m) => m.providerId === 'openai').length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-muted-foreground px-2 text-[10px] font-normal">
                      OPENAI
                    </DropdownMenuLabel>
                    {SUPPORTED_MODELS.filter((m) => m.providerId === 'openai').map((model) => (
                      <DropdownMenuItem
                        key={model.modelId}
                        onClick={() => {
                          if (activeThreadId) {
                            setThreadModel(activeThreadId, model.modelId, model.providerId);
                          }
                        }}
                        className={threadModelId === model.modelId ? 'bg-accent' : ''}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{model.name}</span>
                          <span className="text-muted-foreground text-[10px]">
                            {model.contextWindow.toLocaleString()} ctx •{' '}
                            {model.pricing.inputPer1kTokens > 0
                              ? `$${model.pricing.inputPer1kTokens}/1K`
                              : 'Free'}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                {SUPPORTED_MODELS.filter((m) => m.providerId === 'anthropic').length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-muted-foreground px-2 text-[10px] font-normal">
                      ANTHROPIC
                    </DropdownMenuLabel>
                    {SUPPORTED_MODELS.filter((m) => m.providerId === 'anthropic').map((model) => (
                      <DropdownMenuItem
                        key={model.modelId}
                        onClick={() => {
                          if (activeThreadId) {
                            setThreadModel(activeThreadId, model.modelId, model.providerId);
                          }
                        }}
                        className={threadModelId === model.modelId ? 'bg-accent' : ''}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{model.name}</span>
                          <span className="text-muted-foreground text-[10px]">
                            {model.contextWindow.toLocaleString()} ctx •{' '}
                            {model.pricing.inputPer1kTokens > 0
                              ? `$${model.pricing.inputPer1kTokens}/1K`
                              : 'Free'}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                {SUPPORTED_MODELS.filter((m) => m.providerId === 'google').length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-muted-foreground px-2 text-[10px] font-normal">
                      GOOGLE
                    </DropdownMenuLabel>
                    {SUPPORTED_MODELS.filter((m) => m.providerId === 'google').map((model) => (
                      <DropdownMenuItem
                        key={model.modelId}
                        onClick={() => {
                          if (activeThreadId) {
                            setThreadModel(activeThreadId, model.modelId, model.providerId);
                          }
                        }}
                        className={threadModelId === model.modelId ? 'bg-accent' : ''}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{model.name}</span>
                          <span className="text-muted-foreground text-[10px]">
                            {model.contextWindow.toLocaleString()} ctx •{' '}
                            {model.pricing.inputPer1kTokens > 0
                              ? `$${model.pricing.inputPer1kTokens}/1K`
                              : 'Free'}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuLabel className="text-muted-foreground px-2 text-[10px] font-normal">
                  OTHER PROVIDERS
                </DropdownMenuLabel>
                {SUPPORTED_MODELS.filter(
                  (m) => !['openai', 'anthropic', 'google'].includes(m.providerId),
                ).map((model) => (
                  <DropdownMenuItem
                    key={model.modelId}
                    onClick={() => {
                      if (activeThreadId) {
                        setThreadModel(activeThreadId, model.modelId, model.providerId);
                      }
                    }}
                    className={threadModelId === model.modelId ? 'bg-accent' : ''}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{model.name}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {model.providerId.toUpperCase()} •{' '}
                        {model.pricing.inputPer1kTokens > 0
                          ? `$${model.pricing.inputPer1kTokens}/1K`
                          : 'Free'}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="bg-muted/50 flex items-center gap-1 rounded-md p-1">
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
            <div className="min-h-0 flex-1 p-2">
              <ChatGraphView
                messages={
                  Object.values(storeMessages).map((n) => ({
                    id: n.id,
                    role: n.role as any,
                    content: n.content,
                    createdAt: new Date(n.createdAt),
                    parts: [{ type: 'text', text: n.content }],
                  })) as UIMessage[]
                }
                onNodeClick={(id) => {
                  console.log('Clicked node', id);
                }}
              />
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pt-4 pb-4">
                {messages.length === 0 && (
                  <div className="text-muted-foreground mt-20 flex h-full flex-col items-center justify-center space-y-2 opacity-50">
                    <Bot size={48} />
                    <p>Start a conversation...</p>
                    <p className="text-muted-foreground text-xs">
                      Branching enabled. Edit messages to fork!
                    </p>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {messages.map((m) => {
                    const storeNode = storeMessages[m.id];
                    const { index, total } = storeNode
                      ? getSiblingIndex(m.id)
                      : { index: 0, total: 1 };

                    return (
                      <ChatMessage
                        key={m.id}
                        message={m}
                        storeNode={storeNode}
                        index={index}
                        total={total}
                        isLoading={isLoading}
                        onNavigateToSibling={navigateToSibling}
                        onEdit={(id, content, parentId) => {
                          setInput(content);
                          setEditingParentId(parentId);
                        }}
                        onTogglePin={(id) => {
                          if (activeThreadId) {
                            useChatStore.getState().togglePin(activeThreadId, id);
                          }
                        }}
                        onSplitThread={(id) => {
                          if (activeThreadId) {
                            useChatStore.getState().splitThread(activeThreadId, id);
                          }
                        }}
                        getMsgContent={getMsgContent}
                      />
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </Card>

        <div className="mx-auto mt-8 mb-4 w-full max-w-3xl">
          <ChatInputArea
            value={input}
            onChange={setInput}
            onSendMessage={async (content, attachments) => {
              if (isLoading) return;

              const parentId = editingParentId !== null ? editingParentId : currentLeafId;
              setEditingParentId(null);
              setInput('');

              // Optimistic update
              addMessage({
                role: 'user',
                content: content,
                parentId: parentId,
              });

              const ancestors = traverseToRoot(parentId || '');
              const aiAncestors: UIMessage[] = ancestors.map((n) => ({
                id: n.id,
                role: n.role as any,
                content: n.content,
                createdAt: new Date(n.createdAt),
                parts: [{ type: 'text', text: n.content }],
              }));

              setMessages(aiAncestors);

              // Correctly map Attachments for AI SDK
              const aiAttachments = attachments
                .filter((a) => a.status === 'completed' && a.url)
                .map((a) => ({
                  name: a.name,
                  contentType: a.type,
                  url: a.url!,
                }));

              await append({
                text: content,
                ...(aiAttachments.length > 0 && { experimental_attachments: aiAttachments }),
              });
            }}
            onPendingSend={async (content, attachments) => {
              // PRE-FLIGHT CHECK: Is this a local model that needs pulling?
              const modelConfig = SUPPORTED_MODELS.find((m) => m.modelId === threadModelId);
              if (modelConfig?.category === 'local' && modelConfig.pullString) {
                try {
                  const res = await fetch('/api/models/local/tags');
                  if (res.ok) {
                    const data = await res.json();
                    const installedNames = new Set(data.models?.map((m: any) => m.name));
                    if (
                      !installedNames.has(modelConfig.pullString) &&
                      !installedNames.has(`${modelConfig.pullString}:latest`)
                    ) {
                      // Trigger Auto-Pull UI
                      setPendingAction({ content, attachments });
                      setModelToPull({
                        id: modelConfig.modelId,
                        pullString: modelConfig.pullString,
                      });
                      throw new Error('PULL_REQUIRED');
                    }
                  }
                } catch (e) {
                  if (e instanceof Error && e.message === 'PULL_REQUIRED') throw e;
                  console.error('Auto-pull check failed', e);
                }
              }
            }}
            onStartComparison={() => {
              if (input.trim()) setIsSelectingModels(true);
            }}
            isLoading={isLoading}
            placeholder={
              editingParentId !== null ? 'Edit your message to fork...' : 'Type your message...'
            }
            isEditing={editingParentId !== null}
          />
        </div>
      </div>
      {/* Artifact Panel Sideview */}
      <ArtifactPanel />

      {/* Auto-Pull Overlay */}
      {modelToPull && (
        <AutoPullOverlay
          modelId={modelToPull.id}
          pullString={modelToPull.pullString}
          onComplete={() => {
            const action = pendingAction;
            setModelToPull(null);
            setPendingAction(null);
            // After pull completion, the user can now send the message.
            if (action) {
              toast.success('Model ready! You can send your message now.');
            }
          }}
          onCancel={() => {
            setModelToPull(null);
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
}
