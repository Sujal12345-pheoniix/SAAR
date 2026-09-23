/**
 * Generic response shapes shared across all SAAR API endpoints.
 */

/** Opaque cursor value used for keyset pagination. */
export type Cursor = string;

/** Query parameters accepted by any paginated endpoint. */
export interface PaginationQuery {
  /** Maximum number of items to return (server enforces an upper bound). */
  limit?: number;
  /** Opaque cursor from the previous page's `page.nextCursor`. */
  cursor?: Cursor;
}

/** Page metadata returned alongside every paginated list. */
export interface PageInfo {
  /** Cursor to pass as `cursor` on the next request, or `null` when exhausted. */
  nextCursor: string | null;
  /** `true` when at least one more page is available. */
  hasMore: boolean;
}

/** Standard wrapper for paginated list responses. */
export interface PaginatedResponse<T> {
  data: T[];
  page: PageInfo;
}

/** Standard wrapper for single-resource responses. */
export interface ApiResponse<T> {
  data: T;
}
