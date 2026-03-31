import { keccak256 } from 'js-sha3';

import type { HashHex, SelectorHex } from '@/domain/types';

export function keccakHash(value: string): HashHex {
  return `0x${keccak256(value)}`;
}

export function selectorFromSignature(signature: string): SelectorHex {
  const hash = keccakHash(signature);
  return `0x${hash.slice(2, 10)}`;
}
