import { describe, expect, it } from 'vitest';

import { calldataSchema, selectorSchema, signatureSchema } from '@/shared/validation';

describe('validation', () => {
  it('normalizes selector', () => {
    const value = selectorSchema.parse('A9059CBB');
    expect(value).toBe('0xa9059cbb');
  });

  it('rejects invalid selector length', () => {
    const result = selectorSchema.safeParse('0x123');
    expect(result.success).toBe(false);
  });

  it('accepts canonical signature pattern', () => {
    const result = signatureSchema.safeParse('approve(address,uint256)');
    expect(result.success).toBe(true);
  });

  it('rejects malformed signature', () => {
    const result = signatureSchema.safeParse('approve(address,uint256');
    expect(result.success).toBe(false);
  });

  it('validates calldata minimum length and hex', () => {
    const result = calldataSchema.safeParse('0xa9059cbb00000000');
    expect(result.success).toBe(true);
  });
});
