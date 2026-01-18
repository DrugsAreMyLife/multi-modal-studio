'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useChatStore } from '@/lib/store/chat-store';
import { supabase } from '@/lib/db/client';

export function useSync() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { threads, syncThread, syncMessage } = useChatStore();

  // Track synced entities to avoid infinite loops if not careful,
  // though upsert handles this well.
  const lastSyncedRef = useRef<Record<string, number>>({});

  // Sync threads and messages when they change
  useEffect(() => {
    if (!userId) return;

    Object.values(threads).forEach(async (thread) => {
      const lastSynced = lastSyncedRef.current[thread.id] || 0;

      if (thread.updatedAt > lastSynced) {
        // Sync thread metadata
        await syncThread(thread.id, userId as string);

        // Sync messages that are new or updated
        const messageSyncPromises = Object.values(thread.messages).map(async (msg) => {
          const msgSyncKey = `${thread.id}:${msg.id}`;
          const lastMsgSynced = lastSyncedRef.current[msgSyncKey] || 0;

          if (msg.createdAt > lastMsgSynced) {
            await syncMessage(msg, thread.id);
            lastSyncedRef.current[msgSyncKey] = msg.createdAt;
          }
        });

        await Promise.all(messageSyncPromises);
        lastSyncedRef.current[thread.id] = thread.updatedAt;
      }
    });
  }, [threads, userId, syncThread, syncMessage]);

  // Initial pull from Supabase
  useEffect(() => {
    if (!userId) return;

    async function pullFromSupabase() {
      // 1. Fetch all conversations for the user
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId);

      if (convError) {
        console.error('Failed to pull conversations:', convError);
        return;
      }

      // 2. For each conversation, fetch its messages
      for (const conv of conversations) {
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id);

        if (msgError) {
          console.error(`Failed to pull messages for conv ${conv.id}:`, msgError);
          continue;
        }

        // 3. Map to store format
        const threadMessages: Record<string, any> = {};
        messages.forEach((m: any) => {
          threadMessages[m.id] = {
            id: m.id,
            role: m.role,
            content: m.content,
            parentId: m.parent_id,
            createdAt: new Date(m.created_at).getTime(),
            childrenIds: messages
              .filter((child: any) => child.parent_id === m.id)
              .map((child: any) => child.id),
          };
        });

        // 4. Update the store if cloud is newer or local is missing
        const existingThread = useChatStore.getState().threads[conv.id];
        const cloudUpdatedAt = new Date(conv.updated_at).getTime();

        if (!existingThread || cloudUpdatedAt > existingThread.updatedAt) {
          useChatStore.setState((state) => ({
            threads: {
              ...state.threads,
              [conv.id]: {
                ...(existingThread || {}),
                id: conv.id,
                title: conv.title,
                modelId: conv.model_id,
                updatedAt: cloudUpdatedAt,
                createdAt: new Date(conv.created_at).getTime(),
                messages: threadMessages,
                rootId: messages.find((m: any) => !m.parent_id)?.id || null,
                currentLeafId:
                  messages.find(
                    (m: any) => !messages.some((other: any) => other.parent_id === m.id),
                  )?.id || null,
              } as any,
            },
          }));
          lastSyncedRef.current[conv.id] = cloudUpdatedAt;
        }
      }
    }

    pullFromSupabase();
  }, [userId]);
}
