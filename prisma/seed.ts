import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";

const variantNames = ["Oak Natural", "Walnut Brown", "White"];

const categories = [
  { name: "Ghế", slug: "ghe", description: "Ghế sofa, ghế đơn, ghế ăn", displayOrder: 1 },
  { name: "Bàn", slug: "ban", description: "Bàn ăn, bàn làm việc, bàn cà phê", displayOrder: 2 },
  { name: "Kệ", slug: "ke", description: "Kệ sách, kệ tivi, kệ trang trí", displayOrder: 3 },
  { name: "Giường", slug: "giuong", description: "Giường ngủ và nội thất phòng ngủ", displayOrder: 4 },
  { name: "Đèn", slug: "den", description: "Đèn sàn, đèn bàn, đèn trang trí", displayOrder: 5 }
];

const products = [
  {
    categorySlug: "ghe",
    name: "Ghế Sofa Oslo",
    slug: "ghe-sofa-oslo",
    description: "Ghế sofa phong cách Bắc Âu với khung gỗ chắc chắn, đệm ngồi êm và kiểu dáng gọn cho phòng khách hiện đại.",
    basePrice: 6500000,
    dimensions: { width: 180, height: 85, depth: 90, unit: "cm" },
    materials: ["Gỗ cao su", "Vải linen"],
    tags: ["sofa", "bac-au", "phong-khach"],
    stockQuantity: 18
  },
  {
    categorySlug: "ghe",
    name: "Ghế Ăn Milan",
    slug: "ghe-an-milan",
    description: "Ghế ăn lưng cong bọc nệm, chân gỗ thanh mảnh, phù hợp bàn ăn gia đình và căn hộ nhỏ.",
    basePrice: 1800000,
    dimensions: { width: 48, height: 82, depth: 52, unit: "cm" },
    materials: ["Gỗ sồi", "Nệm vải"],
    tags: ["ghe-an", "go-soi", "can-ho"],
    stockQuantity: 40
  },
  {
    categorySlug: "ghe",
    name: "Ghế Thư Giãn Hana",
    slug: "ghe-thu-gian-hana",
    description: "Ghế thư giãn dáng thấp với tay vịn rộng, thích hợp góc đọc sách hoặc ban công trong nhà.",
    basePrice: 4200000,
    dimensions: { width: 76, height: 88, depth: 82, unit: "cm" },
    materials: ["Gỗ tần bì", "Vải bố"],
    tags: ["thu-gian", "doc-sach", "vai-bo"],
    stockQuantity: 14
  },
  {
    categorySlug: "ban",
    name: "Bàn Cà Phê Kyoto",
    slug: "ban-ca-phe-kyoto",
    description: "Bàn cà phê mặt bo tròn với hộc lưu trữ nhỏ, thiết kế tối giản cho phòng khách ấm cúng.",
    basePrice: 3200000,
    dimensions: { width: 110, height: 42, depth: 60, unit: "cm" },
    materials: ["Gỗ MDF phủ veneer", "Chân thép"],
    tags: ["ban-ca-phe", "toi-gian", "phong-khach"],
    stockQuantity: 22
  },
  {
    categorySlug: "ban",
    name: "Bàn Làm Việc Sapa",
    slug: "ban-lam-viec-sapa",
    description: "Bàn làm việc có ngăn kéo và khoang đi dây, mặt bàn rộng cho laptop, màn hình và phụ kiện.",
    basePrice: 3900000,
    dimensions: { width: 140, height: 75, depth: 65, unit: "cm" },
    materials: ["Gỗ công nghiệp", "Kim loại sơn tĩnh điện"],
    tags: ["ban-lam-viec", "home-office", "ngan-keo"],
    stockQuantity: 20
  },
  {
    categorySlug: "ban",
    name: "Bàn Ăn Đà Lạt",
    slug: "ban-an-da-lat",
    description: "Bàn ăn sáu chỗ với mặt gỗ tự nhiên phủ dầu, đường nét mềm và bền cho sinh hoạt hằng ngày.",
    basePrice: 8500000,
    dimensions: { width: 180, height: 76, depth: 90, unit: "cm" },
    materials: ["Gỗ cao su ghép", "Sơn dầu tự nhiên"],
    tags: ["ban-an", "sau-cho", "go-tu-nhien"],
    stockQuantity: 10
  },
  {
    categorySlug: "ke",
    name: "Kệ Sách Bergen",
    slug: "ke-sach-bergen",
    description: "Kệ sách năm tầng với khung vững chắc, phù hợp phòng làm việc, phòng khách hoặc góc học tập.",
    basePrice: 4500000,
    dimensions: { width: 90, height: 180, depth: 34, unit: "cm" },
    materials: ["Gỗ MDF", "Thép"],
    tags: ["ke-sach", "nam-tang", "hoc-tap"],
    stockQuantity: 16
  },
  {
    categorySlug: "ke",
    name: "Kệ Tivi Nha Trang",
    slug: "ke-tivi-nha-trang",
    description: "Kệ tivi dài có cánh lùa và khoang thiết bị, giúp phòng khách gọn gàng và dễ phối nội thất.",
    basePrice: 5200000,
    dimensions: { width: 180, height: 48, depth: 42, unit: "cm" },
    materials: ["Gỗ công nghiệp", "Mây đan"],
    tags: ["ke-tivi", "canh-lua", "phong-khach"],
    stockQuantity: 12
  },
  {
    categorySlug: "ke",
    name: "Kệ Trang Trí Hội An",
    slug: "ke-trang-tri-hoi-an",
    description: "Kệ trang trí dáng mở, chia ô linh hoạt để đặt sách, bình hoa và phụ kiện trang trí.",
    basePrice: 3600000,
    dimensions: { width: 100, height: 150, depth: 32, unit: "cm" },
    materials: ["Gỗ thông", "Sơn mờ"],
    tags: ["ke-trang-tri", "chia-o", "phu-kien"],
    stockQuantity: 19
  },
  {
    categorySlug: "giuong",
    name: "Giường Ngủ Lotus",
    slug: "giuong-ngu-lotus",
    description: "Giường ngủ bọc vải đầu giường êm, khung nâng đỡ chắc chắn cho phòng ngủ yên tĩnh.",
    basePrice: 12000000,
    dimensions: { width: 180, height: 105, depth: 210, unit: "cm" },
    materials: ["Gỗ plywood", "Vải polyester"],
    tags: ["giuong-ngu", "boc-vai", "phong-ngu"],
    stockQuantity: 8
  },
  {
    categorySlug: "giuong",
    name: "Giường Gỗ Mộc Châu",
    slug: "giuong-go-moc-chau",
    description: "Giường gỗ tự nhiên với vân gỗ rõ, thiết kế bền và dễ kết hợp với nhiều phong cách phòng ngủ.",
    basePrice: 14500000,
    dimensions: { width: 180, height: 95, depth: 205, unit: "cm" },
    materials: ["Gỗ sồi", "Dầu lau gỗ"],
    tags: ["giuong-go", "go-soi", "moc"],
    stockQuantity: 6
  },
  {
    categorySlug: "giuong",
    name: "Giường Daybed An Nhiên",
    slug: "giuong-daybed-an-nhien",
    description: "Daybed đa năng dùng làm ghế nghỉ ban ngày và giường phụ, phù hợp căn hộ studio.",
    basePrice: 7800000,
    dimensions: { width: 100, height: 78, depth: 205, unit: "cm" },
    materials: ["Gỗ cao su", "Nệm vải"],
    tags: ["daybed", "studio", "da-nang"],
    stockQuantity: 11
  },
  {
    categorySlug: "den",
    name: "Đèn Sàn Aurora",
    slug: "den-san-aurora",
    description: "Đèn sàn thân mảnh với chụp vải, ánh sáng dịu cho góc sofa hoặc khu đọc sách.",
    basePrice: 2400000,
    dimensions: { width: 42, height: 158, depth: 42, unit: "cm" },
    materials: ["Thép sơn", "Vải linen"],
    tags: ["den-san", "anh-sang-diu", "doc-sach"],
    stockQuantity: 25
  },
  {
    categorySlug: "den",
    name: "Đèn Bàn Moon",
    slug: "den-ban-moon",
    description: "Đèn bàn nhỏ với ánh sáng ấm, chân gốm mờ và công tắc tiện dụng cho bàn làm việc.",
    basePrice: 1500000,
    dimensions: { width: 28, height: 45, depth: 28, unit: "cm" },
    materials: ["Gốm", "Vải"],
    tags: ["den-ban", "anh-sang-am", "home-office"],
    stockQuantity: 30
  },
  {
    categorySlug: "den",
    name: "Đèn Treo Trần Halo",
    slug: "den-treo-tran-halo",
    description: "Đèn treo trần vòng sáng hiện đại, phù hợp khu bàn ăn hoặc đảo bếp trong căn hộ mới.",
    basePrice: 5800000,
    dimensions: { width: 80, height: 120, depth: 80, unit: "cm" },
    materials: ["Nhôm", "Acrylic"],
    tags: ["den-treo", "ban-an", "hien-dai"],
    stockQuantity: 9
  }
];

