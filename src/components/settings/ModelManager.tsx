'use client';

import { useRegistryStore } from '@/lib/store/registry-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Cloud, Laptop, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { ThemeBuilder } from './ThemeBuilder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ModelManager() {
    const { models, isFetching, refreshModels, toggleModel, lastUpdated } = useRegistryStore();

    return (
        <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 gap-0 bg-background/80 backdrop-blur-xl border-white/10">
            <DialogHeader className="p-6 border-b border-border pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <DialogTitle>Settings & Configuration</DialogTitle>
                        <div className="text-xs text-muted-foreground mt-1">
                            Manage AI models and studio appearance
                        </div>
                    </div>
                </div>
            </DialogHeader>

            <Tabs defaultValue="models" className="flex-1 flex flex-col min-h-0">
                <div className="px-6 pt-2 border-b border-white/5">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/20">
                        <TabsTrigger value="models">Model Registry</TabsTrigger>
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="models" className="flex-1 flex flex-col min-h-0 m-0">
                    <div className="flex items-center justify-between px-6 py-2 border-b border-white/5 bg-muted/10">
                        <div className="text-xs text-muted-foreground">
                            Last check: {new Date(lastUpdated).toLocaleTimeString()}
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => refreshModels()}
                            disabled={isFetching}
                            className={cn("gap-2 h-7 text-xs", isFetching && "animate-pulse")}
                        >
                            <RefreshCw size={12} className={cn(isFetching && "animate-spin")} />
                            {isFetching ? 'Checking...' : 'Check for Updates'}
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                            {['image', 'video', 'audio'].map((type) => {
                                const typeModels = models.filter(m => m.type === type);
                                if (typeModels.length === 0) return null;

                                return (
                                    <div key={type} className="space-y-3">
                                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{type} Models</h3>
                                        <div className="grid gap-2">
                                            {typeModels.map((model) => (
                                                <div key={model.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("p-2 rounded-md",
                                                            model.provider === 'local' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                                        )}>
                                                            {model.provider === 'local' ? <Laptop size={16} /> : <Cloud size={16} />}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm flex items-center gap-2">
                                                                {model.name}
                                                                {model.tags.includes('New') && <span className="text-[10px] bg-red-500 text-white px-1 rounded-sm">NEW</span>}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                {model.id} • {model.capabilities.join(', ')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={model.enabled}
                                                        onCheckedChange={() => toggleModel(model.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t border-border bg-muted/20 text-[10px] text-muted-foreground flex justify-between">
                        <span>Registry v1.0.0 connected</span>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Local Service</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Cloud API</span>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="appearance" className="flex-1 min-h-0 m-0 p-6 overflow-auto">
                    <ThemeBuilder />
                </TabsContent>
            </Tabs>
        </DialogContent>
    );
}
