import { StorageProvider, StorageProviderType } from './types';
import { GoogleDriveProvider } from './providers/GoogleDriveProvider';
import { DropboxProvider } from './providers/DropboxProvider';

export class StorageManager {
  private static instance: StorageManager;
  private providers: Map<StorageProviderType, StorageProvider> = new Map();
  private activeProviderId: StorageProviderType | null = null;

  private constructor() {
    // Register providers
    this.registerProvider('google_drive', new GoogleDriveProvider());
    this.registerProvider('dropbox', new DropboxProvider());
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  public registerProvider(id: StorageProviderType, provider: StorageProvider) {
    this.providers.set(id, provider);
  }

  public getProvider(id: StorageProviderType): StorageProvider | undefined {
    return this.providers.get(id);
  }

  public getActiveProvider(): StorageProvider | undefined {
    if (!this.activeProviderId) return undefined;
    return this.providers.get(this.activeProviderId);
  }

  public setActiveProvider(id: StorageProviderType) {
    if (!this.providers.has(id)) {
      throw new Error(`Provider ${id} not found`);
    }
    this.activeProviderId = id;
  }

  public getAllProviders(): StorageProvider[] {
    return Array.from(this.providers.values());
  }
}
