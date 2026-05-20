import "dotenv/config";

import { Prisma, VariantType } from "@prisma/client";

import { prisma } from "../src/lib/prisma";

const chairProduct = {
  name: "Ghế Công Thái Học AeroFlex Pro",
  slug: "ghe-cong-thai-hoc-aeroflex-pro",
  description:
    "Ghế công thái học AeroFlex Pro dành cho góc làm việc tại nhà và văn phòng nhỏ. Tựa lưng lưới thoáng khí, đỡ thắt lưng điều chỉnh 3 cấp, kê tay 4D, piston nâng hạ êm và mâm ngả khóa nhiều góc giúp ngồi lâu thoải mái hơn.",
  basePrice: 6250000,
  comparePrice: 7190000,
  thumbnailUrl:
    "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=900&h=675&q=80",
  modelUrl: "/assets/seed/models/chair.gltf",
  hasArSupport: true,
  dimensions: {
    width: 68,
    height: 122,
    depth: 70,
    unit: "cm",
    seatHeight: "45-55cm",
    maxLoad: "120kg"
  } satisfies Prisma.InputJsonObject,
  materials: [
    "Lưới polyester thoáng khí",
    "Khung nylon gia cường",
    "Đệm mút đúc mật độ cao",
    "Chân hợp kim nhôm",
    "Bánh xe PU chống xước"
  ],
  tags: [
    "ghe",
    "ghe-cong-thai-hoc",
    "ergonomic",
    "home-office",
    "ar-ready",
    "aeroflex-pro"
  ],
  stockQuantity: 18,
  variants: [
    {
      name: "Đen Graphite",
      type: VariantType.COLOR,
      hexColor: "#1F2937",
      priceAddon: 0,
      isDefault: true,
      stockQuantity: 18
    },
    {
      name: "Xám Ash",
      type: VariantType.COLOR,
      hexColor: "#9CA3AF",
      priceAddon: 250000,
      isDefault: false,
      stockQuantity: 12
    },
    {
      name: "Navy Office",
      type: VariantType.COLOR,
      hexColor: "#1E3A8A",
      priceAddon: 350000,
      isDefault: false,
      stockQuantity: 8
    },
    {
      name: "Lưới tiêu chuẩn",
      type: VariantType.MATERIAL,
      priceAddon: 0,
      isDefault: false,
      stockQuantity: 18
    },
    {
      name: "Lưới premium chống bám bụi",
      type: VariantType.MATERIAL,
      priceAddon: 650000,
      isDefault: false,
      stockQuantity: 10
    }
  ],
  images: [
    {
      url: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=900&h=675&q=80",
      alt: "Ghế AeroFlex Pro trong góc làm việc",
      displayOrder: 1
    },
    {
      url: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=900&h=675&q=80",
      alt: "Chi tiết ghế làm việc hiện đại",
      displayOrder: 2
    },
    {
      url: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=900&h=675&q=80",
      alt: "Ghế trong không gian nội thất tối giản",
      displayOrder: 3
    }
  ]
} as const;

async function upsertChairCategory(): Promise<string> {
  const category = await prisma.category.upsert({
    where: { slug: "ghe" },
    update: {
      description: "Ghế ăn, ghế làm việc và ghế thư giãn",
      displayOrder: 1,
      name: "Ghế"
    },
    create: {
      name: "Ghế",
      slug: "ghe",
      description: "Ghế ăn, ghế làm việc và ghế thư giãn",
      displayOrder: 1
    },
    select: { id: true }
  });

  return category.id;
}

async function upsertDetailedChairProduct(): Promise<void> {
  const categoryId = await upsertChairCategory();
  const existingProduct = await prisma.product.findUnique({
    where: { slug: chairProduct.slug },
    select: { id: true }
  });

  if (existingProduct) {
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: existingProduct.id } }),
      prisma.productVariant.deleteMany({ where: { productId: existingProduct.id } }),
      prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          name: chairProduct.name,
          description: chairProduct.description,
          categoryId,
          basePrice: chairProduct.basePrice,
          comparePrice: chairProduct.comparePrice,
          thumbnailUrl: chairProduct.thumbnailUrl,
          modelUrl: chairProduct.modelUrl,
          hasArSupport: chairProduct.hasArSupport,
          dimensions: chairProduct.dimensions,
          materials: [...chairProduct.materials],
          tags: [...chairProduct.tags],
          stockQuantity: chairProduct.stockQuantity,
          variants: {
            create: chairProduct.variants.map((variant) => ({ ...variant }))
          },
          images: {
            create: chairProduct.images.map((image) => ({ ...image }))
          }
        }
      })
    ]);

    console.log(`Updated product: ${chairProduct.name} (${chairProduct.slug})`);
    return;
  }

  await prisma.product.create({
    data: {
      name: chairProduct.name,
      slug: chairProduct.slug,
      description: chairProduct.description,
      categoryId,
      basePrice: chairProduct.basePrice,
      comparePrice: chairProduct.comparePrice,
      thumbnailUrl: chairProduct.thumbnailUrl,
      modelUrl: chairProduct.modelUrl,
      hasArSupport: chairProduct.hasArSupport,
      dimensions: chairProduct.dimensions,
      materials: [...chairProduct.materials],
      tags: [...chairProduct.tags],
      stockQuantity: chairProduct.stockQuantity,
      variants: {
        create: chairProduct.variants.map((variant) => ({ ...variant }))
      },
      images: {
        create: chairProduct.images.map((image) => ({ ...image }))
      }
    }
  });

  console.log(`Created product: ${chairProduct.name} (${chairProduct.slug})`);
}

upsertDetailedChairProduct()
  .catch((error) => {
    console.error("Failed to upsert detailed chair product:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
