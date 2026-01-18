import { useEffect, useRef } from 'react';
import { useChatStore } from './chat-store';
import { UIMessage } from 'ai';

const MIN_MESSAGES_FOR_TITLE = 3;
const DEFAULT_TITLE = 'New Conversation';

export const useAutoTitle = () => {
  const activeThreadId = useChatStore((state) => state.activeThreadId);
  const activeThread = useChatStore((state) =>
    activeThreadId ? state.threads[activeThreadId] : null,
  );
  const updateThreadTitle = useChatStore((state) => state.updateThreadTitle);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    if (!activeThread) return;

    const messageCount = Object.keys(activeThread.messages).length;
    const needsTitle =
      activeThread.title === DEFAULT_TITLE && messageCount >= MIN_MESSAGES_FOR_TITLE;

    if (needsTitle && !isGeneratingRef.current) {
      isGeneratingRef.current = true;

      // Gather last few messages for context
      // We need to traverse to current leaf to get the linear conversation,
      // but for titling, just grabbing some recent ones is "okay" as long as it's not totally random.
      // Better: use the store's traverse logic or just grabbing first few if root exists.

      // Let's grab the first 3 messages if possible by following root.
      // Simplified: Convert object values to array.
      const messages = Object.values(activeThread.messages)
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(0, 5)
        .map((m) => ({ role: m.role, content: m.content }));

      fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (data.title) {
            updateThreadTitle(activeThread.id, data.title);
          }
        })
        .catch((err) => {
          console.error('Auto-title failed', err);
        })
        .finally(() => {
          isGeneratingRef.current = false;
        });
    }
  }, [activeThread?.messages, activeThread?.title, activeThread?.id, updateThreadTitle]);
};
