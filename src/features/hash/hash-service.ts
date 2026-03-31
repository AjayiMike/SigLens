import type { HashEventResult, HashFunctionResult } from '@/domain/types';
import { ValidationError } from '@/errors/app-errors';
import { keccakHash, selectorFromSignature } from '@/infrastructure/crypto/keccak';
import { canonicalizeSignature } from '@/shared/normalization';
import { eventSignatureSchema, signatureSchema } from '@/shared/validation';

export function hashFunctionSignature(signature: string): HashFunctionResult {
  const parsed = signatureSchema.safeParse(signature);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid function signature.');
  }

  const canonical = canonicalizeSignature(parsed.data);
  const fullHash = keccakHash(canonical);

  return {
    canonicalSignature: canonical,
    selector: selectorFromSignature(canonical),
    fullHash
  };
}

export function hashEventSignature(signature: string): HashEventResult {
  const parsed = eventSignatureSchema.safeParse(signature);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid event signature.');
  }

  const canonical = canonicalizeSignature(parsed.data);
  return {
    canonicalSignature: canonical,
    topicHash: keccakHash(canonical)
  };
}
