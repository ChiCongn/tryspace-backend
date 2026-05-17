import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import { slugify } from "../src/utils/slugify";

const SEED_PASSWORD = "Tryspace@123";
const LOCAL_ASSET_BASE = "/assets/seed";

const localAssets = {
  sofa: {
    imageUrl: `${LOCAL_ASSET_BASE}/products/sofa.svg`,
    modelUrl: `${LOCAL_ASSET_BASE}/models/sofa.gltf`
  },
  chair: {
    imageUrl: `${LOCAL_ASSET_BASE}/products/chair.svg`,
    modelUrl: `${LOCAL_ASSET_BASE}/models/chair.gltf`
  },
  coffeeTable: {
    imageUrl: `${LOCAL_ASSET_BASE}/products/coffee-table.svg`,
    modelUrl: `${LOCAL_ASSET_BASE}/models/table.gltf`
  },
  desk: {
    imageUrl: `${LOCAL_ASSET_BASE}/products/desk.svg`,
    modelUrl: `${LOCAL_ASSET_BASE}/models/table.gltf`
  },
  bookShelf: {
    imageUrl: `${LOCAL_ASSET_BASE}/products/bookshelf.svg`,
    modelUrl: `${LOCAL_ASSET_BASE}/models/shelf.gltf`
  },
  tvConsole: {
    imageUrl: `${LOCAL_ASSET_BASE}/products/tv-console.svg`,
    modelUrl: `${LOCAL_ASSET_BASE}/models/shelf.gltf`
  },
  bed: {
    imageUrl: `${LOCAL_ASSET_BASE}/products/bed.svg`,
    modelUrl: `${LOCAL_ASSET_BASE}/models/bed.gltf`
  },
  floorLamp: {
    imageUrl: `${LOCAL_ASSET_BASE}/products/floor-lamp.svg`,
    modelUrl: `${LOCAL_ASSET_BASE}/models/lamp.gltf`
  },
  sofaBed: {
    imageUrl: `${LOCAL_ASSET_BASE}/products/sofa-bed.svg`,
    modelUrl: `${LOCAL_ASSET_BASE}/models/sofa.gltf`
  },
  wardrobe: {
    imageUrl: `${LOCAL_ASSET_BASE}/products/wardrobe.svg`,
    modelUrl: `${LOCAL_ASSET_BASE}/models/shelf.gltf`
  }
} as const;

type LocalAssetKey = keyof typeof localAssets;

interface CategorySeed {
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
}

interface ProductSeed {
  categorySlug: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  dimensions: Prisma.InputJsonObject;
  materials: string[];
  tags: string[];
  stockQuantity: number;
  assetKey?: LocalAssetKey;
}

interface CreatedProductSummary {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  thumbnailUrl: string;
  variants: Array<{
    id: string;
    name: string;
    priceAddon: number;
  }>;
}

const categories: CategorySeed[] = [
  { name: "Ghế", slug: "ghe", description: "Ghế ăn, ghế làm việc và ghế thư giãn", displayOrder: 1 },
  { name: "Bàn", slug: "ban", description: "Bàn ăn, bàn làm việc, bàn trà và bàn phụ", displayOrder: 2 },
  { name: "Kệ", slug: "ke", description: "Kệ sách, kệ tivi, kệ giày và kệ trang trí", displayOrder: 3 },
  { name: "Giường", slug: "giuong", description: "Giường ngủ, daybed và giường trẻ em", displayOrder: 4 },
  { name: "Đèn", slug: "den", description: "Đèn sàn, đèn bàn, đèn treo và đèn trang trí", displayOrder: 5 },
  { name: "Sofa", slug: "sofa", description: "Sofa phòng khách, sofa bed và sofa module", displayOrder: 6 },
  { name: "Tủ", slug: "tu", description: "Tủ quần áo, tủ giày, tủ hồ sơ và tủ buffet", displayOrder: 7 },
  { name: "Bàn trang điểm", slug: "ban-trang-diem", description: "Bàn trang điểm, gương và phụ kiện làm đẹp", displayOrder: 8 },
  { name: "Thảm", slug: "tham", description: "Thảm phòng khách, thảm hành lang và thảm trang trí", displayOrder: 9 },
  { name: "Trang trí", slug: "trang-tri", description: "Bình, tranh và vật dụng trang trí nhà", displayOrder: 10 }
];

function dimensions(width: number, height: number, depth: number): Prisma.InputJsonObject {
  return { width, height, depth, unit: "cm" };
}

function product(input: Omit<ProductSeed, "slug">): ProductSeed {
  return {
    ...input,
    slug: slugify(input.name)
  };
}

