import type { HistoryItem } from '@/domain/types';
import { ParseError, ProviderError, ValidationError } from '@/errors/app-errors';
import { hashEventSignature, hashFunctionSignature } from '@/features/hash/hash-service';
import { parseInterfaceToSelectors } from '@/features/interface-parser/parser';
import { LookupService } from '@/features/lookup/lookup-service';
import { HistoryStorage } from '@/infrastructure/history/historyStorage';
import type {
  CommandEnvelope,
  CommandError,
  CommandFailure,
  CommandResponse,
  CommandSuccess,
  HashSignaturePayload,
  LookupSelectorPayload,
  ParseInterfacePayload,
  SetSettingsPayload
} from '@/infrastructure/messaging/commands';
import { SettingsStorage } from '@/infrastructure/storage/settingsStorage';
import { buildHistorySummary, normalizeSelectorInput } from '@/shared/normalization';
import { interfaceInputSchema, selectorSchema } from '@/shared/validation';

const lookupService = new LookupService();
const historyStorage = new HistoryStorage();
const settingsStorage = new SettingsStorage();

function ok<TData>(requestId: string, data: TData): CommandSuccess<TData> {
  return {
    ok: true,
    requestId,
    data
  };
}

function fail(requestId: string, error: CommandError): CommandFailure {
  return {
    ok: false,
    requestId,
    error
  };
}

function toErrorPayload(error: unknown): CommandError {
  if (error instanceof ValidationError) {
    const payload: CommandError = {
      code: 'VALIDATION_ERROR',
      message: error.message
    };
    if (error.details !== undefined) {
      payload.details = error.details;
    }
    return payload;
  }

  if (error instanceof ProviderError) {
    return {
      code: 'PROVIDER_ERROR',
      message: error.message
    };
  }

  if (error instanceof ParseError) {
    return {
      code: 'PARSE_ERROR',
      message: error.message
    };
  }

  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    message: 'Unknown error.'
  };
}

async function addHistory(item: Omit<HistoryItem, 'id' | 'createdAt'>): Promise<void> {
  await historyStorage.add({
    ...item,
    id: `${item.kind}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    createdAt: Date.now()
  });
}

export async function handleCommand(envelope: CommandEnvelope): Promise<CommandResponse> {
  try {
    switch (envelope.command) {
      case 'PING': {
        return ok(envelope.requestId, { pong: true });
      }

      case 'LOOKUP_SELECTOR': {
        const payload = envelope.payload as LookupSelectorPayload | undefined;
        const parsed = selectorSchema.safeParse(payload?.selector ?? '');
        if (!parsed.success) {
          throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid selector.');
        }

        const normalized = normalizeSelectorInput(parsed.data);
        const result = await lookupService.lookup(normalized);

        const summary = buildHistorySummary(
          normalized,
          result.candidates[0]?.textSignature ?? `${result.candidates.length} candidate(s)`
        );
        await addHistory({
          kind: 'lookup',
          input: normalized,
          summary
        });

        return ok(envelope.requestId, { result });
      }

      case 'HASH_SIGNATURE': {
        const payload = envelope.payload as HashSignaturePayload | undefined;
        const signature = payload?.signature;
        const mode = payload?.mode;

        if (mode !== 'function' && mode !== 'event') {
          throw new ValidationError('Hash mode must be function or event.');
        }
        if (!signature || signature.trim().length === 0) {
          throw new ValidationError('Signature is required.');
        }

        if (mode === 'function') {
          const result = hashFunctionSignature(signature);
          await addHistory({
            kind: 'hash-function',
            input: signature,
            summary: buildHistorySummary(signature, result.selector)
          });

          return ok(envelope.requestId, {
            mode,
            result
          });
        }

        const eventResult = hashEventSignature(signature);
        await addHistory({
          kind: 'hash-event',
          input: signature,
          summary: buildHistorySummary(signature, eventResult.topicHash)
        });

        return ok(envelope.requestId, {
          mode,
          result: eventResult
        });
      }

      case 'PARSE_INTERFACE': {
        const payload = envelope.payload as ParseInterfacePayload | undefined;
        const parsed = interfaceInputSchema.safeParse(payload?.source ?? '');
        if (!parsed.success) {
          throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid interface input.');
        }

        const result = parseInterfaceToSelectors(parsed.data);
        await addHistory({
          kind: 'interface-parse',
          input: `${parsed.data.slice(0, 70)}...`,
          summary: `${result.functions.length} function selector(s)`
        });

        return ok(envelope.requestId, { result });
      }

      case 'GET_SETTINGS': {
        const settings = await settingsStorage.get();
        return ok(envelope.requestId, { settings });
      }

      case 'SET_SETTINGS': {
        const payload = envelope.payload as SetSettingsPayload | undefined;
        const settings = await settingsStorage.set(payload?.settings ?? {});
        return ok(envelope.requestId, { settings });
      }

      case 'GET_HISTORY': {
        const items = await historyStorage.list();
        return ok(envelope.requestId, { items });
      }

      case 'CLEAR_CACHE': {
        await lookupService.clearCache();
        return ok(envelope.requestId, { cleared: true });
      }

      case 'CLEAR_HISTORY': {
        await historyStorage.clear();
        return ok(envelope.requestId, { cleared: true });
      }

      default: {
        throw new ValidationError(`Unsupported command: ${String(envelope.command)}`);
      }
    }
  } catch (error) {
    return fail(envelope.requestId, toErrorPayload(error));
  }
}
