import type { Settings } from '@/domain/types';

export const SETTINGS_STORAGE_KEY = 'siglens_settings_v1';
export const CACHE_STORAGE_KEY = 'siglens_cache_v1';
export const HISTORY_STORAGE_KEY = 'siglens_history_v1';

export const DEFAULT_SETTINGS: Settings = {
  cacheTtlDays: 7,
  preferredProvider: 'auto',
  enableExplorerEnhancements: true
};

export const MAX_HISTORY_ITEMS = 50;

export const SELECTOR_ERROR_MESSAGE =
  'Selector must be 4 bytes: 8 hex characters, for example `0xa9059cbb`.';
export const SIGNATURE_ERROR_MESSAGE =
  'Use canonical Solidity format, for example `transfer(address,uint256)`.';
export const CALLDATA_ERROR_MESSAGE =
  'Calldata must be valid hex, even-length, and include at least a 4-byte selector.';
