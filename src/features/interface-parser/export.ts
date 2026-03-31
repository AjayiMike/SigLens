import type { ParsedFunctionRow } from '@/domain/types';

export function toPlainText(rows: ParsedFunctionRow[]): string {
  return rows.map((row) => `${row.signature} ${row.selector}`).join('\n');
}

export function toCsv(rows: ParsedFunctionRow[]): string {
  const head = 'signature,selector';
  const body = rows.map((row) => `${JSON.stringify(row.signature)},${row.selector}`).join('\n');
  return `${head}\n${body}`;
}

export function toMarkdown(rows: ParsedFunctionRow[]): string {
  const head = '| Function | Selector |\n|---|---|';
  const body = rows.map((row) => `| \`${row.signature}\` | \`${row.selector}\` |`).join('\n');
  return `${head}\n${body}`;
}
