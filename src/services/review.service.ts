import { Prisma, ReviewStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";
import {
  reviewListQuerySchema,
  type AdminReplyInput,
  type CreateReviewInput,
  type UpdateReviewInput,
  type UpdateReviewStatusInput
} from "../schemas/review.schema";
import { ApiError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";

const REVIEW_DEFAULT_LIMIT = 10;

const reviewInclude = {
  user: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true
    }
  },
  images: {
    orderBy: [{ displayOrder: "asc" }],
    select: {
      id: true,
      url: true,
      displayOrder: true
    }
  },
  variant: {
    select: {
      id: true,
      name: true
    }
  },
  helpfulVotes: {
    select: {
      userId: true
    }
  }
} satisfies Prisma.ReviewInclude;

type ReviewWithRelations = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;

function reviewLimit(rawLimit: number | undefined): number {
  return Math.min(Math.max(rawLimit ?? REVIEW_DEFAULT_LIMIT, 1), 100);
}

function formatReview(review: ReviewWithRelations, currentUserId?: string | null) {
  return {
    id: review.id,
    user: review.user,
    rating: review.rating,
    title: review.title,
    body: review.body,
    images: review.images,
    variantUsed: review.variant,
    helpfulCount: review.helpfulCount,
    isHelpful: currentUserId ? review.helpfulVotes.some((vote) => vote.userId === currentUserId) : null,
    adminReply: review.adminReply
      ? {
          body: review.adminReply,
          repliedAt: review.adminRepliedAt
        }
      : null,
    status: review.status,
    rejectionReason: review.rejectionReason,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    isEdited: review.isEdited
  };
}

function reviewOrderBy(sortBy: string | undefined, sortOrder: string | undefined): Prisma.ReviewOrderByWithRelationInput[] {
  const direction = sortOrder ?? "desc";

  switch (sortBy) {
    case "createdAt":
      return [{ createdAt: direction as Prisma.SortOrder }];
    case "rating":
      return [{ rating: direction as Prisma.SortOrder }, { createdAt: "desc" }];
    case "helpful":
    default:
      return [{ helpfulCount: direction as Prisma.SortOrder }, { createdAt: "desc" }];
  }
}

async function ensureProductExists(productId: string, requireActive = true): Promise<void> {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      ...(requireActive ? { isActive: true } : {})
    },
    select: { id: true }
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại");
  }
}

async function ensureVariantBelongsToProduct(productId: string, variantId: string | null | undefined): Promise<void> {
  if (!variantId) {
    return;
  }

  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId
    },
    select: { id: true }
  });

  if (!variant) {
    throw new ApiError(400, "VARIANT_NOT_FOUND", "Variant không thuộc sản phẩm này");
  }
}

export async function hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: "DELIVERED",
      items: { some: { productId } }
    }
  });

  return order !== null;
}

export async function updateProductRating(productId: string): Promise<void> {
  const result = await prisma.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { id: true }
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: result._avg.rating ?? 0,
      totalReviews: result._count.id
    }
  });
}

export async function listProductReviews(productId: string, rawQuery: unknown, currentUserId?: string | null, isAdmin = false) {
  await ensureProductExists(productId, !isAdmin);

  const query = reviewListQuerySchema.parse(rawQuery ?? {});
  const page = query.page ?? 1;
  const limit = reviewLimit(query.limit);
  const skip = (page - 1) * limit;
  const where: Prisma.ReviewWhereInput = {
    productId,
    ...(isAdmin ? {} : { status: "APPROVED" })
  };

  if (query.rating !== undefined) {
    where.rating = query.rating;
  }

  if (query.hasImages !== undefined) {
    where.images = query.hasImages ? { some: {} } : { none: {} };
  }

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: reviewOrderBy(query.sortBy, query.sortOrder),
      skip,
      take: limit
    })
  ]);

  return {
    data: reviews.map((review) => formatReview(review, currentUserId)),
    meta: buildPaginationMeta(total, page, limit)
  };
}

