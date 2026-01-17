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
} from '@/components/ui/dialog';

import { ThemeBuilder } from './ThemeBuilder';
import { ProviderSettings } from './ProviderSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '../analytics/Dashboard';

export function ModelManager() {
  const { models, isFetching, refreshModels, toggleModel, lastUpdated } = useRegistryStore();

  return (
    <DialogContent className="bg-background/80 flex h-[85vh] flex-col gap-0 border-white/10 p-0 backdrop-blur-xl sm:max-w-[700px]">
      <DialogHeader className="border-border border-b p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle>Settings & Configuration</DialogTitle>
            <div className="text-muted-foreground mt-1 text-xs">
              Manage AI models and studio appearance
            </div>
          </div>
        </div>
      </DialogHeader>

      <Tabs defaultValue="models" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-white/5 px-6 pt-2">
          <TabsList className="bg-muted/20 grid w-full grid-cols-4">
            <TabsTrigger value="models">Model Registry</TabsTrigger>
            <TabsTrigger value="providers">API Providers</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="models" className="m-0 flex min-h-0 flex-1 flex-col">
          <div className="bg-muted/10 flex items-center justify-between border-b border-white/5 px-6 py-2">
            <div className="text-muted-foreground text-xs">
              Last check: {new Date(lastUpdated).toLocaleTimeString()}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refreshModels()}
              disabled={isFetching}
              className={cn('h-7 gap-2 text-xs', isFetching && 'animate-pulse')}
            >
              <RefreshCw size={12} className={cn(isFetching && 'animate-spin')} />
              {isFetching ? 'Checking...' : 'Check for Updates'}
            </Button>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {['image', 'video', 'audio'].map((type) => {
                const typeModels = models.filter((m) => m.type === type);
                if (typeModels.length === 0) return null;

                return (
                  <div key={type} className="space-y-3">
                    <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                      {type} Models
                    </h3>
                    <div className="grid gap-2">
                      {typeModels.map((model) => (
                        <div
                          key={model.id}
                          className="border-border bg-background/50 flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'rounded-md p-2',
                                model.provider === 'local'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : 'bg-blue-500/10 text-blue-500',
                              )}
                            >
                              {model.provider === 'local' ? (
                                <Laptop size={16} />
                              ) : (
                                <Cloud size={16} />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 text-sm font-medium">
                                {model.name}
                                {model.tags.includes('New') && (
                                  <span className="rounded-sm bg-red-500 px-1 text-[10px] text-white">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div className="text-muted-foreground text-[10px]">
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
          <div className="border-border bg-muted/20 text-muted-foreground flex justify-between border-t p-4 text-[10px]">
            <span>Registry v1.0.0 connected</span>
            <div className="flex gap-2">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Local Service
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Cloud API
              </span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="providers" className="m-0 flex min-h-0 flex-1 flex-col">
          <ScrollArea className="flex-1 p-6">
            <ProviderSettings />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="appearance" className="m-0 flex min-h-0 flex-1 flex-col">
          <ScrollArea className="flex-1 p-6">
            <ThemeBuilder />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="usage" className="m-0 flex min-h-0 flex-1 flex-col">
          <ScrollArea className="flex-1 p-6">
            <AnalyticsDashboard />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}
