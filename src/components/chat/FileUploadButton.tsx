'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileText, Image, Film, Music, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/upload';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

interface FileUploadButtonProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  selectedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

const DEFAULT_ACCEPTED = ['image/*', 'application/pdf', 'text/*', '.md', '.json', '.csv'];
const FILE_ICONS: Record<string, typeof FileText> = {
  image: Image,
  video: Film,
  audio: Music,
  default: FileText,
};

function getFileIcon(type: string) {
  const category = type.split('/')[0];
  return FILE_ICONS[category] || FILE_ICONS.default;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadButton({
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = DEFAULT_ACCEPTED,
  disabled = false,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    const files = Array.from(fileList).slice(0, maxFiles - selectedFiles.length);
    const maxBytes = maxSizeMB * 1024 * 1024;

    for (const file of files) {
      if (file.size > maxBytes) {
        toast.error(`File ${file.name} is too large. Max size is ${maxSizeMB}MB.`);
        continue;
      }

      const id = crypto.randomUUID();
      let preview: string | undefined;

      if (file.type.startsWith('image/')) {
        preview = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const newFile: UploadedFile = {
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        preview,
        status: 'uploading',
      };

      onFilesSelected([newFile]);

      try {
        const result = await uploadFile(file);
        onFilesSelected([{ ...newFile, url: result.url, status: 'completed' }]);
      } catch (err) {
        console.error('Upload failed:', err);
        toast.error(`Failed to upload ${file.name}`);
        onFilesSelected([{ ...newFile, status: 'error' }]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="bg-muted/50 flex flex-wrap gap-2 rounded-lg p-2">
          {selectedFiles.map((file) => {
            const Icon = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className={cn(
                  'bg-background flex items-center gap-2 rounded border px-2 py-1 text-xs transition-all',
                  file.status === 'uploading' && 'border-primary/30 animate-pulse opacity-70',
                  file.status === 'error' && 'border-destructive/30 bg-destructive/5',
                )}
              >
                {file.preview ? (
                  <img src={file.preview} alt="" className="h-6 w-6 rounded object-cover" />
                ) : file.status === 'uploading' ? (
                  <Loader2 size={12} className="text-primary animate-spin" />
                ) : (
                  <Icon size={14} className="text-muted-foreground" />
                )}
                <span className="max-w-[100px] truncate">{file.name}</span>
                <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                <button onClick={() => onRemoveFile(file.id)} className="hover:text-destructive">
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button and drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn('relative', isDragOver && 'ring-primary rounded ring-2 ring-offset-2')}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled || selectedFiles.length >= maxFiles}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || selectedFiles.length >= maxFiles}
        >
          <Paperclip size={16} />
        </Button>
      </div>
    </div>
  );
}
