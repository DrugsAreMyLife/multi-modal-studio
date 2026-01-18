'use client';

import * as React from 'react';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutGrid,
  ScanEye,
  Image as ImageIcon,
  Video,
  Mic,
  Dna,
  MessageSquare,
  Workflow,
  Search,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { ViewMode } from '@/components/layout/Sidebar';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/ui-store';
import { Maximize2, Minimize2 } from 'lucide-react';

interface CommandPaletteProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function CommandPalette({ currentView, onViewChange }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const { isFocused, toggleFocused } = useUIStore();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const navigate = (view: ViewMode) => {
    runCommand(() => onViewChange(view));
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Studios">
          <CommandItem onSelect={() => navigate('chat')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Chat Orchestrator</span>
            {currentView === 'chat' && <CommandShortcut>Target</CommandShortcut>}
          </CommandItem>
          <CommandItem onSelect={() => navigate('video')}>
            <Video className="mr-2 h-4 w-4" />
            <span>Video Studio</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('image')}>
            <ImageIcon className="mr-2 h-4 w-4" />
            <span>Image Studio</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('audio')}>
            <Mic className="mr-2 h-4 w-4" />
            <span>Audio Studio</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('icon-studio')}>
            <Dna className="mr-2 h-4 w-4" />
            <span>Icon System</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('analysis')}>
            <ScanEye className="mr-2 h-4 w-4" />
            <span>VLM Analysis</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('workflow')}>
            <Workflow className="mr-2 h-4 w-4" />
            <span>Workflow Studio</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('workbench')}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            <span>Workbench</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              toggleFocused();
              setOpen(false);
            }}
          >
            {isFocused ? (
              <Minimize2 className="mr-2 h-4 w-4" />
            ) : (
              <Maximize2 className="mr-2 h-4 w-4" />
            )}
            <span>{isFocused ? 'Exit Focus Mode' : 'Enter Focus Mode'}</span>
          </CommandItem>
          <CommandItem onSelect={() => console.log('New Chat Triggered')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>New Chat Thread</span>
          </CommandItem>
          <CommandItem onSelect={() => console.log('Generate Image')}>
            <ImageIcon className="mr-2 h-4 w-4" />
            <span>Generate Image...</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
