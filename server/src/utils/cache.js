/**
 * Cache Utility
 * Purpose: Redis-backed cache with in-memory fallback for transcript/session workflows.
 * SRS Reference: FR-01.5
 */
import { createClient } from 'redis';

import config from '../config/config.js';

class MemoryCache {
    constructor() {
        this.store = new Map();
    }

    async get(key) {
        const record = this.store.get(key);
        if (!record) return null;

        if (record.expiresAt <= Date.now()) {
            this.store.delete(key);
            return null;
        }

        return record.value;
    }

    async set(key, value, ttlSeconds = 60) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    async invalidate(key) {
        this.store.delete(key);
    }

    async invalidatePattern(prefix) {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }
}

class RedisCache {
    constructor(fallbackCache) {
        this.fallbackCache = fallbackCache;
        this.client = null;
        this.connecting = null;
        this.disabled = config.CACHE_PROVIDER !== 'redis';
        this.keyPrefix = config.REDIS_KEY_PREFIX.replace(/:+$/g, '');
    }

    async get(key) {
        const client = await this.getClient();
        if (!client) return this.fallbackCache.get(key);

        try {
            const value = await client.get(this.toRedisKey(key));
            return value ? JSON.parse(value) : null;
        } catch {
            return this.fallbackCache.get(key);
        }
    }

    async set(key, value, ttlSeconds = 60) {
        await this.fallbackCache.set(key, value, ttlSeconds);

        const client = await this.getClient();
        if (!client) return;

        try {
            await client.set(this.toRedisKey(key), JSON.stringify(value), {
                EX: ttlSeconds,
            });
        } catch {
            await this.disableRedis();
        }
    }

    async invalidate(key) {
        await this.fallbackCache.invalidate(key);

        const client = await this.getClient();
        if (!client) return;

        try {
            await client.del(this.toRedisKey(key));
        } catch {
            await this.disableRedis();
        }
    }

    async invalidatePattern(prefix) {
        await this.fallbackCache.invalidatePattern(prefix);

        const client = await this.getClient();
        if (!client) return;

        try {
            const pattern = this.toRedisKey(`${prefix}*`);
            for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
                await client.del(key);
            }
        } catch {
            await this.disableRedis();
        }
    }

    async getClient() {
        if (this.disabled) return null;
        if (this.client?.isOpen) return this.client;
        if (this.connecting) return this.connecting;

        this.client = createClient({
            url: config.REDIS_URL,
            socket: {
                reconnectStrategy: false,
            },
        });

        this.client.on('error', () => {
            this.disabled = true;
        });

        this.connecting = this.client
            .connect()
            .then(() => this.client)
            .catch(async () => {
                await this.disableRedis();
                return null;
            })
            .finally(() => {
                this.connecting = null;
            });

        return this.connecting;
    }

    async disableRedis() {
        this.disabled = true;
        if (this.client?.isOpen) {
            await this.client.quit().catch(() => null);
        }
        this.client = null;
    }

    toRedisKey(key) {
        return `${this.keyPrefix}:${key}`;
    }
}

const memoryCache = new MemoryCache();
const cache = new RedisCache(memoryCache);

export default cache;
