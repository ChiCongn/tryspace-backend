import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { buildPaginationMeta } from "../utils/pagination";

const SEARCH_DEFAULT_LIMIT = 12;
const SEARCH_MAX_LIMIT = 48;

const searchProductInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  variants: {
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      hexColor: true,
      textureUrl: true,
      priceAddon: true,
      isDefault: true
    }
  }
} satisfies Prisma.ProductInclude;

type SearchProduct = Prisma.ProductGetPayload<{ include: typeof searchProductInclude }>;

function parsePageLimit(query: unknown): { page: number; limit: number; skip: number } {
  const raw = (query ?? {}) as { page?: unknown; limit?: unknown };
  const page = Math.max(Number.parseInt(String(raw.page ?? "1"), 10) || 1, 1);
  const parsedLimit = Number.parseInt(String(raw.limit ?? SEARCH_DEFAULT_LIMIT), 10) || SEARCH_DEFAULT_LIMIT;
  const limit = Math.min(Math.max(parsedLimit, 1), SEARCH_MAX_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

function formatSearchProduct(product: SearchProduct) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    thumbnailUrl: product.thumbnailUrl,
    basePrice: product.basePrice,
    comparePrice: product.comparePrice,
    finalPrice: product.basePrice,
    hasArSupport: product.hasArSupport,
    averageRating: product.averageRating,
    totalReviews: product.totalReviews,
    tags: product.tags,
    variants: product.variants.map((variant) => ({
      ...variant,
      finalPrice: product.basePrice + variant.priceAddon
    }))
  };
}

export async function search(rawQuery: unknown) {
  const query = (rawQuery ?? {}) as { q?: unknown };
  const q = String(query.q ?? "").trim();
  const { page, limit, skip } = parsePageLimit(rawQuery);

  if (q.length < 2) {
    return {
      data: {
        query: q,
        products: [],
        categories: []
      },
      meta: buildPaginationMeta(0, page, limit)
    };
  }

  const [countRows, idRows, categories] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "Product" p
      WHERE p."isActive" = true
        AND to_tsvector('simple', p."name" || ' ' || p."description" || ' ' || array_to_string(p."tags", ' '))
          @@ plainto_tsquery('simple', ${q})
    `),
    prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT p."id"
      FROM "Product" p
      WHERE p."isActive" = true
        AND to_tsvector('simple', p."name" || ' ' || p."description" || ' ' || array_to_string(p."tags", ' '))
          @@ plainto_tsquery('simple', ${q})
      ORDER BY p."totalReviews" DESC, p."averageRating" DESC, p."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `),
    prisma.category.findMany({
      where: {
        name: { contains: q, mode: "insensitive" }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        }
      },
      take: 10,
      orderBy: { displayOrder: "asc" }
    })
  ]);

  const totalProducts = Number(countRows[0]?.count ?? 0);
  const ids = idRows.map((row) => row.id);
  const products = ids.length
    ? await prisma.product.findMany({
        where: { id: { in: ids } },
        include: searchProductInclude
      })
    : [];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const sortedProducts = ids.map((id) => productMap.get(id)).filter((product): product is SearchProduct => Boolean(product));
  const formattedCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    matchCount: category._count.products
  }));

  return {
    data: {
      query: q,
      products: sortedProducts.map(formatSearchProduct),
      categories: formattedCategories
    },
    meta: buildPaginationMeta(totalProducts + formattedCategories.length, page, limit)
  };
}

export async function suggestions(rawQuery: unknown) {
  const q = String(((rawQuery ?? {}) as { q?: unknown }).q ?? "").trim();

  if (q.length < 1) {
    return { suggestions: [] };
  }

  const [products, categories, tagProducts] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        name: { contains: q, mode: "insensitive" }
      },
      select: {
        name: true,
        slug: true
      },
      take: 5,
      orderBy: [{ totalReviews: "desc" }, { createdAt: "desc" }]
    }),
    prisma.category.findMany({
      where: {
        name: { contains: q, mode: "insensitive" }
      },
      select: {
        name: true,
        slug: true
      },
      take: 2,
      orderBy: { displayOrder: "asc" }
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { tags: true },
      take: 200
    })
  ]);

  const normalizedQuery = q.toLowerCase();
  const tags = Array.from(
    new Set(tagProducts.flatMap((product) => product.tags).filter((tag) => tag.toLowerCase().includes(normalizedQuery)))
  ).slice(0, 3);

  return {
    suggestions: [
      ...products.map((product) => ({ type: "product" as const, text: product.name, slug: product.slug })),
      ...categories.map((category) => ({ type: "category" as const, text: category.name, slug: category.slug })),
      ...tags.map((tag) => ({ type: "tag" as const, text: tag }))
    ].slice(0, 10)
  };
}
