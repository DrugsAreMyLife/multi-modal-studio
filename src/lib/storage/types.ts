export interface FileInfo {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  path?: string; // For folder structures
  modifiedTime?: string;
}

export interface StorageProvider {
  id: string;
  name: string; // e.g., "Google Drive"
  icon?: React.ReactNode;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isAuthenticated(): boolean;

  listFiles(folderId?: string): Promise<FileInfo[]>;
  uploadFile(
    file: File | Blob,
    name: string,
    mimeType: string,
    parentFolderId?: string,
  ): Promise<FileInfo>;
  downloadFile(fileId: string): Promise<Blob>;
  createFolder(name: string, parentFolderId?: string): Promise<FileInfo>;
}

export type StorageProviderType = 'google_drive' | 'dropbox' | 'icloud' | 'local';
