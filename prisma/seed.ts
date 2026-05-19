import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import { slugify } from "../src/utils/slugify";

// ── FEATURED PRODUCTS (12 AR-ready) ──
// 1. sofa-bang-3-cho | 2. ghe-eames-replica | 3. den-dung-arc | 4. ban-ca-phe-tron
// 5. ke-sach-5-tang | 6. ghe-van-phong-luoi | 7. ban-an-6-nguoi | 8. den-treo-tran-canh-quat
// 9. tham-tron-len | 10. tu-dau-giuong | 11. ghe-banh-doc-sach | 12. ban-lam-viec-goc-chu-l

const SEED_PASSWORD = "Password123!";
const ADMIN_PASSWORD = "Admin@2024!";
const SHIPPING_FEE = 50000;

// Vietnamese collections
const COLLECTIONS = [
  "Bắc Âu Tối Giản",
  "Nhiệt Đới Xanh",
  "Công Nghiệp Hiện Đại",
  "Cổ Điển Sang Trọng",
  "Tối Giản Nhật Bản"
];

// Real Unsplash photo IDs for furniture
const UNSPLASH_PHOTOS = {
  sofa: [
    "photo-1555041469-a586c61ea9bc", // 3-seat sofa
    "photo-1493663284031-b7e3aefcae8e", // gray sofa
    "photo-1550226891-ef816aed4a98", // modern sofa
    "photo-1616047006789-b7af5afb8c20" // leather sofa
  ],
  chair: [
    "photo-1598300042247-d088f8ab3a91", // Eames style
    "photo-1505843490538-5133c6c7d0e1", // office chair
    "photo-1567538096630-e0c55bd6374c", // armchair
    "photo-1580480055273-228ff5388ef8"  // dining chair
  ],
  table: [
    "photo-1617103996702-96e81148d8a9", // round coffee table
    "photo-1567533238-216a4f98be2e", // dining table
    "photo-1532323544230-7191fd51bc1b", // desk
    "photo-1595428774223-ef52624120d2"  // small table
  ],
  lamp: [
    "photo-1507473888900-52e1adad5cd1", // arc lamp
    "photo-1513506003901-1e6a229e2d15", // floor lamp
    "photo-1543198126-a8ad8e47fb22", // pendant light
    "photo-1565814329452-e1efa11c5b89"  // table lamp
  ],
  shelf: [
    "photo-1594620302200-9a762244a156", // bookshelf
    "photo-1595428774223-ef52624120d2", // floating shelves
    "photo-1595515106969-1ce29566ff1c", // storage unit
    "photo-1586023492125-27b2c045efd7"  // cabinet
  ],
  rug: [
    "photo-1555041469-a586c61ea9bc", // round rug
    "photo-1586023492125-27b2c045efd7", // area rug
    "photo-1555041469-a586c61ea9bc", // textured rug
    "photo-1595515106969-1ce29566ff1c"  // neutral rug
  ]
};

function unsplashImage(category: string, index: number): string {
  const photos = UNSPLASH_PHOTOS[category as keyof typeof UNSPLASH_PHOTOS] || UNSPLASH_PHOTOS.sofa;
  const photoId = photos[index % photos.length];
  return `https://images.unsplash.com/${photoId}?w=800&q=80`;
}

