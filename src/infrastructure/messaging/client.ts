import { browser } from 'wxt/browser';

import type {
  CommandEnvelope,
  CommandResponse,
  CommandSuccess,
  HashResponseData,
  HashSignaturePayload,
  HistoryResponseData,
  LookupResponseData,
  LookupSelectorPayload,
  ParseInterfacePayload,
  ParseResponseData,
  SetSettingsPayload,
  SettingsResponseData
} from '@/infrastructure/messaging/commands';
import { createRequestId } from '@/shared/id';

async function sendCommand<TPayload, TResponse>(
  command: CommandEnvelope<TPayload>['command'],
  payload?: TPayload
): Promise<CommandSuccess<TResponse>> {
  const request: CommandEnvelope<TPayload> = {
    command,
    requestId: createRequestId(command.toLowerCase()),
    version: 1
  };
  if (payload !== undefined) {
    request.payload = payload;
  }

  const response = (await browser.runtime.sendMessage(request)) as CommandResponse<TResponse>;
  if (!response.ok) {
    throw new Error(response.error.message);
  }

  return response;
}

export function pingBackground() {
  return sendCommand<undefined, { pong: true }>('PING');
}

export function lookupSelector(payload: LookupSelectorPayload) {
  return sendCommand<LookupSelectorPayload, LookupResponseData>('LOOKUP_SELECTOR', payload);
}

export function hashSignature(payload: HashSignaturePayload) {
  return sendCommand<HashSignaturePayload, HashResponseData>('HASH_SIGNATURE', payload);
}

export function parseInterface(payload: ParseInterfacePayload) {
  return sendCommand<ParseInterfacePayload, ParseResponseData>('PARSE_INTERFACE', payload);
}

export function getSettings() {
  return sendCommand<undefined, SettingsResponseData>('GET_SETTINGS');
}

export function setSettings(payload: SetSettingsPayload) {
  return sendCommand<SetSettingsPayload, SettingsResponseData>('SET_SETTINGS', payload);
}

export function getHistory() {
  return sendCommand<undefined, HistoryResponseData>('GET_HISTORY');
}

export function clearCache() {
  return sendCommand<undefined, { cleared: true }>('CLEAR_CACHE');
}

export function clearHistory() {
  return sendCommand<undefined, { cleared: true }>('CLEAR_HISTORY');
}
