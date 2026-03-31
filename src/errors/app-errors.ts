export class ValidationError extends Error {
  public readonly details?: string;

  constructor(message: string, details?: string) {
    super(message);
    this.name = 'ValidationError';
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export class NetworkError extends Error {
  public readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'NetworkError';
    if (status !== undefined) {
      this.status = status;
    }
  }
}

export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export class DecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecodeError';
  }
}

export class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}
