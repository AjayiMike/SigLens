import type { HistoryItem } from '@/domain/types';
import { createLocalStorageDriver } from '@/infrastructure/storage/browserStorage';
import { HISTORY_STORAGE_KEY, MAX_HISTORY_ITEMS } from '@/shared/constants';


export class HistoryStorage {
  private readonly driver = createLocalStorageDriver();

  async list(): Promise<HistoryItem[]> {
    return (await this.driver.get<HistoryItem[]>(HISTORY_STORAGE_KEY)) ?? [];
  }

  async add(item: HistoryItem): Promise<void> {
    const items = await this.list();
    const deduped = items.filter((existing) => existing.summary !== item.summary);
    const next = [item, ...deduped].slice(0, MAX_HISTORY_ITEMS);
    await this.driver.set(HISTORY_STORAGE_KEY, next);
  }

  async clear(): Promise<void> {
    await this.driver.remove(HISTORY_STORAGE_KEY);
  }
}
