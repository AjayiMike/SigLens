export interface SelectorMatch {
  selector: `0x${string}`;
  start: number;
  end: number;
}

const SELECTOR_REGEX = /\b(?:0x)?[0-9a-fA-F]{8}\b/g;

export function findSelectorMatches(text: string): SelectorMatch[] {
  const matches: SelectorMatch[] = [];
  let match: RegExpExecArray | null = SELECTOR_REGEX.exec(text);

  while (match) {
    const raw = match[0].toLowerCase();
    const normalized = (raw.startsWith('0x') ? raw : `0x${raw}`) as `0x${string}`;
    matches.push({
      selector: normalized,
      start: match.index,
      end: match.index + match[0].length
    });
    match = SELECTOR_REGEX.exec(text);
  }

  SELECTOR_REGEX.lastIndex = 0;
  return matches;
}
