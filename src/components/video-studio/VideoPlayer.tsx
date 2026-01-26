import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface VideoPlayerProps {
  url: string | null;
  status: string | null;
  isGenerating: boolean;
  className?: string;
}

export function VideoPlayer({ url, status, isGenerating, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, [url]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    const time = value[0];
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isGenerating) {
    return (
      <div
        className={cn(
          'relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-zinc-900',
          className,
        )}
      >
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
        <LoadingSpinner className="text-primary mb-4 h-12 w-12" />
        <p className="animate-pulse text-sm font-medium text-zinc-400">
          {status || 'Generating Cinematic Sequence...'}
        </p>
        <div className="mt-8 h-1 w-64 overflow-hidden rounded-full bg-white/10">
          <div className="bg-primary h-full w-[40%] animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div
        className={cn(
          'relative flex aspect-video flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-zinc-950',
          className,
        )}
      >
        <div className="mb-4 rounded-full bg-white/5 p-4 blur-sm transition-all group-hover:blur-none">
          <Play size={48} className="text-white/20" />
        </div>
        <p className="text-sm text-zinc-500 italic">Ready to render your creation</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative aspect-video overflow-hidden rounded-lg bg-black shadow-2xl',
        className,
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={url}
        className="h-full w-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {/* Overlay Play Button */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40"
          onClick={togglePlay}
        >
          <div className="bg-primary flex h-20 w-20 scale-100 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-110">
            <Play size={32} className="ml-1 fill-white" />
          </div>
        </div>
      )}

      {/* Cinematic Controls */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 transition-all duration-300',
          showControls || !isPlaying ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        <div className="space-y-4">
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.01}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => (videoRef.current!.currentTime = 0)}
              >
                <RotateCcw size={18} />
              </Button>

              <div className="group/vol flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </Button>
                <div className="w-0 overflow-hidden transition-all group-hover/vol:w-24">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.05}
                    onValueChange={(v) => {
                      setVolume(v[0]);
                      if (videoRef.current) videoRef.current.volume = v[0];
                      setIsMuted(v[0] === 0);
                    }}
                  />
                </div>
              </div>

              <span className="font-mono text-xs text-zinc-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => videoRef.current?.requestFullscreen()}
              >
                <Maximize size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
