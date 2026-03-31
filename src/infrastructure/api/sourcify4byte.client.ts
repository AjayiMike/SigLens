import type { LookupResult, SelectorHex, SignatureCandidate } from '@/domain/types';
import { ProviderError } from '@/errors/app-errors';
import { getJson } from '@/infrastructure/api/http';
import type { SignatureProvider } from '@/infrastructure/api/provider';

interface SourcifyLookupResponse {
  ok?: boolean;
  result?: {
    function?: Record<string, Array<{ name?: string; filtered?: boolean }>>;
  };
}

export class Sourcify4byteClient implements SignatureProvider {
  readonly name = 'sourcify4byte' as const;

  async getFunctionSignaturesBySelector(selector: SelectorHex): Promise<LookupResult> {
    const url = `https://api.4byte.sourcify.dev/signature-database/v1/lookup?function=${selector}`;
    const payload = await getJson<SourcifyLookupResponse>(url);

    const rawCandidates = payload.result?.function?.[selector] ?? [];
    const candidates: SignatureCandidate[] = rawCandidates
      .filter((entry) => typeof entry.name === 'string' && entry.name.length > 0)
      .map((entry) => {
        const candidate: SignatureCandidate = {
          textSignature: entry.name as string,
          selector,
          provider: this.name,
          sourceUrl: 'https://4byte.sourcify.dev',
          confidence: 'medium'
        };
        if (entry.filtered) {
          candidate.notes = ['Result flagged as filtered by provider.'];
        }

        return candidate;
      });

    if (!Array.isArray(rawCandidates)) {
      throw new ProviderError('Unexpected Sourcify response shape.');
    }

    return {
      selector,
      candidates,
      fromCache: false,
      fetchedAt: Date.now(),
      providersTried: [this.name]
    };
  }
}
