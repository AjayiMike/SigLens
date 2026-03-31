import type {
  HashEventResult,
  HashFunctionResult,
  HistoryItem,
  LookupResult,
  ParseResult,
  Settings
} from '@/domain/types';

export type CommandName =
  | 'PING'
  | 'LOOKUP_SELECTOR'
  | 'HASH_SIGNATURE'
  | 'PARSE_INTERFACE'
  | 'GET_SETTINGS'
  | 'SET_SETTINGS'
  | 'GET_HISTORY'
  | 'CLEAR_CACHE'
  | 'CLEAR_HISTORY';

export interface CommandEnvelope<TPayload = unknown> {
  command: CommandName;
  payload?: TPayload;
  requestId: string;
  version: 1;
}

export interface CommandError {
  code: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'PROVIDER_ERROR' | 'PARSE_ERROR' | 'INTERNAL_ERROR';
  message: string;
  details?: string;
}

export interface CommandSuccess<TData = unknown> {
  ok: true;
  requestId: string;
  data: TData;
}

export interface CommandFailure {
  ok: false;
  requestId: string;
  error: CommandError;
}

export type CommandResponse<TData = unknown> = CommandSuccess<TData> | CommandFailure;

export interface LookupSelectorPayload {
  selector: string;
}

export interface HashSignaturePayload {
  signature: string;
  mode: 'function' | 'event';
}

export interface ParseInterfacePayload {
  source: string;
}

export interface SetSettingsPayload {
  settings: Partial<Settings>;
}

export interface HistoryResponseData {
  items: HistoryItem[];
}

export interface HashResponseData {
  mode: 'function' | 'event';
  result: HashFunctionResult | HashEventResult;
}

export interface LookupResponseData {
  result: LookupResult;
}

export interface ParseResponseData {
  result: ParseResult;
}

export interface SettingsResponseData {
  settings: Settings;
}
