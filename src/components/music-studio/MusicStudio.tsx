'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  Infinity,
  Settings2,
  Plus,
  X,
  Volume2,
  ListMusic,
  AudioWaveform,
  Disc,
  Layers,
  FlaskConical,
  Hammer,
  Upload,
  Download,
  Wand2,
  Package,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ARTIST_STYLES, getTagsForArtist } from '@/lib/audio/artist-styles';
import { AudioVisualizer } from '@/components/audio/AudioVisualizer';
import { cn } from '@/lib/utils';

export function MusicStudio() {
  const [activeTab, setActiveTab] = useState('generator');
  const [prompt, setPrompt] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generations, setGenerations] = useState<any[]>([]);
  const [currentPlaybackUrl, setCurrentPlaybackUrl] = useState<string | null>(null);

  // Stem Lab State
  const [isProcessingStems, setIsProcessingStems] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stems, setStems] = useState<Record<string, string> | null>(null);

  // Sample Forge State
  const [samplePrompt, setSamplePrompt] = useState('');
  const [isForging, setIsForging] = useState(false);

  // SFX Lab State
  const [sfxPrompt, setSfxPrompt] = useState('');
  const [isGeneratingSfx, setIsGeneratingSfx] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [themePackItems, setThemePackItems] = useState<string[]>([]);
  const [isGeneratingPack, setIsGeneratingPack] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const infiniteModeTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleArtistSelect = (artistId: string) => {
    setSelectedArtist(artistId);
    const style = ARTIST_STYLES[artistId];
    if (style) {
      setTags(style.tags.split(',').map((t) => t.trim()));
    }
  };

  const enhancePrompt = async (
    currentPrompt: string,
    type: 'music' | 'sfx' | 'sample',
    setter: (v: string) => void,
  ) => {
    if (!currentPrompt) return;
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/generate/audio/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, type }),
      });
      const data = await response.json();
      if (data.success) {
        setter(data.enhanced);
        toast.success('Prompt optimized by AI');
      }
    } catch (err) {
      toast.error('Failed to enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  const startGeneration = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    const finalTags = tags.join(', ');

    try {
      const response = await fetch('/api/generate/audio/heart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:
            prompt ||
            (selectedArtist ? `In the style of ${ARTIST_STYLES[selectedArtist].name}` : ''),
          artist: selectedArtist,
          duration_ms: 30000,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const { jobId } = await response.json();

      const tempId = Math.random().toString(36).substring(7);
      setGenerations((prev) => [
        {
          id: tempId,
          jobId,
          type: 'generation',
          status: 'processing',
          timestamp: new Date().toISOString(),
          tags: finalTags,
          artist: selectedArtist,
        },
        ...prev,
      ]);

      pollStatus(jobId, tempId, '/api/generate/audio/heart');
    } catch (error) {
      toast.error('Failed to start music generation');
      setIsGenerating(false);
    }
  }, [prompt, selectedArtist, tags, isGenerating, isInfiniteMode]);

  const pollStatus = async (jobId: string, localId: string, endpoint: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${endpoint}?jobId=${jobId}`);
        const data = await res.json();

        if (data.status === 'completed') {
          clearInterval(interval);
          setGenerations((prev) =>
            prev.map((g) =>
              g.id === localId
                ? {
                    ...g,
                    status: 'completed',
                    url: data.result_url || data.result_urls?.sample || data.result_urls?.sound_0,
                  }
                : g,
            ),
          );
          setIsGenerating(false);
          setIsForging(false);
          setIsGeneratingSfx(false);
          setIsGeneratingPack(false);

          if (isInfiniteMode && endpoint.includes('heart')) {
            toast.info('Infinite Mode: Starting next track...');
            infiniteModeTimeout.current = setTimeout(startGeneration, 2000);
          }
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setGenerations((prev) =>
            prev.map((g) => (g.id === localId ? { ...g, status: 'failed', error: data.error } : g)),
          );
          setIsGenerating(false);
          setIsForging(false);
          setIsGeneratingSfx(false);
          setIsGeneratingPack(false);
          setIsInfiniteMode(false);
        }
      } catch (e) {
        clearInterval(interval);
        setIsGenerating(false);
        setIsForging(false);
        setIsGeneratingSfx(false);
        setIsGeneratingPack(false);
      }
    }, 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const startStemSeparation = async () => {
    if (!selectedFile) return;
    setIsProcessingStems(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/generate/audio/stems', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Stem separation failed');
      const { jobId } = await response.json();

      pollStemsStatus(jobId);
    } catch (err) {
      toast.error('Failed to start stem separation');
      setIsProcessingStems(false);
    }
  };

  const pollStemsStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate/audio/stems?jobId=${jobId}`);
        const data = await res.json();
        if (data.status === 'completed') {
          clearInterval(interval);
          setStems(data.result_urls);
          setIsProcessingStems(false);
          toast.success('Stem separation complete!');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIsProcessingStems(false);
          toast.error('Stem separation failed');
        }
      } catch (e) {
        clearInterval(interval);
        setIsProcessingStems(false);
      }
    }, 3000);
  };

  const startSampleForge = async () => {
    if (!samplePrompt) return;
    setIsForging(true);

    try {
      const response = await fetch('/api/generate/audio/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: samplePrompt, duration_s: 5.0 }),
      });

      const { jobId } = await response.json();
      const tempId = Math.random().toString(36).substring(7);

      setGenerations((prev) => [
        {
          id: tempId,
          jobId,
          type: 'sample',
          status: 'processing',
          prompt: samplePrompt,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      pollStatus(jobId, tempId, '/api/generate/audio/sample');
    } catch (err) {
      toast.error('Failed to forge sample');
      setIsForging(false);
    }
  };

  const startSfxGen = async () => {
    if (!sfxPrompt) return;
    setIsGeneratingSfx(true);

    try {
      const response = await fetch('/api/generate/audio/sfx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: sfxPrompt }),
      });

      const { jobId } = await response.json();
      const tempId = Math.random().toString(36).substring(7);

      setGenerations((prev) => [
        {
          id: tempId,
          jobId,
          type: 'sfx',
          status: 'processing',
          prompt: sfxPrompt,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      pollStatus(jobId, tempId, '/api/generate/audio/sfx');
    } catch (err) {
      toast.error('Failed to generate SFX');
      setIsGeneratingSfx(false);
    }
  };

  const addToThemePack = () => {
    if (sfxPrompt && !themePackItems.includes(sfxPrompt)) {
      setThemePackItems([...themePackItems, sfxPrompt]);
      setSfxPrompt('');
    }
  };

  const generateThemePack = async () => {
    if (themePackItems.length === 0) return;
    setIsGeneratingPack(true);

    try {
      const response = await fetch('/api/generate/audio/theme-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts: themePackItems }),
      });

      const { jobId } = await response.json();
      const tempId = Math.random().toString(36).substring(7);

      setGenerations((prev) => [
        {
          id: tempId,
          jobId,
          type: 'pack',
          status: 'processing',
          prompt: `Theme Pack (${themePackItems.length} sounds)`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      pollStatus(jobId, tempId, '/api/generate/audio/theme-pack');
    } catch (err) {
      toast.error('Failed to generate theme pack');
      setIsGeneratingPack(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-2.5">
            <Music className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Music Generation Studio</h1>
            <p className="text-muted-foreground text-sm">
              HeartMuLa | Demucs | Stable Audio | AudioLDM2
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-muted/50 rounded-lg p-1">
          <TabsList className="h-8 bg-transparent">
            <TabsTrigger value="generator" className="gap-2 text-xs">
              <Disc size={14} /> Generator
            </TabsTrigger>
            <TabsTrigger value="stemlab" className="gap-2 text-xs">
              <FlaskConical size={14} /> Stem Lab
            </TabsTrigger>
            <TabsTrigger value="forge" className="gap-2 text-xs">
              <Hammer size={14} /> Sample Forge
            </TabsTrigger>
            <TabsTrigger value="sfx" className="gap-2 text-xs">
              <Sparkles size={14} /> SFX Lab
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {activeTab === 'generator' && (
            <Button
              variant={isInfiniteMode ? 'default' : 'outline'}
              size="sm"
              className={cn('gap-2', isInfiniteMode && 'animate-pulse')}
              onClick={() => setIsInfiniteMode(!isInfiniteMode)}
            >
              <Infinity size={16} />
              {isInfiniteMode ? 'Infinite ON' : 'Infinite'}
            </Button>
          )}
          <Button variant="outline" size="icon">
            <Settings2 size={16} />
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Input Controls */}
        <div className="flex flex-col gap-6 overflow-hidden lg:col-span-4">
          <AnimatePresence mode="wait">
            {activeTab === 'generator' && (
              <motion.div
                key="generator-controls"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-4"
              >
                <Card className="flex flex-col gap-4 p-5">
                  <div className="space-y-2">
                    <Label>Select Artist Style</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(ARTIST_STYLES).map(([id, style]) => (
                        <Button
                          key={id}
                          variant={selectedArtist === id ? 'default' : 'outline'}
                          className="h-auto flex-col items-start gap-0.5 px-3 py-2 text-left"
                          onClick={() => handleArtistSelect(id)}
                        >
                          <span className="text-xs font-semibold">{style.name}</span>
                          <span className="text-muted-foreground line-clamp-1 text-[10px] leading-tight font-normal">
                            {style.description}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Mood & Style Tags</Label>
                    <form onSubmit={handleAddTag} className="flex gap-2">
                      <Input
                        placeholder="Add custom tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button type="submit" size="icon" className="h-8 w-8 shrink-0">
                        <Plus size={14} />
                      </Button>
                    </form>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-1 pl-2 text-[10px]"
                        >
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                            <X size={10} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="shadow-primary/20 mt-2 w-full gap-2 shadow-lg"
                    size="lg"
                    disabled={isGenerating || tags.length === 0}
                    onClick={startGeneration}
                  >
                    {isGenerating ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play size={18} fill="currentColor" />
                        Generate Track
                      </>
                    )}
                  </Button>
                </Card>
              </motion.div>
            )}

            {activeTab === 'stemlab' && (
              <motion.div
                key="stem-controls"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-4"
              >
                <Card className="flex flex-col gap-4 p-5">
                  <div className="space-y-3">
                    <Label>Upload Track for Separation</Label>
                    <div
                      className="border-primary/20 bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) setSelectedFile(file);
                      }}
                    >
                      <Upload className="text-muted-foreground mb-2" size={24} />
                      <p className="text-muted-foreground text-xs">
                        {selectedFile ? selectedFile.name : 'Drag & drop or click to upload'}
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        id="audio-upload"
                        onChange={handleFileUpload}
                      />
                      <Button asChild variant="ghost" size="sm" className="mt-2">
                        <label htmlFor="audio-upload">Select File</label>
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full gap-2"
                    disabled={!selectedFile || isProcessingStems}
                    onClick={startStemSeparation}
                  >
                    {isProcessingStems ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Layers size={18} /> Isolate Stems
                      </>
                    )}
                  </Button>
                </Card>
              </motion.div>
            )}

            {activeTab === 'forge' && (
              <motion.div
                key="forge-controls"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-4"
              >
                <Card className="flex flex-col gap-4 p-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between">
                        What kind of sound?
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={!samplePrompt || isEnhancing}
                          onClick={() => enhancePrompt(samplePrompt, 'sample', setSamplePrompt)}
                        >
                          <Wand2 size={12} className={cn(isEnhancing && 'animate-pulse')} />
                        </Button>
                      </Label>
                      <Input
                        placeholder="e.g. punchy deep house kick"
                        value={samplePrompt}
                        onChange={(e) => setSamplePrompt(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (Seconds)</Label>
                      <Slider defaultValue={[5]} max={10} step={1} />
                    </div>
                  </div>

                  <Button
                    className="w-full gap-2"
                    disabled={!samplePrompt || isForging}
                    onClick={startSampleForge}
                  >
                    {isForging ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Forging...
                      </>
                    ) : (
                      <>
                        <Hammer size={18} /> Forge Sample
                      </>
                    )}
                  </Button>
                </Card>
              </motion.div>
            )}

            {activeTab === 'sfx' && (
              <motion.div
                key="sfx-controls"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-4"
              >
                <Card className="flex flex-col gap-4 p-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between">
                        Describe the effect
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={!sfxPrompt || isEnhancing}
                          onClick={() => enhancePrompt(sfxPrompt, 'sfx', setSfxPrompt)}
                        >
                          <Wand2 size={12} className={cn(isEnhancing && 'animate-pulse')} />
                        </Button>
                      </Label>
                      <Input
                        placeholder="e.g. cinematic transition boom"
                        value={sfxPrompt}
                        onChange={(e) => setSfxPrompt(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={!sfxPrompt || isGeneratingSfx}
                        onClick={startSfxGen}
                      >
                        <Sparkles size={14} /> One-shot
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        disabled={!sfxPrompt}
                        onClick={addToThemePack}
                      >
                        <Plus size={14} /> Add to Pack
                      </Button>
                    </div>
                  </div>

                  {themePackItems.length > 0 && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 italic">
                          <Package size={14} /> Theme Pack ({themePackItems.length})
                        </Label>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setThemePackItems([])}
                        >
                          <RefreshCw size={12} />
                        </Button>
                      </div>
                      <ScrollArea className="bg-muted/30 h-[120px] rounded-lg p-2">
                        <div className="flex flex-col gap-1.5">
                          {themePackItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-card group flex items-center justify-between rounded border p-2 text-[10px]"
                            >
                              <span className="truncate">{item}</span>
                              <button
                                onClick={() =>
                                  setThemePackItems((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="text-destructive opacity-0 group-hover:opacity-100"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <Button
                        className="w-full gap-2"
                        variant="default"
                        disabled={isGeneratingPack}
                        onClick={generateThemePack}
                      >
                        {isGeneratingPack ? 'Generating Pack...' : 'Generate Full Pack'}
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Library & Visualization */}
        <div className="flex flex-col gap-6 overflow-hidden lg:col-span-8">
          {/* Active Generation / Playback */}
          <Card className="relative flex min-h-[300px] flex-col overflow-hidden p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'stemlab' && stems ? (
                <motion.div
                  key="stem-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Isolated Stems</h3>
                    <Button variant="outline" size="sm" onClick={() => setStems(null)}>
                      Reset
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(stems).map(([name, url]) => (
                      <div key={name} className="bg-muted/50 space-y-2 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold capitalize">{name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setCurrentPlaybackUrl(url)}
                          >
                            <Play size={12} fill="currentColor" />
                          </Button>
                        </div>
                        <AudioVisualizer
                          url={url}
                          height={40}
                          barWidth={2}
                          gap={1}
                          waveColor="#94a3b8"
                          progressColor="#3b82f6"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="main-playback"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full flex-col items-center justify-center text-center"
                >
                  {currentPlaybackUrl ? (
                    <div className="w-full space-y-6">
                      <div className="flex flex-col items-center gap-2">
                        <Badge variant="outline" className="text-primary border-primary/20">
                          NOW PLAYING
                        </Badge>
                        <h3 className="text-xl font-bold">Playback Engine</h3>
                      </div>
                      <AudioVisualizer
                        url={currentPlaybackUrl}
                        height={120}
                        barWidth={3}
                        gap={2}
                        waveColor="#3b82f6"
                        progressColor="#60a5fa"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-12">
                      <AudioWaveform className="text-muted-foreground opacity-20" size={64} />
                      <p className="text-muted-foreground text-sm">Waiting for sound input...</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* History */}
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <span className="text-sm font-semibold">Studio History</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y">
                {generations.map((gen) => (
                  <div
                    key={gen.id}
                    className="group hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors"
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      disabled={gen.status !== 'completed'}
                      onClick={() => setCurrentPlaybackUrl(gen.url)}
                    >
                      {gen.status === 'processing' ? (
                        <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                      ) : (
                        <Play size={16} fill="currentColor" />
                      )}
                    </Button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {gen.type === 'sample'
                            ? 'Sample: ' + gen.prompt
                            : gen.type === 'sfx'
                              ? 'SFX: ' + gen.prompt
                              : gen.artist
                                ? ARTIST_STYLES[gen.artist].name
                                : 'Custom Track'}
                        </span>
                        <Badge className="scale-75 text-[10px] uppercase" variant="outline">
                          {gen.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground line-clamp-1 text-[10px]">
                        {gen.tags || gen.prompt}
                      </p>
                    </div>
                    {gen.status === 'completed' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
