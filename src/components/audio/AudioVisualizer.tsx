'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Volume2, AudioLines } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface AudioVisualizerProps {
    url: string;
    height?: number;
    waveColor?: string;
    progressColor?: string;
}

export function AudioVisualizer({
    url,
    height = 120,
    waveColor = '#64748b',
    progressColor = '#3b82f6'
}: AudioVisualizerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;

        wavesurfer.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: waveColor,
            progressColor: progressColor,
            height: height,
            barWidth: 2,
            barGap: 3,
            cursorWidth: 1,
            cursorColor: '#ef4444',
            barRadius: 3,
            normalize: true,
            backend: 'WebAudio',
        });

        // Load the audio file
        wavesurfer.current.load(url);

        wavesurfer.current.on('ready', () => {
            setDuration(wavesurfer.current?.getDuration() || 0);
        });

        wavesurfer.current.on('audioprocess', () => {
            setCurrentTime(wavesurfer.current?.getCurrentTime() || 0);
        });

        wavesurfer.current.on('play', () => setIsPlaying(true));
        wavesurfer.current.on('pause', () => setIsPlaying(false));
        wavesurfer.current.on('finish', () => setIsPlaying(false));

        return () => {
            wavesurfer.current?.destroy();
        };
    }, [url, height, waveColor, progressColor]);

    const togglePlay = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
        }
    };

    const handleVolumeChange = (vals: number[]) => {
        const newVol = vals[0];
        setVolume(newVol);
        wavesurfer.current?.setVolume(newVol);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-muted/20 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <AudioLines size={20} />
                    </div>
                    <div>
                        <h4 className="font-medium text-sm">Audio Track</h4>
                        <p className="text-xs text-muted-foreground font-mono">{formatTime(currentTime)} / {formatTime(duration)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-muted-foreground" />
                    <Slider
                        value={[volume]}
                        max={1}
                        step={0.01}
                        className="w-24"
                        onValueChange={handleVolumeChange}
                    />
                </div>
            </div>

            <div className="relative group">
                <div ref={containerRef} className="w-full" />

                {/* Overlay Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-12 w-12 rounded-full shadow-lg pointer-events-auto"
                        onClick={togglePlay}
                    >
                        {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current pl-1" />}
                    </Button>
                </div>
            </div>

            <div className="p-2 flex justify-end">
                <Button variant="ghost" size="sm" className="text-xs gap-2">
                    <Download size={14} />
                    Export
                </Button>
            </div>
        </div>
    );
}
