'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Sound {
    id: number;
    name: string;
    username: string;
    duration: number;
    previews: {
        'preview-hq-mp3': string;
    };
    images?: {
        waveform_m: string;
    };
}

export function SoundCard({ sound }: { sound: Sound }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio(sound.previews['preview-hq-mp3']);
        audioRef.current.onended = () => setIsPlaying(false);
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [sound.previews]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <Card className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-3 flex items-center gap-3">
                <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 shrink-0 rounded-full"
                    onClick={togglePlay}
                >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate" title={sound.name}>
                        {sound.name}
                    </h4>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                        <span className="truncate">by {sound.username}</span>
                        <span>•</span>
                        <span>{Math.round(sound.duration)}s</span>
                    </div>
                </div>

                {sound.images?.waveform_m && (
                    <img
                        src={sound.images.waveform_m}
                        alt="waveform"
                        className="h-8 w-24 opacity-50 grayscale"
                    />
                )}
            </CardContent>
        </Card>
    );
}

export function SoundResultList({ query }: { query: string }) {
    const [sounds, setSounds] = useState<Sound[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSounds = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/sounds/search?q=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error('Failed to fetch sounds');
                const data = await res.json();
                setSounds(data.results || []);
            } catch (err) {
                setError('Could not find sounds');
            } finally {
                setLoading(false);
            }
        };

        if (query) {
            fetchSounds();
        }
    }, [query]);

    if (loading) return <div className="text-sm text-muted-foreground animate-pulse">Searching for sounds...</div>;
    if (error) return <div className="text-sm text-red-500">{error}</div>;
    if (sounds.length === 0) return <div className="text-sm text-muted-foreground">No sounds found.</div>;

    return (
        <div className="space-y-2 mt-2">
            {sounds.map((sound) => (
                <SoundCard key={sound.id} sound={sound} />
            ))}
        </div>
    );
}
