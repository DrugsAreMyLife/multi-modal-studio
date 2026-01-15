'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, LayoutGrid, Paperclip, X, File, FileCode, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VoiceInput } from './VoiceInput';

interface ChatInputAreaProps {
    value: string;
    onChange: (val: string) => void;
    onSendMessage: (content: string, attachments: File[]) => void;
    onStartComparison: () => void;
    isLoading: boolean;
    placeholder?: string;
    isEditing?: boolean;
}

export function ChatInputArea({
    value,
    onChange,
    onSendMessage,
    onStartComparison,
    isLoading,
    placeholder = "Type your message...",
    isEditing = false
}: ChatInputAreaProps) {
    const [files, setFiles] = useState<File[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!value.trim() && files.length === 0) || isLoading) return;

        onSendMessage(value, files);
        // We generally rely on parent to clear input, but parent might not know about files easily
        // So we clear files here. Parent should clear 'value'.
        setFiles([]);
    };

    const FileIcon = ({ file }: { file: File }) => {
        if (file.type.startsWith('image/')) return <FileImage size={14} className="text-blue-500" />;
        if (file.type.includes('code') || file.name.endsWith('.tsx') || file.name.endsWith('.ts')) return <FileCode size={14} className="text-amber-500" />;
        return <File size={14} className="text-gray-500" />;
    };

    return (
        <div {...getRootProps()} className="relative">
            <input {...getInputProps()} />

            <AnimatePresence>
                {isDragActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 -top-20 z-50 bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-xl flex items-center justify-center pointer-events-none"
                    >
                        <p className="text-lg font-medium text-primary">Drop files to attach</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File Previews */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex gap-2 mb-2 px-4 overflow-x-auto scrollbar-hide py-2"
                    >
                        {files.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-muted/80 pl-2 pr-1 py-1 rounded-md border border-border shrink-0 text-xs">
                                <FileIcon file={file} />
                                <span className="max-w-[100px] truncate">{file.name}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 rounded-full hover:bg-destructive/20 hover:text-destructive"
                                    onClick={() => removeFile(i)}
                                >
                                    <X size={10} />
                                </Button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className={cn(
                "flex gap-2 items-center bg-background border p-2 rounded-full shadow-lg focus-within:ring-2 focus-within:ring-ring ring-offset-background max-w-3xl mx-auto w-full transition-all duration-300",
                isDragActive && "ring-2 ring-primary"
            )}>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.onchange = (e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.files) {
                                setFiles(prev => [...prev, ...Array.from(target.files!)]);
                            }
                        };
                        input.click();
                    }}
                >
                    <Paperclip size={18} />
                </Button>

                <VoiceInput onTranscript={(text) => onChange(value ? value + ' ' + text : text)} />

                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={cn(
                        "flex-1 border-none focus-visible:ring-0 shadow-none bg-transparent pl-2",
                        isEditing && "text-primary font-medium"
                    )}
                    disabled={isLoading}
                />

                {/* Compare Button */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground hover:text-primary transition-colors"
                    onClick={onStartComparison}
                    disabled={isLoading || (!value.trim() && files.length === 0)}
                    title="Compare Models"
                >
                    <LayoutGrid size={20} />
                </Button>

                <Button type="submit" size="icon" className="rounded-full" disabled={isLoading || (!value.trim() && files.length === 0)}>
                    <Send size={18} />
                    <span className="sr-only">Send</span>
                </Button>
            </form>
        </div>
    );
}
