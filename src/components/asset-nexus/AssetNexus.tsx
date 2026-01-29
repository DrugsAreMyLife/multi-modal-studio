'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FolderOpen,
  Search,
  Grid,
  List,
  Filter,
  MoreVertical,
  Download,
  Trash2,
  ExternalLink,
  ImageIcon,
  Video,
  FileAudio,
  Database,
  Tag,
  Share2,
  HardDrive,
  Cloud,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Activity,
  GitBranch,
  Cog,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import React, { useMemo } from 'react';
import {
  PreprocessingRepo,
  PreprocessedAsset,
  AssetChangeEvent,
} from '@/lib/orchestration/PreprocessingRepo';

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'dataset';
  size: string;
  date: string;
  thumbnail: string;
  tags: string[];
  semanticAudit?: {
    status: 'raw' | 'processing' | 'refined' | 'validated' | 'baked';
    constraints: { key: string; value: string; confidence: number }[];
  };
}

/**
 * Maps a PreprocessedAsset from PreprocessingRepo to the component's Asset interface.
 */
function mapPreprocessedAssetToAsset(preprocessed: PreprocessedAsset): Asset {
  const now = Date.now();
  const assetAgeMs = now - preprocessed.semanticData.timestamp;
  const assetAgeSeconds = Math.floor(assetAgeMs / 1000);

  let dateStr: string;
  if (assetAgeSeconds < 60) {
    dateStr = 'Just now';
  } else if (assetAgeSeconds < 3600) {
    dateStr = `${Math.floor(assetAgeSeconds / 60)}m ago`;
  } else if (assetAgeSeconds < 86400) {
    dateStr = `${Math.floor(assetAgeSeconds / 3600)}h ago`;
  } else {
    dateStr = `${Math.floor(assetAgeSeconds / 86400)}d ago`;
  }

  // Infer type from semantic source or fileUrn
  let assetType: 'image' | 'video' | 'audio' | 'dataset' = 'dataset';
  if (preprocessed.semanticData.source === 'creative') {
    assetType = 'image';
  } else if (preprocessed.semanticData.source === 'forge') {
    assetType = 'dataset';
  }

  // Map constraints to display format
  const constraints = preprocessed.semanticData.constraints.map((c) => ({
    key: c.key,
    value: String(c.value),
    confidence: c.confidence,
  }));

  return {
    id: preprocessed.id,
    name: preprocessed.fileUrn.split('/').pop() || `Asset_${preprocessed.id}`,
    type: assetType,
    size: '0 B', // Would need additional metadata
    date: dateStr,
    thumbnail: '',
    tags: preprocessed.semanticData.tags,
    semanticAudit: {
      status: preprocessed.status,
      constraints,
    },
  };
}

