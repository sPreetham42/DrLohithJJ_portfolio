export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  constructor(details: unknown) {
    super(400, 'VALIDATION_ERROR', 'Request validation failed', details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Access forbidden: Email not in authorized administrator list') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id: string) {
    super(404, 'NOT_FOUND', `${resource} with id '${id}' not found`);
    this.name = 'NotFoundError';
  }
}

export class ConcurrencyConflictError extends ApiError {
  public readonly entityType: string;
  public readonly id: string;
  public readonly expectedVersion: number;

  constructor(entityType: string, id: string, expectedVersion: number) {
    super(
      409,
      'CONCURRENCY_CONFLICT',
      `Concurrency conflict on ${entityType} '${id}': expected version ${expectedVersion} does not match current database version.`,
      { entityType, id, expectedVersion }
    );
    this.name = 'ConcurrencyConflictError';
    this.entityType = entityType;
    this.id = id;
    this.expectedVersion = expectedVersion;
  }
}

export class ConflictError extends ApiError {
  constructor(code: string, message: string, details?: unknown) {
    super(409, code, message, details);
    this.name = 'ConflictError';
  }
}
