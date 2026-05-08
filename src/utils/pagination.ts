import type { PaginationMeta } from "./response";

interface PaginationQuery {
  page?: unknown;
  limit?: unknown;
}

export function parsePaginationQuery(query: unknown): { page: number; limit: number; skip: number } {
  const { page: rawPage, limit: rawLimit } = (query ?? {}) as PaginationQuery;
  const page = Math.max(Number.parseInt(String(rawPage ?? "1"), 10) || 1, 1);
  const parsedLimit = Number.parseInt(String(rawLimit ?? "12"), 10) || 12;
  const limit = Math.min(Math.max(parsedLimit, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}
