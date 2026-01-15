'use client';

import { useIconStudioStore, AVAILABLE_ICON_MODELS } from '@/lib/store/icon-studio-store';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Cloud, Laptop, BoxSelect } from 'lucide-react';

export function IconModelSelector() {
    const { selectedModelId, setModel } = useIconStudioStore();
    const activeModel = AVAILABLE_ICON_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_ICON_MODELS[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-3 border border-border/50 bg-background/20 hover:bg-background/40">
                    <BoxSelect size={14} className="text-primary" />
                    <span className="text-xs font-medium">{activeModel.name}</span>
                    <ChevronDown size={12} className="opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[240px]" align="end">
                {AVAILABLE_ICON_MODELS.map((model) => (
                    <DropdownMenuItem
                        key={model.id}
                        onClick={() => setModel(model.id)}
                        className="gap-2 text-xs cursor-pointer"
                    >
                        {model.provider === 'local' ? <Laptop size={12} /> : <Cloud size={12} />}
                        <span>{model.name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
