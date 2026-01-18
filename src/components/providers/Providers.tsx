'use client';

import { SessionProvider } from 'next-auth/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { KeyboardShortcutsProvider } from '@/components/providers/KeyboardShortcutsProvider';
import { useSync } from '@/lib/hooks/useSync';
import { useModelSync } from '@/lib/hooks/useModelSync';

function SyncHandler() {
  useSync();
  useModelSync(); // Auto-sync model registry every 3-4 hours
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider>
        <KeyboardShortcutsProvider>
          <SyncHandler />
          {children}
        </KeyboardShortcutsProvider>
      </TooltipProvider>
    </SessionProvider>
  );
}
