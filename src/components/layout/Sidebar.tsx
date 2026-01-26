'use client';

import {
  LayoutGrid,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Workflow,
  Settings,
  Mic,
  Dna,
  ScanEye,
  Brain,
  Combine,
  Music,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { ModelManager } from '@/components/settings/ModelManager';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type ViewMode =
  | 'workbench'
  | 'image'
  | 'video'
  | 'audio'
  | 'chat'
  | 'workflow'
  | 'icon-studio'
  | 'analysis'
  | 'training'
  | 'music'
  | 'remix';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const navItems = [
    { id: 'workbench', icon: LayoutGrid, label: 'Workbench' },
    { id: 'analysis', icon: ScanEye, label: 'VLM Analysis' },
    { id: 'image', icon: ImageIcon, label: 'Image Studio' },
    { id: 'video', icon: Video, label: 'Video Studio' },
    { id: 'audio', icon: Mic, label: 'Audio Studio' },
    { id: 'icon-studio', icon: Dna, label: 'Icon System' },
    { id: 'chat', icon: MessageSquare, label: 'Orchestrator' },
    { id: 'workflow', icon: Workflow, label: 'Workflows' },
    { id: 'training', icon: Brain, label: 'Training' },
    { id: 'music', icon: Music, label: 'Music Studio' },
    { id: 'remix', icon: Combine, label: 'Remix Engine' },
  ] as const;

  return (
    <div className="border-border bg-background/80 z-50 flex h-full w-16 flex-col items-center gap-4 border-r py-4 backdrop-blur-md">
      <div className="text-primary mb-4 text-xl font-bold">O</div>

      <div className="flex w-full flex-col gap-2 px-2">
        {navItems.map((item) => (
          <TooltipProvider key={item.id}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'hover:bg-muted h-10 w-full rounded-xl transition-all',
                    currentView === item.id
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'text-muted-foreground',
                  )}
                  onClick={() => onViewChange(item.id as ViewMode)}
                >
                  <item.icon size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="text-xs font-semibold">
                {item.label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      <div className="mt-auto pb-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
              <Settings size={20} className="text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <ModelManager />
        </Dialog>
      </div>
    </div>
  );
}
