import { StorageProvider, FileInfo } from '../types';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getSession } from 'next-auth/react'; // Note: This is client-side. Server-side we use getServerSession
// We need a way to get the access token.
// For this MVP, we will assume we can get the token from the session.

export class GoogleDriveProvider implements StorageProvider {
  id = 'google_drive';
  name = 'Google Drive';

  private accessToken: string | null = null;

  constructor(accessToken?: string) {
    if (accessToken) {
      this.accessToken = accessToken;
    }
  }

  // In a real app, this would redirect to sign in or rely on existing session
  async connect(): Promise<void> {
    // This is handled by NextAuth signin on the frontend
    console.log('Connect Google Drive via NextAuth');
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  private getDriveClient() {
    if (!this.accessToken) throw new Error('Not authenticated');

    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: this.accessToken });

    return google.drive({ version: 'v3', auth });
  }

  async listFiles(folderId: string = 'root'): Promise<FileInfo[]> {
    try {
      // Note: "google" library is Node.js only. If this runs on client, we fetch via API route.
      // If we are server-side, this works.
      // Architecture Choice: We should allow this to be client-side compatible?
      // No, for security, we should proxy storage calls via our own API.
      // But for this MVP, let's try direct API calls using fetch if client-side, or googleapis if server-side.

      // Let's implement a fetch-based approach for client-side compatibility
      if (!this.accessToken) throw new Error('Not authenticated');

      const q = `'${folderId}' in parents and trashed = false`;
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,modifiedTime)`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Drive API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.files.map((f: any) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size ? parseInt(f.size) : 0,
        modifiedTime: f.modifiedTime,
      }));
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }

  async uploadFile(
    file: File | Blob,
    name: string,
    mimeType: string,
    parentFolderId: string = 'root',
  ): Promise<FileInfo> {
    if (!this.accessToken) throw new Error('Not authenticated');

    const metadata = {
      name,
      parents: [parentFolderId],
      mimeType,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: form,
      },
    );

    if (!response.ok) {
      throw new Error(`Upload error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
    };
  }

  async downloadFile(fileId: string): Promise<Blob> {
    if (!this.accessToken) throw new Error('Not authenticated');

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download error: ${response.statusText}`);
    }

    return await response.blob();
  }

  async createFolder(name: string, parentFolderId: string = 'root'): Promise<FileInfo> {
    if (!this.accessToken) throw new Error('Not authenticated');

    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error(`Create folder error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
    };
  }
}