export function AssetNexus() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeAudit, setActiveAudit] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Subscribe to PreprocessingRepo for reactive asset updates
  useEffect(() => {
    // Initial load from PreprocessingRepo
    const loadAssets = () => {
      const repoAssets = PreprocessingRepo.getHistoryByOriginalId('current_session');

      if (repoAssets.length > 0) {
        // Map preprocessed assets and merge with existing (prefer repo data)
        const mapped = repoAssets.map((a) => mapPreprocessedAssetToAsset(a));
        setAssets((prev) => {
          // Replace any assets with same id from repo, keep others from state
          const repoIds = new Set(mapped.map((m) => m.id));
          const nonRepoAssets = prev.filter((p) => !repoIds.has(p.id));
          return [...mapped, ...nonRepoAssets];
        });
      }
    };

    loadAssets();

    // Subscribe to changes for reactive updates
    const unsubscribe = PreprocessingRepo.subscribe((event: AssetChangeEvent) => {
      if (event.type === 'register' || event.type === 'refine') {
        loadAssets();
      } else if (event.type === 'delete') {
        setAssets((prev) => prev.filter((a) => a.id !== event.asset.id));
      }
    });

    return () => unsubscribe();
  }, []);

  const memoizedAssets = useMemo(() => assets, [assets]);

  return (
    <div className="flex h-full w-full flex-col bg-[#050505]">
      {/* Search & Global Controls */}
      <div className="flex items-center justify-between border-b border-white/5 bg-black/40 p-4 px-6 backdrop-blur-xl">
        <div className="flex max-w-2xl flex-1 items-center gap-4">
          <div className="relative flex-1">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
              size={16}
            />
            <Input
              placeholder="Search across datasets, models, and renders..."
              className="focus:ring-primary/20 h-10 border-white/5 bg-white/5 pl-10 text-sm"
            />
          </div>
          <Button variant="outline" className="gap-2 border-white/5 bg-white/5 text-xs">
            <Filter size={14} /> Filter
          </Button>
        </div>

        <div className="ml-6 flex items-center gap-4 border-l border-white/5 pl-6">
          <div className="flex rounded-lg bg-white/5 p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid size={14} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List size={14} />
            </Button>
          </div>
          <Button className="shadow-primary/20 gap-2 font-bold italic shadow-lg">
            <Sparkles size={14} /> Auto-Archive
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Tree: Buckets & Collections */}
        <div className="w-64 space-y-6 border-r border-white/5 bg-black/20 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black tracking-widest uppercase opacity-40">
                Locations
              </span>
              <Plus size={12} className="opacity-40" />
            </div>
            <div className="space-y-1">
              {[
                { name: 'Recent Renders', icon: FolderOpen, active: true },
                { name: 'Training Datasets', icon: Database, active: false },
                { name: 'LoRA Binaries', icon: Layers, active: false },
                { name: 'Social Drafts', icon: Share2, active: false },
              ].map((folder, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  className={cn(
                    'h-9 w-full justify-start gap-3 text-xs transition-colors',
                    folder.active
                      ? 'bg-primary/10 text-primary border-primary rounded-none border-r-2'
                      : 'opacity-60 hover:bg-white/5 hover:opacity-100',
                  )}
                >
                  <folder.icon size={14} /> {folder.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black tracking-widest uppercase opacity-40">
                Categories
              </span>
            </div>
            <div className="flex flex-wrap gap-2 px-2">
              {['#Nick', '#Pharmacy', '#Presentation', '#Raw', '#Verified'].map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="hover:bg-primary/20 hover:border-primary/40 cursor-pointer border-white/5 bg-white/5 text-[9px] transition-all"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-8">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <HardDrive size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                  Storage Health
                </span>
              </div>
              <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 bg-emerald-500" />
              </div>
              <p className="text-[9px] opacity-40">3.4 TB / 5 TB Used (Cloud Sync Active)</p>
            </div>
          </div>
        </div>

        {/* Main Content Area: The Nexus */}
        <div className="flex-1 overflow-auto bg-[radial-gradient(#111_1px,transparent_1px)] [background-size:32px_32px]">
          <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Recent Renders</h2>
                <p className="text-muted-foreground text-xs">Showing 128 items in Local Hub</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="gap-2 text-xs">
                  <CheckSquare size={14} /> Select All
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive gap-2 text-xs">
                  <Trash2 size={14} /> Purge Ghost Files
                </Button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {memoizedAssets.map((asset) => (
                  <Card
                    key={asset.id}
                    className="group boarder-white/5 hover:shadow-primary/5 relative overflow-hidden bg-black/60 shadow-xl transition-all hover:-translate-y-1"
                  >
                    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-zinc-900">
                      {asset.thumbnail ? (
                        <img
                          src={asset.thumbnail}
                          className="h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-100"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-20">
                          {asset.type === 'audio' ? (
                            <FileAudio size={40} />
                          ) : (
                            <Database size={40} />
                          )}
                          <span className="font-mono text-[10px] tracking-widest uppercase">
                            {asset.type}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex translate-y-[-120%] transform gap-1 transition-transform group-hover:translate-y-0">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 border border-white/10 bg-black/60 backdrop-blur-md"
                        >
                          <Download size={14} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 border border-white/10 bg-black/60 backdrop-blur-md"
                        >
                          <ExternalLink size={14} />
                        </Button>
                      </div>
                      <Badge className="absolute bottom-2 left-2 h-4 border-white/10 bg-black/60 text-[8px] uppercase backdrop-blur-md">
                        {asset.size}
                      </Badge>
                    </div>
                    <div className="p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="truncate pr-4 text-[11px] font-bold">{asset.name}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical size={14} />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.map((tag) => (
                          <span key={tag} className="font-mono text-[9px] opacity-30">
                            #{tag}
                          </span>
                        ))}
                        {asset.semanticAudit && (
                          <Badge
                            variant="outline"
                            className="ml-auto h-4 border-emerald-500/30 bg-emerald-500/5 text-[8px] text-emerald-500"
                          >
                            <ShieldCheck size={8} className="mr-1" /> Semantic OK
                          </Badge>
                        )}
                      </div>
                      {asset.semanticAudit && (
                        <Button
                          variant="ghost"
                          className="mt-2 h-7 w-full gap-2 border border-white/5 text-[9px] hover:bg-white/5"
                          onClick={() => setActiveAudit(asset)}
                        >
                          <Activity size={10} /> Audit Chain
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="overflow-hidden border-white/5 bg-black/40">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/5 bg-white/5 text-[10px] font-black tracking-widest uppercase opacity-40">
                    <tr>
                      <th className="px-6 py-3">Asset Name</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Size</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {memoizedAssets.map((asset) => (
                      <tr key={asset.id} className="transition-colors hover:bg-white/5">
                        <td className="flex items-center gap-3 px-6 py-4">
                          {asset.type === 'video' ? (
                            <Video size={14} className="text-primary" />
                          ) : (
                            <ImageIcon size={14} className="text-emerald-500" />
                          )}
                          <span className="font-medium">{asset.name}</span>
                        </td>
                        <td className="px-6 py-4 text-[10px] uppercase opacity-40">{asset.type}</td>
                        <td className="px-6 py-4 font-mono opacity-60">{asset.size}</td>
                        <td className="px-6 py-4 opacity-60">{asset.date}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Semantic Audit Overlay */}
      {activeAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8 backdrop-blur-md">
          <Card className="w-full max-w-4xl overflow-hidden border-white/10 bg-[#0a0a0a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <Activity className="text-emerald-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Semantic Audit: {activeAudit.name}</h3>
                  <p className="text-muted-foreground text-xs">
                    Tracing logic from Lexicon Script to Fabrication Prep
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveAudit(null)}
                className="hover:bg-white/5"
              >
                <Plus className="rotate-45" size={20} />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 p-8">
              <div className="space-y-6">
                <div className="text-primary flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                  <GitBranch size={14} /> Logic Chain
                </div>
                <div className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-white/5">
                  {[
                    {
                      stage: 'Lexicon',
                      desc: 'Script parsing & Intent extraction',
                      status: 'done',
                    },
                    { stage: 'Dimension', desc: 'Geometric constraint alignment', status: 'done' },
                    { stage: 'Forge', desc: 'Material & Load validation', status: 'pending' },
                    { stage: 'Fabrication', desc: 'G-Code baking', status: 'queued' },
                  ].map((step, i) => (
                    <div key={i} className="relative flex translate-x-1 items-start gap-4">
                      <div
                        className={cn(
                          'z-10 mt-1 h-4 w-4 rounded-full border-2 border-[#0a0a0a] ring-2',
                          step.status === 'done'
                            ? 'bg-emerald-500 ring-emerald-500/20'
                            : step.status === 'pending'
                              ? 'bg-yellow-500 ring-yellow-500/20'
                              : 'bg-white/10 ring-white/5',
                        )}
                      />
                      <div>
                        <p className="text-[11px] font-bold">{step.stage}</p>
                        <p className="text-[10px] opacity-40">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2 space-y-6">
                <div className="text-primary flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                  <Cog size={14} /> Extracted Constraints
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {activeAudit.semanticAudit?.constraints.map((c, i) => (
                    <Card
                      key={i}
                      className="flex flex-col gap-2 border-white/5 bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] tracking-tighter uppercase opacity-40">
                          {c.key}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-emerald-500/20 bg-emerald-500/10 text-[8px] text-emerald-500"
                        >
                          {(c.confidence * 100).toFixed(0)}% Match
                        </Badge>
                      </div>
                      <p className="text-xl font-black italic">{c.value}</p>
                    </Card>
                  ))}
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500" size={16} />
                    <span className="text-xs font-bold tracking-widest text-emerald-500 uppercase">
                      Integrity Report
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-80">
                    {activeAudit.semanticAudit?.constraints.length ? (
                      <>
                        Semantic analysis confirms compatibility across{' '}
                        {activeAudit.semanticAudit.constraints.length} extracted constraints.
                        {activeAudit.semanticAudit.constraints.slice(0, 2).map((c, i) => (
                          <span key={i}>
                            {' '}
                            <strong>{c.key}</strong> ({(c.confidence * 100).toFixed(0)}% confidence)
                          </span>
                        ))}
                        Ready for high-precision bake.
                      </>
                    ) : (
                      'Semantic analysis complete. Ready for high-precision bake.'
                    )}
                  </p>
                  <div className="mt-4 flex gap-4">
                    <Button
                      className="h-9 flex-1 bg-emerald-500 text-[10px] font-black tracking-widest text-black uppercase hover:bg-emerald-600"
                      onClick={() => {
                        if (activeAudit && activeAudit.id) {
                          try {
                            // Update asset status to 'validated' in PreprocessingRepo
                            PreprocessingRepo.refineAsset(activeAudit.id, { status: 'validated' });

                            // Show success toast
                            toast.success(`Asset "${activeAudit.name}" approved for fabrication`, {
                              description: 'Status updated to validated in preprocessing pipeline',
                            });

                            // Close audit overlay
                            setActiveAudit(null);
                          } catch (error) {
                            console.error('Error approving asset:', error);
                            toast.error('Failed to approve asset', {
                              description:
                                error instanceof Error ? error.message : 'Unknown error occurred',
                            });
                          }
                        }
                      }}
                    >
                      Approve for Fabrication
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
