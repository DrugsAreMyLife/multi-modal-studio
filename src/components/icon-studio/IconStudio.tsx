'use client';

import { useIconStudioStore } from '@/lib/store/icon-studio-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StyleDNABuilder } from './StyleDNABuilder';
import { IconModelSelector } from './IconModelSelector';
import { ConceptInput } from './ConceptInput';
import { GenerationPipeline } from './GenerationPipeline';
import { DriftInspector } from './DriftInspector';
import { Dna, Lightbulb, PlayCircle, ShieldCheck } from 'lucide-react';
import { IconStudioTab } from '@/lib/types/icon-system';

export function IconStudio() {
    const { activeTab, setActiveTab } = useIconStudioStore();

    return (
        <div className="h-full flex flex-col bg-background/50 backdrop-blur-xl">
            {/* Header */}
            <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/60">
                <div className="flex items-center gap-2">
                    <Dna className="text-primary" size={20} />
                    <h1 className="font-semibold text-lg tracking-tight">Icon System Engineering</h1>
                </div>
                <div className="flex items-center gap-4">
                    <IconModelSelector />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as IconStudioTab)} className="flex-1 flex flex-col">
                    <div className="px-6 pt-4 pb-2 border-b border-white/5 bg-black/5">
                        <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-black/20">
                            <TabsTrigger value="dna" className="gap-2">
                                <Dna size={14} /> Style DNA
                            </TabsTrigger>
                            <TabsTrigger value="concepts" className="gap-2">
                                <Lightbulb size={14} /> Concepts
                            </TabsTrigger>
                            <TabsTrigger value="pipeline" className="gap-2">
                                <PlayCircle size={14} /> Pipeline
                            </TabsTrigger>
                            <TabsTrigger value="qa" className="gap-2">
                                <ShieldCheck size={14} /> QA & Drift
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-auto bg-black/10">
                        <TabsContent value="dna" className="h-full mt-0">
                            <StyleDNABuilder />
                        </TabsContent>
                        <TabsContent value="concepts" className="h-full mt-0">
                            <ConceptInput />
                        </TabsContent>
                        <TabsContent value="pipeline" className="h-full mt-0">
                            <GenerationPipeline />
                        </TabsContent>
                        <TabsContent value="qa" className="h-full mt-0">
                            <DriftInspector />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
