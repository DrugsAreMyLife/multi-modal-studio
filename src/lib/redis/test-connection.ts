import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export interface RedisConnectionStatus {
  connected: boolean;
  url: string;
  latencyMs?: number;
  version?: string;
  error?: string;
}

export async function testRedisConnection(): Promise<RedisConnectionStatus> {
  const redis = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    lazyConnect: true,
  });

  const start = Date.now();

  try {
    await redis.connect();
    const pong = await redis.ping();
    const info = await redis.info('server');
    const versionMatch = info.match(/redis_version:(\S+)/);

    await redis.quit();

    return {
      connected: pong === 'PONG',
      url: REDIS_URL.replace(/\/\/.*@/, '//*****@'), // hide credentials
      latencyMs: Date.now() - start,
      version: versionMatch?.[1],
    };
  } catch (error) {
    try {
      await redis.quit();
    } catch {}
    return {
      connected: false,
      url: REDIS_URL.replace(/\/\/.*@/, '//*****@'),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Singleton connection for app-wide use
let sharedConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!sharedConnection) {
    sharedConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });
  }
  return sharedConnection;
}

export async function closeRedisConnection(): Promise<void> {
  if (sharedConnection) {
    await sharedConnection.quit();
    sharedConnection = null;
  }
}
