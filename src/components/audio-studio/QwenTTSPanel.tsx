'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAudioStudioStore, QWEN_TTS_LANGUAGES } from '@/lib/store/audio-studio-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Copy,
  Sparkles,
  Palette,
  GraduationCap,
  Lightbulb,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { ReferenceAudioUpload } from './ReferenceAudioUpload';
import { DragDropZone } from './DragDropZone';
import { TrainingSampleList } from './TrainingSampleList';
import { TrainingProgressDisplay } from './TrainingProgressDisplay';
import { cn } from '@/lib/utils';

interface WorkerStatus {
  isRunning: boolean;
  isReady: boolean;
  isStarting: boolean;
  isHealthy: boolean;
  error: string | null;
}

export function QwenTTSPanel() {
  const {
    qwenMode,
    setQwenMode,
    selectedLanguage,
    setSelectedLanguage,
    styleInstruction,
    setStyleInstruction,
    voiceDescription,
    setVoiceDescription,
    xVectorOnlyMode,
    setXVectorOnlyMode,
    trainingSamples,
    activeTrainingJob,
  } = useAudioStudioStore();

  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [isCheckingWorker, setIsCheckingWorker] = useState(false);

  // Check worker status on mount and periodically
  const checkWorkerStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/generate/audio/qwen/status');
      if (response.ok) {
        const data = await response.json();
        setWorkerStatus(data.worker);
      }
    } catch {
      setWorkerStatus({
        isRunning: false,
        isReady: false,
        isStarting: false,
        isHealthy: false,
        error: 'Failed to check status',
      });
    }
  }, []);

  // Start the worker
  const startWorker = useCallback(async () => {
    setIsCheckingWorker(true);
    try {
      const response = await fetch('/api/generate/audio/qwen/status', { method: 'POST' });
      const data = await response.json();
      setWorkerStatus(data.worker);
    } catch {
      setWorkerStatus((prev) => (prev ? { ...prev, error: 'Failed to start worker' } : null));
    } finally {
      setIsCheckingWorker(false);
    }
  }, []);

  useEffect(() => {
    checkWorkerStatus();
    // Check every 30 seconds
    const interval = setInterval(checkWorkerStatus, 30000);
    return () => clearInterval(interval);
  }, [checkWorkerStatus]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-purple-400" />
          <span className="text-xs font-medium text-purple-400">Qwen3-TTS Mode</span>
        </div>

        {/* Worker Status Indicator */}
        <WorkerStatusBadge
          status={workerStatus}
          isChecking={isCheckingWorker}
          onStart={startWorker}
          onRefresh={checkWorkerStatus}
        />
      </div>

      <Tabs value={qwenMode} onValueChange={(v) => setQwenMode(v as typeof qwenMode)}>
        <TabsList className="grid w-full grid-cols-4 bg-black/20">
          <TabsTrigger value="custom" className="gap-1.5 text-xs">
            <Sparkles size={12} />
            Custom
          </TabsTrigger>
          <TabsTrigger value="clone" className="gap-1.5 text-xs">
            <Copy size={12} />
            Clone
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-1.5 text-xs">
            <Palette size={12} />
            Design
          </TabsTrigger>
          <TabsTrigger value="train" className="gap-1.5 text-xs">
            <GraduationCap size={12} />
            Train
          </TabsTrigger>
        </TabsList>

        {/* Custom Voice Tab */}
        <TabsContent value="custom" className="mt-4 space-y-4">
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
            <p className="text-xs text-purple-300">
              Use 9 premium voice timbres with emotion and style control via natural language
              instructions.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Style Instruction (Optional)</Label>
            <Textarea
              placeholder='e.g., "very angry tone", "whisper softly", "speak like a news anchor"'
              className="bg-background/50 min-h-[60px] resize-none text-sm"
              value={styleInstruction}
              onChange={(e) => setStyleInstruction(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {['Happy', 'Sad', 'Angry', 'Whisper', 'Excited'].map((style) => (
                <button
                  key={style}
                  onClick={() => setStyleInstruction(style.toLowerCase())}
                  className="text-muted-foreground rounded-full bg-white/5 px-2 py-0.5 text-[10px] hover:bg-white/10"
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <LanguageSelector value={selectedLanguage} onChange={setSelectedLanguage} />
        </TabsContent>

        {/* Clone Voice Tab */}
        <TabsContent value="clone" className="mt-4 space-y-4">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-xs text-blue-300">
              Clone any voice from just 3 seconds of audio. Provide a reference audio sample and its
              transcript for best quality.
            </p>
          </div>

          <ReferenceAudioUpload />

          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="space-y-0.5">
              <Label className="text-xs">X-Vector Only Mode</Label>
              <p className="text-muted-foreground text-[10px]">
                Faster but lower quality (no transcript needed)
              </p>
            </div>
            <Switch checked={xVectorOnlyMode} onCheckedChange={setXVectorOnlyMode} />
          </div>

          <LanguageSelector value={selectedLanguage} onChange={setSelectedLanguage} />
        </TabsContent>

        {/* Design Voice Tab */}
        <TabsContent value="design" className="mt-4 space-y-4">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs text-emerald-300">
              Create entirely new voices from natural language descriptions. Describe age, gender,
              accent, emotion, and speaking style.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Voice Description</Label>
            <Textarea
              placeholder='e.g., "Male, 17 years old, tenor range, gaining confidence - deeper breath support now, though vowels still tighten when nervous"'
              className="bg-background/50 min-h-[100px] resize-none text-sm"
              value={voiceDescription}
              onChange={(e) => setVoiceDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Lightbulb size={12} />
              <span>Example Prompts</span>
            </div>
            <div className="space-y-1.5">
              {[
                'Deep female voice with British accent, authoritative but warm',
                'Energetic infomercial host with rapid-fire delivery',
                'Elderly wise narrator with a gravelly, thoughtful tone',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setVoiceDescription(example)}
                  className="text-muted-foreground block w-full rounded border border-white/10 bg-white/5 p-2 text-left text-[11px] hover:bg-white/10"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>

          <LanguageSelector value={selectedLanguage} onChange={setSelectedLanguage} />
        </TabsContent>

        {/* Train Voice Tab */}
        <TabsContent value="train" className="mt-4 space-y-4">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-300">
              Train a custom voice LoRA with your own audio samples. Upload 5-50 audio clips with
              transcripts for best results.
            </p>
          </div>

          {activeTrainingJob ? (
            <TrainingProgressDisplay job={activeTrainingJob} />
          ) : (
            <>
              <DragDropZone />

              {trainingSamples.length > 0 && <TrainingSampleList samples={trainingSamples} />}

              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <Label className="mb-2 block text-xs">Dataset Status</Label>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Samples uploaded</span>
                  <span
                    className={trainingSamples.length >= 5 ? 'text-emerald-400' : 'text-amber-400'}
                  >
                    {trainingSamples.length} / 5 minimum
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">With transcripts</span>
                  <span>
                    {trainingSamples.filter((s) => s.transcript && s.validated).length} /{' '}
                    {trainingSamples.length}
                  </span>
                </div>
              </div>

              <LanguageSelector value={selectedLanguage} onChange={setSelectedLanguage} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LanguageSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Target Language</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-background/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {QWEN_TTS_LANGUAGES.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {lang}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function WorkerStatusBadge({
  status,
  isChecking,
  onStart,
  onRefresh,
}: {
  status: WorkerStatus | null;
  isChecking: boolean;
  onStart: () => void;
  onRefresh: () => void;
}) {
  if (!status) {
    return (
      <button
        onClick={onRefresh}
        className="text-muted-foreground flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-0.5 text-[10px] hover:bg-white/10"
      >
        <Loader2 size={10} className="animate-spin" />
        Checking...
      </button>
    );
  }

  if (status.isStarting || isChecking) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">
        <Loader2 size={10} className="animate-spin" />
        Starting worker...
      </div>
    );
  }

  if (status.isHealthy && status.isReady) {
    return (
      <button
        onClick={onRefresh}
        className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 hover:bg-emerald-500/20"
        title="Worker is ready - click to refresh status"
      >
        <CheckCircle size={10} />
        Ready
      </button>
    );
  }

  // Not running - show start button
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onStart}
      disabled={isChecking}
      className={cn(
        'h-6 gap-1.5 rounded-full px-2 text-[10px]',
        status.error
          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
          : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
      )}
    >
      {status.error ? (
        <>
          <XCircle size={10} />
          Retry
        </>
      ) : (
        <>
          <RefreshCw size={10} />
          Start Worker
        </>
      )}
    </Button>
  );
}