function thumbnailUrl(name: string) {
  return `https://placehold.co/400x400/EDE9E0/C9714E?text=${encodeURIComponent(name)}`;
}

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@123456", 12);
  const testPasswordHash = await bcrypt.hash("Test@123456", 12);

  await prisma.$transaction([
    prisma.helpfulVote.deleteMany(),
    prisma.reviewImage.deleteMany(),
    prisma.review.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.designItem.deleteMany(),
    prisma.design.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany()
  ]);

  await prisma.user.create({
    data: {
      email: "admin@tryspace.app",
      passwordHash: adminPasswordHash,
      displayName: "TrySpace Admin",
      role: "ADMIN"
    }
  });

  const testUser = await prisma.user.create({
    data: {
      email: "test@tryspace.app",
      passwordHash: testPasswordHash,
      displayName: "TrySpace Test User",
      role: "USER"
    }
  });

  const categoryBySlug = new Map<string, string>();

  for (const category of categories) {
    const created = await prisma.category.create({ data: category });
    categoryBySlug.set(created.slug, created.id);
  }

  for (const product of products) {
    const categoryId = categoryBySlug.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Missing category for slug ${product.categorySlug}`);
    }

    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId,
        basePrice: product.basePrice,
        comparePrice: product.basePrice + 500000,
        thumbnailUrl: thumbnailUrl(product.name),
        modelUrl: null,
        hasArSupport: false,
        dimensions: product.dimensions,
        materials: product.materials,
        tags: product.tags,
        stockQuantity: product.stockQuantity,
        variants: {
          create: variantNames.map((name, index) => ({
            name,
            type: "MATERIAL",
            hexColor: index === 0 ? "#D8B98A" : index === 1 ? "#7B4A2F" : "#F7F4EF",
            textureUrl: null,
            priceAddon: index * 150000,
            isDefault: index === 0,
            stockQuantity: Math.max(product.stockQuantity - index * 2, 0)
          }))
        },
        images: {
          create: [
            {
              url: thumbnailUrl(product.name),
              alt: product.name,
              displayOrder: 1
            }
          ]
        }
      }
    });
  }

  const orderProducts = await prisma.product.findMany({
    take: 2,
    orderBy: { createdAt: "asc" },
    include: {
      variants: {
        orderBy: { createdAt: "asc" },
        take: 1
      }
    }
  });

  if (orderProducts.length < 2 || !orderProducts[0].variants[0] || !orderProducts[1].variants[0]) {
    throw new Error("Seed order requires at least two products with variants");
  }

  const orderItems = orderProducts.map((product, index) => {
    const quantity = index + 1;
    const variant = product.variants[0];
    const unitPrice = product.basePrice + variant.priceAddon;

    return {
      productId: product.id,
      variantId: variant.id,
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
      snapshot: {
        productName: product.name,
        productSlug: product.slug,
        thumbnailUrl: product.thumbnailUrl,
        variantName: variant.name,
        basePrice: product.basePrice,
        priceAddon: variant.priceAddon
      }
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  await prisma.order.create({
    data: {
      orderNumber: "TS-20260508-0001",
      userId: testUser.id,
      status: "DELIVERED",
      paymentStatus: "PAID",
      paymentMethod: "MOCK",
      shippingAddress: {
        fullName: "Nguyen Van Minh",
        phone: "0901234567",
        addressLine1: "123 Nguyen Hue",
        addressLine2: "Phuong Ben Nghe, Quan 1",
        city: "Ho Chi Minh",
        province: "Ho Chi Minh"
      },
      subtotal,
      shippingFee: 0,
      total: subtotal,
      note: "Don hang seed de test review",
      deliveredAt: new Date("2026-05-08T10:00:00.000Z"),
      items: {
        create: orderItems
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
