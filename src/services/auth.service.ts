import type { Prisma, Role, User } from "@prisma/client";

import { prisma } from "../lib/prisma";
import type { ChangePasswordInput, LoginInput, RegisterInput } from "../schemas/auth.schema";
import { ApiError } from "../utils/ApiError";
import { comparePassword, hashPassword } from "../utils/password";
import { hashToken, signAccessToken, signRefreshToken } from "../utils/jwt";

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: Role;
  createdAt?: Date;
  lastLoginAt?: Date | null;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
  user: AuthUser;
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
}

interface ProfileResult {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: Role;
  createdAt: Date;
  lastLoginAt: Date | null;
  stats: {
    totalOrders: number;
    totalDesigns: number;
    totalReviews: number;
  };
}

function publicAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
}

function parseDurationMs(value: string | undefined, fallbackMs: number): number {
  if (!value) {
    return fallbackMs;
  }

  const match = value.match(/^(\d+)([smhd])$/);

  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return amount * multipliers[unit];
}

function refreshTokenMaxAgeMs(): number {
  return parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN, REFRESH_TOKEN_DEFAULT_MAX_AGE_MS);
}

async function createRefreshToken(userId: string, tx: Prisma.TransactionClient = prisma): Promise<{ token: string; maxAgeMs: number }> {
  const token = signRefreshToken();
  const maxAgeMs = refreshTokenMaxAgeMs();

  await tx.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + maxAgeMs)
    }
  });

  return { token, maxAgeMs };
}

function accountLockedError(lockedUntil: Date): ApiError {
  const remainingSeconds = Math.max(Math.ceil((lockedUntil.getTime() - Date.now()) / 1000), 0);

  return new ApiError(403, "ACCOUNT_LOCKED", "Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần", {
    lockedUntil: lockedUntil.toISOString(),
    remainingSeconds
  });
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const email = input.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new ApiError(409, "EMAIL_ALREADY_EXISTS", "Email đã được đăng ký");
  }

  try {
    const passwordHash = await hashPassword(input.password);
    const { user, refreshToken, refreshTokenMaxAgeMs } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          displayName: input.displayName,
          role: "USER",
          isActive: true
        }
      });
      const refresh = await createRefreshToken(user.id, tx);

      return {
        user,
        refreshToken: refresh.token,
        refreshTokenMaxAgeMs: refresh.maxAgeMs
      };
    });

    return {
      accessToken: signAccessToken({ sub: user.id, role: user.role }),
      refreshToken,
      refreshTokenMaxAgeMs,
      user: publicAuthUser(user)
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && "code" in error && error.code === "P2002") {
      throw new ApiError(409, "EMAIL_ALREADY_EXISTS", "Email đã được đăng ký");
    }

    throw error;
  }
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const email = input.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng");
  }

  if (!user.isActive) {
    throw new ApiError(403, "ACCOUNT_INACTIVE", "Tài khoản đã bị vô hiệu hóa");
  }

  if (user.lockedUntil) {
    if (user.lockedUntil > new Date()) {
      throw accountLockedError(user.lockedUntil);
    }

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const lockedUntil = failedLoginAttempts >= LOCK_THRESHOLD ? new Date(Date.now() + LOCK_DURATION_MS) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts,
        lockedUntil
      }
    });

    if (lockedUntil) {
      throw accountLockedError(lockedUntil);
    }

    throw new ApiError(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng");
  }

  const { updatedUser, refreshToken, refreshTokenMaxAgeMs } = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });
    const refresh = await createRefreshToken(user.id, tx);

    return {
      updatedUser,
      refreshToken: refresh.token,
      refreshTokenMaxAgeMs: refresh.maxAgeMs
    };
  });

  return {
    accessToken: signAccessToken({ sub: updatedUser.id, role: updatedUser.role }),
    refreshToken,
    refreshTokenMaxAgeMs,
    user: publicAuthUser(updatedUser)
  };
}

export async function refresh(refreshToken: string | undefined): Promise<RefreshResult> {
  if (!refreshToken) {
    throw new ApiError(401, "REFRESH_TOKEN_MISSING", "Không có refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!storedToken) {
    throw new ApiError(401, "REFRESH_TOKEN_INVALID", "Refresh token không hợp lệ");
  }

  if (storedToken.expiresAt <= new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new ApiError(401, "REFRESH_TOKEN_EXPIRED", "Refresh token đã hết hạn");
  }

  if (!storedToken.user.isActive) {
    throw new ApiError(403, "ACCOUNT_INACTIVE", "Tài khoản đã bị vô hiệu hóa");
  }

  const rotated = await prisma.$transaction(async (tx) => {
    await tx.refreshToken.delete({ where: { id: storedToken.id } });
    return createRefreshToken(storedToken.userId, tx);
  });

  return {
    accessToken: signAccessToken({ sub: storedToken.user.id, role: storedToken.user.role }),
    refreshToken: rotated.token,
    refreshTokenMaxAgeMs: rotated.maxAgeMs
  };
}

export async function logout(userId: string, refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) {
    return;
  }

  await prisma.refreshToken.deleteMany({
    where: {
      userId,
      tokenHash: hashToken(refreshToken)
    }
  });
}

export async function getMe(userId: string): Promise<ProfileResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User không tồn tại");
  }

  const [totalOrders, totalDesigns, totalReviews] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.design.count({ where: { userId } }),
    prisma.review.count({ where: { userId } })
  ]);

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    stats: {
      totalOrders,
      totalDesigns,
      totalReviews
    }
  };
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User không tồn tại");
  }

  const currentPasswordMatches = await comparePassword(input.currentPassword, user.passwordHash);

  if (!currentPasswordMatches) {
    throw new ApiError(401, "INVALID_CURRENT_PASSWORD", "Mật khẩu hiện tại sai");
  }

  const newPasswordMatchesCurrentHash = await comparePassword(input.newPassword, user.passwordHash);

  if (newPasswordMatchesCurrentHash) {
    throw new ApiError(400, "SAME_PASSWORD", "Mật khẩu mới trùng mật khẩu cũ");
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    }),
    prisma.refreshToken.deleteMany({ where: { userId } })
  ]);

  return {
    message: "Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại trên các thiết bị khác."
  };
}
