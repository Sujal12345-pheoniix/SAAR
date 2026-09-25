/**
 * @saar/contracts — barrel re-export
 *
 * Import everything from this single entry-point:
 *   import { UserStatus, ErrorCode, EventEnvelope, ... } from '@saar/contracts'
 */

// Enums
export * from './enums/index.js';

// Error shapes & codes
export * from './errors/index.js';

// Generic response wrappers
export * from './common/index.js';

// Feature-specific DTOs
export * from './auth/index.js';
export * from './users/index.js';
export * from './events/index.js';
export * from './events/schemas.js';
export * from './life-model/index.js';
