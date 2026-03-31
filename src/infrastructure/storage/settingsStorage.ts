import type { Settings } from '@/domain/types';
import { createLocalStorageDriver } from '@/infrastructure/storage/browserStorage';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '@/shared/constants';


export class SettingsStorage {
  private readonly driver = createLocalStorageDriver();

  async get(): Promise<Settings> {
    const settings = await this.driver.get<Settings>(SETTINGS_STORAGE_KEY);
    return {
      ...DEFAULT_SETTINGS,
      ...settings
    };
  }

  async set(partial: Partial<Settings>): Promise<Settings> {
    const merged = {
      ...(await this.get()),
      ...partial
    };
    await this.driver.set(SETTINGS_STORAGE_KEY, merged);
    return merged;
  }
}
