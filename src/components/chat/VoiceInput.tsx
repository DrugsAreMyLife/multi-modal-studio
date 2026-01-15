'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper for type safety with Web Speech API
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    className?: string;
}

export function VoiceInput({ onTranscript, className }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
        if (webkitSpeechRecognition || SpeechRecognition) {
            const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;
            const recognizer = new SpeechRecognitionConstructor();
            recognizer.continuous = true;
            recognizer.interimResults = true;
            recognizer.lang = 'en-US';

            recognizer.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // We transmit the final transcript primarily, but could also showing interim
                if (finalTranscript) {
                    onTranscript(finalTranscript);
                }
                // If we want real-time typing effect, we'd need to handle interim + debouncing 
                // but simpler for now to append final segments.
            };

            recognizer.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognizer.onend = () => {
                // If we wanted continuous listening even after silence, we'd restart here
                // assuming isListening is true.
                // But generally users toggle it manually.
                if (isListening) {
                    // recognizer.start(); 
                    // Actually, if it ends by itself, let's stop.
                    setIsListening(false);
                }
            };

            setRecognition(recognizer);
        }
    }, [onTranscript]);

    const toggleListening = useCallback(() => {
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            recognition.start();
            setIsListening(true);
        }
    }, [isListening, recognition]);

    if (!recognition) return null; // Hide if not supported

    return (
        <Button
            type="button"
            variant={isListening ? "destructive" : "ghost"}
            size="icon"
            className={cn("rounded-full transition-colors", isListening && "animate-pulse", className)}
            onClick={toggleListening}
            title={isListening ? "Stop Recording" : "Voice Input"}
        >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </Button>
    );
}
