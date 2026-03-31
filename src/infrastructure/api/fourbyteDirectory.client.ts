import type { LookupResult, SelectorHex, SignatureCandidate } from '@/domain/types';
import { ProviderError } from '@/errors/app-errors';
import { getJson } from '@/infrastructure/api/http';
import type { SignatureProvider } from '@/infrastructure/api/provider';

interface FourByteDirectoryResponse {
  results?: Array<{
    text_signature?: string;
    hex_signature?: string;
  }>;
}

export class FourByteDirectoryClient implements SignatureProvider {
  readonly name = '4byteDirectory' as const;

  async getFunctionSignaturesBySelector(selector: SelectorHex): Promise<LookupResult> {
    const url = `https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`;
    const payload = await getJson<FourByteDirectoryResponse>(url);

    if (!Array.isArray(payload.results)) {
      throw new ProviderError('Unexpected 4byte.directory response shape.');
    }

    const candidates: SignatureCandidate[] = payload.results
      .filter((entry) => entry.hex_signature?.toLowerCase() === selector.toLowerCase())
      .filter((entry) => typeof entry.text_signature === 'string' && entry.text_signature.length > 0)
      .map((entry) => ({
        textSignature: entry.text_signature as string,
        selector,
        provider: this.name,
        sourceUrl: 'https://www.4byte.directory',
        confidence: 'medium'
      }));

    return {
      selector,
      candidates,
      fromCache: false,
      fetchedAt: Date.now(),
      providersTried: [this.name]
    };
  }
}
