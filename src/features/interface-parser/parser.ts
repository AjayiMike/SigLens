import type { ParseResult, ParsedFunctionRow } from '@/domain/types';
import { ParseError } from '@/errors/app-errors';
import { selectorFromSignature } from '@/infrastructure/crypto/keccak';

const PARAM_STORAGE_KEYWORDS = /\b(memory|calldata|storage|indexed|payable)\b/g;

function removeComments(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function splitTopLevel(input: string, delimiter: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

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

    if (char === delimiter && depth === 0) {
      out.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    out.push(current);
  }

  return out;
}

function parseParamType(raw: string): string | null {
  let value = raw.trim();
  if (!value) {
    return null;
  }

  if (/\bfunction\s*\(/.test(value) || /\bmapping\s*\(/.test(value)) {
    return null;
  }

  value = value.replace(PARAM_STORAGE_KEYWORDS, ' ').replace(/\s+/g, ' ').trim();

  const trailingIdentifier = value.match(/^(.*\S)\s+([A-Za-z_][A-Za-z0-9_]*)$/);
  if (trailingIdentifier) {
    value = trailingIdentifier[1]?.trim() ?? value;
  }

  value = value.replace(/\s+/g, '');
  value = value.replace(/^addresspayable$/, 'address');

  if (!value) {
    return null;
  }

  return value;
}

function extractDeclarations(preprocessed: string): Array<{ name: string; params: string }> {
  const declarations: Array<{ name: string; params: string }> = [];
  let cursor = 0;

  while (cursor < preprocessed.length) {
    const fnIndex = preprocessed.indexOf('function', cursor);
    if (fnIndex < 0) {
      break;
    }

    const before = fnIndex > 0 ? preprocessed[fnIndex - 1] : ' ';
    if (before && /[A-Za-z0-9_]/.test(before)) {
      cursor = fnIndex + 'function'.length;
      continue;
    }

    let i = fnIndex + 'function'.length;
    while (i < preprocessed.length && /\s/.test(preprocessed[i] ?? '')) {
      i += 1;
    }

    const nameStart = i;
    while (i < preprocessed.length && /[A-Za-z0-9_]/.test(preprocessed[i] ?? '')) {
      i += 1;
    }

    const name = preprocessed.slice(nameStart, i).trim();
    if (!name) {
      cursor = fnIndex + 'function'.length;
      continue;
    }

    while (i < preprocessed.length && /\s/.test(preprocessed[i] ?? '')) {
      i += 1;
    }

    if (preprocessed[i] !== '(') {
      cursor = fnIndex + 'function'.length;
      continue;
    }

    i += 1;
    let depth = 1;
    const paramsStart = i;

    while (i < preprocessed.length && depth > 0) {
      const char = preprocessed[i];
      if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
      }
      i += 1;
    }

    if (depth !== 0) {
      throw new ParseError('Unbalanced parentheses in function declaration.');
    }

    const params = preprocessed.slice(paramsStart, i - 1);
    declarations.push({ name, params });
    cursor = i;
  }

  return declarations;
}

export function parseInterfaceToSelectors(input: string): ParseResult {
  const preprocessed = removeComments(input);
  const declarations = extractDeclarations(preprocessed);

  const warnings: string[] = [];
  const seen = new Set<string>();
  const functions: ParsedFunctionRow[] = [];

  for (const declaration of declarations) {
    const rawParams = splitTopLevel(declaration.params, ',').map((item) => item.trim());
    const paramTypes: string[] = [];

    for (const rawParam of rawParams) {
      if (!rawParam) {
        continue;
      }

      const parsedType = parseParamType(rawParam);
      if (!parsedType) {
        warnings.push(`Unsupported parameter in function ${declaration.name}: "${rawParam}"`);
        continue;
      }

      paramTypes.push(parsedType);
    }

    const signature = `${declaration.name}(${paramTypes.join(',')})`;
    if (seen.has(signature)) {
      warnings.push(`Duplicate function signature skipped: ${signature}`);
      continue;
    }

    seen.add(signature);
    functions.push({
      signature,
      selector: selectorFromSignature(signature)
    });
  }

  if (functions.length === 0) {
    return {
      functions: [],
      warnings,
      errors: ['No function declarations found. Paste Solidity function declarations or interface blocks.']
    };
  }

  return {
    functions,
    warnings,
    errors: []
  };
}
