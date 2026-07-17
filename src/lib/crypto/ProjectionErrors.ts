export class ProjectionError extends Error {
  constructor(message: string, public readonly eventId?: string) {
    super(message);
    this.name = 'ProjectionError';
  }
}

export class ProjectionGapError extends ProjectionError {
  constructor(public readonly expectedSequence: number, public readonly receivedSequence: number) {
    super(`Sequence gap detected. Expected ${expectedSequence}, received ${receivedSequence}`);
    this.name = 'ProjectionGapError';
  }
}

export class ProjectionCryptoError extends ProjectionError {
  constructor(eventId: string, message: string = 'Failed to decrypt payload') {
    super(message, eventId);
    this.name = 'ProjectionCryptoError';
  }
}

export class ProjectionValidationError extends ProjectionError {
  constructor(eventId: string, message: string) {
    super(message, eventId);
    this.name = 'ProjectionValidationError';
  }
}

export class ProjectionIdempotencyError extends ProjectionError {
  constructor(eventId: string, message: string = 'Corrupted duplicate event detected (checksum mismatch)') {
    super(message, eventId);
    this.name = 'ProjectionIdempotencyError';
  }
}

export class ProjectionReducerError extends ProjectionError {
  constructor(eventId: string, public readonly originalError: Error, public readonly isCritical: boolean) {
    super(`Reducer failed: ${originalError.message}`, eventId);
    this.name = 'ProjectionReducerError';
  }
}