const products: ProductSeed[] = [
  product({
    categorySlug: "ghe",
    name: "Ghế Ăn Milan Phong Cách Ý",
    description: "Ghế ăn lưng cong bọc nệm êm, chân gỗ thanh mảnh và tỉ lệ gọn cho bàn ăn gia đình.",
    basePrice: 2500000,
    dimensions: dimensions(52, 85, 54),
    materials: ["Gỗ sồi", "Nệm vải polyester", "Sơn dầu tự nhiên"],
    tags: ["ghe-an", "go-soi", "can-ho", "local-asset"],
    stockQuantity: 35,
    assetKey: "chair"
  }),
  product({
    categorySlug: "ghe",
    name: "Ghế Thư Giãn Hana Premium",
    description: "Ghế thư giãn dáng thấp với tay vịn rộng, phù hợp góc đọc sách, ban công hoặc phòng ngủ.",
    basePrice: 5800000,
    dimensions: dimensions(82, 92, 88),
    materials: ["Gỗ tần bì", "Vải bố thô", "Nệm mút mật độ cao"],
    tags: ["thu-gian", "doc-sach", "vai-bo"],
    stockQuantity: 15
  }),
  product({
    categorySlug: "ghe",
    name: "Ghế Bar Urban",
    description: "Ghế bar điều chỉnh độ cao, chân thép mạ chrome và đệm da PU dễ vệ sinh.",
    basePrice: 1850000,
    dimensions: dimensions(42, 75, 42),
    materials: ["Thép không gỉ", "Da PU", "Chân đế nhựa"],
    tags: ["ghe-bar", "hien-dai", "kitchen-island"],
    stockQuantity: 24
  }),
  product({
    categorySlug: "ghe",
    name: "Ghế Làm Việc Nova Ergonomic",
    description: "Ghế làm việc có tựa lưng lưới thoáng, kê tay nâng hạ và đệm ngồi hỗ trợ ngồi lâu.",
    basePrice: 3600000,
    dimensions: dimensions(66, 118, 66),
    materials: ["Lưới polyester", "Khung nylon", "Chân thép"],
    tags: ["ghe-van-phong", "ergonomic", "home-office"],
    stockQuantity: 28
  }),
  product({
    categorySlug: "ghe",
    name: "Ghế Bành Cloudy",
    description: "Ghế bành bo tròn với đệm dày và vải nỉ mềm, tạo điểm nhấn ấm áp cho phòng khách.",
    basePrice: 6400000,
    dimensions: dimensions(88, 86, 92),
    materials: ["Khung gỗ thông", "Vải nỉ", "Mút đàn hồi"],
    tags: ["ghe-banh", "phong-khach", "ni-mem"],
    stockQuantity: 11
  }),
  product({
    categorySlug: "ghe",
    name: "Ghế Gấp Ban Công Breeze",
    description: "Ghế gấp nhẹ, chống ẩm tốt và dễ cất gọn cho ban công hoặc sân vườn nhỏ.",
    basePrice: 1250000,
    dimensions: dimensions(48, 82, 54),
    materials: ["Gỗ tràm", "Khớp thép", "Sơn ngoài trời"],
    tags: ["ghe-gap", "ban-cong", "ngoai-troi"],
    stockQuantity: 42
  }),
  product({
    categorySlug: "ghe",
    name: "Ghế Đôn Len Moka",
    description: "Ghế đôn nhỏ bọc len dệt, dùng làm ghế phụ, kê chân hoặc điểm nhấn cạnh sofa.",
    basePrice: 980000,
    dimensions: dimensions(42, 44, 42),
    materials: ["Len dệt", "Gỗ cao su", "Mút đàn hồi"],
    tags: ["ghe-don", "ke-chan", "decor"],
    stockQuantity: 30
  }),
  product({
    categorySlug: "ban",
    name: "Bàn Cà Phê Kyoto Natural",
    description: "Bàn cà phê mặt bo tròn với hộc lưu trữ nhỏ, phủ veneer gỗ sồi tự nhiên.",
    basePrice: 4200000,
    dimensions: dimensions(120, 45, 65),
    materials: ["Gỗ sồi", "Veneer gỗ sồi", "Bản lề thép"],
    tags: ["ban-ca-phe", "toi-gian", "phong-khach", "local-asset"],
    stockQuantity: 18,
    assetKey: "coffeeTable"
  }),
  product({
    categorySlug: "ban",
    name: "Bàn Làm Việc Sapa Pro",
    description: "Bàn làm việc có hai ngăn kéo, khoang đi dây và mặt bàn rộng cho laptop cùng màn hình.",
    basePrice: 4900000,
    dimensions: dimensions(160, 75, 70),
    materials: ["Gỗ MDF phủ veneer", "Thép sơn tĩnh điện", "Bản lề giảm chấn"],
    tags: ["ban-lam-viec", "home-office", "local-asset"],
    stockQuantity: 22,
    assetKey: "desk"
  }),
  product({
    categorySlug: "ban",
    name: "Bàn Ăn Đà Lạt 6 Chỗ",
    description: "Bàn ăn sáu chỗ với mặt gỗ tự nhiên phủ dầu, mép bo tròn và chân gỗ chắc chắn.",
    basePrice: 12500000,
    dimensions: dimensions(180, 76, 90),
    materials: ["Gỗ cao su ghép", "Sơn dầu tự nhiên", "Bản lề mở rộng"],
    tags: ["ban-an", "sau-cho", "go-tu-nhien"],
    stockQuantity: 8
  }),
  product({
    categorySlug: "ban",
    name: "Bàn Console Marble Luxe",
    description: "Bàn console mặt đá nhân tạo vân marble, khung thép mạ vàng và kệ dưới để decor.",
    basePrice: 6800000,
    dimensions: dimensions(140, 80, 40),
    materials: ["Đá nhân tạo", "Thép mạ vàng", "Gỗ MDF"],
    tags: ["ban-console", "sang-trong", "marble"],
    stockQuantity: 10
  }),
  product({
    categorySlug: "ban",
    name: "Bàn Gấp Wallie",
    description: "Bàn gấp treo tường tiết kiệm diện tích, phù hợp căn hộ nhỏ hoặc góc học tập nhanh.",
    basePrice: 2200000,
    dimensions: dimensions(90, 72, 52),
    materials: ["Gỗ plywood", "Bản lề thép", "Sơn phủ mờ"],
    tags: ["ban-gap", "tiet-kiem-dien-tich", "can-ho-nho"],
    stockQuantity: 20
  }),
  product({
    categorySlug: "ban",
    name: "Bàn Góc Laptop Curve",
    description: "Bàn góc chữ L nhỏ gọn cho laptop, có kệ phụ và chân tăng chỉnh chống cập kênh.",
    basePrice: 3400000,
    dimensions: dimensions(120, 74, 120),
    materials: ["MDF chống ẩm", "Thép sơn đen", "Nẹp nhựa ABS"],
    tags: ["ban-goc", "laptop", "home-office"],
    stockQuantity: 14
  }),
  product({
    categorySlug: "ban",
    name: "Bàn Trà Tròn Mori",
    description: "Bàn trà tròn chân trụ, mặt phủ laminate chống trầy và dễ vệ sinh hằng ngày.",
    basePrice: 3100000,
    dimensions: dimensions(82, 40, 82),
    materials: ["MDF phủ laminate", "Chân gỗ cao su", "Sơn PU"],
    tags: ["ban-tra", "tron", "phong-khach"],
    stockQuantity: 19
  }),
  product({
    categorySlug: "ke",
    name: "Kệ Sách Bergen 5 Tầng",
    description: "Kệ sách năm tầng với khung vững chắc, mỗi tầng chịu lực tốt cho sách và đồ trang trí.",
    basePrice: 5500000,
    dimensions: dimensions(100, 185, 36),
    materials: ["Gỗ MDF phủ veneer", "Thép", "Bu lông kết nối"],
    tags: ["ke-sach", "nam-tang", "local-asset"],
    stockQuantity: 14,
    assetKey: "bookShelf"
  }),
  product({
    categorySlug: "ke",
    name: "Kệ Tivi Nha Trang 180cm",
    description: "Kệ tivi dài có cánh lùa và khoang thiết bị, phù hợp tivi đến 65 inch.",
    basePrice: 7200000,
    dimensions: dimensions(180, 50, 45),
    materials: ["Gỗ công nghiệp An Cường", "Mây đan", "Kính cường lực"],
    tags: ["ke-tivi", "canh-lua", "local-asset"],
    stockQuantity: 11,
    assetKey: "tvConsole"
  }),
  product({
    categorySlug: "ke",
    name: "Kệ Trang Trí Hội An",
    description: "Kệ trang trí dáng mở, chia ô linh hoạt để đặt sách, bình hoa và phụ kiện.",
    basePrice: 4100000,
    dimensions: dimensions(110, 160, 34),
    materials: ["Gỗ thông", "Sơn mờ màu kem", "Mối ghép gỗ"],
    tags: ["ke-trang-tri", "chia-o", "vintage"],
    stockQuantity: 17
  }),
  product({
    categorySlug: "ke",
    name: "Kệ Giày Entry Slim",
    description: "Kệ giày hẹp cho lối vào, chứa 12 đôi giày và có mặt ngồi thay giày tiện lợi.",
    basePrice: 2800000,
    dimensions: dimensions(90, 96, 28),
    materials: ["Gỗ MDF", "Nệm vải", "Ray thép"],
    tags: ["ke-giay", "loi-vao", "slim"],
    stockQuantity: 18
  }),
  product({
    categorySlug: "ke",
    name: "Kệ Treo Tường Floating Oak",
    description: "Bộ ba kệ treo tường gỗ sồi, ẩn pát treo và phù hợp trưng bày khung ảnh.",
    basePrice: 1650000,
    dimensions: dimensions(80, 6, 22),
    materials: ["Gỗ sồi", "Pát treo âm", "Sơn dầu"],
    tags: ["ke-treo-tuong", "floating", "go-soi"],
    stockQuantity: 36
  }),
  product({
    categorySlug: "ke",
    name: "Kệ Bếp Mini Pantry",
    description: "Kệ bếp mini có bánh xe, dùng để gia vị, đồ khô và vật dụng nhỏ cạnh tủ bếp.",
    basePrice: 1950000,
    dimensions: dimensions(62, 88, 34),
    materials: ["Thép sơn tĩnh điện", "Gỗ MDF", "Bánh xe khóa"],
    tags: ["ke-bep", "pantry", "banh-xe"],
    stockQuantity: 25
  }),
  product({
    categorySlug: "ke",
    name: "Kệ Đầu Giường Mây Đan",
    description: "Kệ nhỏ cạnh giường với cánh mây đan, ngăn kéo êm và màu gỗ tự nhiên.",
    basePrice: 2600000,
    dimensions: dimensions(48, 58, 42),
    materials: ["Gỗ cao su", "Mây đan", "Ray giảm chấn"],
    tags: ["ke-dau-giuong", "may-dan", "phong-ngu"],
    stockQuantity: 21
  }),
  product({
    categorySlug: "giuong",
    name: "Giường Ngủ Lotus King Size",
    description: "Giường king size bọc vải nỉ êm ái, đầu giường cao và khung plywood chắc chắn.",
    basePrice: 15800000,
    dimensions: dimensions(180, 110, 200),
    materials: ["Gỗ plywood", "Vải nỉ polyester", "Sơn màu trắng"],
    tags: ["giuong-ngu", "king-size", "local-asset"],
    stockQuantity: 6,
    assetKey: "bed"
  }),
  product({
    categorySlug: "giuong",
    name: "Giường Gỗ Mộc Châu Queen",
    description: "Giường queen size gỗ tự nhiên, vân gỗ rõ và xử lý chống mối mọt.",
    basePrice: 18500000,
    dimensions: dimensions(160, 95, 200),
    materials: ["Gỗ sồi Việt Nam", "Dầu lau gỗ", "Sáp ong tự nhiên"],
    tags: ["giuong-go", "go-soi", "queen-size"],
    stockQuantity: 4
  }),
  product({
    categorySlug: "giuong",
    name: "Giường Daybed An Nhiên",
    description: "Daybed đa năng dùng làm ghế nghỉ ban ngày và giường phụ ban đêm cho căn hộ studio.",
    basePrice: 9500000,
    dimensions: dimensions(100, 78, 200),
    materials: ["Gỗ cao su", "Nệm vải linen", "Gối tựa cotton"],
    tags: ["daybed", "studio", "da-nang"],
    stockQuantity: 9
  }),
  product({
    categorySlug: "giuong",
    name: "Giường Tầng Kabi Kids",
    description: "Giường tầng trẻ em có thang an toàn, lan can cao và ngăn kéo dưới gầm.",
    basePrice: 14200000,
    dimensions: dimensions(120, 170, 200),
    materials: ["Gỗ thông", "Sơn gốc nước", "Ray thép"],
    tags: ["giuong-tang", "tre-em", "ngan-keo"],
    stockQuantity: 5
  }),
  product({
    categorySlug: "giuong",
    name: "Giường Bọc Da Verona",
    description: "Giường bọc da PU cao cấp, đầu giường chần ô và khung nâng chứa đồ rộng.",
    basePrice: 19800000,
    dimensions: dimensions(180, 112, 210),
    materials: ["Da PU", "Khung thép", "Gỗ plywood"],
    tags: ["giuong-boc-da", "sang-trong", "chua-do"],
    stockQuantity: 4
  }),
  product({
    categorySlug: "den",
    name: "Đèn Sàn Aurora 160cm",
    description: "Đèn sàn thân mảnh với chụp vải linen trắng, ánh sáng ấm cho góc sofa.",
    basePrice: 3200000,
    dimensions: dimensions(45, 160, 45),
    materials: ["Thép sơn đen mờ", "Vải linen trắng", "Đèn LED 12W"],
    tags: ["den-san", "anh-sang-diu", "local-asset"],
    stockQuantity: 21,
    assetKey: "floorLamp"
  }),
  product({
    categorySlug: "den",
    name: "Đèn Bàn Moon Ceramic",
    description: "Đèn bàn nhỏ ánh sáng ấm, chân gốm mờ và công tắc chân tiện dụng.",
    basePrice: 1850000,
    dimensions: dimensions(30, 48, 30),
    materials: ["Gốm cao cấp", "Vải nỉ", "Đèn LED 6W"],
    tags: ["den-ban", "anh-sang-am", "ceramic"],
    stockQuantity: 28
  }),
  product({
    categorySlug: "den",
    name: "Đèn Treo Trần Halo Modern",
    description: "Đèn treo trần vòng sáng hiện đại, phù hợp bàn ăn hoặc đảo bếp.",
    basePrice: 6800000,
    dimensions: dimensions(80, 120, 80),
    materials: ["Nhôm mạ vàng đồng", "Acrylic", "LED 3x9W"],
    tags: ["den-treo", "ban-an", "led"],
    stockQuantity: 7
  }),
  product({
    categorySlug: "den",
    name: "Đèn Tường Arc Brass",
    description: "Đèn tường tay cong màu brass, chiếu sáng nhẹ cho hành lang hoặc đầu giường.",
    basePrice: 2250000,
    dimensions: dimensions(18, 42, 28),
    materials: ["Thép mạ brass", "Chụp thủy tinh", "LED 5W"],
    tags: ["den-tuong", "brass", "hanh-lang"],
    stockQuantity: 18
  }),
  product({
    categorySlug: "den",
    name: "Đèn Ngủ Nấm Pastel",
    description: "Đèn ngủ dáng nấm, ánh sáng dịu và dimmer cảm ứng cho phòng ngủ nhỏ.",
    basePrice: 1280000,
    dimensions: dimensions(22, 32, 22),
    materials: ["Nhựa ABS", "Silicone", "LED sạc USB-C"],
    tags: ["den-ngu", "pastel", "cam-ung"],
    stockQuantity: 33
  }),
  product({
    categorySlug: "den",
    name: "Đèn Rọi Ray Studio",
    description: "Đèn rọi ray góc chiếu linh hoạt, phù hợp showroom nhỏ hoặc góc trưng bày.",
    basePrice: 980000,
    dimensions: dimensions(8, 18, 12),
    materials: ["Nhôm sơn tĩnh điện", "Chip LED", "Ray điện"],
    tags: ["den-roi", "studio", "trung-bay"],
    stockQuantity: 45
  }),
  product({
    categorySlug: "sofa",
    name: "Sofa Oslo 3 Chỗ",
    description: "Sofa ba chỗ phong cách Bắc Âu, khung gỗ chắc chắn và đệm ngồi êm.",
    basePrice: 12500000,
    dimensions: dimensions(220, 85, 95),
    materials: ["Gỗ sồi", "Vải linen cao cấp", "Nệm cao su non"],
    tags: ["sofa", "bac-au", "local-asset"],
    stockQuantity: 12,
    assetKey: "sofa"
  }),
  product({
    categorySlug: "sofa",
    name: "Sofa Bed Luna 2 in 1",
    description: "Sofa bed chuyển đổi thành giường đơn trong vài thao tác, hợp căn hộ studio.",
    basePrice: 8900000,
    dimensions: dimensions(180, 82, 95),
    materials: ["Khung gỗ thông", "Vải nỉ", "Bản lề thép"],
    tags: ["sofa-bed", "studio", "local-asset"],
    stockQuantity: 12,
    assetKey: "sofaBed"
  }),
  product({
    categorySlug: "sofa",
    name: "Sofa Corner Milan",
    description: "Sofa góc chữ L phủ da PU, có vị trí nằm thư giãn cho phòng khách rộng.",
    basePrice: 18500000,
    dimensions: dimensions(280, 85, 180),
    materials: ["Khung gỗ sồi", "Da PU cao cấp", "Nệm cao su non"],
    tags: ["sofa-corner", "goc-l", "da-pu"],
    stockQuantity: 5
  }),
  product({
    categorySlug: "sofa",
    name: "Sofa Đơn Nami",
    description: "Sofa đơn dáng thấp, lưng cong và vải bouclé mềm cho góc đọc sách.",
    basePrice: 6200000,
    dimensions: dimensions(92, 78, 88),
    materials: ["Vải bouclé", "Gỗ plywood", "Chân gỗ"],
    tags: ["sofa-don", "doc-sach", "boucle"],
    stockQuantity: 9
  }),
  product({
    categorySlug: "sofa",
    name: "Sofa Module Flexi",
    description: "Sofa module tháo ghép linh hoạt, dễ đổi bố cục theo diện tích phòng.",
    basePrice: 21500000,
    dimensions: dimensions(260, 82, 180),
    materials: ["Khung gỗ thông", "Vải chống bám bẩn", "Mút HR"],
    tags: ["sofa-module", "linh-hoat", "phong-khach"],
    stockQuantity: 6
  }),
  product({
    categorySlug: "tu",
    name: "Tủ Quần Áo Hinge 3 Cánh",
    description: "Tủ quần áo ba cánh với gương toàn thân, ngăn kéo và khoang treo rộng.",
    basePrice: 11200000,
    dimensions: dimensions(180, 220, 60),
    materials: ["Gỗ MDF", "Gương cường lực", "Bản lề giảm chấn"],
    tags: ["tu-quan-ao", "3-canh", "local-asset"],
    stockQuantity: 8,
    assetKey: "wardrobe"
  }),
  product({
    categorySlug: "tu",
    name: "Tủ Giày Slipper Smart",
    description: "Tủ giày thông minh năm tầng, cánh kính trong và mặt đá decor phía trên.",
    basePrice: 3200000,
    dimensions: dimensions(80, 110, 25),
    materials: ["Gỗ MDF", "Kính cường lực", "Đá nhân tạo"],
    tags: ["tu-giay", "thong-minh", "5-tang"],
    stockQuantity: 16
  }),
  product({
    categorySlug: "tu",
    name: "Tủ Đầu Giường Lofi",
    description: "Tủ đầu giường hai ngăn kéo, tay nắm âm và chân gỗ cao dễ vệ sinh.",
    basePrice: 2450000,
    dimensions: dimensions(50, 56, 40),
    materials: ["MDF phủ melamine", "Gỗ cao su", "Ray bi"],
    tags: ["tu-dau-giuong", "phong-ngu", "lofi"],
    stockQuantity: 24
  }),
  product({
    categorySlug: "tu",
    name: "Tủ Buffet Saigon",
    description: "Tủ buffet phòng ăn có cánh lùa, khoang chai ly và mặt rộng để đồ trang trí.",
    basePrice: 9700000,
    dimensions: dimensions(160, 86, 45),
    materials: ["Gỗ sồi veneer", "Mây đan", "Ray giảm chấn"],
    tags: ["tu-buffet", "phong-an", "canh-lua"],
    stockQuantity: 7
  }),
  product({
    categorySlug: "tu",
    name: "Tủ Hồ Sơ Office Mate",
    description: "Tủ hồ sơ ba ngăn khóa riêng, phù hợp góc làm việc tại nhà hoặc văn phòng nhỏ.",
    basePrice: 3600000,
    dimensions: dimensions(80, 120, 42),
    materials: ["Thép sơn tĩnh điện", "Khóa cơ", "Bánh xe"],
    tags: ["tu-ho-so", "office", "co-khoa"],
    stockQuantity: 13
  }),
  product({
    categorySlug: "ban-trang-diem",
    name: "Bàn Trang Điểm Vintage Rose",
    description: "Bàn trang điểm vintage với gương tròn LED và ba ngăn kéo lưu trữ mỹ phẩm.",
    basePrice: 4800000,
    dimensions: dimensions(100, 150, 45),
    materials: ["Gỗ MDF", "Gương có LED", "Bản lề giảm chấn"],
    tags: ["ban-trang-diem", "vintage", "led"],
    stockQuantity: 10
  }),
  product({
    categorySlug: "ban-trang-diem",
    name: "Gương Trang Điểm LED Smart",
    description: "Gương trang điểm thông minh ba chế độ sáng, cảm ứng chạm và khay phụ kiện.",
    basePrice: 2100000,
    dimensions: dimensions(60, 70, 15),
    materials: ["Gương LED", "Khung nhôm", "Cảm biến chạm"],
    tags: ["guong-led", "smart", "cam-bien-cham"],
    stockQuantity: 22
  }),
  product({
    categorySlug: "ban-trang-diem",
    name: "Ghế Trang Điểm Mini Puff",
    description: "Ghế puff nhỏ bọc nhung, chân kim loại vàng champagne và chiều cao vừa bàn trang điểm.",
    basePrice: 1450000,
    dimensions: dimensions(38, 44, 38),
    materials: ["Vải nhung", "Mút đàn hồi", "Chân thép"],
    tags: ["ghe-trang-diem", "puff", "nhung"],
    stockQuantity: 26
  }),
  product({
    categorySlug: "ban-trang-diem",
    name: "Hộp Mỹ Phẩm Drawer Set",
    description: "Hộp đựng mỹ phẩm nhiều ngăn, mặt trong suốt và khay tháo rời dễ vệ sinh.",
    basePrice: 820000,
    dimensions: dimensions(32, 22, 24),
    materials: ["Acrylic", "Nhựa ABS", "Tay nắm kim loại"],
    tags: ["hop-my-pham", "organizer", "acrylic"],
    stockQuantity: 40
  }),
  product({
    categorySlug: "tham",
    name: "Thảm Lông Mịn Cloud 160x230",
    description: "Thảm lông mịn màu trung tính, đế chống trượt và phù hợp phòng khách nhỏ.",
    basePrice: 2850000,
    dimensions: dimensions(160, 2, 230),
    materials: ["Sợi polyester", "Đế cao su chống trượt", "Viền may"],
    tags: ["tham-long", "phong-khach", "cloud"],
    stockQuantity: 18
  }),
  product({
    categorySlug: "tham",
    name: "Thảm Jute Eco Round",
    description: "Thảm tròn dệt từ sợi jute tự nhiên, hợp phong cách mộc và góc đọc sách.",
    basePrice: 1950000,
    dimensions: dimensions(150, 1, 150),
    materials: ["Sợi jute", "Cotton viền", "Đế dệt"],
    tags: ["tham-jute", "eco", "tron"],
    stockQuantity: 20
  }),
  product({
    categorySlug: "tham",
    name: "Thảm Hành Lang Terra",
    description: "Thảm runner cho hành lang, họa tiết terra và sợi ngắn dễ hút bụi.",
    basePrice: 1650000,
    dimensions: dimensions(70, 1, 240),
    materials: ["Sợi polypropylene", "Đế cotton", "Viền khóa mép"],
    tags: ["tham-hanh-lang", "runner", "terra"],
    stockQuantity: 23
  }),
  product({
    categorySlug: "trang-tri",
    name: "Bình Gốm Sương Mai",
    description: "Bình gốm thủ công men mờ, dáng cao thanh lịch để cắm hoa khô hoặc decor kệ.",
    basePrice: 1250000,
    dimensions: dimensions(22, 48, 22),
    materials: ["Gốm thủ công", "Men mờ", "Đế nỉ"],
    tags: ["binh-gom", "decor", "thu-cong"],
    stockQuantity: 27
  }),
  product({
    categorySlug: "trang-tri",
    name: "Tranh Canvas Sa Pa Mist",
    description: "Tranh canvas phong cảnh sương núi Sa Pa, khung gỗ nhẹ và màu in dịu.",
    basePrice: 1750000,
    dimensions: dimensions(90, 60, 3),
    materials: ["Canvas", "Khung gỗ thông", "Mực in UV"],
    tags: ["tranh-canvas", "sa-pa", "decor-tuong"],
    stockQuantity: 16
  }),
  product({
    categorySlug: "trang-tri",
    name: "Đồng Hồ Tường Minimal",
    description: "Đồng hồ tường tối giản, kim trôi êm và mặt số rõ cho phòng khách hoặc bếp.",
    basePrice: 920000,
    dimensions: dimensions(34, 34, 4),
    materials: ["Gỗ MDF", "Máy kim trôi", "Mặt phủ sơn"],
    tags: ["dong-ho-tuong", "minimal", "phong-khach"],
    stockQuantity: 31
  })
];

