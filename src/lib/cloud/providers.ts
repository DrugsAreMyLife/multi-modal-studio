import { CloudStorageProvider, CloudFile } from './types';
import { HardDrive, Cloud, Server } from 'lucide-react';
import React from 'react';

// Mock implementations for Phase 3 prototype
// In a real implementation, these would use the Google Drive API, etc.

export class GoogleDriveProvider implements CloudStorageProvider {
    id = 'google-drive';
    name = 'Google Drive';
    icon = React.createElement(Cloud, { className: "text-blue-500" });

    _isConnected = false;

    isConnected() { return this._isConnected; }

    async connect() {
        // Simulate auth flow
        await new Promise(r => setTimeout(r, 1000));
        this._isConnected = true;
    }

    async disconnect() {
        this._isConnected = false;
    }

    async listFiles(path?: string): Promise<CloudFile[]> {
        await new Promise(r => setTimeout(r, 500));
        return [
            { id: '1', name: 'Project Assets', type: 'folder', updatedAt: Date.now() },
            { id: '2', name: 'Logo_Final.png', type: 'file', mimeType: 'image/png', size: 1024 * 500, updatedAt: Date.now() },
            { id: '3', name: 'Intro_Music.mp3', type: 'file', mimeType: 'audio/mpeg', size: 1024 * 1024 * 3, updatedAt: Date.now() }
        ];
    }

    async uploadFile(file: File) {
        return URL.createObjectURL(file);
    }
}

export class DropboxProvider implements CloudStorageProvider {
    id = 'dropbox';
    name = 'Dropbox';
    icon = React.createElement(HardDrive, { className: "text-blue-400" });

    _isConnected = false;

    isConnected() { return this._isConnected; }

    async connect() {
        await new Promise(r => setTimeout(r, 1000));
        this._isConnected = true;
    }

    async disconnect() {
        this._isConnected = false;
    }

    async listFiles(): Promise<CloudFile[]> {
        await new Promise(r => setTimeout(r, 600));
        return [
            { id: 'd1', name: 'Shared Team Folder', type: 'folder', updatedAt: Date.now() },
            { id: 'd2', name: 'Backup_2024.zip', type: 'file', mimeType: 'application/zip', size: 1024 * 1024 * 50, updatedAt: Date.now() }
        ];
    }

    async uploadFile(file: File) {
        return URL.createObjectURL(file);
    }
}

export class AzureProvider implements CloudStorageProvider {
    id = 'azure';
    name = 'Azure Blob';
    icon = React.createElement(Server, { className: "text-blue-600" });

    _isConnected = false;

    isConnected() { return this._isConnected; }

    async connect() {
        await new Promise(r => setTimeout(r, 1000));
        this._isConnected = true;
    }

    async disconnect() {
        this._isConnected = false;
    }

    async listFiles(): Promise<CloudFile[]> {
        await new Promise(r => setTimeout(r, 400));
        return [
            { id: 'a1', name: 'container-01', type: 'folder', updatedAt: Date.now() },
            { id: 'a2', name: 'dataset_v1.json', type: 'file', mimeType: 'application/json', size: 1024 * 200, updatedAt: Date.now() }
        ];
    }

    async uploadFile(file: File) {
        return URL.createObjectURL(file);
    }
}
