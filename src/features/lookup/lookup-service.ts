import type {
  LookupResult,
  PreferredProvider,
  ProviderName,
  SelectorHex,
  SignatureCandidate
} from '@/domain/types';
import { ProviderError } from '@/errors/app-errors';
import { dedupeAndRankCandidates } from '@/features/lookup/ranking';
import { FourByteDirectoryClient } from '@/infrastructure/api/fourbyteDirectory.client';
import type { SignatureProvider } from '@/infrastructure/api/provider';
import { Sourcify4byteClient } from '@/infrastructure/api/sourcify4byte.client';
import { CacheStorage } from '@/infrastructure/cache/cacheStorage';
import { Logger } from '@/infrastructure/logging/logger';
import { SettingsStorage } from '@/infrastructure/storage/settingsStorage';

function providerOrder(preferred: PreferredProvider): SignatureProvider[] {
  const sourcify = new Sourcify4byteClient();
  const directory = new FourByteDirectoryClient();

  switch (preferred) {
    case 'sourcify4byte':
      return [sourcify, directory];
    case '4byteDirectory':
      return [directory, sourcify];
    case 'auto':
    default:
      return [sourcify, directory];
  }
}

export class LookupService {
  private readonly cache = new CacheStorage();
  private readonly settingsStorage = new SettingsStorage();
  private readonly logger = new Logger(true);

  async lookup(selector: SelectorHex): Promise<LookupResult> {
    const settings = await this.settingsStorage.get();

    const cached = await this.cache.getSelector(selector);
    if (cached) {
      this.logger.info('Cache hit', { selector });
      return {
        ...cached,
        fromCache: true
      };
    }

    this.logger.info('Cache miss', { selector });

    const providers = providerOrder(settings.preferredProvider);
    const providersTried: ProviderName[] = [];
    const candidates: SignatureCandidate[] = [];
    const errors: string[] = [];

    for (const provider of providers) {
      providersTried.push(provider.name);

      try {
        const result = await provider.getFunctionSignaturesBySelector(selector);
        candidates.push(...result.candidates);

        if (result.candidates.length > 0 && settings.preferredProvider !== 'auto') {
          break;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown provider error.';
        errors.push(`${provider.name}: ${message}`);
      }
    }

    if (candidates.length === 0 && errors.length > 0) {
      throw new ProviderError(`All providers failed. ${errors.join(' | ')}`);
    }

    const merged = dedupeAndRankCandidates(candidates);
    const result: LookupResult = {
      selector,
      candidates: merged,
      fromCache: false,
      fetchedAt: Date.now(),
      providersTried
    };

    const ttlMs = Math.max(settings.cacheTtlDays, 1) * 24 * 60 * 60 * 1000;
    await this.cache.setSelector(selector, result, ttlMs);

    return result;
  }

  async clearCache(): Promise<void> {
    await this.cache.clear();
  }
}