const variantOptions = [
  { name: "Oak Natural", hexColor: "#D8B98A", priceAddon: 0 },
  { name: "Walnut Brown", hexColor: "#7B4A2F", priceAddon: 150000 },
  { name: "White Matte", hexColor: "#F7F4EF", priceAddon: 200000 },
  { name: "Charcoal Fabric", hexColor: "#44403C", priceAddon: 300000 }
] as const;

const seedUsers = [
  { key: "admin", email: "tryspace.admin@gmail.com", displayName: "TrySpace Admin", role: Role.ADMIN },
  { key: "minh", email: "tryspace.minh@gmail.com", displayName: "Minh Tran", role: Role.USER },
  { key: "lan", email: "tryspace.lan@gmail.com", displayName: "Lan Nguyen", role: Role.USER },
  { key: "anh", email: "tryspace.anh@gmail.com", displayName: "Anh Pham", role: Role.USER },
  { key: "huy", email: "tryspace.huy@gmail.com", displayName: "Huy Le", role: Role.USER }
] as const;

const shippingAddresses: Record<string, Prisma.InputJsonObject> = {
  minh: {
    fullName: "Minh Tran",
    phone: "0901234567",
    addressLine1: "123 Nguyen Hue",
    addressLine2: "Phuong Ben Nghe, Quan 1",
    city: "Quan 1",
    province: "Ho Chi Minh"
  },
  lan: {
    fullName: "Lan Nguyen",
    phone: "0912345678",
    addressLine1: "45 Tran Hung Dao",
    addressLine2: "Phuong Cua Nam, Quan Hoan Kiem",
    city: "Hoan Kiem",
    province: "Ha Noi"
  }
};

