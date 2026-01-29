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
  UserCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { ModelManager } from '@/components/settings/ModelManager';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWorkerHealth } from '@/hooks/useWorkerHealth';
import {
  Move3d,
  Eraser,
  Split,
  Palette,
  Ear,
  Compass,
  Timer,
  Hammer,
  HardDrive,
  BookOpen,
  Rotate3d,
  Printer,
  Mic2,
} from 'lucide-react';

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
  | 'remix'
  | 'actor'
  | 'depth'
  | 'retouch'
  | 'vfx'
  | 'node'
  | 'stem'
  | 'grading'
  | 'acoustic'
  | 'director'
  | 'ops'
  | 'forge'
  | 'nexus'
  | 'lexicon'
  | 'dimension'
  | 'fabrication'
  | 'creative'
  | 'acoustic';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { overallStatus, isLoading } = useWorkerHealth();
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
    { id: 'actor', icon: UserCircle2, label: 'Actor Registry' },
    { id: 'depth', icon: Move3d, label: 'Depth Studio' },
    { id: 'retouch', icon: Eraser, label: 'Neural Retouch' },
    { id: 'vfx', icon: Combine, label: 'VFX Studio' },
    { id: 'node', icon: Workflow, label: 'Node Studio' },
    { id: 'stem', icon: Split, label: 'Stem Studio' },
    { id: 'grading', icon: Palette, label: 'Grading & Fidelity' },
    { id: 'acoustic', icon: Ear, label: 'Acoustic Studio' },
    { id: 'director', icon: Compass, label: 'Director Studio' },
    { id: 'ops', icon: Timer, label: 'Operations' },
    { id: 'forge', icon: Hammer, label: 'LoRA Forge' },
    { id: 'nexus', icon: HardDrive, label: 'Asset Nexus' },
    { id: 'lexicon', icon: BookOpen, label: 'Lexicon Engine' },
    { id: 'dimension', icon: Rotate3d, label: 'Dimension Studio' },
    { id: 'creative', icon: Palette, label: 'Creative Studio' },
    { id: 'fabrication', icon: Printer, label: 'Forge Fabrication' },
    { id: 'acoustic', icon: Mic2, label: 'Acoustic Forge' },
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

      <div className="mt-auto flex flex-col items-center gap-4 pb-4">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="relative cursor-help">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    overallStatus === 'healthy'
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : overallStatus === 'idle'
                        ? 'bg-zinc-500'
                        : 'animate-pulse bg-amber-500',
                  )}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[10px]">
              Workers: {overallStatus}
              {isLoading && ' (updating...)'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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