export async function createReview(productId: string, userId: string, input: CreateReviewInput) {
  await ensureProductExists(productId, true);

  if (!(await hasUserPurchasedProduct(userId, productId))) {
    throw new ApiError(403, "REVIEW_NOT_PURCHASED", "Chỉ người đã mua sản phẩm mới có thể đánh giá");
  }

  const existingReview = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId,
        productId
      }
    },
    select: { id: true }
  });

  if (existingReview) {
    throw new ApiError(409, "REVIEW_ALREADY_EXISTS", "User đã review sản phẩm này rồi");
  }

  await ensureVariantBelongsToProduct(productId, input.variantId);

  const review = await prisma.$transaction(async (tx) => {
    const createdReview = await tx.review.create({
      data: {
        productId,
        userId,
        variantId: input.variantId,
        rating: input.rating,
        title: input.title,
        body: input.body,
        status: "APPROVED",
        images: {
          create: (input.images ?? []).map((url, index) => ({
            url,
            displayOrder: index + 1
          }))
        }
      },
      include: reviewInclude
    });

    return createdReview;
  });

  await updateProductRating(productId);

  return formatReview(review, userId);
}

async function findReviewForProduct(productId: string, reviewId: string): Promise<ReviewWithRelations> {
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      productId
    },
    include: reviewInclude
  });

  if (!review) {
    throw new ApiError(404, "REVIEW_NOT_FOUND", "Review không tồn tại");
  }

  return review;
}

export async function updateReview(productId: string, reviewId: string, userId: string, input: UpdateReviewInput) {
  const existingReview = await findReviewForProduct(productId, reviewId);

  if (existingReview.userId !== userId) {
    throw new ApiError(403, "FORBIDDEN", "Không có quyền thực hiện thao tác này");
  }

  await ensureVariantBelongsToProduct(productId, input.variantId);

  const updatedReview = await prisma.$transaction(async (tx) => {
    if (input.images !== undefined) {
      await tx.reviewImage.deleteMany({ where: { reviewId } });
      if (input.images.length > 0) {
        await tx.reviewImage.createMany({
          data: input.images.map((url, index) => ({
            reviewId,
            url,
            displayOrder: index + 1
          }))
        });
      }
    }

    return tx.review.update({
      where: { id: reviewId },
      data: {
        ...(input.rating === undefined ? {} : { rating: input.rating }),
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.body === undefined ? {} : { body: input.body }),
        ...(input.variantId === undefined ? {} : { variantId: input.variantId }),
        isEdited: true
      },
      include: reviewInclude
    });
  });

  if (existingReview.status === "APPROVED" && input.rating !== undefined && input.rating !== existingReview.rating) {
    await updateProductRating(productId);
  }

  return formatReview(updatedReview, userId);
}

export async function deleteReview(productId: string, reviewId: string): Promise<void> {
  await findReviewForProduct(productId, reviewId);

  await prisma.review.delete({ where: { id: reviewId } });
  await updateProductRating(productId);
}

export async function toggleHelpful(productId: string, reviewId: string, userId: string) {
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      productId,
      status: "APPROVED"
    },
    select: {
      id: true,
      userId: true
    }
  });

  if (!review) {
    throw new ApiError(404, "REVIEW_NOT_FOUND", "Review không tồn tại");
  }

  if (review.userId === userId) {
    throw new ApiError(400, "CANNOT_VOTE_OWN_REVIEW", "Không thể vote review của chính mình");
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingVote = await tx.helpfulVote.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId
        }
      }
    });

    if (existingVote) {
      await tx.helpfulVote.delete({ where: { id: existingVote.id } });
      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { decrement: 1 } },
        select: { helpfulCount: true }
      });

      return {
        helpfulCount: Math.max(updatedReview.helpfulCount, 0),
        isHelpful: false
      };
    }

    await tx.helpfulVote.create({
      data: {
        userId,
        reviewId
      }
    });
    const updatedReview = await tx.review.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
      select: { helpfulCount: true }
    });

    return {
      helpfulCount: updatedReview.helpfulCount,
      isHelpful: true
    };
  });

  return {
    reviewId,
    ...result
  };
}

export async function replyToReview(productId: string, reviewId: string, input: AdminReplyInput) {
  await findReviewForProduct(productId, reviewId);

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      adminReply: input.body,
      adminRepliedAt: new Date()
    },
    include: reviewInclude
  });

  return formatReview(review, null);
}

export async function updateReviewStatus(productId: string, reviewId: string, input: UpdateReviewStatusInput) {
  const existingReview = await findReviewForProduct(productId, reviewId);
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      status: input.status,
      rejectionReason: input.status === "REJECTED" ? input.reason : null
    },
    include: reviewInclude
  });

  if (existingReview.status !== input.status) {
    await updateProductRating(productId);
  }

  return formatReview(review, null);
}

export async function listMyReviews(userId: string) {
  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      ...reviewInclude,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          thumbnailUrl: true
        }
      }
    }
  });

  return reviews.map((review) => ({
    ...formatReview(review, userId),
    product: review.product
  }));
}