const orderSeeds = [
  {
    userKey: "minh",
    orderNumber: "TS-SEED-20260517-0001",
    deliveredAt: new Date("2026-05-14T03:00:00.000Z"),
    items: [
      { productName: "Ghế Ăn Milan Phong Cách Ý", quantity: 4 },
      { productName: "Bàn Ăn Đà Lạt 6 Chỗ", quantity: 1 },
      { productName: "Đèn Sàn Aurora 160cm", quantity: 1 }
    ]
  },
  {
    userKey: "lan",
    orderNumber: "TS-SEED-20260517-0002",
    deliveredAt: new Date("2026-05-15T04:30:00.000Z"),
    items: [
      { productName: "Sofa Bed Luna 2 in 1", quantity: 1 },
      { productName: "Bàn Cà Phê Kyoto Natural", quantity: 1 },
      { productName: "Kệ Tivi Nha Trang 180cm", quantity: 1 }
    ]
  }
] as const;

const reviewTitles = [
  "Đúng mô tả và rất chắc chắn",
  "Hoàn thiện tốt hơn mong đợi",
  "Dễ phối với không gian nhà",
  "Giao nhanh, đóng gói kỹ",
  "Mua để dùng thử và khá hài lòng"
] as const;

const reviewBodies = [
  "Sản phẩm lên form đẹp, màu sắc ngoài thực tế dễ phối hơn ảnh. Gia đình mình dùng vài ngày thấy ổn.",
  "Chất liệu chắc, các cạnh xử lý gọn và không có mùi khó chịu. Đội giao hàng hỗ trợ lắp đặt cẩn thận.",
  "Kích thước đúng như thông tin, đặt vào phòng vừa vặn. Đây là món mình sẽ cân nhắc mua thêm.",
  "Phần hoàn thiện nhìn sạch, không bị trầy xước khi nhận hàng. Trải nghiệm mua hàng mượt.",
  "Mình đặt để test layout nội thất, sản phẩm thật khá đồng nhất với thông tin trên web."
] as const;

