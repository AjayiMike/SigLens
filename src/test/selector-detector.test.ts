import { describe, expect, it } from 'vitest';

import { findSelectorMatches } from '@/features/explorer-enhancement/selector-detector';

describe('selector detector', () => {
  it('finds multiple 4-byte selectors', () => {
    const text = 'call 0xa9059cbb then 0x095ea7b3';
    const result = findSelectorMatches(text);

    expect(result.map((entry) => entry.selector)).toEqual(['0xa9059cbb', '0x095ea7b3']);
  });

  it('normalizes selectors without 0x prefix', () => {
    const text = 'method id a9059cbb';
    const result = findSelectorMatches(text);

    expect(result.map((entry) => entry.selector)).toEqual(['0xa9059cbb']);
  });

  it('does not match 32-byte hashes as 4-byte selectors', () => {
    const text =
      'topic 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef should not match';
    const result = findSelectorMatches(text);

    expect(result).toHaveLength(0);
  });
});
