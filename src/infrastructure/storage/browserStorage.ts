import { browser } from 'wxt/browser';

interface LocalStorageDriver {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

class MemoryLocalStorageDriver implements LocalStorageDriver {
  private readonly store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

class BrowserLocalStorageDriver implements LocalStorageDriver {
  async get<T>(key: string): Promise<T | undefined> {
    const value = await browser.storage.local.get(key);
    return value[key] as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await browser.storage.local.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await browser.storage.local.remove(key);
  }

  async clear(): Promise<void> {
    await browser.storage.local.clear();
  }
}

export function createLocalStorageDriver(): LocalStorageDriver {
  const hasBrowserStorage = typeof browser !== 'undefined' && Boolean(browser.storage?.local);
  if (hasBrowserStorage) {
    return new BrowserLocalStorageDriver();
  }

  return new MemoryLocalStorageDriver();
}
