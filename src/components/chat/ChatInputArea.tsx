'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, LayoutGrid, Paperclip, X, File, FileCode, FileImage, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VoiceInput } from './VoiceInput';
import { uploadFile } from '@/lib/upload';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  status: 'uploading' | 'completed' | 'error';
}

interface ChatInputAreaProps {
  value: string;
  onChange: (val: string) => void;
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  onPendingSend?: (content: string, attachments: Attachment[]) => Promise<void>;
  onStartComparison: () => void;
  isLoading: boolean;
  placeholder?: string;
  isEditing?: boolean;
}

export function ChatInputArea({
  value,
  onChange,
  onSendMessage,
  onPendingSend,
  onStartComparison,
  isLoading,
  placeholder = 'Type your message...',
  isEditing = false,
}: ChatInputAreaProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [visionImages, setVisionImages] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    const id = crypto.randomUUID();
    const newAttachment: Attachment = {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'uploading',
    };

    setAttachments((prev) => [...prev, newAttachment]);

    try {
      const result = await uploadFile(file);
      setAttachments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, url: result.url, status: 'completed' } : a)),
      );
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(`Failed to upload ${file.name}`);
      setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'error' } : a)));
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(handleUpload);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const removeFile = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < Math.min(files.length, 4 - visionImages.length); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        newImages.push(base64);
      } catch (err) {
        console.error('Failed to convert image:', err);
        toast.error(`Failed to process ${file.name}`);
      }
    }

    if (newImages.length > 0) {
      setVisionImages([...visionImages, ...newImages]);
      toast.success(`Added ${newImages.length} image(s) for vision analysis`);
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleRemoveVisionImage = (index: number) => {
    setVisionImages(visionImages.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!value.trim() && attachments.length === 0) || isLoading) return;

    // Check if any files are still uploading
    if (attachments.some((a) => a.status === 'uploading')) {
      toast.error('Please wait for files to finish uploading');
      return;
    }

    if (onPendingSend) {
      onPendingSend(value, attachments)
        .then(() => {
          onSendMessage(value, attachments);
          setAttachments([]);
          setVisionImages([]);
        })
        .catch((e) => {
          if (e.message !== 'PULL_REQUIRED') {
            console.error('Send failed:', e);
            toast.error('An error occurred while preparing your message');
          }
          // If PULL_REQUIRED, we just stop here.
        });
    } else {
      onSendMessage(value, attachments);
      setAttachments([]);
      setVisionImages([]);
    }
  };

  const FileIcon = ({ attachment }: { attachment: Attachment }) => {
    if (attachment.status === 'uploading')
      return <Loader2 size={14} className="text-primary animate-spin" />;
    if (attachment.type.startsWith('image/'))
      return <FileImage size={14} className="text-blue-500" />;
    if (
      attachment.type.includes('code') ||
      attachment.name.endsWith('.tsx') ||
      attachment.name.endsWith('.ts')
    )
      return <FileCode size={14} className="text-amber-500" />;
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
            className="bg-background/80 border-primary pointer-events-none absolute inset-0 -top-20 z-50 flex items-center justify-center rounded-xl border-2 border-dashed backdrop-blur-sm"
          >
            <p className="text-primary text-lg font-medium">Drop files to attach</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Previews */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="scrollbar-hide mb-2 flex gap-2 overflow-x-auto px-4 py-2"
          >
            {attachments.map((file) => (
              <div
                key={file.id}
                className={cn(
                  'bg-muted/80 border-border flex shrink-0 items-center gap-2 rounded-md border py-1 pr-1 pl-2 text-xs transition-all',
                  file.status === 'uploading' && 'border-primary/30 animate-pulse opacity-70',
                  file.status === 'error' && 'border-destructive/30 bg-destructive/5',
                )}
              >
                <FileIcon attachment={file} />
                <span className="max-w-[100px] truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive/20 hover:text-destructive h-4 w-4 rounded-full"
                  onClick={() => removeFile(file.id)}
                >
                  <X size={10} />
                </Button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vision Images Preview */}
      <AnimatePresence>
        {visionImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="scrollbar-hide mb-2 flex gap-2 overflow-x-auto px-4 py-2"
          >
            {visionImages.map((image, index) => (
              <div
                key={`vision-${index}`}
                className="border-border bg-muted/80 relative shrink-0 overflow-hidden rounded-md border"
              >
                {/* Using regular img tag for data URIs since Next/Image requires external URLs */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`Vision image ${index + 1}`}
                  className="h-16 w-16 object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive/20 hover:text-destructive absolute top-0 right-0 h-5 w-5 rounded-full bg-black/50"
                  onClick={() => handleRemoveVisionImage(index)}
                >
                  <X size={12} />
                </Button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden image input */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        aria-label="Upload images for vision analysis"
      />

      <form
        onSubmit={handleSubmit}
        className={cn(
          'bg-background focus-within:ring-ring ring-offset-background mx-auto flex w-full max-w-3xl items-center gap-2 rounded-full border p-2 shadow-lg transition-all duration-300 focus-within:ring-2',
          isDragActive && 'ring-primary ring-2',
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground rounded-full"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              if (target.files) {
                Array.from(target.files).forEach(handleUpload);
              }
            };
            input.click();
          }}
        >
          <Paperclip size={18} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground rounded-full"
          onClick={() => imageInputRef.current?.click()}
          title="Add images for vision analysis"
        >
          <Camera size={18} />
        </Button>

        <VoiceInput onTranscription={(text) => onChange(value ? value + ' ' + text : text)} />

        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'flex-1 border-none bg-transparent pl-2 shadow-none focus-visible:ring-0',
            isEditing && 'text-primary font-medium',
          )}
          disabled={isLoading}
        />

        {/* Compare Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary rounded-full transition-colors"
          onClick={onStartComparison}
          disabled={isLoading || (!value.trim() && attachments.length === 0)}
          title="Compare Models"
        >
          <LayoutGrid size={20} />
        </Button>

        <Button
          type="submit"
          size="icon"
          className="rounded-full"
          disabled={isLoading || (!value.trim() && attachments.length === 0)}
        >
          <Send size={18} />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