// Featured products with full AR support
const featuredProducts = [
  {
    name: "Sofa Băng 3 Chỗ",
    slug: "sofa-bang-3-cho",
    category: "sofa",
    description: "Sofa băng 3 chỗ thiết kế hiện đại, đệm cao su non êm ái, vải linen cao cấp breathable. Phù hợp phòng khách rộng 15-20m².",
    basePrice: 18500000,
    dimensions: { width: 220, height: 85, depth: 95, unit: "cm" },
    colors: [
      { name: "Walnut Brown", hex: "#5C3D2E", priceAddon: 0 },
      { name: "Slate Gray", hex: "#6B7280", priceAddon: 500000 },
      { name: "Cream", hex: "#F5F0E8", priceAddon: 800000 },
      { name: "Forest Green", hex: "#2D5016", priceAddon: 1200000 },
      { name: "Navy Blue", hex: "#1B3A5C", priceAddon: 1500000 }
    ],
    materials: [
      { name: "Vải thường", priceAddon: 0 },
      { name: "Vải nhung", priceAddon: 1500000 },
      { name: "Da thật", priceAddon: 5000000 }
    ],
    collection: "Bắc Âu Tối Giản",
    tags: ["sofa", "sofa-3-cho", "bac-au", "phong-khach"],
    stockQuantity: 15,
    arSupported: true,
    modelUrl: "/models/sofa-bang-3-cho.glb"
  },
  {
    name: "Ghế Eames Replica",
    slug: "ghe-eames-replica",
    category: "ghe",
    description: "Ghế Eames replica经典设计, chân gỗ sồi tự nhiên, đệm da PU cao cấp. Iconic mid-century modern cho phòng khách hoặc làm việc.",
    basePrice: 4500000,
    dimensions: { width: 65, height: 80, depth: 70, unit: "cm" },
    colors: [
      { name: "Black", hex: "#1A1A1A", priceAddon: 0 },
      { name: "Walnut", hex: "#5C3D2E", priceAddon: 300000 },
      { name: "White", hex: "#FFFFFF", priceAddon: 400000 }
    ],
    materials: [
      { name: "Da PU", priceAddon: 0 },
      { name: "Da thật", priceAddon: 3000000 }
    ],
    collection: "Cổ Điển Sang Trọng",
    tags: ["ghe", "eames", "mid-century", "phong-khach"],
    stockQuantity: 25,
    arSupported: true,
    modelUrl: "/models/ghe-eames-replica.glb"
  },
  {
    name: "Đèn Đứng Arc",
    slug: "den-dung-arc",
    category: "den",
    description: "Đèn đứng thiết kế arc độc đáo, thân thép không gỉ mạ chrome, chụp kim loại màu vàng đồng. Ánh sáng ấm E27 60W.",
    basePrice: 3200000,
    dimensions: { width: 45, height: 160, depth: 200, unit: "cm" },
    colors: [
      { name: "Chrome Gold", hex: "#D4AF37", priceAddon: 0 },
      { name: "Black Matte", hex: "#2C2C2C", priceAddon: 200000 },
      { name: "White Gloss", hex: "#FFFFFF", priceAddon: 300000 }
    ],
    materials: [
      { name: "Kim loại", priceAddon: 0 },
      { name: "Thép không gỉ", priceAddon: 800000 }
    ],
    collection: "Công Nghiệp Hiện Đại",
    tags: ["den", "den-dung", "arc", "hien-dai"],
    stockQuantity: 18,
    arSupported: true,
    modelUrl: "/models/den-dung-arc.glb"
  },
  {
    name: "Bàn Cà Phê Tròn",
    slug: "ban-ca-phe-tron",
    category: "ban",
    description: "Bàn cà phê tròn mặt đá nhân tạo vân marble, khung gỗ sồi stabilized. Đường kính 80cm, cao 42cm, phù hợp mọi phòng khách.",
    basePrice: 4200000,
    dimensions: { width: 80, height: 42, depth: 80, unit: "cm" },
    colors: [
      { name: "White Marble", hex: "#F8F8F8", priceAddon: 0 },
      { name: "Black Marble", hex: "#1C1C1C", priceAddon: 600000 },
      { name: "Oak Wood", hex: "#D4A574", priceAddon: 400000 }
    ],
    materials: [
      { name: "Đá nhân tạo", priceAddon: 0 },
      { name: "Đá tự nhiên", priceAddon: 2000000 }
    ],
    collection: "Tối Giản Nhật Bản",
    tags: ["ban", "ban-ca-phe", "tron", "marble"],
    stockQuantity: 22,
    arSupported: true,
    modelUrl: "/models/ban-ca-phe-tron.glb"
  },
  {
    name: "Kệ Sách 5 Tầng",
    slug: "ke-sach-5-tang",
    category: "ke",
    description: "Kệ sách 5 tầng gỗ sồi trắng, thiết kế Bắc Âu minimal. Kích thước 100x185x36cm, chịu lực 30kg/tầng.",
    basePrice: 5500000,
    dimensions: { width: 100, height: 185, depth: 36, unit: "cm" },
    colors: [
      { name: "Natural Oak", hex: "#D4A574", priceAddon: 0 },
      { name: "White Wash", hex: "#F5F5F0", priceAddon: 400000 },
      { name: "Walnut", hex: "#5C3D2E", priceAddon: 600000 }
    ],
    materials: [
      { name: "Gỗ sồi", priceAddon: 0 },
      { name: "Gỗ thông", priceAddon: -500000 }
    ],
    collection: "Bắc Âu Tối Giản",
    tags: ["ke", "ke-sach", "5-tang", "bac-au"],
    stockQuantity: 12,
    arSupported: true,
    modelUrl: "/models/ke-sach-5-tang.glb"
  },
  {
    name: "Ghế Văn Phòng Lưới",
    slug: "ghe-van-phong-luoi",
    category: "ghe",
    description: "Ghế văn phòng ergonomic lưới thoáng khí, tựa lưng điều chỉnh, đệm ngồi dày 8cm. Phù hợp làm việc 8-10 tiếng/ngày.",
    basePrice: 3600000,
    dimensions: { width: 66, height: 118, depth: 66, unit: "cm" },
    colors: [
      { name: "Black Mesh", hex: "#1C1C1C", priceAddon: 0 },
      { name: "Gray Mesh", hex: "#6B7280", priceAddon: 300000 },
      { name: "Blue Mesh", hex: "#1B3A5C", priceAddon: 400000 }
    ],
    materials: [
      { name: "Lưới polyester", priceAddon: 0 },
      { name: "Lưới cao cấp", priceAddon: 800000 }
    ],
    collection: "Công Nghiệp Hiện Đại",
    tags: ["ghe", "ghe-van-phong", "ergonomic", "lưới"],
    stockQuantity: 30,
    arSupported: true,
    modelUrl: "/models/ghe-van-phong-luoi.glb"
  },
  {
    name: "Bàn Ăn 6 Người",
    slug: "ban-an-6-nguoi",
    category: "ban",
    description: "Bàn ăn 6 người gỗ sồi tự nhiên, mặt dày 3cm, chân bo tròn. Kích thước 180x76x90cm, không gian 20-25m².",
    basePrice: 15800000,
    dimensions: { width: 180, height: 76, depth: 90, unit: "cm" },
    colors: [
      { name: "Natural Oak", hex: "#D4A574", priceAddon: 0 },
      { name: "Dark Walnut", hex: "#3D2914", priceAddon: 1200000 },
      { name: "White Wash", hex: "#F5F5F0", priceAddon: 800000 }
    ],
    materials: [
      { name: "Gỗ sồi Việt Nam", priceAddon: 0 },
      { name: "Gỗ sồi Mỹ", priceAddon: 3000000 }
    ],
    collection: "Tối Giản Nhật Bản",
    tags: ["ban", "ban-an", "6-nguoi", "go-soi"],
    stockQuantity: 8,
    arSupported: true,
    modelUrl: "/models/ban-an-6-nguoi.glb"
  },
  {
    name: "Đèn Treo Trần Cánh Quạt",
    slug: "den-treo-tran-canh-quat",
    category: "den",
    description: "Đèn treo trần thiết kế cánh quạt độc đáo, kim loại mạ vàng đồng, 3 ánh sáng điều chỉnh. Đường kính 60cm, dây 1.2m.",
    basePrice: 4800000,
    dimensions: { width: 60, height: 120, depth: 60, unit: "cm" },
    colors: [
      { name: "Brass Gold", hex: "#D4AF37", priceAddon: 0 },
      { name: "Chrome Silver", hex: "#C0C0C0", priceAddon: 300000 },
      { name: "Black Iron", hex: "#2C2C2C", priceAddon: 200000 }
    ],
    materials: [
      { name: "Kim loại mạ", priceAddon: 0 },
      { name: "Đồng thau", priceAddon: 1000000 }
    ],
    collection: "Cổ Điển Sang Trọng",
    tags: ["den", "den-treo", "canh-quat", "sang-trong"],
    stockQuantity: 14,
    arSupported: true,
    modelUrl: "/models/den-treo-tran-canh-quat.glb"
  },
  {
    name: "Thảm Tròn Len",
    slug: "tham-tron-len",
    category: "tham",
    description: "Thảm tròn dệt len thủ công, đường kính 150cm, đế cao su chống trượt. Màu trung tính, họa tiết geometric tinh tế.",
    basePrice: 2200000,
    dimensions: { width: 150, height: 2, depth: 150, unit: "cm" },
    colors: [
      { name: "Cream Gray", hex: "#E8E8E0", priceAddon: 0 },
      { name: "Warm Beige", hex: "#D4C4A8", priceAddon: 200000 },
      { name: "Soft Blue", hex: "#A8C8D8", priceAddon: 300000 }
    ],
    materials: [
      { name: "Len dệt", priceAddon: 0 },
      { name: "Len Merino", priceAddon: 800000 }
    ],
    collection: "Tối Giản Nhật Bản",
    tags: ["tham", "tham-tron", "len", "geometric"],
    stockQuantity: 20,
    arSupported: true,
    modelUrl: "/models/tham-tron-len.glb"
  },
  {
    name: "Tủ Đầu Giường",
    slug: "tu-dau-giuong",
    category: "tu",
    description: "Tủ đầu giường 2 ngăn kéo, chân gỗ cao, tay nắm âm. Kích thước 50x56x40cm, gỗ MDF phủ veneer sồi.",
    basePrice: 2400000,
    dimensions: { width: 50, height: 56, depth: 40, unit: "cm" },
    colors: [
      { name: "Oak Natural", hex: "#D4A574", priceAddon: 0 },
      { name: "White Matte", hex: "#F5F5F0", priceAddon: 200000 },
      { name: "Walnut", hex: "#5C3D2E", priceAddon: 400000 }
    ],
    materials: [
      { name: "MDF veneer", priceAddon: 0 },
      { name: "Gỗ sồi", priceAddon: 1500000 }
    ],
    collection: "Nhiệt Đới Xanh",
    tags: ["tu", "tu-dau-giuong", "2-ngan-keo", "phong-ngu"],
    stockQuantity: 28,
    arSupported: true,
    modelUrl: "/models/tu-dau-giuong.glb"
  },
  {
    name: "Ghế Bành Đọc Sách",
    slug: "ghe-banh-doc-sach",
    category: "ghe",
    description: "Ghế bành đọc sách bọc vải bouclé mềm, tay vịn rộng, đệm dày 12cm. Phù hợp góc đọc hoặc ban công.",
    basePrice: 6200000,
    dimensions: { width: 88, height: 86, depth: 92, unit: "cm" },
    colors: [
      { name: "Cream Bouclé", hex: "#F5F0E8", priceAddon: 0 },
      { name: "Gray Bouclé", hex: "#8B8680", priceAddon: 400000 },
      { name: "Pink Blush", hex: "#E8D0D0", priceAddon: 500000 }
    ],
    materials: [
      { name: "Vải bouclé", priceAddon: 0 },
      { name: "Vải nhung", priceAddon: 1200000 },
      { name: "Da PU", priceAddon: 1800000 }
    ],
    collection: "Bắc Âu Tối Giản",
    tags: ["ghe", "ghe-banh", "doc-sach", "boucle"],
    stockQuantity: 16,
    arSupported: true,
    modelUrl: "/models/ghe-banh-doc-sach.glb"
  },
  {
    name: "Bàn Làm Việc Góc Chữ L",
    slug: "ban-lam-viec-goc-chu-l",
    category: "ban",
    description: "Bàn làm việc góc chữ L lớn, mặt 120x160cm, khung thép sơn tĩnh điện đen. Có hộc CPU và khoang để dây.",
    basePrice: 7800000,
    dimensions: { width: 160, height: 75, depth: 120, unit: "cm" },
    colors: [
      { name: "Black Frame", hex: "#1C1C1C", priceAddon: 0 },
      { name: "White Frame", hex: "#FFFFFF", priceAddon: 300000 },
      { name: "Oak Wood", hex: "#D4A574", priceAddon: 800000 }
    ],
    materials: [
      { name: "MFC chống ẩm", priceAddon: 0 },
      { name: "Gỗ MDF veneer", priceAddon: 1500000 }
    ],
    collection: "Công Nghiệp Hiện Đại",
    tags: ["ban", "ban-lam-viec", "goc-chu-l", "home-office"],
    stockQuantity: 10,
    arSupported: true,
    modelUrl: "/models/ban-lam-viec-goc-chu-l.glb"
  }
];

