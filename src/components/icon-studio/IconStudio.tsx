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
    <div className="bg-background/50 flex h-full flex-col backdrop-blur-xl">
      {/* Header */}
      <div className="border-border bg-background/60 flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <Dna className="text-primary" size={20} />
          <h1 className="text-lg font-semibold tracking-tight">Icon System Engineering</h1>
        </div>
        <div className="flex items-center gap-4">
          <IconModelSelector />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as IconStudioTab)}
          className="flex flex-1 flex-col"
        >
          <div className="border-b border-white/5 bg-black/5 px-6 pt-4 pb-2">
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
            <TabsContent value="dna" className="mt-0 h-full">
              <StyleDNABuilder />
            </TabsContent>
            <TabsContent value="concepts" className="mt-0 h-full">
              <ConceptInput />
            </TabsContent>
            <TabsContent value="pipeline" className="mt-0 h-full">
              <GenerationPipeline />
            </TabsContent>
            <TabsContent value="qa" className="mt-0 h-full">
              <DriftInspector />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
