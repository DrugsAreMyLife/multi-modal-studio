'use client';

import { useEffect } from 'react';
import { useShortcutsStore } from '@/lib/store/shortcuts-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useChatStore } from '@/lib/store/chat-store';

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const shortcuts = useShortcutsStore((state) => state.shortcuts);
  const setCommandPaletteOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const createNewThread = useChatStore((state) => state.createNewThread);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check each registered shortcut
      for (const shortcut of shortcuts) {
        const keys = shortcut.keys.toLowerCase().split('+');
        const hasCtrl = keys.includes('ctrl') || keys.includes('cmd');
        const hasShift = keys.includes('shift');
        const hasAlt = keys.includes('alt');
        const mainKey = keys[keys.length - 1];

        const ctrlPressed = e.ctrlKey || e.metaKey;
        const shiftPressed = e.shiftKey;
        const altPressed = e.altKey;

        if (
          (hasCtrl === ctrlPressed || !hasCtrl) &&
          (hasShift === shiftPressed || !hasShift) &&
          (hasAlt === altPressed || !hasAlt) &&
          e.key.toLowerCase() === mainKey
        ) {
          // Prevent default browser behavior for matched shortcuts
          if (hasCtrl || hasShift || hasAlt) {
            e.preventDefault();
          }

          // Execute action based on shortcut ID
          switch (shortcut.id) {
            case 'new-conversation':
              createNewThread();
              break;
            case 'toggle-sidebar':
              setSidebarOpen();
              break;
            case 'command-palette':
              setCommandPaletteOpen(true);
              break;
            case 'search':
              // Focus search input if exists
              const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
              searchInput?.focus();
              break;
            case 'toggle-shortcuts':
              // Open shortcuts dialog
              useUIStore.getState().setShortcutsDialogOpen(true);
              break;
            default:
              break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, setCommandPaletteOpen, setSidebarOpen, createNewThread]);

  return <>{children}</>;
}
