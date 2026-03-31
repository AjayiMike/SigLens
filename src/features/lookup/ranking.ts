import type { SignatureCandidate } from '@/domain/types';

const ERC_SIGNATURES = new Set([
  'transfer(address,uint256)',
  'approve(address,uint256)',
  'transferFrom(address,address,uint256)',
  'balanceOf(address)',
  'allowance(address,address)',
  'ownerOf(uint256)',
  'safeTransferFrom(address,address,uint256)'
]);

function spamPenalty(signature: string): number {
  if (/test|fake|scam|rug|spam/i.test(signature)) {
    return -2;
  }
  return 0;
}

function baseScore(candidate: SignatureCandidate): number {
  let score = 0;

  if (ERC_SIGNATURES.has(candidate.textSignature)) {
    score += 4;
  }

  if ((candidate.notes ?? []).length === 0) {
    score += 1;
  }

  score += spamPenalty(candidate.textSignature);
  score -= Math.floor(candidate.textSignature.length / 80);

  return score;
}

export function dedupeAndRankCandidates(candidates: SignatureCandidate[]): SignatureCandidate[] {
  const bySignature = new Map<string, SignatureCandidate & { _providers: Set<string>; _score: number }>();

  for (const candidate of candidates) {
    const key = candidate.textSignature;
    const existing = bySignature.get(key);

    if (!existing) {
      bySignature.set(key, {
        ...candidate,
        _providers: new Set([candidate.provider]),
        _score: baseScore(candidate)
      });
      continue;
    }

    existing._providers.add(candidate.provider);
    existing._score += 2;
    existing.notes = Array.from(new Set([...(existing.notes ?? []), ...(candidate.notes ?? [])]));
  }

  return Array.from(bySignature.values())
    .sort((a, b) => b._score - a._score || a.textSignature.localeCompare(b.textSignature))
    .map((entry) => {
      const candidate: SignatureCandidate = {
        textSignature: entry.textSignature,
        selector: entry.selector,
        provider: entry.provider,
        confidence: entry._providers.size > 1 ? 'high' : entry.confidence ?? 'medium'
      };

      if (entry.sourceUrl !== undefined) {
        candidate.sourceUrl = entry.sourceUrl;
      }
      if (entry.isVerified !== undefined) {
        candidate.isVerified = entry.isVerified;
      }
      if (entry.notes !== undefined) {
        candidate.notes = entry.notes;
      }

      return candidate;
    });
}
