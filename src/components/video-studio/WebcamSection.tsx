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
        { id: 'cartoon', name: 'Cel Shaded', icon: '🎨' }
    ];

    const toggleCamera = async () => {
        if (isActive) {
            streamRef.current?.getTracks().forEach(track => track.stop());
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
                console.error("Camera access failed", err);
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
                    <span className="font-semibold text-sm">Live AI Webcam</span>
                </div>
                <Badge variant={isActive ? "default" : "secondary"} className="text-[10px]">
                    {isActive ? "LIVE" : "OFFLINE"}
                </Badge>
            </div>

            <Card className="relative aspect-video bg-black overflow-hidden ring-1 ring-white/10 group">
                {isActive ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={cn(
                            "w-full h-full object-cover transition-all duration-500",
                            isMorphing ? "blur-md scale-105" : "blur-0 scale-100"
                        )}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <UserRound size={48} className="opacity-20" />
                        <p className="text-xs">Camera is off</p>
                    </div>
                )}

                {/* Morph Overlay Simulation */}
                {isMorphing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/10 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                        <div className="relative flex flex-col items-center gap-3">
                            <Zap size={32} className="text-primary animate-bounce" />
                            <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-widest animate-pulse">
                                Re-Skinning Frame...
                            </span>
                        </div>
                    </div>
                )}

                {/* Floating Controls */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 text-[10px] bg-background/80 backdrop-blur-md border-white/10"
                        onClick={toggleCamera}
                    >
                        {isActive ? "Stop" : "Start"}
                    </Button>
                    {isActive && (
                        <div className="flex gap-1">
                            <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur-md">
                                <RefreshCcw size={14} />
                            </Button>
                            <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur-md">
                                <Layers size={14} />
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Character Selection */}
            {isActive && (
                <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Select Morph Persona</p>
                    <div className="grid grid-cols-2 gap-2">
                        {characters.map(char => (
                            <Button
                                key={char.id}
                                variant="outline"
                                className={cn(
                                    "h-12 justify-start gap-2 relative overflow-hidden",
                                    selectedCharacter === char.id ? "border-primary bg-primary/5" : "border-white/5"
                                )}
                                onClick={() => {
                                    setSelectedCharacter(char.id);
                                    handleMorph();
                                }}
                            >
                                <span className="text-lg">{char.icon}</span>
                                <div className="flex flex-col items-start min-w-0">
                                    <span className="text-[10px] font-semibold truncate">{char.name}</span>
                                    <span className="text-[9px] opacity-50">Instant Swap</span>
                                </div>
                                {selectedCharacter === char.id && (
                                    <div className="absolute bottom-0 right-0 p-0.5">
                                        <div className="h-1.5 w-1.5 bg-primary rounded-full" />
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
