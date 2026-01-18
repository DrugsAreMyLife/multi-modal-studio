'use client';

import { Activity, Share2, Download, MessageSquare, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/store/ui-store';
import { NotificationCenter } from '@/components/ui/NotificationCenter';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export function TopBar() {
  const { toggleGlobalChat, isGlobalChatOpen, isAnalyticsOpen, setAnalyticsOpen } = useUIStore();
  return (
    <>
      <div className="border-border bg-background/50 z-40 flex h-12 items-center justify-between border-b px-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground text-sm font-medium">
            My Project / <span className="text-foreground">Untitled Session</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Compute Meter Mockup */}
          <div className="text-muted-foreground bg-muted/50 border-border flex items-center gap-2 rounded-full border px-2 py-1 text-xs">
            <Activity size={12} className="text-green-500" />
            <span>GPU: Ready</span>
          </div>

          <NotificationCenter />

          <div className="bg-border mx-1 h-4 w-[1px]" />

          <Button
            variant={isGlobalChatOpen ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 gap-2 text-xs"
            onClick={toggleGlobalChat}
          >
            <MessageSquare size={14} />
            Chat <span className="ml-1 hidden font-mono text-xs opacity-50 md:inline">⌘K</span>
          </Button>

          <Button
            variant={isAnalyticsOpen ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 gap-2 text-xs"
            onClick={() => setAnalyticsOpen(true)}
          >
            <BarChart3 size={14} />
            Analytics
          </Button>

          <div className="bg-border mx-1 h-4 w-[1px]" />

          <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
            <Share2 size={14} />
            Share
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
            <Download size={14} />
            Export
          </Button>
        </div>
      </div>

      <Sheet open={isAnalyticsOpen} onOpenChange={setAnalyticsOpen}>
        <SheetContent side="right" className="w-[600px] sm:w-[800px]">
          <SheetHeader>
            <SheetTitle>API Usage Analytics</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <AnalyticsDashboard />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
