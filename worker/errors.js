export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  constructor(details) {
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
  constructor(resource, id) {
    super(404, 'NOT_FOUND', `${resource} with id '${id}' not found`);
    this.name = 'NotFoundError';
  }
}

export class ConcurrencyConflictError extends ApiError {
  constructor(entityType, id, expectedVersion) {
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
  constructor(code, message, details) {
    super(409, code, message, details);
    this.name = 'ConflictError';
  }
}