// Standard products (38+ products)
const standardProducts = [
  // SOFA category (6 products)
  {
    name: "Sofa Bed Luna 2 in 1",
    slug: "sofa-bed-luna-2-in-1",
    category: "sofa",
    description: "Sofa bed chuyển đổi thành giường đơn, phù hợp căn hộ studio. Khung gỗ thông, vải nỉ polyester.",
    basePrice: 9500000,
    dimensions: { width: 180, height: 82, depth: 95, unit: "cm" },
    colors: [{ name: "Gray", hex: "#6B7280", priceAddon: 0 }],
    materials: [{ name: "Vải nỉ", priceAddon: 0 }],
    collection: "Nhiệt Đới Xanh",
    tags: ["sofa", "sofa-bed", "studio"],
    stockQuantity: 12,
    arSupported: false,
    modelUrl: null
  },
  {
    name: "Sofa Góc Milan",
    slug: "sofa-goc-milan",
    category: "sofa",
    description: "Sofa góc chữ L da PU, vị trí nằm thư giãn cho phòng khách rộng. Khung gỗ sồi, nệm cao su non.",
    basePrice: 18500000,
    dimensions: { width: 280, height: 85, depth: 180, unit: "cm" },
    colors: [{ name: "Black", hex: "#1C1C1C", priceAddon: 0 }],
    materials: [{ name: "Da PU", priceAddon: 0 }],
    collection: "Cổ Điển Sang Trọng",
    tags: ["sofa", "sofa-goc", "da-pu"],
    stockQuantity: 6,
    arSupported: false
  },
  {
    name: "Sofa Đón Khách Compact",
    slug: "sofa-don-khach-compact",
    category: "sofa",
    description: "Sofa 2 chỗ compact dáng thấp, lưng cong và vải linen. Phù hợp căn hộ nhỏ.",
    basePrice: 6800000,
    dimensions: { width: 140, height: 78, depth: 88, unit: "cm" },
    colors: [{ name: "Beige", hex: "#E8D8C8", priceAddon: 0 }],
    materials: [{ name: "Vải linen", priceAddon: 0 }],
    collection: "Tối Giản Nhật Bản",
    tags: ["sofa", "sofa-2-cho", "compact"],
    stockQuantity: 18,
    arSupported: false
  },
  {
    name: "Sofa Module Flexi",
    slug: "sofa-module-flexi",
    category: "sofa",
    description: "Sofa module tháo ghép linh hoạt, dễ đổi bố cục theo diện tích. Khung gỗ thông, vải chống bám bẩn.",
    basePrice: 22000000,
    dimensions: { width: 260, height: 82, depth: 180, unit: "cm" },
    colors: [{ name: "Green", hex: "#4A6741", priceAddon: 0 }],
    materials: [{ name: "Vải kỹ thuật", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["sofa", "sofa-module", "linh-hoat"],
    stockQuantity: 4,
    arSupported: false
  },
  {
    name: "Sofa Velvet Royal",
    slug: "sofa-velvet-royal",
    category: "sofa",
    description: "Sofa 3 chỗ bọc nhung cao cấp, chân mạ vàng đồng. Phù hợp phong cách cổ điển sang trọng.",
    basePrice: 16500000,
    dimensions: { width: 210, height: 88, depth: 92, unit: "cm" },
    colors: [{ name: "Navy Blue", hex: "#1B3A5C", priceAddon: 0 }],
    materials: [{ name: "Vải nhung", priceAddon: 0 }],
    collection: "Cổ Điển Sang Trọng",
    tags: ["sofa", "sofa-3-cho", "nhung"],
    stockQuantity: 8,
    arSupported: false
  },
  {
    name: "Sofa Scandinavian Oak",
    slug: "sofa-scandinavian-oak",
    category: "sofa",
    description: "Sofa 2 chỗ phong cách Bắc Âu, chân gỗ sồi lộ, đệm ngồi dày. Thiết kế minimal và tinh tế.",
    basePrice: 11200000,
    dimensions: { width: 150, height: 80, depth: 85, unit: "cm" },
    colors: [{ name: "Light Gray", hex: "#C0C0C0", priceAddon: 0 }],
    materials: [{ name: "Vải Canvas", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["sofa", "sofa-2-cho", "bac-au"],
    stockQuantity: 14,
    arSupported: false
  },

  // CHAIR category (8 products)
  {
    name: "Ghế Ăn Milan",
    slug: "ghe-an-milan",
    category: "ghe",
    description: "Ghế ăn lưng cong bọc nệm, chân gỗ thanh mảnh. Set 4 ghế cho bàn ăn gia đình.",
    basePrice: 1200000,
    dimensions: { width: 52, height: 85, depth: 54, unit: "cm" },
    colors: [{ name: "Natural", hex: "#D4A574", priceAddon: 0 }],
    materials: [{ name: "Gỗ sồi", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["ghe", "ghe-an", "go-soi"],
    stockQuantity: 40,
    arSupported: false
  },
  {
    name: "Ghế Bar Urban",
    slug: "ghe-bar-urban",
    category: "ghe",
    description: "Ghế bar điều chỉnh độ cao, chân thép mạ chrome và đệm da PU. Phù hợp đảo bếp.",
    basePrice: 1850000,
    dimensions: { width: 42, height: 75, depth: 42, unit: "cm" },
    colors: [{ name: "Chrome", hex: "#C0C0C0", priceAddon: 0 }],
    materials: [{ name: "Da PU", priceAddon: 0 }],
    collection: "Công Nghiệp Hiện Đại",
    tags: ["ghe", "ghe-bar", "chrome"],
    stockQuantity: 24,
    arSupported: false
  },
  {
    name: "Ghế Thư Giãn Hana",
    slug: "ghe-thu-gian-hana",
    category: "ghe",
    description: "Ghế thư giãn dáng thấp với tay vịn rộng, phù hợp góc đọc sách. Vải bố thô và gỗ tần bì.",
    basePrice: 5800000,
    dimensions: { width: 82, height: 92, depth: 88, unit: "cm" },
    colors: [{ name: "Khaki", hex: "#8B7355", priceAddon: 0 }],
    materials: [{ name: "Vải bố", priceAddon: 0 }],
    collection: "Tối Giản Nhật Bản",
    tags: ["ghe", "thu-gian", "doc-sach"],
    stockQuantity: 12,
    arSupported: false
  },
  {
    name: "Ghế Bành Cloudy",
    slug: "ghe-banh-cloudy",
    category: "ghe",
    description: "Ghế bành bo tròn với đệm dày và vải nỉ mềm. Tạo điểm nhấn ấm áp cho phòng khách.",
    basePrice: 6400000,
    dimensions: { width: 88, height: 86, depth: 92, unit: "cm" },
    colors: [{ name: "Cream", hex: "#F5F0E8", priceAddon: 0 }],
    materials: [{ name: "Vải nỉ", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["ghe", "ghe-banh", "ni"],
    stockQuantity: 10,
    arSupported: false
  },
  {
    name: "Ghế Gấp Ban Công",
    slug: "ghe-gap-ban-cong",
    category: "ghe",
    description: "Ghế gấp nhẹ, chống ẩm tốt và dễ cất gọn. Gỗ tràm xử lý ngoài trời.",
    basePrice: 1250000,
    dimensions: { width: 48, height: 82, depth: 54, unit: "cm" },
    colors: [{ name: "Natural", hex: "#8B6914", priceAddon: 0 }],
    materials: [{ name: "Gỗ tràm", priceAddon: 0 }],
    collection: "Nhiệt Đới Xanh",
    tags: ["ghe", "ghe-gap", "ban-cong"],
    stockQuantity: 35,
    arSupported: false
  },
  {
    name: "Ghế Đôn Len Moka",
    slug: "ghe-don-len-moka",
    category: "ghe",
    description: "Ghế đôn nhỏ bọc len dệt, dùng làm ghế phụ hoặc kê chân. Len dệt thủ công.",
    basePrice: 980000,
    dimensions: { width: 42, height: 44, depth: 42, unit: "cm" },
    colors: [{ name: "Brown", hex: "#6B4423", priceAddon: 0 }],
    materials: [{ name: "Len dệt", priceAddon: 0 }],
    collection: "Tối Giản Nhật Bản",
    tags: ["ghe", "ghe-don", "len"],
    stockQuantity: 28,
    arSupported: false
  },
  {
    name: "Ghế Gaming Ergonomic",
    slug: "ghe-gaming-ergonomic",
    category: "ghe",
    description: "Ghế gaming ergonomic, tựa lưng 135°, đệm ngồi cold foam. Phù hợp game thủ và làm việc lâu.",
    basePrice: 7800000,
    dimensions: { width: 70, height: 125, depth: 70, unit: "cm" },
    colors: [{ name: "Red Black", hex: "#8B0000", priceAddon: 0 }],
    materials: [{ name: "Da PU", priceAddon: 0 }],
    collection: "Công Nghiệp Hiện Đại",
    tags: ["ghe", "gaming", "ergonomic"],
    stockQuantity: 15,
    arSupported: false
  },
  {
    name: "Ghế Toppins Vintage",
    slug: "ghe-toppins-vintage",
    category: "ghe",
    description: "Ghế ăn vintage chân gỗ cong, đệm ngồi bọc vải cotton. Phong cách hoài cổ.",
    basePrice: 1650000,
    dimensions: { width: 48, height: 82, depth: 50, unit: "cm" },
    colors: [{ name: "Antique White", hex: "#F5F5DC", priceAddon: 0 }],
    materials: [{ name: "Gỗ thông", priceAddon: 0 }],
    collection: "Cổ Điển Sang Trọng",
    tags: ["ghe", "ghe-an", "vintage"],
    stockQuantity: 22,
    arSupported: false
  },

  // TABLE category (8 products)
  {
    name: "Bàn Làm Việc Sapa",
    slug: "ban-lam-viec-sapa",
    category: "ban",
    description: "Bàn làm việc 2 ngăn kéo, khoang đi dây và mặt rộng 160cm. Gỗ MDF phủ veneer sồi.",
    basePrice: 4900000,
    dimensions: { width: 160, height: 75, depth: 70, unit: "cm" },
    colors: [{ name: "Oak", hex: "#D4A574", priceAddon: 0 }],
    materials: [{ name: "MDF veneer", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["ban", "ban-lam-viec", "2-ngan-keo"],
    stockQuantity: 18,
    arSupported: false
  },
  {
    name: "Bàn Console Marble",
    slug: "ban-console-marble",
    category: "ban",
    description: "Bàn console mặt đá nhân tạo, khung thép mạ vàng. Kệ dưới để decor.",
    basePrice: 6800000,
    dimensions: { width: 140, height: 80, depth: 40, unit: "cm" },
    colors: [{ name: "Marble White", hex: "#F8F8F8", priceAddon: 0 }],
    materials: [{ name: "Đá nhân tạo", priceAddon: 0 }],
    collection: "Cổ Điển Sang Trọng",
    tags: ["ban", "ban-console", "marble"],
    stockQuantity: 10,
    arSupported: false
  },
  {
    name: "Bàn Gấp Wallie",
    slug: "ban-gap-wallie",
    category: "ban",
    description: "Bàn gấp treo tường tiết kiệm diện tích. Gỗ plywood, bản lề thép.",
    basePrice: 2200000,
    dimensions: { width: 90, height: 72, depth: 52, unit: "cm" },
    colors: [{ name: "White", hex: "#FFFFFF", priceAddon: 0 }],
    materials: [{ name: "Gỗ plywood", priceAddon: 0 }],
    collection: "Tối Giản Nhật Bản",
    tags: ["ban", "ban-gap", "treo-tuong"],
    stockQuantity: 20,
    arSupported: false
  },
  {
    name: "Bàn Góc Laptop",
    slug: "ban-goc-laptop",
    category: "ban",
    description: "Bàn góc chữ L nhỏ cho laptop, có kệ phụ và chân tăng chỉnh. MFC chống ẩm.",
    basePrice: 3400000,
    dimensions: { width: 120, height: 74, depth: 120, unit: "cm" },
    colors: [{ name: "Black", hex: "#1C1C1C", priceAddon: 0 }],
    materials: [{ name: "MFC", priceAddon: 0 }],
    collection: "Công Nghiệp Hiện Đại",
    tags: ["ban", "ban-goc", "laptop"],
    stockQuantity: 14,
    arSupported: false
  },
  {
    name: "Bàn Trà Tròn Mori",
    slug: "ban-tra-tron-mori",
    category: "ban",
    description: "Bàn trà tròn chân trụ, mặt laminate chống trầy. Đường kính 82cm, cao 40cm.",
    basePrice: 3100000,
    dimensions: { width: 82, height: 40, depth: 82, unit: "cm" },
    colors: [{ name: "White", hex: "#F5F5F0", priceAddon: 0 }],
    materials: [{ name: "MDF laminate", priceAddon: 0 }],
    collection: "Tối Giản Nhật Bản",
    tags: ["ban", "ban-tra", "tron"],
    stockQuantity: 16,
    arSupported: false
  },
  {
    name: "Băn Ăn Đà Lạt 4 Chỗ",
    slug: "ban-an-da-lat-4-cho",
    category: "ban",
    description: "Bàn ăn 4 chỗ gỗ cao su ghép, mặt dày 2.5cm. Kích thước 120x75x80cm.",
    basePrice: 7800000,
    dimensions: { width: 120, height: 75, depth: 80, unit: "cm" },
    colors: [{ name: "Natural", hex: "#8B6914", priceAddon: 0 }],
    materials: [{ name: "Gỗ cao su", priceAddon: 0 }],
    collection: "Nhiệt Đới Xanh",
    tags: ["ban", "ban-an", "4-cho"],
    stockQuantity: 12,
    arSupported: false
  },
  {
    name: "Bàn Cà Phê Kyoto",
    slug: "ban-ca-phe-kyoto",
    category: "ban",
    description: "Bàn cà phê mặt bo tròn với hộc lưu trữ nhỏ. Veneer gỗ sồi, thiết kế Nhật Bản.",
    basePrice: 4200000,
    dimensions: { width: 120, height: 45, depth: 65, unit: "cm" },
    colors: [{ name: "Natural Oak", hex: "#D4A574", priceAddon: 0 }],
    materials: [{ name: "Gỗ sồi", priceAddon: 0 }],
    collection: "Tối Giản Nhật Bản",
    tags: ["ban", "ban-ca-phe", "nhat-ban"],
    stockQuantity: 15,
    arSupported: false
  },
  {
    name: "Bàn Trang Điểm LED",
    slug: "ban-trang-diem-led",
    category: "ban",
    description: "Bàn trang điểm có gương LED và 3 ngăn kéo. MDF trắng, gương cảm ứng.",
    basePrice: 5200000,
    dimensions: { width: 100, height: 150, depth: 45, unit: "cm" },
    colors: [{ name: "White", hex: "#FFFFFF", priceAddon: 0 }],
    materials: [{ name: "MDF", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["ban", "ban-trang-diem", "led"],
    stockQuantity: 18,
    arSupported: false
  },

  // SHELVES category (5 products)
  {
    name: "Kệ Tivi Nha Trang",
    slug: "ke-tivi-nha-trang",
    category: "ke",
    description: "Kệ Tivi 180cm có cánh lùa và khoang thiết bị. Gỗ công nghiệp An Cường.",
    basePrice: 7200000,
    dimensions: { width: 180, height: 50, depth: 45, unit: "cm" },
    colors: [{ name: "White Oak", hex: "#F5F5F0", priceAddon: 0 }],
    materials: [{ name: "Gỗ công nghiệp", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["ke", "ke-tivi", "canh-lua"],
    stockQuantity: 12,
    arSupported: false
  },
  {
    name: "Kệ Trang Trí Hội An",
    slug: "ke-trang-tri-hoi-an",
    category: "ke",
    description: "Kệ trang trí dáng mở, chia ô linh hoạt. Gỗ thông sơn mờ màu kem.",
    basePrice: 4100000,
    dimensions: { width: 110, height: 160, depth: 34, unit: "cm" },
    colors: [{ name: "Cream", hex: "#F5F5DC", priceAddon: 0 }],
    materials: [{ name: "Gỗ thông", priceAddon: 0 }],
    collection: "Nhiệt Đới Xanh",
    tags: ["ke", "ke-trang-tri", "chia-o"],
    stockQuantity: 16,
    arSupported: false
  },
  {
    name: "Kệ Giày Entry Slim",
    slug: "ke-giay-entry-slim",
    category: "ke",
    description: "Kệ giày hẹp cho lối vào, chứa 12 đôi giày. Có mặt ngồi thay giày.",
    basePrice: 2800000,
    dimensions: { width: 90, height: 96, depth: 28, unit: "cm" },
    colors: [{ name: "White", hex: "#FFFFFF", priceAddon: 0 }],
    materials: [{ name: "Gỗ MDF", priceAddon: 0 }],
    collection: "Tối Giản Nhật Bản",
    tags: ["ke", "ke-giay", "slim"],
    stockQuantity: 20,
    arSupported: false
  },
  {
    name: "Kệ Treo Tường Floating",
    slug: "ke-treo-tuong-floating",
    category: "ke",
    description: "Bộ ba kệ treo tường gỗ sồi, ẩn pát treo. Phù hợp trưng bày khung ảnh.",
    basePrice: 1650000,
    dimensions: { width: 80, height: 6, depth: 22, unit: "cm" },
    colors: [{ name: "Oak", hex: "#D4A574", priceAddon: 0 }],
    materials: [{ name: "Gỗ sồi", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["ke", "ke-treo-tuong", "floating"],
    stockQuantity: 30,
    arSupported: false
  },
  {
    name: "Kệ Bếp Mini Pantry",
    slug: "ke-bep-mini-pantry",
    category: "ke",
    description: "Kệ bếp mini có bánh xe, dùng cho gia vị và đồ khô. Thép sơn tĩnh điện.",
    basePrice: 1950000,
    dimensions: { width: 62, height: 88, depth: 34, unit: "cm" },
    colors: [{ name: "Black", hex: "#1C1C1C", priceAddon: 0 }],
    materials: [{ name: "Thép sơn", priceAddon: 0 }],
    collection: "Công Nghiệp Hiện Đại",
    tags: ["ke", "ke-bep", "banh-xe"],
    stockQuantity: 22,
    arSupported: false
  },

  // LAMP category (5 products)
  {
    name: "Đèn Sàn Aurora",
    slug: "den-san-aurora",
    category: "den",
    description: "Đèn sàn thân mảnh với chụp vải linen trắng. Ánh sáng ấm cho góc sofa.",
    basePrice: 3200000,
    dimensions: { width: 45, height: 160, depth: 45, unit: "cm" },
    colors: [{ name: "White", hex: "#FFFFFF", priceAddon: 0 }],
    materials: [{ name: "Vải linen", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["den", "den-san", "linen"],
    stockQuantity: 18,
    arSupported: false
  },
  {
    name: "Đèn Bàn Moon Ceramic",
    slug: "den-ban-moon-ceramic",
    category: "den",
    description: "Đèn bàn nhỏ ánh sáng ấm, chân gốm mờ. Công tắc chân tiện dụng.",
    basePrice: 1850000,
    dimensions: { width: 30, height: 48, depth: 30, unit: "cm" },
    colors: [{ name: "Cream", hex: "#F5F5DC", priceAddon: 0 }],
    materials: [{ name: "Gốm", priceAddon: 0 }],
    collection: "Tối Giản Nhật Bản",
    tags: ["den", "den-ban", "ceramic"],
    stockQuantity: 25,
    arSupported: false
  },
  {
    name: "Đèn Treo Trần Halo",
    slug: "den-treo-tran-halo",
    category: "den",
    description: "Đèn treo trần vòng sáng hiện đại, phù hợp bàn ăn. Nhôm mạ vàng đồng.",
    basePrice: 6800000,
    dimensions: { width: 80, height: 120, depth: 80, unit: "cm" },
    colors: [{ name: "Gold", hex: "#D4AF37", priceAddon: 0 }],
    materials: [{ name: "Kim loại", priceAddon: 0 }],
    collection: "Cổ Điển Sang Trọng",
    tags: ["den", "den-treo", "led"],
    stockQuantity: 8,
    arSupported: false
  },
  {
    name: "Đèn Tường Arc Brass",
    slug: "den-tuong-arc-brass",
    category: "den",
    description: "Đèn tường tay cong màu brass, chiếu sáng nhẹ cho hành lang. LED 5W.",
    basePrice: 2250000,
    dimensions: { width: 18, height: 42, depth: 28, unit: "cm" },
    colors: [{ name: "Brass", hex: "#D4AF37", priceAddon: 0 }],
    materials: [{ name: "Thép mạ", priceAddon: 0 }],
    collection: "Cổ Điển Sang Trọng",
    tags: ["den", "den-tuong", "brass"],
    stockQuantity: 20,
    arSupported: false
  },
  {
    name: "Đèn Ngủ Nấm Pastel",
    slug: "den-ngu-nam-pastel",
    category: "den",
    description: "Đèn ngủ dáng nấm, ánh sáng dịu và dimmer cảm ứng. LED sạc USB-C.",
    basePrice: 1280000,
    dimensions: { width: 22, height: 32, depth: 22, unit: "cm" },
    colors: [{ name: "Pastel Pink", hex: "#FFB6C1", priceAddon: 0 }],
    materials: [{ name: "Silicone", priceAddon: 0 }],
    collection: "Tối Giản Nhật Bản",
    tags: ["den", "den-ngu", "pastel"],
    stockQuantity: 35,
    arSupported: false
  },

  // OTHER category (8+ products)
  {
    name: "Tủ Quần Áo Hinge",
    slug: "tu-quan-ao-hinge",
    category: "tu",
    description: "Tủ quần áo 3 cánh với gương toàn thân, ngăn kéo và khoan treo rộng. Gỗ MDF.",
    basePrice: 11200000,
    dimensions: { width: 180, height: 220, depth: 60, unit: "cm" },
    colors: [{ name: "White", hex: "#FFFFFF", priceAddon: 0 }],
    materials: [{ name: "Gỗ MDF", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["tu", "tu-quan-ao", "3-canh"],
    stockQuantity: 8,
    arSupported: false
  },
  {
    name: "Tủ Giày Slipper",
    slug: "tu-giay-slipper",
    category: "tu",
    description: "Tủ giày thông minh 5 tầng, cánh kính trong và mặt đá decor.",
    basePrice: 3200000,
    dimensions: { width: 80, height: 110, depth: 25, unit: "cm" },
    colors: [{ name: "White", hex: "#FFFFFF", priceAddon: 0 }],
    materials: [{ name: "Gỗ MDF", priceAddon: 0 }],
    collection: "Tối Giản Nhật Bản",
    tags: ["tu", "tu-giay", "kinh"],
    stockQuantity: 15,
    arSupported: false
  },
  {
    name: "Tủ Buffet Saigon",
    slug: "tu-buffet-saigon",
    category: "tu",
    description: "Tủ buffet phòng ăn có cánh lùa, khoan chai ly và mặt rộng decor.",
    basePrice: 9700000,
    dimensions: { width: 160, height: 86, depth: 45, unit: "cm" },
    colors: [{ name: "Walnut", hex: "#5C3D2E", priceAddon: 0 }],
    materials: [{ name: "Gỗ sồi", priceAddon: 0 }],
    collection: "Nhiệt Đới Xanh",
    tags: ["tu", "tu-buffet", "phong-an"],
    stockQuantity: 7,
    arSupported: false
  },
  {
    name: "Tủ Hồ Sơ Office",
    slug: "tu-ho-so-office",
    category: "tu",
    description: "Tủ hồ sơ 3 ngăn khóa riêng, phù hợp home office. Thép sơn tĩnh điện.",
    basePrice: 3600000,
    dimensions: { width: 80, height: 120, depth: 42, unit: "cm" },
    colors: [{ name: "Gray", hex: "#6B7280", priceAddon: 0 }],
    materials: [{ name: "Thép sơn", priceAddon: 0 }],
    collection: "Công Nghiệp Hiện Đại",
    tags: ["tu", "tu-ho-so", "van-phong"],
    stockQuantity: 12,
    arSupported: false
  },
  {
    name: "Giường Ngủ Lotus",
    slug: "giuong-ngu-lotus",
    category: "giuong",
    description: "Giường king size bọc vải nỉ êm ái, đầu giường cao. Khung plywood chắc chắn.",
    basePrice: 15800000,
    dimensions: { width: 180, height: 110, depth: 200, unit: "cm" },
    colors: [{ name: "Gray", hex: "#6B7280", priceAddon: 0 }],
    materials: [{ name: "Vải nỉ", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["giuong", "king-size", "ni"],
    stockQuantity: 5,
    arSupported: false
  },
  {
    name: "Giường Gỗ Mộc Châu",
    slug: "giuong-go-moc-chau",
    category: "giuong",
    description: "Giường queen size gỗ tự nhiên, vân gỗ rõ và xử lý chống mối mọt. Gỗ sồi VN.",
    basePrice: 18500000,
    dimensions: { width: 160, height: 95, depth: 200, unit: "cm" },
    colors: [{ name: "Natural Oak", hex: "#D4A574", priceAddon: 0 }],
    materials: [{ name: "Gỗ sồi", priceAddon: 0 }],
    collection: "Tối Giản Nhật Bản",
    tags: ["giuong", "go-soi", "queen-size"],
    stockQuantity: 4,
    arSupported: false
  },
  {
    name: "Thảm Lông Mịn Cloud",
    slug: "tham-long-min-cloud",
    category: "tham",
    description: "Thảm lông mịn màu trung tính, đế chống trượt. 160x230cm, phù hợp phòng khách.",
    basePrice: 2850000,
    dimensions: { width: 160, height: 2, depth: 230, unit: "cm" },
    colors: [{ name: "Cream Gray", hex: "#E8E8E0", priceAddon: 0 }],
    materials: [{ name: "Polyester", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["tham", "tham-long", "phong-khach"],
    stockQuantity: 15,
    arSupported: false
  },
  {
    name: "Thảm Jute Eco Round",
    slug: "tham-jute-eco-round",
    category: "tham",
    description: "Thảm tròn dệt từ sợi jute tự nhiên, hợp phong cách mộc. Đường kính 150cm.",
    basePrice: 1950000,
    dimensions: { width: 150, height: 1, depth: 150, unit: "cm" },
    colors: [{ name: "Natural Jute", hex: "#8B7355", priceAddon: 0 }],
    materials: [{ name: "Jute", priceAddon: 0 }],
    collection: "Nhiệt Đới Xanh",
    tags: ["tham", "tham-jute", "eco"],
    stockQuantity: 18,
    arSupported: false
  },
  {
    name: "Bình Gốm Sương Mai",
    slug: "binh-gom-suong-mai",
    category: "trang-tri",
    description: "Bình gốm thủ công men mờ, dáng cao thanh lịch. Để cắm hoa khô hoặc decor.",
    basePrice: 1250000,
    dimensions: { width: 22, height: 48, depth: 22, unit: "cm" },
    colors: [{ name: "Matte White", hex: "#F5F5F0", priceAddon: 0 }],
    materials: [{ name: "Gốm", priceAddon: 0 }],
    collection: "Tối Giản Nhật Bản",
    tags: ["trang-tri", "binh-gom", "thu-cong"],
    stockQuantity: 25,
    arSupported: false
  },
  {
    name: "Đồng Hồ Tường Minimal",
    slug: "dong-ho-tuong-minimal",
    category: "trang-tri",
    description: "Đồng hồ tường tối giản, kim trôi êm. Mặt số rõ cho phòng khách hoặc bếp.",
    basePrice: 920000,
    dimensions: { width: 34, height: 34, depth: 4, unit: "cm" },
    colors: [{ name: "White", hex: "#FFFFFF", priceAddon: 0 }],
    materials: [{ name: "Gỗ MDF", priceAddon: 0 }],
    collection: "Bắc Âu Tối Giản",
    tags: ["trang-tri", "dong-ho", "minimal"],
    stockQuantity: 30,
    arSupported: false
  },
  {
    name: "Gương Trang Điểm LED",
    slug: "guong-trang-diem-led",
    category: "ban-trang-diem",
    description: "Gương trang điểm LED thông minh 3 chế độ sáng, cảm ứng chạm. Khung nhôm.",
    basePrice: 2100000,
    dimensions: { width: 60, height: 70, depth: 15, unit: "cm" },
    colors: [{ name: "White", hex: "#FFFFFF", priceAddon: 0 }],
    materials: [{ name: "Gương LED", priceAddon: 0 }],
    collection: "Công Nghiệp Hiện Đại",
    tags: ["guong", "led", "smart"],
    stockQuantity: 20,
    arSupported: false
  },
  {
    name: "Màn Cửa Bamboo",
    slug: "man-cua-bamboo",
    category: "trang-tri",
    description: "Màn cửa tre mây bamboo dệt thủ công. Chiều dài 2m, rộng 1m, tạo privacy mềm mại.",
    basePrice: 1450000,
    dimensions: { width: 100, height: 200, depth: 2, unit: "cm" },
    colors: [{ name: "Natural Bamboo", hex: "#C4A77D", priceAddon: 0 }],
    materials: [{ name: "Tre", priceAddon: 0 }],
    collection: "Nhiệt Đới Xanh",
    tags: ["trang-tri", "man-cua", "bamboo"],
    stockQuantity: 22,
    arSupported: false
  }
];

// Vietnamese addresses
const addresses = {
  an: {
    fullName: "Nguyễn Văn An",
    phone: "0901234567",
    addressLine1: "123 Nguyễn Huệ",
    addressLine2: "Phường Bến Nghé, Quận 1",
    city: "Quận 1",
    province: "Hồ Chí Minh"
  },
  bich: {
    fullName: "Trần Thị Bích",
    phone: "0912345678",
    addressLine1: "45 Trần Hưng Đạo",
    addressLine2: "Phường Cửa Nam, Quận Hoàn Kiếm",
    city: "Hoàn Kiếm",
    province: "Hà Nội"
  },
  duc: {
    fullName: "Lê Minh Đức",
    phone: "0923456789",
    addressLine1: "78 Lê Lợi",
    addressLine2: "Phường 4, Quận Gò Vấp",
    city: "Gò Vấp",
    province: "Hồ Chí Minh"
  },
  hoa: {
    fullName: "Phạm Thị Hoa",
    phone: "0934567890",
    addressLine1: "56 Hai Bà Trưng",
    addressLine2: "Phường Tân Định, Quận 1",
    city: "Quận 1",
    province: "Hồ Chí Minh"
  },
  admin: {
    fullName: "TrySpace Admin",
    phone: "0945678901",
    addressLine1: "ĐHQG TP.HCM",
    addressLine2: "Phường Linh Trung, Thành phố Thủ Đức",
    city: "Thủ Đức",
    province: "Hồ Chí Minh"
  }
};

// Order definitions
const orderDefinitions = [
  // User 1 (An) - 4 DELIVERED orders
  {
    userKey: "an",
    orderNumber: "TS-SEED-20250401-0001",
    status: "DELIVERED" as const,
    paymentStatus: "PAID" as const,
    paymentMethod: "MOCK" as const,
    createdAt: new Date("2025-04-01T10:00:00.000Z"),
    deliveredAt: new Date("2025-04-05T14:30:00.000Z"),
    items: [
      { productSlug: "sofa-bang-3-cho", quantity: 1 },
      { productSlug: "ban-ca-phe-tron", quantity: 1 }
    ]
  },
  {
    userKey: "an",
    orderNumber: "TS-SEED-20250415-0002",
    status: "DELIVERED" as const,
    paymentStatus: "PAID" as const,
    paymentMethod: "MOCK" as const,
    createdAt: new Date("2025-04-15T09:00:00.000Z"),
    deliveredAt: new Date("2025-04-19T16:00:00.000Z"),
    items: [
      { productSlug: "den-dung-arc", quantity: 1 }
    ]
  },
  {
    userKey: "an",
    orderNumber: "TS-SEED-20250425-0003",
    status: "DELIVERED" as const,
    paymentStatus: "PAID" as const,
    paymentMethod: "MOCK" as const,
    createdAt: new Date("2025-04-25T11:30:00.000Z"),
    deliveredAt: new Date("2025-05-01T15:00:00.000Z"),
    items: [
      { productSlug: "ghe-eames-replica", quantity: 2 },
      { productSlug: "ban-lam-viec-goc-chu-l", quantity: 1 },
      { productSlug: "tu-dau-giuong", quantity: 1 }
    ]
  },
  {
    userKey: "an",
    orderNumber: "TS-SEED-20250509-0004",
    status: "DELIVERED" as const,
    paymentStatus: "PAID" as const,
    paymentMethod: "MOCK" as const,
    createdAt: new Date("2025-05-09T14:00:00.000Z"),
    deliveredAt: new Date("2025-05-14T17:30:00.000Z"),
    items: [
      { productSlug: "ghe-van-phong-luoi", quantity: 1 }
    ]
  },
  // User 2 (Bích) - 3 DELIVERED orders
  {
    userKey: "bich",
    orderNumber: "TS-SEED-20250320-0005",
    status: "DELIVERED" as const,
    paymentStatus: "PAID" as const,
    paymentMethod: "MOCK" as const,
    createdAt: new Date("2025-03-20T10:00:00.000Z"),
    deliveredAt: new Date("2025-03-25T14:00:00.000Z"),
    items: [
      { productSlug: "ban-an-6-nguoi", quantity: 1 },
      { productSlug: "ghe-eames-replica", quantity: 6 }
    ]
  },
  {
    userKey: "bich",
    orderNumber: "TS-SEED-20250424-0006",
    status: "DELIVERED" as const,
    paymentStatus: "PAID" as const,
    paymentMethod: "MOCK" as const,
    createdAt: new Date("2025-04-24T11:00:00.000Z"),
    deliveredAt: new Date("2025-04-29T16:30:00.000Z"),
    items: [
      { productSlug: "den-treo-tran-canh-quat", quantity: 1 },
      { productSlug: "tham-tron-len", quantity: 1 }
    ]
  },
  {
    userKey: "bich",
    orderNumber: "TS-SEED-20250504-0007",
    status: "DELIVERED" as const,
    paymentStatus: "PAID" as const,
    paymentMethod: "MOCK" as const,
    createdAt: new Date("2025-05-04T15:30:00.000Z"),
    deliveredAt: new Date("2025-05-09T18:00:00.000Z"),
    items: [
      { productSlug: "sofa-bang-3-cho", quantity: 1 },
      { productSlug: "ke-sach-5-tang", quantity: 1 }
    ]
  },
  // User 3 (Đức) - 2 PENDING orders (no reviews)
  {
    userKey: "duc",
    orderNumber: "TS-SEED-20250517-0008",
    status: "PENDING_PAYMENT" as const,
    paymentStatus: "PENDING" as const,
    paymentMethod: "MOCK" as const,
    createdAt: new Date("2025-05-17T10:00:00.000Z"),
    items: [
      { productSlug: "ghe-banh-doc-sach", quantity: 1 }
    ]
  },
  {
    userKey: "duc",
    orderNumber: "TS-SEED-20250518-0009",
    status: "PENDING_PAYMENT" as const,
    paymentStatus: "PENDING" as const,
    paymentMethod: "COD" as const,
    createdAt: new Date("2025-05-18T14:30:00.000Z"),
    items: [
      { productSlug: "den-ban-moon-ceramic", quantity: 2 },
      { productSlug: "tham-jute-eco-round", quantity: 1 }
    ]
  }
];

// Review templates in Vietnamese
const reviewTemplates = {
  sofa: [
    "Sofa rất thoải mái, chất liệu vải mịn và dày dặn. Giao hàng nhanh, đóng gói cẩn thận.",
    "Sofa đẹp hơn ảnh minh họa, màu sắc trung tính dễ phối nội thất. Nệm êm, ngồi lâu không mỏi.",
    "Chất lượng tốt, khung gỗ chắc chắn. Vải dễ vệ sinh và không bị bám bụi. Rất hài lòng!"
  ],
  chair: [
    "Ghế ngồi êm ái, tựa lưng đỡ cột sống tốt. Điểm cộng là dễ điều chỉnh độ cao.",
    "Ghế rất chắc chắn, vải da mềm và không bị nóng. Phù hợp làm việc cả ngày.",
    "Thiết kế đẹp, màu sắc trang nhã. Lắp đặt đơn giản, hướng dẫn rõ ràng."
  ],
  table: [
    "Bàn rất chắc chắn, mặt đá đẹp và dễ vệ sinh. Kích thước phù hợp với không gian.",
    "Chất lượng gỗ tốt, vân rõ và tự nhiên. Đóng gói kỹ, không bị trầy xước khi vận chuyển.",
    "Bàn có thiết kế hiện đại, để đồ được nhiều. Giá thành hợp lý với chất lượng."
  ],
  lamp: [
    "Đèn sáng vừa phải, ánh sáng ấm phù hợp đọc sách. Thiết kế rất đẹp và hiện đại.",
    "Chất lượng kim loại tốt, ánh sáng không gây chói mắt. Dễ dàng thay đổi độ sáng.",
    "Đèn đóng vai trò decor rất tốt, phòng trông sang hơn hẳn. Vận hành êm ái."
  ],
  shelf: [
    "Kệ chắc chắn, chịu lực tốt và lắp đặt dễ dàng. Chỗ để đồ rộng rãi.",
    "Thiết kế tối giản nhưng rất đẹp, phù hợp nhiều phong cách nội thất.",
    "Kệ không bị rung lắc khi để đồ nặng. Giá trị với tiền bỏ ra."
  ],
  rug: [
    "Thảm mềm, không bị rụng lông. Màu sắc đẹp và trung tính.",
    "Thảm dày dặn, đế chống trượt tốt. Cảm giác đi chân rất êm.",
    "Chất liệu tốt, dễ giặt vệ sinh. Màu không bị phai sau thời gian sử dụng."
  ]
};

function getReviewTemplate(category: string): string[] {
  return reviewTemplates[category as keyof typeof reviewTemplates] || reviewTemplates.sofa;
}

async function clearExistingData(): Promise<void> {
  console.log("🗑️  Clearing existing data...");

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

  console.log("✅ Existing data cleared");
}

async function createCategories(): Promise<Map<string, string>> {
  console.log("📁 Creating categories...");

  const categories = [
    { name: "Sofa", slug: "sofa", description: "Sofa phòng khách, sofa bed và sofa module", displayOrder: 1 },
    { name: "Ghế", slug: "ghe", description: "Ghế ăn, ghế làm việc và ghế thư giãn", displayOrder: 2 },
    { name: "Bàn", slug: "ban", description: "Bàn ăn, bàn làm việc, bàn trà và bàn phụ", displayOrder: 3 },
    { name: "Kệ", slug: "ke", description: "Kệ sách, kệ tivi, kệ giày và kệ trang trí", displayOrder: 4 },
    { name: "Đèn", slug: "den", description: "Đèn sàn, đèn bàn, đèn treo và đèn trang trí", displayOrder: 5 },
    { name: "Tủ", slug: "tu", description: "Tủ quần áo, tủ giày, tủ hồ sơ và tủ buffet", displayOrder: 6 },
    { name: "Giường", slug: "giuong", description: "Giường ngủ, daybed và giường trẻ em", displayOrder: 7 },
    { name: "Thảm", slug: "tham", description: "Thảm phòng khách, thảm hành lang và thảm trang trí", displayOrder: 8 },
    { name: "Bàn trang điểm", slug: "ban-trang-diem", description: "Bàn trang điểm, gương và phụ kiện làm đẹp", displayOrder: 9 },
    { name: "Trang trí", slug: "trang-tri", description: "Bình, tranh và vật dụng trang trí nhà", displayOrder: 10 }
  ];

  const categoryMap = new Map<string, string>();

  for (const category of categories) {
    const created = await prisma.category.create({ data: category });
    categoryMap.set(created.slug, created.id);
  }

  console.log(`✅ Created ${categories.length} categories`);
  return categoryMap;
}

async function createUsers(): Promise<Map<string, string>> {
  console.log("👥 Creating users...");

  const users = [
    { key: "an", email: "an.nguyen@gmail.com", displayName: "Nguyễn Văn An", role: Role.USER, avatar: "https://i.pravatar.cc/150?u=an" },
    { key: "bich", email: "bich.tran@gmail.com", displayName: "Trần Thị Bích", role: Role.USER, avatar: "https://i.pravatar.cc/150?u=bich" },
    { key: "duc", email: "duc.le@gmail.com", displayName: "Lê Minh Đức", role: Role.USER, avatar: "https://i.pravatar.cc/150?u=duc" },
    { key: "hoa", email: "hoa.pham@gmail.com", displayName: "Phạm Thị Hoa", role: Role.USER, avatar: "https://i.pravatar.cc/150?u=hoa" },
    { key: "admin", email: "admin@tryspace.vn", displayName: "TrySpace Admin", role: Role.ADMIN, avatar: "https://i.pravatar.cc/150?u=admin" }
  ];

  const userMap = new Map<string, string>();

  for (const user of users) {
    const password = user.key === "admin" ? ADMIN_PASSWORD : SEED_PASSWORD;
    const passwordHash = await bcrypt.hash(password, 12);

    const created = await prisma.user.create({
      data: {
        email: user.email,
        passwordHash,
        displayName: user.displayName,
        avatarUrl: user.avatar,
        role: user.role
      }
    });

    userMap.set(user.key, created.id);
  }

  console.log(`✅ Created ${users.length} users`);
  return userMap;
}

async function createProducts(categoryMap: Map<string, string>): Promise<Map<string, any>> {
  console.log("🛋️  Creating products...");

  const allProducts = [...featuredProducts, ...standardProducts];
  const productMap = new Map<string, any>();

  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];
    const categoryId = categoryMap.get(product.category);

    if (!categoryId) {
      throw new Error(`Category not found: ${product.category}`);
    }

    // Generate image URLs
    const imageCount = product.arSupported ? 4 : 2;
    const images: string[] = [];
    for (let j = 0; j < imageCount; j++) {
      images.push(unsplashImage(product.category, i + j));
    }

    // Create variants (colors + materials)
    const variants: any[] = [];

    // Color variants
    for (const color of product.colors) {
      variants.push({
        name: color.name,
        type: "COLOR",
        hexColor: color.hex,
        priceAddon: color.priceAddon,
        isDefault: color.priceAddon === 0 && variants.length === 0,
        stockQuantity: product.stockQuantity
      });
    }

    // Material variants
    for (const material of product.materials) {
      variants.push({
        name: material.name,
        type: "MATERIAL",
        priceAddon: material.priceAddon,
        isDefault: material.priceAddon === 0 && variants.length === product.colors.length,
        stockQuantity: product.stockQuantity
      });
    }

    const created = await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId,
        basePrice: product.basePrice,
        comparePrice: product.basePrice + Math.floor(product.basePrice * 0.1),
        thumbnailUrl: images[0],
        modelUrl: product.modelUrl || null,
        hasArSupport: product.arSupported,
        dimensions: product.dimensions,
        materials: product.materials.map(m => m.name),
        tags: [...product.tags, product.collection],
        stockQuantity: product.stockQuantity,
        variants: {
          create: variants
        },
        images: {
          create: images.map((url, index) => ({
            url,
            alt: `${product.name} - View ${index + 1}`,
            displayOrder: index + 1
          }))
        }
      },
      include: {
        variants: true
      }
    });

    productMap.set(product.slug, created);
  }

  console.log(`✅ Created ${allProducts.length} products (${featuredProducts.length} featured AR)`);
  return productMap;
}

async function createOrders(userMap: Map<string, string>, productMap: Map<string, any>): Promise<Array<{userId: string, productId: string}>> {
  console.log("📦 Creating orders...");

  const purchasedItems: Array<{userId: string, productId: string}> = [];

  for (const orderDef of orderDefinitions) {
    const userId = userMap.get(orderDef.userKey);
    if (!userId) throw new Error(`User not found: ${orderDef.userKey}`);

    const address = addresses[orderDef.userKey as keyof typeof addresses];
    if (!address) throw new Error(`Address not found: ${orderDef.userKey}`);

    // Build order items
    const orderItems: any[] = [];
    let subtotal = 0;

    for (const item of orderDef.items) {
      const product = productMap.get(item.productSlug);
      if (!product) throw new Error(`Product not found: ${item.productSlug}`);

      // Get default color variant
      const defaultVariant = product.variants.find((v: any) => v.type === "COLOR" && v.isDefault) || product.variants[0];
      if (!defaultVariant) throw new Error(`No variants for product: ${item.productSlug}`);

      const unitPrice = product.basePrice + defaultVariant.priceAddon;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        variantId: defaultVariant.id,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        snapshot: {
          productName: product.name,
          productSlug: product.slug,
          thumbnailUrl: product.thumbnailUrl,
          variantName: defaultVariant.name,
          basePrice: product.basePrice,
          priceAddon: defaultVariant.priceAddon
        }
      });

      // Track for reviews (only delivered orders)
      if (orderDef.status === "DELIVERED") {
        purchasedItems.push({ userId, productId: product.id });
      }
    }

    const total = subtotal + SHIPPING_FEE;

    await prisma.order.create({
      data: {
        orderNumber: orderDef.orderNumber,
        userId,
        status: orderDef.status,
        paymentStatus: orderDef.paymentStatus,
        paymentMethod: orderDef.paymentMethod,
        shippingAddress: address,
        subtotal,
        shippingFee: SHIPPING_FEE,
        total,
        note: "Seed order",
        createdAt: orderDef.createdAt,
        ...(orderDef.deliveredAt && { deliveredAt: orderDef.deliveredAt }),
        items: {
          create: orderItems
        }
      }
    });
  }

  console.log(`✅ Created ${orderDefinitions.length} orders`);
  return purchasedItems;
}

async function createReviews(purchasedItems: Array<{userId: string, productId: string}>): Promise<number> {
  console.log("⭐ Creating reviews...");

  // Group by product to avoid duplicate reviews
  const reviewMap = new Map<string, string>();

  for (const item of purchasedItems) {
    const key = `${item.userId}-${item.productId}`;
    if (!reviewMap.has(key)) {
      reviewMap.set(key, item.productId);
    }
  }

  let reviewCount = 0;
  const affectedProductIds = new Set<string>();

  for (const [key, productId] of reviewMap) {
    const [userId] = key.split('-');

    // Get product details for category
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: { isDefault: true }
        },
        category: true
      }
    });

    if (!product) continue;

    // Get default variant
    const defaultVariant = product.variants.length > 0 ? product.variants[0] : null;
    const templates = getReviewTemplate(product.category.slug);
    const reviewText = templates[Math.floor(Math.random() * templates.length)];

    // Random rating 4-5 stars
    const rating = Math.random() > 0.3 ? 5 : 4;

    await prisma.review.create({
      data: {
        productId,
        userId,
        variantId: defaultVariant?.id,
        rating,
        title: `Sản phẩm tốt ${rating}/5`,
        body: reviewText,
        status: "APPROVED",
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random within last 30 days
      }
    });

    reviewCount++;
    affectedProductIds.add(productId);
  }

  // Update product ratings
  for (const productId of affectedProductIds) {
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

  console.log(`✅ Created ${reviewCount} reviews`);
  return reviewCount;
}

async function main(): Promise<void> {
  console.log("🌱 Starting TrySpace database seed...\n");

  await clearExistingData();
  const categoryMap = await createCategories();
  const userMap = await createUsers();
  const productMap = await createProducts(categoryMap);
  const purchasedItems = await createOrders(userMap, productMap);
  const reviewCount = await createReviews(purchasedItems);

  console.log("\n" + "=".repeat(50));
  console.log("✅ Seeding completed successfully!");
  console.log("=".repeat(50));
  console.log(`📊 Statistics:`);
  console.log(`   • Products: ${featuredProducts.length + standardProducts.length} (${featuredProducts.length} featured AR)`);
  console.log(`   • Categories: ${categoryMap.size}`);
  console.log(`   • Users: ${userMap.size}`);
  console.log(`   • Orders: ${orderDefinitions.length}`);
  console.log(`   • Reviews: ${reviewCount}`);
  console.log(`\n🏆 Featured AR Products:`);
  featuredProducts.forEach(p => console.log(`   • ${p.slug}`));
  console.log(`\n👤 Test Accounts:`);
  console.log(`   • an.nguyen@gmail.com / ${SEED_PASSWORD}`);
  console.log(`   • bich.tran@gmail.com / ${SEED_PASSWORD}`);
  console.log(`   • duc.le@gmail.com / ${SEED_PASSWORD}`);
  console.log(`   • hoa.pham@gmail.com / ${SEED_PASSWORD}`);
  console.log(`   • admin@tryspace.vn / ${ADMIN_PASSWORD}`);
  console.log("=".repeat(50));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
