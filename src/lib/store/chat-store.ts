import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ChatTree, MessageNode, Role } from '@/lib/types';
import { ModelConfig } from '@/lib/models/supported-models';
import { supabase } from '@/lib/db/client';

export interface ChatThread extends ChatTree {
  id: string;
  title: string;
  summary?: string;
  createdAt: number;
  updatedAt: number;
  modelId?: string;
  providerId?: string;
  modelConfig?: ModelConfig;
}

interface ChatState {
  threads: Record<string, ChatThread>;
  activeThreadId: string | null;

  // Computed (for component convenience)
  getActiveThread: () => ChatThread | null;

  // Actions
  addMessage: (message: Omit<MessageNode, 'id' | 'childrenIds' | 'createdAt'>) => string;
  setLeaf: (leafId: string) => void;
  traverseToRoot: (leafId: string) => MessageNode[];
  getSiblingIndex: (nodeId: string) => { index: number; total: number };
  navigateToSibling: (nodeId: string, direction: 'prev' | 'next') => void;

  // Thread Management
  createNewThread: () => string;
  switchThread: (threadId: string) => void;
  deleteThread: (id: string) => void;
  clearAllThreads: () => void;
  splitThread: (threadId: string, nodeId: string) => string;
  updateThreadTitle: (id: string, title: string) => void;
  transferMessagesToThread: (sourceThreadId: string, targetThreadId: string) => void;
  togglePin: (threadId: string, messageId: string) => void;
  setThreadModel: (threadId: string, modelId: string, providerId?: string) => void;

  // Sync Actions
  syncThread: (threadId: string, userId: string) => Promise<void>;
  syncMessage: (message: MessageNode, threadId: string) => Promise<void>;
}

