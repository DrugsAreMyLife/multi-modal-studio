'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, UserRound, RefreshCcw, Layers, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function WebcamSection() {
  const [isActive, setIsActive] = useState(false);
  const [isMorphing, setIsMorphing] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const characters = [
    { id: 'neo', name: 'Cyberpunk', icon: '🕶️' },
    { id: 'wizard', name: 'Ancient Wizard', icon: '🧙‍♂️' },
    { id: 'robot', name: 'Synth Human', icon: '🤖' },
    { id: 'cartoon', name: 'Cel Shaded', icon: '🎨' },
  ];

  const toggleCamera = async () => {
    if (isActive) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setIsActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setIsActive(true);
      } catch (err) {
        console.error('Camera access failed', err);
      }
    }
  };

  const handleMorph = () => {
    setIsMorphing(true);
    // Simulate real-time processing delay
    setTimeout(() => setIsMorphing(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-primary" />
          <span className="text-sm font-semibold">Live AI Webcam</span>
        </div>
        <Badge variant={isActive ? 'default' : 'secondary'} className="text-[10px]">
          {isActive ? 'LIVE' : 'OFFLINE'}
        </Badge>
      </div>

      <Card className="group relative aspect-video overflow-hidden bg-black ring-1 ring-white/10">
        {isActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              'h-full w-full object-cover transition-all duration-500',
              isMorphing ? 'scale-105 blur-md' : 'blur-0 scale-100',
            )}
          />
        ) : (
          <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2">
            <UserRound size={48} className="opacity-20" />
            <p className="text-xs">Camera is off</p>
          </div>
        )}

        {/* Morph Overlay Simulation */}
        {isMorphing && (
          <div className="bg-primary/10 absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="from-primary/20 absolute inset-0 bg-gradient-to-t to-transparent" />
            <div className="relative flex flex-col items-center gap-3">
              <Zap size={32} className="text-primary animate-bounce" />
              <span className="text-primary-foreground animate-pulse text-[10px] font-bold tracking-widest uppercase">
                Re-Skinning Frame...
              </span>
            </div>
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute right-2 bottom-2 left-2 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size="sm"
            variant="secondary"
            className="bg-background/80 h-8 border-white/10 text-[10px] backdrop-blur-md"
            onClick={toggleCamera}
          >
            {isActive ? 'Stop' : 'Start'}
          </Button>
          {isActive && (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="secondary"
                className="bg-background/80 h-8 w-8 backdrop-blur-md"
              >
                <RefreshCcw size={14} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="bg-background/80 h-8 w-8 backdrop-blur-md"
              >
                <Layers size={14} />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Character Selection */}
      {isActive && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
            Select Morph Persona
          </p>
          <div className="grid grid-cols-2 gap-2">
            {characters.map((char) => (
              <Button
                key={char.id}
                variant="outline"
                className={cn(
                  'relative h-12 justify-start gap-2 overflow-hidden',
                  selectedCharacter === char.id ? 'border-primary bg-primary/5' : 'border-white/5',
                )}
                onClick={() => {
                  setSelectedCharacter(char.id);
                  handleMorph();
                }}
              >
                <span className="text-lg">{char.icon}</span>
                <div className="flex min-w-0 flex-col items-start">
                  <span className="truncate text-[10px] font-semibold">{char.name}</span>
                  <span className="text-[9px] opacity-50">Instant Swap</span>
                </div>
                {selectedCharacter === char.id && (
                  <div className="absolute right-0 bottom-0 p-0.5">
                    <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                  </div>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
