import { StorageProvider, FileInfo } from '../types';
import { Dropbox } from 'dropbox';

export class DropboxProvider implements StorageProvider {
    id = 'dropbox';
    name = 'Dropbox';

    private accessToken: string | null = null;
    private dbx: Dropbox | null = null;

    constructor(accessToken?: string) {
        if (accessToken) {
            this.accessToken = accessToken;
            this.dbx = new Dropbox({ accessToken });
        }
    }

    async connect(): Promise<void> {
        console.log('Connect Dropbox via NextAuth');
    }

    async disconnect(): Promise<void> {
        this.accessToken = null;
        this.dbx = null;
    }

    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    async listFiles(folderId: string = ''): Promise<FileInfo[]> {
        if (!this.dbx) throw new Error('Not authenticated');

        try {
            // Dropbox uses empty string for root, or paths like '/folder'
            const response = await this.dbx.filesListFolder({
                path: folderId === 'root' ? '' : folderId
            });

            return response.result.entries.map((entry: any) => ({
                id: entry.path_lower || entry.id,
                name: entry.name,
                mimeType: entry['.tag'] === 'folder' ? 'application/vnd.google-apps.folder' : 'application/octet-stream', // Dropbox doesn't give mimeType in list
                size: entry.size || 0,
                modifiedTime: entry.client_modified
            }));
        } catch (error) {
            console.error('Dropbox list files error:', error);
            throw error;
        }
    }

    async uploadFile(file: File | Blob, name: string, mimeType: string, parentFolderId: string = ''): Promise<FileInfo> {
        if (!this.dbx) throw new Error('Not authenticated');

        const path = parentFolderId === 'root' ? `/${name}` : `${parentFolderId}/${name}`;

        // Dropbox SDK expects specific types, but generally accepts Blob/File for uploads in browser Environment
        // We might need to handle this carefully depending on environment.

        const response = await this.dbx.filesUpload({
            path,
            contents: file as any // Casting as any to bypass strict type check for now
        });

        return {
            id: response.result.path_lower || response.result.id,
            name: response.result.name,
            mimeType: mimeType
        };
    }

    async downloadFile(fileId: string): Promise<Blob> {
        if (!this.dbx) throw new Error('Not authenticated');

        const response = await this.dbx.filesDownload({ path: fileId });

        return (response.result as any).fileBlob;
    }

    async createFolder(name: string, parentFolderId: string = ''): Promise<FileInfo> {
        if (!this.dbx) throw new Error('Not authenticated');

        const path = parentFolderId === 'root' || parentFolderId === '' ? `/${name}` : `${parentFolderId}/${name}`;

        const response = await this.dbx.filesCreateFolderV2({ path });

        return {
            id: response.result.metadata.path_lower || response.result.metadata.id,
            name: response.result.metadata.name,
            mimeType: 'application/vnd.google-apps.folder'
        };
    }
}
