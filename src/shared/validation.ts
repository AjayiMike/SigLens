import { z } from 'zod';

import type { SelectorHex } from '@/domain/types';
import {
  CALLDATA_ERROR_MESSAGE,
  SELECTOR_ERROR_MESSAGE,
  SIGNATURE_ERROR_MESSAGE
} from '@/shared/constants';

const selectorRawSchema = z
  .string()
  .trim()
  .regex(/^(0x)?[0-9a-fA-F]{8}$/, SELECTOR_ERROR_MESSAGE);

const signatureRawSchema = z
  .string()
  .trim()
  .refine((value) => {
    const canonical = value.replace(/\s+/g, '');
    return /^[A-Za-z_][A-Za-z0-9_]*\([^()]*\)$/.test(canonical);
  }, SIGNATURE_ERROR_MESSAGE);

const eventSignatureRawSchema = signatureRawSchema;

export const selectorSchema = selectorRawSchema.transform((value): SelectorHex => {
  const normalized = value.toLowerCase().replace(/^0x/, '');
  return `0x${normalized}`;
});

export const signatureSchema = signatureRawSchema;
export const eventSignatureSchema = eventSignatureRawSchema;

export const calldataSchema = z
  .string()
  .trim()
  .refine((value) => {
    const sanitized = value.replace(/^0x/, '');
    return sanitized.length >= 8 && sanitized.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(sanitized);
  }, CALLDATA_ERROR_MESSAGE)
  .transform((value): `0x${string}` => {
    const sanitized = value.toLowerCase().replace(/^0x/, '');
    return `0x${sanitized}`;
  });

export const interfaceInputSchema = z.string().trim().min(1, 'Interface input cannot be empty.');
