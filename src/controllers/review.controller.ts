import type { Request, Response } from "express";

import type { AdminReplyInput, CreateReviewInput, UpdateReviewInput, UpdateReviewStatusInput } from "../schemas/review.schema";
import * as reviewService from "../services/review.service";
import { ApiError } from "../utils/ApiError";
import { sendPaginated, sendSuccess } from "../utils/response";

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, "AUTH_TOKEN_MISSING", "Không có access token");
  }

  return req.user.id;
}

export async function listProductReviews(req: Request, res: Response): Promise<void> {
  const result = await reviewService.listProductReviews(req.params.productId, req.query, req.user?.id, req.user?.role === "ADMIN");

  sendPaginated(res, result.data, result.meta);
}

export async function createReview(req: Request, res: Response): Promise<void> {
  const review = await reviewService.createReview(req.params.productId, requireUserId(req), req.body as CreateReviewInput);

  sendSuccess(res, review, 201);
}

export async function updateReview(req: Request, res: Response): Promise<void> {
  const review = await reviewService.updateReview(req.params.productId, req.params.reviewId, requireUserId(req), req.body as UpdateReviewInput);

  sendSuccess(res, review);
}

export async function deleteReview(req: Request, res: Response): Promise<void> {
  await reviewService.deleteReview(req.params.productId, req.params.reviewId);

  res.status(204).send();
}

export async function toggleHelpful(req: Request, res: Response): Promise<void> {
  const result = await reviewService.toggleHelpful(req.params.productId, req.params.reviewId, requireUserId(req));

  sendSuccess(res, result);
}

export async function replyToReview(req: Request, res: Response): Promise<void> {
  const review = await reviewService.replyToReview(req.params.productId, req.params.reviewId, req.body as AdminReplyInput);

  sendSuccess(res, review);
}

export async function updateReviewStatus(req: Request, res: Response): Promise<void> {
  const review = await reviewService.updateReviewStatus(req.params.productId, req.params.reviewId, req.body as UpdateReviewStatusInput);

  sendSuccess(res, review);
}

export async function listMyReviews(req: Request, res: Response): Promise<void> {
  const reviews = await reviewService.listMyReviews(requireUserId(req));

  sendSuccess(res, reviews);
}
