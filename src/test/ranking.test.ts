import { describe, expect, it } from 'vitest';

import type { SignatureCandidate } from '@/domain/types';
import { dedupeAndRankCandidates } from '@/features/lookup/ranking';

describe('candidate ranking', () => {
  it('deduplicates by signature and boosts multi-provider matches', () => {
    const input: SignatureCandidate[] = [
      {
        textSignature: 'transfer(address,uint256)',
        selector: '0xa9059cbb',
        provider: 'sourcify4byte'
      },
      {
        textSignature: 'transfer(address,uint256)',
        selector: '0xa9059cbb',
        provider: '4byteDirectory'
      },
      {
        textSignature: 'fakeRugPull(address)',
        selector: '0xa9059cbb',
        provider: '4byteDirectory'
      }
    ];

    const result = dedupeAndRankCandidates(input);
    expect(result).toHaveLength(2);
    expect(result[0]?.textSignature).toBe('transfer(address,uint256)');
    expect(result[0]?.confidence).toBe('high');
  });
});
