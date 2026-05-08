import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import type { CreateCategoryInput, UpdateCategoryInput } from "../schemas/category.schema";
import { ApiError } from "../utils/ApiError";
import { slugify } from "../utils/slugify";

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  iconUrl: true,
  thumbnailUrl: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.CategorySelect;

type CategoryRecord = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;

async function productCountByCategory(categoryIds: string[]): Promise<Map<string, number>> {
  if (categoryIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.product.groupBy({
    by: ["categoryId"],
    where: {
      categoryId: { in: categoryIds },
      isActive: true
    },
    _count: { _all: true }
  });

  return new Map(rows.map((row) => [row.categoryId, row._count._all]));
}

function withProductCount(category: CategoryRecord, counts: Map<string, number>) {
  return {
    ...category,
    productCount: counts.get(category.id) ?? 0
  };
}

function publicCategoryWithProductCount(category: CategoryRecord, counts: Map<string, number>) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    iconUrl: category.iconUrl,
    thumbnailUrl: category.thumbnailUrl,
    displayOrder: category.displayOrder,
    productCount: counts.get(category.id) ?? 0
  };
}

async function assertUniqueName(name: string, excludeId?: string): Promise<void> {
  const existing = await prisma.category.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {})
    },
    select: { id: true }
  });

  if (existing) {
    throw new ApiError(409, "CATEGORY_NAME_EXISTS", "Tên danh mục đã tồn tại");
  }
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(name) || "category";
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.category.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {})
      },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function defaultDisplayOrder(): Promise<number> {
  const result = await prisma.category.aggregate({
    _max: { displayOrder: true }
  });

  return (result._max.displayOrder ?? 0) + 1;
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: categorySelect
  });
  const counts = await productCountByCategory(categories.map((category) => category.id));

  return categories.map((category) => publicCategoryWithProductCount(category, counts));
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: categorySelect
  });

  if (!category) {
    throw new ApiError(404, "CATEGORY_NOT_FOUND", "Danh mục không tồn tại");
  }

  const counts = await productCountByCategory([category.id]);

  return withProductCount(category, counts);
}

export async function createCategory(input: CreateCategoryInput) {
  await assertUniqueName(input.name);

  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug: await generateUniqueSlug(input.name),
      description: input.description,
      iconUrl: input.iconUrl,
      thumbnailUrl: input.thumbnailUrl,
      displayOrder: input.displayOrder ?? (await defaultDisplayOrder())
    },
    select: categorySelect
  });

  return withProductCount(category, new Map());
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true }
  });

  if (!existing) {
    throw new ApiError(404, "CATEGORY_NOT_FOUND", "Danh mục không tồn tại");
  }

  const data: Prisma.CategoryUpdateInput = {};

  if (input.name !== undefined) {
    await assertUniqueName(input.name, categoryId);
    data.name = input.name;
    data.slug = await generateUniqueSlug(input.name, categoryId);
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.iconUrl !== undefined) {
    data.iconUrl = input.iconUrl;
  }

  if (input.thumbnailUrl !== undefined) {
    data.thumbnailUrl = input.thumbnailUrl;
  }

  if (input.displayOrder !== undefined) {
    data.displayOrder = input.displayOrder;
  }

  const category = await prisma.category.update({
    where: { id: categoryId },
    data,
    select: categorySelect
  });
  const counts = await productCountByCategory([category.id]);

  return withProductCount(category, counts);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true }
  });

  if (!category) {
    throw new ApiError(404, "CATEGORY_NOT_FOUND", "Danh mục không tồn tại");
  }

  const activeProductCount = await prisma.product.count({
    where: {
      categoryId,
      isActive: true
    }
  });

  if (activeProductCount > 0) {
    throw new ApiError(409, "CATEGORY_HAS_PRODUCTS", "Còn sản phẩm active thuộc danh mục");
  }

  await prisma.category.delete({ where: { id: categoryId } });
}
