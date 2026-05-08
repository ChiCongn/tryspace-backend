import { VariantType } from "@prisma/client";
import { z } from "zod";

function isCloudinaryUrl(value: string): boolean {
  try {
    return new URL(value).hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function isCloudinaryGlbUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname === "res.cloudinary.com" && url.pathname.toLowerCase().endsWith(".glb");
  } catch {
    return false;
  }
}

const optionalNonNegativeIntegerQuery = z
  .preprocess((value) => (value === undefined || value === "" ? undefined : value), z.coerce.number().int().min(0).optional());

const optionalBooleanQuery = z
  .preprocess((value) => (value === undefined || value === "" ? undefined : value), z.enum(["true", "false"]).optional())
  .transform((value) => (value === undefined ? undefined : value === "true"));

const cloudinaryUrlSchema = z
  .string()
  .url("URL không hợp lệ")
  .refine(isCloudinaryUrl, "URL phải thuộc domain res.cloudinary.com");

const cloudinaryGlbUrlSchema = z
  .string()
  .url("URL không hợp lệ")
  .refine(isCloudinaryGlbUrl, "Model phải là file .glb trên res.cloudinary.com");

const hexColorSchema = z.string().regex(/^#?[0-9a-fA-F]{6}$/, "Mã màu HEX không hợp lệ");

const dimensionsSchema = z
  .object({
    width: z.number().positive("Chiều rộng phải lớn hơn 0"),
    height: z.number().positive("Chiều cao phải lớn hơn 0"),
    depth: z.number().positive("Chiều sâu phải lớn hơn 0"),
    unit: z.enum(["cm", "mm"]),
    weight: z.number().positive("Cân nặng phải lớn hơn 0").optional()
  })
  .passthrough();

const productImageSchema = z.object({
  url: cloudinaryUrlSchema,
  alt: z.string().max(200, "Alt tối đa 200 ký tự").nullable().optional(),
  displayOrder: z.number().int().min(0).optional()
});

const variantTypeSchema = z
  .enum(["COLOR", "MATERIAL", "color", "material"])
  .transform((value) => value.toUpperCase() as VariantType);

const variantBodySchema = z
  .object({
    name: z.string().trim().min(1, "Tên variant là bắt buộc").max(100, "Tên variant tối đa 100 ký tự"),
    type: variantTypeSchema,
    hexColor: hexColorSchema.nullable().optional(),
    textureUrl: cloudinaryUrlSchema.nullable().optional(),
    priceAddon: z.number().int().optional(),
    isDefault: z.boolean().optional(),
    stockQuantity: z.number().int().min(0).nullable().optional()
  });

const createVariantSchema = variantBodySchema
  .refine((data) => data.type !== "COLOR" || Boolean(data.hexColor), {
    path: ["hexColor"],
    message: "Variant màu cần có hexColor"
  });

const updateVariantSchema = variantBodySchema
  .extend({
    id: z.string().min(1).optional()
  })
  .refine((data) => data.type !== "COLOR" || Boolean(data.hexColor), {
    path: ["hexColor"],
    message: "Variant màu cần có hexColor"
  });

function hasExactlyOneDefaultVariant(variants: Array<{ isDefault?: boolean }> | undefined): boolean {
  if (!variants || variants.length === 0) {
    return true;
  }

  return variants.filter((variant) => variant.isDefault === true).length === 1;
}

function hasUniqueVariantNames(variants: Array<{ name: string }> | undefined): boolean {
  if (!variants) {
    return true;
  }

  const normalizedNames = variants.map((variant) => variant.name.trim().toLowerCase());
  return new Set(normalizedNames).size === normalizedNames.length;
}

export const productListQuerySchema = z
  .object({
    search: z.string().trim().optional(),
    categoryId: z.string().trim().optional(),
    categorySlug: z.string().trim().optional(),
    minPrice: optionalNonNegativeIntegerQuery,
    maxPrice: optionalNonNegativeIntegerQuery,
    color: z.string().trim().optional(),
    material: z.string().trim().optional(),
    hasArSupport: optionalBooleanQuery,
    inStock: optionalBooleanQuery,
    tags: z.string().trim().optional(),
    sortBy: z.enum(["price", "createdAt", "rating", "popular"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(48).optional()
  })
  .refine((data) => data.minPrice === undefined || data.maxPrice === undefined || data.maxPrice >= data.minPrice, {
    path: ["maxPrice"],
    message: "maxPrice phải lớn hơn hoặc bằng minPrice"
  });

const productBodySchema = z
  .object({
    name: z.string().trim().min(2, "Tên sản phẩm phải có ít nhất 2 ký tự").max(200, "Tên sản phẩm tối đa 200 ký tự"),
    description: z.string().trim().min(10, "Mô tả phải có ít nhất 10 ký tự").max(5000, "Mô tả tối đa 5000 ký tự"),
    categoryId: z.string().min(1, "categoryId là bắt buộc"),
    basePrice: z.number().int().min(0, "basePrice phải lớn hơn hoặc bằng 0"),
    comparePrice: z.number().int().min(0).nullable().optional(),
    thumbnailUrl: cloudinaryUrlSchema,
    modelUrl: cloudinaryGlbUrlSchema.nullable().optional(),
    hasArSupport: z.boolean().optional(),
    images: z.array(productImageSchema).max(10, "Tối đa 10 ảnh").optional(),
    dimensions: dimensionsSchema,
    materials: z.array(z.string().trim().min(1).max(100)).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(10, "Tối đa 10 tags").optional(),
    stockQuantity: z.number().int().min(0).nullable().optional(),
    variants: z.array(createVariantSchema).max(20, "Tối đa 20 variants").optional()
  });

export const createProductSchema = productBodySchema
  .refine((data) => data.comparePrice == null || data.comparePrice > data.basePrice, {
    path: ["comparePrice"],
    message: "comparePrice phải lớn hơn basePrice"
  })
  .refine((data) => !data.hasArSupport || Boolean(data.modelUrl), {
    path: ["modelUrl"],
    message: "modelUrl là bắt buộc khi hasArSupport=true"
  })
  .refine((data) => hasExactlyOneDefaultVariant(data.variants), {
    path: ["variants"],
    message: "Phải có đúng 1 variant mặc định"
  })
  .refine((data) => hasUniqueVariantNames(data.variants), {
    path: ["variants"],
    message: "Tên variant không được trùng nhau trong cùng sản phẩm"
  });

export const updateProductSchema = productBodySchema
  .omit({ variants: true })
  .partial()
  .extend({
    variants: z.array(updateVariantSchema).max(20, "Tối đa 20 variants").optional()
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Cần cung cấp ít nhất một trường để cập nhật"
  })
  .refine((data) => hasExactlyOneDefaultVariant(data.variants), {
    path: ["variants"],
    message: "Phải có đúng 1 variant mặc định"
  })
  .refine((data) => hasUniqueVariantNames(data.variants), {
    path: ["variants"],
    message: "Tên variant không được trùng nhau trong cùng sản phẩm"
  });

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
