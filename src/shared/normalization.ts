import { ParseError } from '@/errors/app-errors';

export function canonicalizeSignature(signature: string): string {
  const trimmed = signature.trim();
  if (!trimmed.includes('(') || !trimmed.endsWith(')')) {
    throw new ParseError('Signature must include a function name and parenthesized argument list.');
  }

  const withoutSpaces = trimmed
    .replace(/\s*,\s*/g, ',')
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ')');

  return withoutSpaces;
}

export function normalizeSelectorInput(input: string): `0x${string}` {
  const normalized = input.trim().toLowerCase().replace(/^0x/, '');
  return `0x${normalized}`;
}

export function shortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function buildHistorySummary(input: string, output: string): string {
  return `${input} -> ${output}`;
}
