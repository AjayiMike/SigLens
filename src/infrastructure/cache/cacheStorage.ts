import type { LookupResult } from '@/domain/types';
import { CacheError } from '@/errors/app-errors';
import { createLocalStorageDriver } from '@/infrastructure/storage/browserStorage';
import { CACHE_STORAGE_KEY } from '@/shared/constants';


interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  expiresAt: number;
  version: number;
}

type CacheRecord = Record<string, CacheEntry<LookupResult>>;

export class CacheStorage {
  private readonly driver = createLocalStorageDriver();

  async getSelector(selector: string): Promise<LookupResult | null> {
    const key = `selector:${selector}`;
    const all = (await this.driver.get<CacheRecord>(CACHE_STORAGE_KEY)) ?? {};
    const entry = all[key];

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      delete all[key];
      await this.driver.set(CACHE_STORAGE_KEY, all);
      return null;
    }

    return entry.value;
  }

  async setSelector(selector: string, value: LookupResult, ttlMs: number): Promise<void> {
    if (ttlMs <= 0) {
      throw new CacheError('TTL must be greater than zero.');
    }

    const all = (await this.driver.get<CacheRecord>(CACHE_STORAGE_KEY)) ?? {};
    const now = Date.now();
    const key = `selector:${selector}`;

    all[key] = {
      key,
      value,
      createdAt: now,
      expiresAt: now + ttlMs,
      version: 1
    };

    await this.driver.set(CACHE_STORAGE_KEY, all);
  }

  async clear(): Promise<void> {
    await this.driver.remove(CACHE_STORAGE_KEY);
  }
}