function assertSeedRequirements(): void {
  const slugs = new Set<string>();

  for (const seedProduct of products) {
    if (slugs.has(seedProduct.slug)) {
      throw new Error(`Duplicate product slug in seed data: ${seedProduct.slug}`);
    }

    slugs.add(seedProduct.slug);
  }

  const localAssetProductCount = products.filter((seedProduct) => seedProduct.assetKey).length;

  if (products.length < 50) {
    throw new Error(`Seed requires at least 50 products; found ${products.length}`);
  }

  if (localAssetProductCount < 10) {
    throw new Error(`Seed requires at least 10 local asset products; found ${localAssetProductCount}`);
  }

  if (seedUsers.length !== 5) {
    throw new Error(`Seed requires exactly 5 users; found ${seedUsers.length}`);
  }
}

function placeholderImage(name: string, index: number, view = 1): string {
  const palette = [
    ["EDE9E0", "7B4A2F"],
    ["E6EEF0", "3E5968"],
    ["F3E8DD", "8A5A44"],
    ["EEF2EA", "4F6F52"],
    ["F2ECF4", "725A78"]
  ];
  const [background, foreground] = palette[index % palette.length];
  const text = encodeURIComponent(view === 1 ? name : `${name} View ${view}`);

  return `https://placehold.co/640x480/${background}/${foreground}?text=${text}`;
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]!;
}

