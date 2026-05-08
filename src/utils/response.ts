import type { Response } from "express";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data
  });
}

export function sendPaginated<T>(res: Response, data: T[], meta: PaginationMeta): void {
  res.status(200).json({
    success: true,
    data,
    meta
  });
}