const DEFAULT_THREAD_TITLE = 'New Conversation';

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: {},
      activeThreadId: null,

      getActiveThread: () => {
        const { threads, activeThreadId } = get();
        if (!activeThreadId) return null;
        return threads[activeThreadId] || null;
      },

      createNewThread: () => {
        const id = uuidv4();
        const newThread: ChatThread = {
          id,
          title: DEFAULT_THREAD_TITLE,
          rootId: null,
          messages: {},
          currentLeafId: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          modelId: 'gpt-4.5-turbo',
          providerId: 'openai',
        };

        set((state) => ({
          threads: { ...state.threads, [id]: newThread },
          activeThreadId: id,
        }));

        return id;
      },

      switchThread: (threadId) => {
        set({ activeThreadId: threadId });
      },

      deleteThread: (threadId) => {
        set((state) => {
          const newThreads = { ...state.threads };
          delete newThreads[threadId];

          let nextActiveId = state.activeThreadId;
          if (state.activeThreadId === threadId) {
            const remainingIds = Object.keys(newThreads);
            nextActiveId = remainingIds.length > 0 ? remainingIds[remainingIds.length - 1] : null;
          }

          return {
            threads: newThreads,
            activeThreadId: nextActiveId,
          };
        });
      },

      clearAllThreads: () => {
        set({ threads: {}, activeThreadId: null });
      },

      addMessage: (partialMsg) => {
        const id = uuidv4();
        const newNode: MessageNode = {
          ...partialMsg,
          id,
          childrenIds: [],
          createdAt: Date.now(),
          visionImages: partialMsg.visionImages,
        };

        const state = get();
        let threadId = state.activeThreadId;

        // Auto-create thread if none exists
        if (!threadId) {
          threadId = get().createNewThread();
        }

        set((state) => {
          const thread = state.threads[threadId!];
          if (!thread) return state;

          const newMessages = { ...thread.messages, [id]: newNode };

          // Update parent's children array
          if (newNode.parentId && newMessages[newNode.parentId]) {
            const parent = { ...newMessages[newNode.parentId] };
            parent.childrenIds = [...parent.childrenIds, id];
            newMessages[newNode.parentId] = parent;
          }

          // If this is the first message, set as root
          const newRootId = thread.rootId || (newNode.parentId ? thread.rootId : id);

          // Update title if it's the first message
          let newTitle = thread.title;
          if (!thread.rootId && newNode.role === 'user') {
            newTitle = newNode.content.slice(0, 40) + (newNode.content.length > 40 ? '...' : '');
          }

          const updatedThread: ChatThread = {
            ...thread,
            messages: newMessages,
            rootId: newRootId,
            currentLeafId: id,
            title: newTitle,
            updatedAt: Date.now(),
          };

          return {
            threads: { ...state.threads, [threadId!]: updatedThread },
          };
        });

        return id;
      },

      setLeaf: (leafId) => {
        const { activeThreadId, threads } = get();
        if (!activeThreadId || !threads[activeThreadId]) return;

        set((state) => ({
          threads: {
            ...state.threads,
            [activeThreadId]: {
              ...state.threads[activeThreadId],
              currentLeafId: leafId,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      traverseToRoot: (leafId) => {
        const thread = get().getActiveThread();
        if (!thread) return [];

        const { messages } = thread;
        const path: MessageNode[] = [];
        let currentId: string | null = leafId;

        while (currentId && messages[currentId]) {
          path.unshift(messages[currentId]);
          currentId = messages[currentId].parentId;
        }

        return path;
      },

      getSiblingIndex: (nodeId) => {
        const thread = get().getActiveThread();
        if (!thread) return { index: 0, total: 1 };

        const { messages } = thread;
        const node = messages[nodeId];
        if (!node || !node.parentId) return { index: 0, total: 1 };

        const parent = messages[node.parentId];
        const index = parent.childrenIds.indexOf(nodeId);
        return { index, total: parent.childrenIds.length };
      },

      navigateToSibling: (nodeId, direction) => {
        const thread = get().getActiveThread();
        if (!thread) return;

        const { messages } = thread;
        const node = messages[nodeId];
        if (!node || !node.parentId) return;

        const parent = messages[node.parentId];
        const currentIndex = parent.childrenIds.indexOf(nodeId);
        if (currentIndex === -1) return;

        let newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

        // Bounds check
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= parent.childrenIds.length) newIndex = parent.childrenIds.length - 1;

        if (newIndex === currentIndex) return;

        const siblingId = parent.childrenIds[newIndex];

        // When switching branches, find the "leaf" of that branch
        let targetId = siblingId;
        while (messages[targetId].childrenIds.length > 0) {
          const children = messages[targetId].childrenIds;
          targetId = children[children.length - 1];
        }

        get().setLeaf(targetId);
      },

      splitThread: (threadId, nodeId) => {
        const state = get();
        const thread = state.threads[threadId];
        if (!thread) return '';

        // Traverse to root to get the specific path
        const messages = thread.messages;
        const newThreadMessages: Record<string, MessageNode> = {};
        let currentId: string | null = nodeId;

        while (currentId && messages[currentId]) {
          newThreadMessages[currentId] = { ...messages[currentId], childrenIds: [] };
          currentId = messages[currentId].parentId;
        }

        const newThreadId = uuidv4();
        const newThread: ChatThread = {
          id: newThreadId,
          title: `Split: ${thread.title}`,
          rootId: thread.rootId, // Might be deeper than root, but we filter
          messages: newThreadMessages,
          currentLeafId: nodeId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          threads: { ...state.threads, [newThreadId]: newThread },
          activeThreadId: newThreadId,
        }));

        return newThreadId;
      },

      updateThreadTitle: (id, title) =>
        set((state) => ({
          threads: {
            ...state.threads,
            [id]: { ...state.threads[id], title, updatedAt: Date.now() },
          },
        })),

      transferMessagesToThread: (sourceId, targetId) => {
        const state = get();
        const source = state.threads[sourceId];
        const target = state.threads[targetId];
        if (!source || !target) return;

        // Create a synthetic summary message
        const summaryContent = `[Imported from ${source.title}]\n\nContext Summary: This conversation explored various topics including ${source.title}.`;

        // Add to target thread (simplified: add as a user message)
        const id = uuidv4();
        const newNode: MessageNode = {
          id,
          role: 'user',
          content: summaryContent,
          parentId: target.currentLeafId,
          childrenIds: [],
          createdAt: Date.now(),
        };

        set((state) => ({
          threads: {
            ...state.threads,
            [targetId]: {
              ...state.threads[targetId],
              messages: { ...state.threads[targetId].messages, [id]: newNode },
              currentLeafId: id,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      togglePin: (threadId, messageId) => {
        set((state) => {
          const thread = state.threads[threadId];
          if (!thread || !thread.messages[messageId]) return state;

          const message = thread.messages[messageId];
          const updatedMessage = { ...message, isPinned: !message.isPinned };

          return {
            threads: {
              ...state.threads,
              [threadId]: {
                ...thread,
                messages: {
                  ...thread.messages,
                  [messageId]: updatedMessage,
                },
              },
            },
          };
        });
      },

      setThreadModel: (threadId, modelId, providerId) =>
        set((state) => {
          const thread = state.threads[threadId];
          if (!thread) return state;
          return {
            threads: {
              ...state.threads,
              [threadId]: {
                ...thread,
                modelId,
                providerId: providerId || thread.providerId || 'openai',
                updatedAt: Date.now(),
              },
            },
          };
        }),

      syncThread: async (threadId, userId) => {
        const thread = get().threads[threadId];
        if (!thread) return;

        const { error } = await supabase.from('conversations').upsert({
          id: thread.id,
          user_id: userId,
          title: thread.title,
          model_id: thread.modelId,
          updated_at: new Date(thread.updatedAt).toISOString(),
          created_at: new Date(thread.createdAt).toISOString(),
        });

        if (error) console.error('Failed to sync thread:', error);
      },

      syncMessage: async (message, threadId) => {
        const { error } = await supabase.from('messages').upsert({
          id: message.id,
          conversation_id: threadId,
          parent_id: message.parentId,
          role: message.role,
          content: message.content,
          vision_images: message.visionImages,
          created_at: new Date(message.createdAt).toISOString(),
        });

        if (error) console.error('Failed to sync message:', error);
      },
    }),
    {
      name: 'chat-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          const state = persistedState as any;
          if (state.threads) {
            Object.keys(state.threads).forEach((id) => {
              if (!state.threads[id].modelId) {
                state.threads[id].modelId = 'gpt-4.5-turbo';
              }
              if (!state.threads[id].providerId) {
                state.threads[id].providerId = 'openai';
              }
            });
          }
        }
        return persistedState;
      },
    },
  ),
);
