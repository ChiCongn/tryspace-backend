import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { adminUsersQuerySchema, type UpdateMeInput, type UpdateUserStatusInput } from "../schemas/user.schema";
import { ApiError } from "../utils/ApiError";
import { buildPaginationMeta, parsePaginationQuery } from "../utils/pagination";

export async function updateMe(userId: string, input: UpdateMeInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.displayName === undefined ? {} : { displayName: input.displayName }),
      ...(input.avatarUrl === undefined ? {} : { avatarUrl: input.avatarUrl })
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      updatedAt: true
    }
  });

  return user;
}

export async function getPublicProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      displayName: true,
      avatarUrl: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User không tồn tại");
  }

  const [totalReviews, totalDesigns] = await Promise.all([
    prisma.review.count({ where: { userId } }),
    prisma.design.count({ where: { userId } })
  ]);

  return {
    ...user,
    stats: {
      totalReviews,
      totalDesigns
    }
  };
}

export async function listUsers(rawQuery: unknown) {
  const { page, limit, skip } = parsePaginationQuery(rawQuery);
  const parsedQuery = adminUsersQuerySchema.parse(rawQuery ?? {});
  const where: Prisma.UserWhereInput = {};

  if (parsedQuery.search) {
    where.OR = [
      { email: { contains: parsedQuery.search, mode: "insensitive" } },
      { displayName: { contains: parsedQuery.search, mode: "insensitive" } }
    ];
  }

  if (parsedQuery.role) {
    where.role = parsedQuery.role;
  }

  if (parsedQuery.isActive !== undefined) {
    where.isActive = parsedQuery.isActive;
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      }
    })
  ]);

  return {
    data: users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      stats: {
        totalOrders: user._count.orders,
        totalReviews: user._count.reviews
      }
    })),
    meta: buildPaginationMeta(total, page, limit)
  };
}

export async function updateUserStatus(adminUserId: string, targetUserId: string, input: UpdateUserStatusInput) {
  if (adminUserId === targetUserId && !input.isActive) {
    throw new ApiError(400, "CANNOT_DEACTIVATE_SELF", "Admin không thể tự vô hiệu hóa tài khoản của chính mình");
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true }
  });

  if (!existingUser) {
    throw new ApiError(404, "USER_NOT_FOUND", "User không tồn tại");
  }

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: input.isActive },
    select: {
      id: true,
      isActive: true,
      updatedAt: true
    }
  });

  return {
    userId: user.id,
    isActive: user.isActive,
    updatedAt: user.updatedAt
  };
}
