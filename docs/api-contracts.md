# API Contracts

## Internal message commands

- `PING`
- `LOOKUP_SELECTOR`
- `HASH_SIGNATURE`
- `PARSE_INTERFACE`
- `GET_SETTINGS`
- `SET_SETTINGS`
- `GET_HISTORY`
- `CLEAR_CACHE`
- `CLEAR_HISTORY`

## Message envelope

```ts
interface CommandEnvelope<TPayload = unknown> {
  command: CommandName;
  payload?: TPayload;
  requestId: string;
  version: 1;
}
```

## Response

```ts
type CommandResponse<TData = unknown> =
  | { ok: true; requestId: string; data: TData }
  | {
      ok: false;
      requestId: string;
      error: {
        code: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'PROVIDER_ERROR' | 'PARSE_ERROR' | 'INTERNAL_ERROR';
        message: string;
        details?: string;
      };
    };
```
