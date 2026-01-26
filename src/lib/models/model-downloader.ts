import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';
import { supabase } from '@/lib/db/server';
import { notificationQueue } from '@/lib/queue/batch-queue';

/**
 * Manager for downloading large AI models to local storage
 */
export class ModelDownloader {
  private baseDir: string;

  constructor(baseDir = './models') {
    this.baseDir = path.resolve(baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Downloads a model from a URL and tracks progress
   */
  async downloadModel(modelId: string, url: string, expectedHash?: string) {
    const fileName = path.basename(new URL(url).pathname);
    const filePath = path.join(this.baseDir, fileName);

    // 1. Mark model as downloading in DB
    await supabase
      .from('model_registry')
      .update({ status: 'downloading', metadata: { fileName, filePath } })
      .eq('id', modelId);

    try {
      console.log(`[*] Starting download: ${url} -> ${filePath}`);
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
      });

      const totalLength = parseInt(response.headers['content-length'], 10);
      let downloadedLength = 0;
      let lastReportedProgress = 0;

      const writer = fs.createWriteStream(filePath);

      response.data.on('data', (chunk: Buffer) => {
        downloadedLength += chunk.length;
        const progress = Math.floor((downloadedLength / totalLength) * 100);

        // Report progress via Redis/SSE every 5%
        if (progress >= lastReportedProgress + 5) {
          lastReportedProgress = progress;
          this.reportProgress(modelId, progress);
        }
      });

      response.data.pipe(writer);

      return new Promise<string>((resolve, reject) => {
        writer.on('finish', async () => {
          // 2. Verify Hash if provided
          if (expectedHash) {
            const actualHash = await this.calculateHash(filePath);
            if (actualHash !== expectedHash) {
              return reject(
                new Error(`Hash mismatch! Expected ${expectedHash}, got ${actualHash}`),
              );
            }
          }

          // 3. Mark as available
          await supabase
            .from('model_registry')
            .update({ status: 'available', updated_at: new Date().toISOString() })
            .eq('id', modelId);

          // 4. Notify user
          await notificationQueue.add('broadcast-model-ready', {
            modelId,
            title: 'Model Ready',
            message: `Model ${modelId} has been successfully downloaded and is ready for use.`,
          });

          resolve(filePath);
        });

        writer.on('error', reject);
      });
    } catch (error) {
      await supabase
        .from('model_registry')
        .update({ status: 'error', metadata: { error: String(error) } })
        .eq('id', modelId);
      throw error;
    }
  }

  private async reportProgress(modelId: string, progress: number) {
    // We send a raw pulse to Redis which the SSE route listens to
    await notificationQueue.add('model-download-progress', {
      modelId,
      progress,
    });
  }

  private calculateHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }
}

export const modelDownloader = new ModelDownloader();
