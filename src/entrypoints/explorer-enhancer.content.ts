import { defineContentScript } from 'wxt/utils/define-content-script';

import { findSelectorMatches } from '@/features/explorer-enhancement/selector-detector';
import { getSettings, lookupSelector } from '@/infrastructure/messaging/client';

const STYLE_ID = 'siglens-explorer-enhancer-style';
const SELECTOR_CLASS = 'siglens-selector-token';
const MAX_TEXT_NODES_PER_PASS = 20000;

const resolvedSelectorCache = new Map<string, string | null>();

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${SELECTOR_CLASS} {
      border-bottom: 1px dashed #35c8ac;
      cursor: help;
      border-radius: 2px;
      padding: 0 1px;
      transition: background-color 120ms ease;
    }
    .${SELECTOR_CLASS}:hover {
      background: rgba(53, 200, 172, 0.15);
    }
    .${SELECTOR_CLASS}.siglens-found {
      border-bottom-color: #35c8ac;
    }
    .${SELECTOR_CLASS}.siglens-miss {
      border-bottom-color: #9aa7b8;
    }
  `;

  document.head.appendChild(style);
}

function shouldSkipTextNode(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) {
    return true;
  }

  if (parent.closest(`.${SELECTOR_CLASS}`)) {
    return true;
  }

  const tag = parent.tagName.toLowerCase();
  return (
    tag === 'script' ||
    tag === 'style' ||
    tag === 'noscript' ||
    tag === 'textarea' ||
    tag === 'input' ||
    tag === 'select'
  );
}

async function resolveSelectorToken(token: HTMLElement): Promise<void> {
  const selector = token.dataset.selector;
  if (!selector) {
    return;
  }

  const cached = resolvedSelectorCache.get(selector);
  if (cached !== undefined) {
    token.title = cached ?? `${selector} (no known signature)`;
    token.classList.add(cached ? 'siglens-found' : 'siglens-miss');
    return;
  }

  token.title = `${selector} (resolving...)`;

  try {
    const response = await lookupSelector({ selector });
    const best = response.data.result.candidates[0]?.textSignature ?? null;
    resolvedSelectorCache.set(selector, best);

    token.title = best ? `${selector} -> ${best}` : `${selector} (no known signature)`;
    token.classList.add(best ? 'siglens-found' : 'siglens-miss');
  } catch {
    token.title = `${selector} (lookup failed)`;
    token.classList.add('siglens-miss');
  }
}

function createToken(selector: `0x${string}`): HTMLElement {
  const token = document.createElement('span');
  token.className = SELECTOR_CLASS;
  token.textContent = selector;
  token.dataset.selector = selector;
  token.title = `${selector} (hover to resolve)`;
  token.addEventListener('mouseenter', () => {
    void resolveSelectorToken(token);
  });
  return token;
}

function enhanceTextNode(node: Text): boolean {
  if (shouldSkipTextNode(node)) {
    return false;
  }

  const text = node.textContent ?? '';
  if (text.length === 0 || text.length > 1200) {
    return false;
  }

  const matches = findSelectorMatches(text);
  if (matches.length === 0) {
    return false;
  }

  const fragment = document.createDocumentFragment();
  let cursor = 0;

  for (const match of matches) {
    if (match.start > cursor) {
      fragment.appendChild(document.createTextNode(text.slice(cursor, match.start)));
    }

    fragment.appendChild(createToken(match.selector));
    cursor = match.end;
  }

  if (cursor < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(cursor)));
  }

  node.replaceWith(fragment);
  return true;
}

function processRoot(root: ParentNode): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  let current = walker.nextNode();
  while (current && textNodes.length < MAX_TEXT_NODES_PER_PASS) {
    if (current instanceof Text) {
      textNodes.push(current);
    }
    current = walker.nextNode();
  }

  let enhancedCount = 0;
  for (const node of textNodes) {
    if (enhanceTextNode(node)) {
      enhancedCount += 1;
    }
  }

  return enhancedCount;
}

function bootstrapObserver(): void {
  let scheduled = false;

  const observer = new MutationObserver((mutations) => {
    if (scheduled) {
      return;
    }

    const hasNewNodes = mutations.some((mutation) => mutation.addedNodes.length > 0);
    if (!hasNewNodes) {
      return;
    }

    scheduled = true;
    setTimeout(() => {
      processRoot(document.body);
      scheduled = false;
    }, 180);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

export default defineContentScript({
  matches: [
    '*://*.etherscan.io/*',
    '*://etherscan.io/*',
    '*://*.arbiscan.io/*',
    '*://*.basescan.org/*',
    '*://*.bscscan.com/*',
    '*://*.polygonscan.com/*',
    '*://*.snowtrace.io/*',
    '*://*.ftmscan.com/*',
    '*://*.blockscout.com/*',
    '*://blockscout.com/*'
  ],
  runAt: 'document_idle',
  main: async () => {
    let enabled = true;
    try {
      const settingsResponse = await getSettings();
      enabled = settingsResponse.data.settings.enableExplorerEnhancements;
    } catch {
      enabled = true;
    }

    if (!enabled) {
      return;
    }

    if (!document.body) {
      return;
    }

    injectStyle();
    processRoot(document.body);
    bootstrapObserver();

    setTimeout(() => {
      processRoot(document.body);
    }, 1200);
  }
});