async function clearExistingData(): Promise<void> {
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
}

async function createCategories(): Promise<Map<string, string>> {
  const categoryBySlug = new Map<string, string>();

  for (const category of categories) {
    const created = await prisma.category.create({ data: category });
    categoryBySlug.set(created.slug, created.id);
  }

  return categoryBySlug;
}

async function createUsers(): Promise<Map<string, string>> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  const userByKey = new Map<string, string>();

  for (const seedUser of seedUsers) {
    const created = await prisma.user.create({
      data: {
        email: seedUser.email,
        passwordHash,
        displayName: seedUser.displayName,
        role: seedUser.role
      }
    });
    userByKey.set(seedUser.key, created.id);
  }

  return userByKey;
}

async function createProducts(categoryBySlug: Map<string, string>): Promise<Map<string, CreatedProductSummary>> {
  const productBySlug = new Map<string, CreatedProductSummary>();

  for (const [index, seedProduct] of products.entries()) {
    const categoryId = categoryBySlug.get(seedProduct.categorySlug);

    if (!categoryId) {
      throw new Error(`Missing category for slug ${seedProduct.categorySlug}`);
    }

    const asset = seedProduct.assetKey ? localAssets[seedProduct.assetKey] : null;
    const thumbnailUrl = asset?.imageUrl ?? placeholderImage(seedProduct.name, index);
    const created = await prisma.product.create({
      data: {
        name: seedProduct.name,
        slug: seedProduct.slug,
        description: seedProduct.description,
        categoryId,
        basePrice: seedProduct.basePrice,
        comparePrice: seedProduct.basePrice + Math.floor(seedProduct.basePrice * 0.12),
        thumbnailUrl,
        modelUrl: asset?.modelUrl ?? null,
        hasArSupport: Boolean(asset?.modelUrl),
        dimensions: seedProduct.dimensions,
        materials: seedProduct.materials,
        tags: seedProduct.tags,
        stockQuantity: seedProduct.stockQuantity,
        variants: {
          create: variantOptions.map((variant, variantIndex) => ({
            name: variant.name,
            type: "MATERIAL",
            hexColor: variant.hexColor,
            textureUrl: null,
            priceAddon: variant.priceAddon,
            isDefault: variantIndex === 0,
            stockQuantity: Math.max(seedProduct.stockQuantity - variantIndex * 2, 0)
          }))
        },
        images: {
          create: [
            {
              url: thumbnailUrl,
              alt: seedProduct.name,
              displayOrder: 1
            },
            {
              url: placeholderImage(seedProduct.name, index + 1, 2),
              alt: `${seedProduct.name} - View 2`,
              displayOrder: 2
            },
            {
              url: placeholderImage(seedProduct.name, index + 2, 3),
              alt: `${seedProduct.name} - View 3`,
              displayOrder: 3
            }
          ]
        }
      },
      include: {
        variants: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
          select: {
            id: true,
            name: true,
            priceAddon: true
          }
        }
      }
    });

    productBySlug.set(created.slug, {
      id: created.id,
      name: created.name,
      slug: created.slug,
      basePrice: created.basePrice,
      thumbnailUrl: created.thumbnailUrl,
      variants: created.variants
    });
  }

  return productBySlug;
}

