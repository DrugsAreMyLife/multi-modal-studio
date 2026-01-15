export interface CloudStorageProvider {
    id: string;
    name: string;
    icon: React.ReactNode;
    isConnected: () => boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    listFiles: (path?: string) => Promise<CloudFile[]>;
    uploadFile: (file: File, path?: string) => Promise<string>; // Returns URL
}

export interface CloudFile {
    id: string;
    name: string;
    type: 'file' | 'folder';
    mimeType?: string;
    size?: number;
    thumbnailUrl?: string;
    updatedAt: number;
}
