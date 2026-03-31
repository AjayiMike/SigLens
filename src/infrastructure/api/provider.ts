import type { LookupResult, SelectorHex } from '@/domain/types';

export interface SignatureProvider {
  readonly name: 'sourcify4byte' | '4byteDirectory';
  getFunctionSignaturesBySelector(selector: SelectorHex): Promise<LookupResult>;
}
