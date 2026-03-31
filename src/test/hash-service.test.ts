import { describe, expect, it } from 'vitest';

import { hashEventSignature, hashFunctionSignature } from '@/features/hash/hash-service';

describe('hash-service', () => {
  it('hashes function signature to known selector', () => {
    const result = hashFunctionSignature('transfer(address,uint256)');
    expect(result.selector).toBe('0xa9059cbb');
    expect(result.fullHash.startsWith('0xa9059cbb')).toBe(true);
    expect(result.fullHash.length).toBe(66);
  });

  it('hashes event signature to known topic', () => {
    const result = hashEventSignature('Transfer(address,address,uint256)');
    expect(result.topicHash).toBe(
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    );
  });
});
