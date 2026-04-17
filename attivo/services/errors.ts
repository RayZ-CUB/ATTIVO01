export class ServiceError extends Error {
  constructor(
    message: string,
    public code:
      | 'NOT_FOUND'
      | 'UNAUTHORIZED'
      | 'VALIDATION'
      | 'NETWORK'
      | 'RATE_LIMIT'
      | 'SERVER_ERROR'
      | 'UNKNOWN',
    public statusCode?: number,
    public retryable: boolean = false,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  isRetryable(): boolean {
    return this.retryable || this.code === 'NETWORK' || this.code === 'RATE_LIMIT';
  }

  getUserMessage(): string {
    const messages: Record<string, string> = {
      NOT_FOUND: 'The requested resource was not found',
      UNAUTHORIZED: 'You are not authorized to perform this action',
      VALIDATION: 'Please check your input and try again',
      NETWORK: 'Network connection issue. Please check your internet',
      RATE_LIMIT: 'Too many requests. Please wait a moment',
      SERVER_ERROR: 'Server error. Please try again later',
      UNKNOWN: 'An unexpected error occurred',
    };
    return messages[this.code] || this.message;
  }
}

export function mapSupabaseError(error: any): ServiceError {
  if (!error) return new ServiceError('Unknown error', 'UNKNOWN');

  const message = error.message || 'Unknown error';
  const code = error.code || '';

  if (code === 'PGRST116' || message.includes('not found')) {
    return new ServiceError(message, 'NOT_FOUND', 404);
  }
  if (code === '42501' || message.includes('permission') || message.includes('policy')) {
    return new ServiceError(message, 'UNAUTHORIZED', 403);
  }
  if (message.includes('network') || message.includes('fetch')) {
    return new ServiceError(message, 'NETWORK', 0, true);
  }
  if (message.includes('duplicate') || message.includes('unique')) {
    return new ServiceError(message, 'VALIDATION', 409);
  }

  return new ServiceError(message, 'UNKNOWN', 500, false, error);
}
