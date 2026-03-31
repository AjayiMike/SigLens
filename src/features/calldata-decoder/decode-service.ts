import { ValidationError } from '@/errors/app-errors';
import { calldataSchema } from '@/shared/validation';

export interface DecodedParam {
  index: number;
  type: string;
  value: string;
}

export interface DecodeResult {
  selector: `0x${string}`;
  paramTypes: string[];
  values: DecodedParam[];
}

function splitTopLevel(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (char === '(' || char === '[') {
      depth += 1;
      current += char;
      continue;
    }

    if (char === ')' || char === ']') {
      depth = Math.max(depth - 1, 0);
      current += char;
      continue;
    }

    if (char === ',' && depth === 0) {
      out.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    out.push(current.trim());
  }

  return out;
}

function extractParamTypes(signature: string): string[] {
  const start = signature.indexOf('(');
  const end = signature.lastIndexOf(')');
  if (start < 0 || end < 0 || end <= start) {
    throw new ValidationError('Invalid signature format for decoding.');
  }

  const inside = signature.slice(start + 1, end).trim();
  if (!inside) {
    return [];
  }

  return splitTopLevel(inside);
}

function isDynamicType(type: string): boolean {
  if (type === 'string' || type === 'bytes') {
    return true;
  }

  const dynamicArrayMatch = type.match(/^(.*)\[\]$/);
  if (dynamicArrayMatch) {
    return true;
  }

  return false;
}

function readWord(dataNoPrefix: string, wordIndex: number): string {
  const start = wordIndex * 64;
  const end = start + 64;
  if (end > dataNoPrefix.length) {
    throw new ValidationError(`Calldata too short while reading word ${wordIndex}.`);
  }
  return dataNoPrefix.slice(start, end);
}

function decodeUtf8(hex: string): string {
  if (hex.length === 0) {
    return '';
  }

  const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map((pair) => parseInt(pair, 16)) ?? []);

  try {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder().decode(bytes);
    }
  } catch {
    return '[invalid utf8]';
  }

  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
}

function decodeStatic(type: string, wordHex: string): string {
  if (type === 'address') {
    return `0x${wordHex.slice(24)}`;
  }

  if (type === 'bool') {
    return BigInt(`0x${wordHex}`) === 0n ? 'false' : 'true';
  }

  if (/^u?int(\d+)?$/.test(type)) {
    return BigInt(`0x${wordHex}`).toString(10);
  }

  const fixedBytes = type.match(/^bytes(\d{1,2})$/);
  if (fixedBytes) {
    const byteLen = Number(fixedBytes[1]);
    return `0x${wordHex.slice(0, byteLen * 2)}`;
  }

  return `0x${wordHex}`;
}

function decodeDynamic(type: string, argsHex: string, offsetBytes: number): string {
  const wordOffset = Math.floor(offsetBytes / 32);

  if (type === 'string' || type === 'bytes') {
    const lengthHex = readWord(argsHex, wordOffset);
    const length = Number(BigInt(`0x${lengthHex}`));
    const bytesStart = (wordOffset + 1) * 64;
    const bytesEnd = bytesStart + length * 2;
    const content = argsHex.slice(bytesStart, bytesEnd);

    if (type === 'string') {
      return decodeUtf8(content);
    }

    return `0x${content}`;
  }

  const dynamicArrayMatch = type.match(/^(.*)\[\]$/);
  if (dynamicArrayMatch) {
    const innerType = dynamicArrayMatch[1] as string;
    const lengthHex = readWord(argsHex, wordOffset);
    const length = Number(BigInt(`0x${lengthHex}`));
    const values: string[] = [];

    for (let index = 0; index < length; index += 1) {
      const wordHex = readWord(argsHex, wordOffset + 1 + index);
      values.push(decodeStatic(innerType, wordHex));
    }

    return `[${values.join(', ')}]`;
  }

  return `[dynamic ${type}]`;
}

export function decodeCalldataWithSignature(calldata: string, signature: string): DecodeResult {
  const parsed = calldataSchema.safeParse(calldata);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid calldata.');
  }

  const normalized = parsed.data;
  const selector = normalized.slice(0, 10) as `0x${string}`;
  const argsHex = normalized.slice(10);

  const paramTypes = extractParamTypes(signature);
  const values: DecodedParam[] = [];

  for (let index = 0; index < paramTypes.length; index += 1) {
    const type = paramTypes[index] as string;

    if (isDynamicType(type)) {
      const pointer = readWord(argsHex, index);
      const offsetBytes = Number(BigInt(`0x${pointer}`));
      const value = decodeDynamic(type, argsHex, offsetBytes);
      values.push({
        index,
        type,
        value
      });
      continue;
    }

    const word = readWord(argsHex, index);
    values.push({
      index,
      type,
      value: decodeStatic(type, word)
    });
  }

  return {
    selector,
    paramTypes,
    values
  };
}
