 
export class Logger {
  constructor(private readonly enabled: boolean = true) {}

  info(message: string, details?: unknown): void {
    if (this.enabled) {
      console.info(`[SigLens] ${message}`, details ?? '');
    }
  }

  warn(message: string, details?: unknown): void {
    if (this.enabled) {
      console.warn(`[SigLens] ${message}`, details ?? '');
    }
  }

  error(message: string, details?: unknown): void {
    console.error(`[SigLens] ${message}`, details ?? '');
  }
}
