export type SelectorHex = `0x${string}`;
export type HashHex = `0x${string}`;

export type FunctionSignature = string;
export type EventSignature = string;

export type ProviderName = 'sourcify4byte' | '4byteDirectory' | 'local';
export type PreferredProvider = 'auto' | 'sourcify4byte' | '4byteDirectory';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface SignatureCandidate {
  textSignature: FunctionSignature;
  selector: SelectorHex;
  provider: ProviderName;
  sourceUrl?: string;
  isVerified?: boolean;
  confidence?: ConfidenceLevel;
  notes?: string[];
}

export interface LookupResult {
  selector: SelectorHex;
  candidates: SignatureCandidate[];
  fromCache: boolean;
  fetchedAt: number;
  providersTried: ProviderName[];
}

export interface ParsedFunctionRow {
  signature: FunctionSignature;
  selector: SelectorHex;
}

export interface ParseResult {
  functions: ParsedFunctionRow[];
  warnings: string[];
  errors: string[];
}

export interface HashFunctionResult {
  canonicalSignature: FunctionSignature;
  selector: SelectorHex;
  fullHash: HashHex;
}

export interface HashEventResult {
  canonicalSignature: EventSignature;
  topicHash: HashHex;
}

export interface Settings {
  cacheTtlDays: number;
  preferredProvider: PreferredProvider;
  enableExplorerEnhancements: boolean;
}

export interface HistoryItem {
  id: string;
  kind: 'lookup' | 'hash-function' | 'hash-event' | 'interface-parse';
  input: string;
  createdAt: number;
  summary: string;
}