function getUserId(userByKey: Map<string, string>, userKey: string): string {
  const userId = userByKey.get(userKey);

  if (!userId) {
    throw new Error(`Missing seed user: ${userKey}`);
  }

  return userId;
}

function getProduct(productBySlug: Map<string, CreatedProductSummary>, productName: string): CreatedProductSummary {
  const seedProduct = productBySlug.get(slugify(productName));

  if (!seedProduct) {
    throw new Error(`Missing seed product: ${productName}`);
  }

  return seedProduct;
}

async function createOrders(
  userByKey: Map<string, string>,
  productBySlug: Map<string, CreatedProductSummary>
): Promise<Array<{ userKey: string; productName: string }>> {
  const purchasedItems: Array<{ userKey: string; productName: string }> = [];

  for (const orderSeed of orderSeeds) {
    const orderItems = orderSeed.items.map((item) => {
      const seedProduct = getProduct(productBySlug, item.productName);
      const defaultVariant = seedProduct.variants[0];

      if (!defaultVariant) {
        throw new Error(`Missing default variant for product: ${item.productName}`);
      }

      const unitPrice = seedProduct.basePrice + defaultVariant.priceAddon;
      purchasedItems.push({ userKey: orderSeed.userKey, productName: item.productName });

      return {
        productId: seedProduct.id,
        variantId: defaultVariant.id,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
        snapshot: {
          productName: seedProduct.name,
          productSlug: seedProduct.slug,
          thumbnailUrl: seedProduct.thumbnailUrl,
          variantName: defaultVariant.name,
          basePrice: seedProduct.basePrice,
          priceAddon: defaultVariant.priceAddon
        }
      };
    });
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingFee = 30000;
    const shippingAddress = shippingAddresses[orderSeed.userKey];

    if (!shippingAddress) {
      throw new Error(`Missing shipping address for user: ${orderSeed.userKey}`);
    }

    await prisma.order.create({
      data: {
        orderNumber: orderSeed.orderNumber,
        userId: getUserId(userByKey, orderSeed.userKey),
        status: "DELIVERED",
        paymentStatus: "PAID",
        paymentMethod: "MOCK",
        shippingAddress,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        note: "Seed order for review eligibility",
        deliveredAt: orderSeed.deliveredAt,
        items: {
          create: orderItems
        }
      }
    });
  }

  return purchasedItems;
}

