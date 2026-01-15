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
    ScanEye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { ModelManager } from '@/components/settings/ModelManager';

export type ViewMode = 'workbench' | 'image' | 'video' | 'audio' | 'chat' | 'workflow' | 'icon-studio' | 'analysis';

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
    ] as const;

    return (
        <div className="w-16 flex flex-col items-center py-4 border-r border-border bg-background/80 backdrop-blur-md h-full gap-4 z-50">
            <div className="font-bold text-xl mb-4 text-primary">O</div>

            <div className="flex flex-col gap-2 w-full px-2">
                {navItems.map((item) => (
                    <Button
                        key={item.id}
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "w-full h-10 rounded-xl transition-all hover:bg-muted",
                            currentView === item.id ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground"
                        )}
                        onClick={() => onViewChange(item.id as ViewMode)}
                        title={item.label}
                    >
                        <item.icon size={20} />
                    </Button>
                ))}
            </div>

            <div className="mt-auto pb-4">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
                            <Settings size={20} className="text-muted-foreground" />
                        </Button>
                    </DialogTrigger>
                    <ModelManager />
                </Dialog>
            </div>
        </div>
    );
}
