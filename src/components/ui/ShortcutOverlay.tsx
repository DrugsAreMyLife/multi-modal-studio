'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CommandShortcut } from '@/components/ui/command';

interface ShortcutGroup {
    category: string;
    shortcuts: { description: string; keys: string[] }[];
}

const SHORTCUTS: ShortcutGroup[] = [
    {
        category: 'Global',
        shortcuts: [
            { description: 'Command Palette', keys: ['⌘', 'K'] },
            { description: 'Focus Mode', keys: ['⌘', 'K', 'Enter Focus'] },
            { description: 'Show Shortcuts', keys: ['?'] },
            { description: 'Settings', keys: ['⌘', 'S'] },
        ],
    },
    {
        category: 'Chat Studio',
        shortcuts: [
            { description: 'New Thread', keys: ['⌘', 'N'] },
            { description: 'Toggle Sidebar', keys: ['⌘', 'B'] },
            { description: 'Send Message', keys: ['Enter'] },
            { description: 'Multiline', keys: ['Shift', 'Enter'] },
        ],
    },
    {
        category: 'Video Studio',
        shortcuts: [
            { description: 'Play/Pause', keys: ['Space'] },
            { description: 'Next Frame', keys: ['Right'] },
            { description: 'Prev Frame', keys: ['Left'] },
        ],
    },
];

export function ShortcutOverlay() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Keyboard Shortcuts</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {SHORTCUTS.map((group) => (
                            <div key={group.category} className="space-y-3">
                                <h3 className="font-medium text-muted-foreground text-sm">{group.category}</h3>
                                <div className="space-y-2">
                                    {group.shortcuts.map((shortcut) => (
                                        <div key={shortcut.description} className="flex items-center justify-between text-sm">
                                            <span>{shortcut.description}</span>
                                            <div className="flex gap-1">
                                                {shortcut.keys.map((key) => (
                                                    <kbd
                                                        key={key}
                                                        className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
                                                    >
                                                        {key}
                                                    </kbd>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                    <span>Press <kbd className="bg-muted px-1 rounded mx-1">Esc</kbd> to close</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