async function updateProductRatings(productIds: string[]): Promise<void> {
  for (const productId of productIds) {
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
}

async function createReviews(
  userByKey: Map<string, string>,
  productBySlug: Map<string, CreatedProductSummary>,
  purchasedItems: Array<{ userKey: string; productName: string }>
): Promise<number> {
  const random = createRandom(20260517);
  const affectedProductIds = new Set<string>();
  const reviewedPairs = new Set<string>();

  for (const purchasedItem of purchasedItems) {
    const userId = getUserId(userByKey, purchasedItem.userKey);
    const seedProduct = getProduct(productBySlug, purchasedItem.productName);
    const reviewKey = `${userId}:${seedProduct.id}`;

    if (reviewedPairs.has(reviewKey)) {
      continue;
    }

    const defaultVariant = seedProduct.variants[0];
    const includeImage = random() > 0.45;

    await prisma.review.create({
      data: {
        productId: seedProduct.id,
        userId,
        variantId: defaultVariant?.id,
        rating: pick([4, 4, 5, 5, 5], random),
        title: pick(reviewTitles, random),
        body: pick(reviewBodies, random),
        status: "APPROVED",
        ...(includeImage
          ? {
              images: {
                create: [
                  {
                    url: seedProduct.thumbnailUrl,
                    displayOrder: 1
                  }
                ]
              }
            }
          : {})
      }
    });

    reviewedPairs.add(reviewKey);
    affectedProductIds.add(seedProduct.id);
  }

  await updateProductRatings([...affectedProductIds]);

  return reviewedPairs.size;
}

async function main(): Promise<void> {
  assertSeedRequirements();

  console.log("Starting TrySpace database seed...");

  await clearExistingData();
  const userByKey = await createUsers();
  const categoryBySlug = await createCategories();
  const productBySlug = await createProducts(categoryBySlug);
  const purchasedItems = await createOrders(userByKey, productBySlug);
  const reviewCount = await createReviews(userByKey, productBySlug, purchasedItems);

  console.log("Seed completed successfully.");
  console.log(`Categories: ${categories.length}`);
  console.log(`Products: ${products.length}`);
  console.log(`Products using local image/3D assets: ${products.filter((seedProduct) => seedProduct.assetKey).length}`);
  console.log(`Users: ${seedUsers.length}`);
  console.log(`Delivered orders: ${orderSeeds.length}`);
  console.log(`Reviews: ${reviewCount}`);
  console.log(`Common password for all seed accounts: ${SEED_PASSWORD}`);
  console.log("Seed accounts:");
  for (const seedUser of seedUsers) {
    console.log(`- ${seedUser.email} (${seedUser.role})`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
