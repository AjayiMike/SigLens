import { NetworkError } from '@/errors/app-errors';

interface RequestOptions {
  timeoutMs?: number;
  retries?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 5000;
  const retries = options.retries ?? 1;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new NetworkError(`Request failed with status ${response.status}`, response.status);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (attempt >= retries) {
        if (error instanceof Error) {
          throw new NetworkError(error.message);
        }

        throw new NetworkError('Unknown network error.');
      }

      const jitter = Math.floor(Math.random() * 120);
      const backoff = Math.pow(2, attempt) * 250 + jitter;
      await sleep(backoff);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new NetworkError('Network request failed after retries.');
}
