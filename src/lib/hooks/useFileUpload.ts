'use client';

import { useState, useCallback } from 'react';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  preview?: string;
}

interface UseFileUploadOptions {
  maxFiles?: number;
  maxSizeMB?: number;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { maxFiles = 5, maxSizeMB = 10 } = options;
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = useCallback(
    (newFiles: UploadedFile[]) => {
      setFiles((prev) => {
        const combined = [...prev, ...newFiles];
        return combined.slice(0, maxFiles);
      });
    },
    [maxFiles],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const getFilesContext = useCallback(() => {
    if (files.length === 0) return '';

    const fileDescriptions = files
      .map((f) => `[Attached: ${f.name} (${f.type}, ${formatBytes(f.size)})]`)
      .join('\n');

    return `\n\nAttached files:\n${fileDescriptions}`;
  }, [files]);

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    isUploading,
    hasFiles: files.length > 0,
    canAddMore: files.length < maxFiles,
    getFilesContext,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
