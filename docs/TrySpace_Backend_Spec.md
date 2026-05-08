# TrySpace — Backend Specification
## Đặc Tả Chi Tiết Chức Năng & API Contract

**Version:** 1.0.0 | **Base URL:** `https://api.tryspace.app/api/v1`
**Auth scheme:** JWT Bearer Token (header: `Authorization: Bearer <token>`)
**Content-Type mặc định:** `application/json`

---

## Mục Lục

1. [Quy Ước Chung](#1-quy-ước-chung)
2. [Module Auth — Xác Thực](#2-module-auth--xác-thực)
3. [Module Users — Người Dùng](#3-module-users--người-dùng)
4. [Module Categories — Danh Mục](#4-module-categories--danh-mục)
5. [Module Products — Sản Phẩm](#5-module-products--sản-phẩm)
6. [Module Reviews — Đánh Giá](#6-module-reviews--đánh-giá)
7. [Module Cart — Giỏ Hàng](#7-module-cart--giỏ-hàng)
8. [Module Orders — Đơn Hàng](#8-module-orders--đơn-hàng)
9. [Module Designs — Thiết Kế Phòng](#9-module-designs--thiết-kế-phòng)
10. [Module Wishlist — Yêu Thích](#10-module-wishlist--yêu-thích)
11. [Module Search — Tìm Kiếm](#11-module-search--tìm-kiếm)
12. [Module Upload — Tải File](#12-module-upload--tải-file)
13. [Error Reference](#13-error-reference)
14. [Middleware Stack](#14-middleware-stack)
15. [Database Indexes](#15-database-indexes)

---

## 1. Quy Ước Chung

### 1.1 Response Envelope

Mọi response đều theo cấu trúc chuẩn sau:

**Success — single object:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Success — paginated list:**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 12,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [
      { "field": "email", "message": "Email không đúng định dạng" }
    ]
  }
}
```

### 1.2 Pagination Query Params (dùng ở mọi endpoint danh sách)

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `page` | integer | 1 | Trang hiện tại (bắt đầu từ 1) |
| `limit` | integer | 12 | Số item mỗi trang (tối đa 100) |
| `sortBy` | string | `createdAt` | Field để sort |
| `sortOrder` | `asc` \| `desc` | `desc` | Thứ tự sort |

### 1.3 Timestamp Format

Tất cả timestamps dùng ISO 8601: `"2025-01-15T10:30:00.000Z"`

### 1.4 Giá Tiền

- Đơn vị: VND (số nguyên, không có thập phân)
- Ví dụ: `3500000` (không phải `3500000.00`)

### 1.5 Permission Levels

| Level | Mô tả |
|---|---|
| `PUBLIC` | Không cần auth |
| `USER` | Cần đăng nhập (valid JWT) |
| `OWNER` | Cần đăng nhập + là chủ sở hữu resource |
| `ADMIN` | Cần đăng nhập + role = ADMIN |

---

## 2. Module Auth — Xác Thực

### Business Rules

**BR-AUTH-01: Đăng ký**
- Email phải unique trong hệ thống (case-insensitive, normalize về lowercase)
- Password phải ≥ 8 ký tự, chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số
- `displayName` phải từ 2–50 ký tự, không chứa ký tự đặc biệt ngoài dấu cách và dấu gạch ngang
- Mật khẩu hash bằng bcrypt với salt rounds = 12
- Tài khoản mới mặc định role = `USER`, isActive = `true`
- KHÔNG gửi email xác thực trong MVP (scope giản lược)

**BR-AUTH-02: Đăng nhập**
- So sánh email (lowercase) + bcrypt verify password
- Nếu sai mật khẩu: tăng `failedLoginAttempts` lên 1
- Nếu `failedLoginAttempts` ≥ 5: lock tài khoản 15 phút (set `lockedUntil`)
- Khi đăng nhập thành công: reset `failedLoginAttempts = 0`, cập nhật `lastLoginAt`
- Trả về: `accessToken` (JWT, expire 15 phút) + set httpOnly cookie `refreshToken` (expire 7 ngày)

**BR-AUTH-03: Token**
- `accessToken`: JWT, payload chứa `{ sub: userId, role, iat, exp }`
- `refreshToken`: random string 64 ký tự, lưu hash SHA-256 vào DB, expire 7 ngày
- Mỗi refresh tạo refresh token mới (rotation), invalidate token cũ
- Đăng xuất: xóa refresh token khỏi DB, clear cookie

**BR-AUTH-04: Đổi mật khẩu**
- Phải verify `currentPassword` trước
- Mật khẩu mới không được trùng với mật khẩu hiện tại
- Sau khi đổi mật khẩu: invalidate TẤT CẢ refresh token của user (buộc đăng nhập lại trên các thiết bị khác)

---

### POST /auth/register

**Permission:** PUBLIC

**Request Body:**
```json
{
  "email": "minh@example.com",
  "password": "MyPass123",
  "displayName": "Nguyen Minh"
}
```

**Validation:**
| Field | Rule |
|---|---|
| `email` | required, valid email format, max 255 chars |
| `password` | required, min 8 chars, regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$` |
| `displayName` | required, 2–50 chars, regex: `^[a-zA-ZÀ-ỹ\s\-]+$` |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx9abc123",
      "email": "minh@example.com",
      "displayName": "Nguyen Minh",
      "avatarUrl": null,
      "role": "USER",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

**Set-Cookie header:**
```
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800
```

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Field không hợp lệ |
| 409 | `EMAIL_ALREADY_EXISTS` | Email đã được đăng ký |

---

### POST /auth/login

**Permission:** PUBLIC

**Request Body:**
```json
{
  "email": "minh@example.com",
  "password": "MyPass123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "user": {
      "id": "clx9abc123",
      "email": "minh@example.com",
      "displayName": "Nguyen Minh",
      "avatarUrl": null,
      "role": "USER",
      "lastLoginAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Thiếu field |
| 401 | `INVALID_CREDENTIALS` | Email không tồn tại hoặc sai mật khẩu |
| 403 | `ACCOUNT_LOCKED` | Tài khoản bị khóa, kèm `lockedUntil` trong error details |
| 403 | `ACCOUNT_INACTIVE` | Tài khoản bị vô hiệu hóa bởi admin |

**Error details khi bị lock:**
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần",
    "details": {
      "lockedUntil": "2025-01-15T10:45:00.000Z",
      "remainingSeconds": 847
    }
  }
}
```

---

### POST /auth/refresh

**Permission:** PUBLIC (dùng cookie refreshToken)

**Request:** Không cần body, đọc `refreshToken` từ httpOnly cookie

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci..."
  }
}
```

Đồng thời set cookie `refreshToken` mới (token rotation).

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 401 | `REFRESH_TOKEN_MISSING` | Không có cookie |
| 401 | `REFRESH_TOKEN_INVALID` | Token không hợp lệ hoặc đã bị revoke |
| 401 | `REFRESH_TOKEN_EXPIRED` | Token hết hạn |

---

### POST /auth/logout

**Permission:** USER

**Request:** Không cần body

**Response 204:** No content

Xóa refresh token khỏi DB, clear cookie `refreshToken`.

---

### GET /auth/me

**Permission:** USER

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "clx9abc123",
    "email": "minh@example.com",
    "displayName": "Nguyen Minh",
    "avatarUrl": "https://res.cloudinary.com/tryspace/image/upload/v1/avatars/abc123.jpg",
    "role": "USER",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "lastLoginAt": "2025-01-15T10:30:00.000Z",
    "stats": {
      "totalOrders": 3,
      "totalDesigns": 7,
      "totalReviews": 2
    }
  }
}
```

---

### PATCH /auth/change-password

**Permission:** USER

**Request Body:**
```json
{
  "currentPassword": "MyPass123",
  "newPassword": "NewPass456"
}
```

**Validation:**
| Field | Rule |
|---|---|
| `currentPassword` | required |
| `newPassword` | required, min 8 chars, same regex, must differ from currentPassword |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại trên các thiết bị khác."
  }
}
```

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Mật khẩu mới không đủ mạnh |
| 400 | `SAME_PASSWORD` | Mật khẩu mới trùng mật khẩu cũ |
| 401 | `INVALID_CURRENT_PASSWORD` | Mật khẩu hiện tại sai |

---

## 3. Module Users — Người Dùng

### Business Rules

**BR-USER-01: Xem profile**
- Profile public của user chỉ hiển thị: `displayName`, `avatarUrl`, `createdAt`
- Profile private (của chính mình hoặc admin): thêm `email`, `stats`

**BR-USER-02: Cập nhật profile**
- User chỉ được cập nhật profile của chính mình
- `email` không được phép thay đổi qua endpoint này (đổi email là flow riêng)
- `avatarUrl` phải là URL Cloudinary hợp lệ (validate domain: `res.cloudinary.com`)

**BR-USER-03: Admin**
- Admin có thể xem danh sách tất cả users
- Admin có thể deactivate/reactivate tài khoản
- Admin KHÔNG thể tự deactivate tài khoản của chính mình

---

### GET /users/me

**Permission:** USER | Alias cho GET /auth/me

---

### PATCH /users/me

**Permission:** USER

**Request Body (tất cả fields optional):**
```json
{
  "displayName": "Nguyen Van Minh",
  "avatarUrl": "https://res.cloudinary.com/tryspace/image/upload/v1/avatars/abc.jpg"
}
```

**Validation:**
| Field | Rule |
|---|---|
| `displayName` | optional, 2–50 chars |
| `avatarUrl` | optional, must be valid Cloudinary URL or null |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "clx9abc123",
    "email": "minh@example.com",
    "displayName": "Nguyen Van Minh",
    "avatarUrl": "https://res.cloudinary.com/tryspace/...",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

---

### GET /users/:userId

**Permission:** PUBLIC

**Response 200 (public profile):**
```json
{
  "success": true,
  "data": {
    "id": "clx9abc123",
    "displayName": "Nguyen Minh",
    "avatarUrl": null,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "stats": {
      "totalReviews": 5,
      "totalDesigns": 3
    }
  }
}
```

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 404 | `USER_NOT_FOUND` | userId không tồn tại |

---

### GET /admin/users

**Permission:** ADMIN

**Query params:** `page`, `limit`, `search` (tìm theo email/displayName), `role`, `isActive`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx9abc123",
      "email": "minh@example.com",
      "displayName": "Nguyen Minh",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "lastLoginAt": "2025-01-20T08:00:00.000Z",
      "stats": {
        "totalOrders": 3,
        "totalReviews": 2
      }
    }
  ],
  "meta": { "total": 245, "page": 1, "limit": 20, "totalPages": 13, "hasNextPage": true, "hasPrevPage": false }
}
```

---

### PATCH /admin/users/:userId/status

**Permission:** ADMIN

**Request Body:**
```json
{
  "isActive": false,
  "reason": "Vi phạm điều khoản sử dụng"
}
```

**Validation:**
| Field | Rule |
|---|---|
| `isActive` | required, boolean |
| `reason` | required khi `isActive = false`, max 500 chars |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "userId": "clx9abc123",
    "isActive": false,
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 400 | `CANNOT_DEACTIVATE_SELF` | Admin tự deactivate chính mình |
| 404 | `USER_NOT_FOUND` | userId không tồn tại |

---

## 4. Module Categories — Danh Mục

### Business Rules

**BR-CAT-01:** Danh mục có cấu trúc phẳng (flat), không có sub-category trong MVP
**BR-CAT-02:** Chỉ Admin được tạo/sửa/xóa danh mục
**BR-CAT-03:** Không thể xóa danh mục nếu vẫn còn sản phẩm active thuộc danh mục đó
**BR-CAT-04:** `slug` được tự động generate từ `name` (lowercase, dấu → không dấu, space → gạch ngang), phải unique
**BR-CAT-05:** `displayOrder` quyết định thứ tự hiển thị trên frontend

---

### GET /categories

**Permission:** PUBLIC

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_01",
      "name": "Ghế",
      "slug": "ghe",
      "description": "Ghế sofa, ghế đơn, ghế ăn",
      "iconUrl": "https://res.cloudinary.com/.../ghe-icon.svg",
      "thumbnailUrl": "https://res.cloudinary.com/.../ghe-thumb.jpg",
      "displayOrder": 1,
      "productCount": 48
    },
    {
      "id": "cat_02",
      "name": "Bàn",
      "slug": "ban",
      "description": "Bàn ăn, bàn làm việc, bàn cà phê",
      "iconUrl": "https://res.cloudinary.com/.../ban-icon.svg",
      "thumbnailUrl": "https://res.cloudinary.com/.../ban-thumb.jpg",
      "displayOrder": 2,
      "productCount": 32
    }
  ]
}
```

---

### GET /categories/:slug

**Permission:** PUBLIC

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "cat_01",
    "name": "Ghế",
    "slug": "ghe",
    "description": "Ghế sofa, ghế đơn, ghế ăn",
    "iconUrl": "...",
    "thumbnailUrl": "...",
    "displayOrder": 1,
    "productCount": 48,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### POST /admin/categories

**Permission:** ADMIN

**Request Body:**
```json
{
  "name": "Kệ sách",
  "description": "Kệ sách, kệ tivi, kệ trang trí",
  "iconUrl": "https://res.cloudinary.com/.../ke-icon.svg",
  "thumbnailUrl": "https://res.cloudinary.com/.../ke-thumb.jpg",
  "displayOrder": 3
}
```

**Validation:**
| Field | Rule |
|---|---|
| `name` | required, 2–100 chars, unique (case-insensitive) |
| `description` | optional, max 500 chars |
| `iconUrl` | optional, valid Cloudinary URL |
| `thumbnailUrl` | optional, valid Cloudinary URL |
| `displayOrder` | optional, integer ≥ 1, default = max existing + 1 |

**Response 201:** Category object đầy đủ

---

### PATCH /admin/categories/:id

**Permission:** ADMIN

**Request Body:** Các field muốn cập nhật (partial update)

**Response 200:** Category object đã cập nhật

---

### DELETE /admin/categories/:id

**Permission:** ADMIN

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 409 | `CATEGORY_HAS_PRODUCTS` | Còn sản phẩm active thuộc danh mục |

**Response 204:** No content (khi xóa thành công)

---

## 5. Module Products — Sản Phẩm

### Business Rules

**BR-PROD-01: Trạng thái sản phẩm**
- `isActive = false`: Sản phẩm bị ẩn khỏi catalog người dùng, nhưng vẫn có thể truy cập qua ID nếu đã từng thêm vào giỏ/design
- Chỉ Admin mới thấy sản phẩm không active

**BR-PROD-02: Variants**
- Mỗi sản phẩm có tối thiểu 0 variant (dùng giá base) và tối đa 20 variants
- `priceAddon` của variant cộng thêm vào `basePrice` để ra giá cuối
- `priceAddon` có thể âm (giảm giá cho variant đặc biệt)
- Variant có thể có type = `color` (chỉ cần `hexColor`) hoặc `material` (có thể có `textureUrl`)
- Ít nhất 1 variant phải được đánh dấu `isDefault = true` nếu có variants

**BR-PROD-03: 3D Model**
- `modelUrl` phải là file GLB hosted trên Cloudinary
- `modelUrl` bắt buộc nếu `hasArSupport = true`
- Kích thước file tối đa: 50MB

**BR-PROD-04: Giá**
- `basePrice` phải ≥ 0
- `comparePrice` (giá gốc để gạch bỏ) phải > `basePrice` nếu được set
- `comparePrice = null` nghĩa là không có khuyến mãi

**BR-PROD-05: Rating**
- `averageRating` và `totalReviews` là computed fields, được cập nhật mỗi khi có review mới/xóa/sửa
- Không lưu trực tiếp, tính từ bảng `Review`

**BR-PROD-06: Tìm kiếm & Filter**
- Full-text search trên: `name`, `description`, `tags`
- Filter hỗ trợ: `categoryId`, `categorySlug`, `minPrice`, `maxPrice`, `color` (HEX), `material`, `hasArSupport`, `inStock`
- `inStock`: nếu `stockQuantity > 0` hoặc `stockQuantity = null` (không quản lý kho)

---

### GET /products

**Permission:** PUBLIC

**Query Params:**
| Param | Type | Mô tả |
|---|---|---|
| `search` | string | Full-text search |
| `categoryId` | string | Filter theo categoryId |
| `categorySlug` | string | Filter theo category slug |
| `minPrice` | integer | Giá tối thiểu (VND) |
| `maxPrice` | integer | Giá tối đa (VND) |
| `color` | string | Hex color (không có #), ví dụ: `C9A882` |
| `material` | string | Tên vật liệu, tìm gần đúng |
| `hasArSupport` | boolean | Chỉ lấy sản phẩm có AR |
| `tags` | string | Comma-separated tags |
| `sortBy` | `price` \| `createdAt` \| `rating` \| `popular` | Sort field |
| `sortOrder` | `asc` \| `desc` | Chiều sort |
| `page` | integer | Trang |
| `limit` | integer | Số item/trang (max 48) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_abc123",
      "name": "Ghế Sofa Oslo",
      "slug": "ghe-sofa-oslo",
      "category": {
        "id": "cat_01",
        "name": "Ghế",
        "slug": "ghe"
      },
      "thumbnailUrl": "https://res.cloudinary.com/.../oslo-thumb.jpg",
      "basePrice": 3500000,
      "comparePrice": 4200000,
      "finalPrice": 3500000,
      "hasArSupport": true,
      "averageRating": 4.3,
      "totalReviews": 24,
      "inStock": true,
      "tags": ["sofa", "bắc-âu", "vải"],
      "variants": [
        {
          "id": "var_001",
          "name": "Walnut Brown",
          "type": "material",
          "hexColor": "#C9A882",
          "textureUrl": "https://res.cloudinary.com/.../walnut-texture.jpg",
          "priceAddon": 0,
          "isDefault": true
        },
        {
          "id": "var_002",
          "name": "Charcoal Grey",
          "type": "material",
          "hexColor": "#6B6B6B",
          "textureUrl": "https://res.cloudinary.com/.../grey-texture.jpg",
          "priceAddon": 200000,
          "isDefault": false
        }
      ],
      "dimensions": {
        "width": 180,
        "height": 85,
        "depth": 90,
        "unit": "cm"
      }
    }
  ],
  "meta": {
    "total": 48,
    "page": 1,
    "limit": 12,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### GET /products/:idOrSlug

**Permission:** PUBLIC (isActive = true) | ADMIN (cả inactive)

Có thể query bằng `id` hoặc `slug`.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "prod_abc123",
    "name": "Ghế Sofa Oslo",
    "slug": "ghe-sofa-oslo",
    "description": "Ghế sofa Bắc Âu với chân gỗ óc chó tự nhiên...",
    "category": {
      "id": "cat_01",
      "name": "Ghế",
      "slug": "ghe"
    },
    "images": [
      {
        "id": "img_001",
        "url": "https://res.cloudinary.com/.../oslo-main.jpg",
        "alt": "Ghế Sofa Oslo - góc nhìn chính",
        "displayOrder": 1
      },
      {
        "id": "img_002",
        "url": "https://res.cloudinary.com/.../oslo-side.jpg",
        "alt": "Ghế Sofa Oslo - góc nhìn bên",
        "displayOrder": 2
      }
    ],
    "thumbnailUrl": "https://res.cloudinary.com/.../oslo-thumb.jpg",
    "modelUrl": "https://res.cloudinary.com/.../oslo.glb",
    "hasArSupport": true,
    "basePrice": 3500000,
    "comparePrice": 4200000,
    "finalPrice": 3500000,
    "variants": [
      {
        "id": "var_001",
        "name": "Walnut Brown",
        "type": "material",
        "hexColor": "#C9A882",
        "textureUrl": "https://res.cloudinary.com/.../walnut.jpg",
        "priceAddon": 0,
        "finalPrice": 3500000,
        "isDefault": true,
        "stockQuantity": 15
      }
    ],
    "dimensions": {
      "width": 180,
      "height": 85,
      "depth": 90,
      "unit": "cm",
      "weight": 42
    },
    "materials": ["Gỗ óc chó", "Vải linen"],
    "tags": ["sofa", "bắc-âu", "vải"],
    "averageRating": 4.3,
    "totalReviews": 24,
    "ratingDistribution": {
      "5": 14,
      "4": 7,
      "3": 2,
      "2": 1,
      "1": 0
    },
    "inStock": true,
    "stockQuantity": 15,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-10T00:00:00.000Z"
  }
}
```

---

### POST /admin/products

**Permission:** ADMIN

**Request Body:**
```json
{
  "name": "Ghế Sofa Oslo",
  "description": "Mô tả chi tiết...",
  "categoryId": "cat_01",
  "basePrice": 3500000,
  "comparePrice": 4200000,
  "modelUrl": "https://res.cloudinary.com/.../oslo.glb",
  "hasArSupport": true,
  "thumbnailUrl": "https://res.cloudinary.com/.../oslo-thumb.jpg",
  "images": [
    { "url": "https://res.cloudinary.com/.../oslo-main.jpg", "alt": "Góc chính", "displayOrder": 1 }
  ],
  "dimensions": {
    "width": 180,
    "height": 85,
    "depth": 90,
    "unit": "cm",
    "weight": 42
  },
  "materials": ["Gỗ óc chó", "Vải linen"],
  "tags": ["sofa", "bắc-âu"],
  "stockQuantity": 15,
  "variants": [
    {
      "name": "Walnut Brown",
      "type": "material",
      "hexColor": "#C9A882",
      "textureUrl": "https://res.cloudinary.com/.../walnut.jpg",
      "priceAddon": 0,
      "isDefault": true,
      "stockQuantity": 8
    }
  ]
}
```

**Validation:**
| Field | Rule |
|---|---|
| `name` | required, 2–200 chars |
| `description` | required, 10–5000 chars |
| `categoryId` | required, phải tồn tại trong DB |
| `basePrice` | required, integer ≥ 0 |
| `comparePrice` | optional, phải > `basePrice` |
| `modelUrl` | required nếu `hasArSupport = true`, valid Cloudinary URL |
| `thumbnailUrl` | required, valid Cloudinary URL |
| `images` | optional, array tối đa 10 items |
| `dimensions.width/height/depth` | required, số dương |
| `dimensions.unit` | `cm` hoặc `mm` |
| `tags` | optional, array tối đa 10 strings, mỗi tag max 50 chars |
| `stockQuantity` | optional, integer ≥ 0, null = không quản lý kho |
| `variants` | optional, array tối đa 20 items |
| `variants[].name` | required nếu có variant, unique trong sản phẩm |
| `variants[].type` | `color` hoặc `material` |
| `variants[].hexColor` | required nếu type = `color`, valid hex |
| Phải có đúng 1 variant `isDefault = true` | nếu có variants |

**Response 201:** Product object đầy đủ

---

### PATCH /admin/products/:id

**Permission:** ADMIN

**Request Body:** Partial update, bất kỳ field nào

Khi cập nhật `variants`: Gửi toàn bộ mảng variants mới (replace, không merge). Backend sẽ:
1. Xóa variants cũ không có trong mảng mới
2. Cập nhật variants đã có (match bằng `id`)
3. Tạo mới variants chưa có `id`

**Response 200:** Product object đầy đủ

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 404 | `PRODUCT_NOT_FOUND` | Product không tồn tại |
| 400 | `NO_DEFAULT_VARIANT` | Có variants nhưng không có default |

---

### DELETE /admin/products/:id

**Permission:** ADMIN

Không xóa cứng — set `isActive = false` (soft delete).

Nếu muốn xóa cứng phải có thêm query param `?permanent=true` và không được có order nào chứa sản phẩm này.

**Response 204:** No content

---

### GET /products/:id/related

**Permission:** PUBLIC

Lấy tối đa 8 sản phẩm liên quan (cùng category, active, không phải sản phẩm hiện tại, sort by rating).

**Response 200:**
```json
{
  "success": true,
  "data": [ /* mảng product objects dạng rút gọn */ ]
}
```

---

## 6. Module Reviews — Đánh Giá

### Business Rules — ĐÂY LÀ MODULE PHỨC TẠP NHẤT VỀ RULES

**BR-REV-01: Quyền viết review**
- Chỉ user đã đăng nhập mới được viết review
- **Chỉ user đã mua sản phẩm** (có Order với status = `DELIVERED` chứa productId này) mới được viết review
- Mỗi user chỉ được viết **1 review trên 1 sản phẩm** (unique constraint: userId + productId)
- User có thể **chỉnh sửa** review của mình (nhưng không thể xóa trừ Admin)
- User không thể review sản phẩm trong đơn hàng của người khác

**BR-REV-02: Nội dung review**
- `rating`: bắt buộc, integer 1–5
- `title`: tùy chọn, max 100 chars
- `body`: tùy chọn, max 2000 chars
- `images`: tùy chọn, tối đa 5 ảnh Cloudinary

**BR-REV-03: Trạng thái review**
- Review mặc định `status = PENDING` (chờ kiểm duyệt) trong môi trường production
- Trong MVP: mặc định `status = APPROVED` (auto-approve)
- Admin có thể set `status = REJECTED` với lý do

**BR-REV-04: Hiển thị**
- Chỉ hiển thị review có `status = APPROVED`
- Admin thấy tất cả review (kể cả PENDING, REJECTED)
- Review được sort mặc định: `helpful DESC, createdAt DESC`

**BR-REV-05: Helpful votes**
- User đã đăng nhập có thể mark review là "helpful"
- Mỗi user chỉ vote 1 lần cho 1 review
- User không thể vote cho review của chính mình
- Có thể bỏ vote bằng cách vote lại (toggle)

**BR-REV-06: Cập nhật rating sản phẩm**
- Sau mỗi thao tác tạo/xóa/approve/reject review: tự động cập nhật `averageRating` và `totalReviews` của Product
- Chỉ tính review có `status = APPROVED`

**BR-REV-07: Phản hồi của shop (admin)**
- Admin có thể thêm 1 reply chính thức cho mỗi review
- Reply được hiển thị là "Phản hồi từ TrySpace"

---

### GET /products/:productId/reviews

**Permission:** PUBLIC

**Query Params:**
| Param | Type | Mô tả |
|---|---|---|
| `rating` | integer 1–5 | Filter theo số sao |
| `hasImages` | boolean | Chỉ review có kèm ảnh |
| `sortBy` | `helpful` \| `createdAt` \| `rating` | Sort field |
| `sortOrder` | `asc` \| `desc` | |
| `page`, `limit` | | Mặc định limit = 10 |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rev_001",
      "user": {
        "id": "clx9abc123",
        "displayName": "Nguyen Minh",
        "avatarUrl": null
      },
      "rating": 5,
      "title": "Chiếc ghế hoàn hảo cho phòng làm việc",
      "body": "Đặt thử bằng AR trước khi mua, kích thước vừa vặn với phòng...",
      "images": [
        {
          "id": "rimg_001",
          "url": "https://res.cloudinary.com/.../review1.jpg",
          "displayOrder": 1
        }
      ],
      "variantUsed": {
        "id": "var_001",
        "name": "Walnut Brown"
      },
      "helpfulCount": 12,
      "isHelpful": false,
      "adminReply": {
        "body": "Cảm ơn bạn đã tin tưởng TrySpace!",
        "repliedAt": "2025-01-16T10:00:00.000Z"
      },
      "status": "APPROVED",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "isEdited": false
    }
  ],
  "meta": { "total": 24, "page": 1, "limit": 10, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false }
}
```

> `isHelpful`: `true`/`false` nếu user đã đăng nhập, `null` nếu guest

---

### POST /products/:productId/reviews

**Permission:** USER

**Request Body:**
```json
{
  "rating": 5,
  "title": "Chiếc ghế hoàn hảo",
  "body": "Mình đặt thử AR trước, kích thước chuẩn với phòng...",
  "variantId": "var_001",
  "images": [
    "https://res.cloudinary.com/.../my-photo.jpg"
  ]
}
```

**Validation:**
| Field | Rule |
|---|---|
| `rating` | required, integer 1–5 |
| `title` | optional, max 100 chars |
| `body` | optional, max 2000 chars |
| `variantId` | optional, phải thuộc product này |
| `images` | optional, array max 5 items, valid Cloudinary URLs |

**Business rule checks (theo thứ tự):**
1. Product phải tồn tại và `isActive = true`
2. User phải có Order với status `DELIVERED` chứa `productId`
3. User chưa có review nào cho product này

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "rev_002",
    "rating": 5,
    "title": "Chiếc ghế hoàn hảo",
    "body": "...",
    "status": "APPROVED",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 403 | `REVIEW_NOT_PURCHASED` | User chưa mua sản phẩm này |
| 409 | `REVIEW_ALREADY_EXISTS` | User đã review sản phẩm này rồi |
| 404 | `PRODUCT_NOT_FOUND` | Product không tồn tại |

---

### PATCH /products/:productId/reviews/:reviewId

**Permission:** OWNER (chỉ người viết review)

**Request Body:** (tất cả optional)
```json
{
  "rating": 4,
  "title": "Tiêu đề mới",
  "body": "Nội dung đã cập nhật...",
  "images": ["https://res.cloudinary.com/.../new-photo.jpg"]
}
```

Sau khi cập nhật: `isEdited = true`, cập nhật `updatedAt`
Nếu rating thay đổi: trigger cập nhật `averageRating` của Product

**Response 200:** Review object đã cập nhật

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 403 | `FORBIDDEN` | Không phải review của user này |

---

### DELETE /products/:productId/reviews/:reviewId

**Permission:** ADMIN

Chỉ Admin được xóa review. User không được xóa review của mình.

**Response 204:** No content

Sau khi xóa: cập nhật `averageRating` và `totalReviews` của Product

---

### POST /products/:productId/reviews/:reviewId/helpful

**Permission:** USER

Không cần body. Toggle helpful vote.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "reviewId": "rev_001",
    "helpfulCount": 13,
    "isHelpful": true
  }
}
```

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 400 | `CANNOT_VOTE_OWN_REVIEW` | User vote cho review của chính mình |

---

### POST /admin/products/:productId/reviews/:reviewId/reply

**Permission:** ADMIN

**Request Body:**
```json
{
  "body": "Cảm ơn bạn đã tin tưởng sản phẩm của chúng tôi!"
}
```

**Validation:** `body` required, max 1000 chars

Nếu review đã có reply: override reply cũ (chỉ 1 admin reply/review)

**Response 200:** Review object với `adminReply` đã cập nhật

---

### PATCH /admin/products/:productId/reviews/:reviewId/status

**Permission:** ADMIN

**Request Body:**
```json
{
  "status": "REJECTED",
  "reason": "Nội dung không phù hợp với chính sách"
}
```

**Validation:**
| Field | Rule |
|---|---|
| `status` | required, enum: `APPROVED` \| `REJECTED` \| `PENDING` |
| `reason` | required khi `status = REJECTED`, max 500 chars |

**Response 200:** Review object với status mới

Trigger cập nhật `averageRating` khi approve hoặc reject

---

### GET /users/me/reviews

**Permission:** USER

Lấy tất cả review của user hiện tại (kể cả PENDING, REJECTED)

**Response 200:** Danh sách review kèm product info

---

## 7. Module Cart — Giỏ Hàng

### Business Rules

**BR-CART-01: Cart ownership**
- Mỗi user chỉ có 1 cart active tại một thời điểm
- Cart được tạo tự động khi user thêm item đầu tiên
- Cart được persist trong DB (không mất khi đóng browser)

**BR-CART-02: Cart items**
- Combination (`productId` + `variantId`) phải unique trong cart
- Nếu thêm sản phẩm đã có trong cart (cùng productId + variantId): tăng `quantity` lên
- `quantity` tối thiểu = 1, tối đa = 99
- Nếu `variantId = null`: dùng giá `basePrice`, không chọn variant

**BR-CART-03: Kiểm tra hàng tồn**
- Khi thêm vào giỏ: check `stockQuantity` của variant (hoặc product nếu không có variant)
- Nếu `stockQuantity = null`: không quản lý kho, cho thêm thoải mái
- Nếu `stockQuantity = 0`: trả lỗi `OUT_OF_STOCK`
- Nếu `quantity > stockQuantity`: trả lỗi `INSUFFICIENT_STOCK`

**BR-CART-04: Giá**
- Giá được tính tại thời điểm **checkout** (không phải khi thêm vào giỏ)
- Nếu sản phẩm thay đổi giá sau khi đã vào giỏ: dùng giá mới khi checkout
- Khi lấy cart: hiển thị `currentPrice` (giá hiện tại) và `priceAtAdd` (không lưu, dùng currentPrice)

**BR-CART-05: Sản phẩm bị vô hiệu hóa**
- Nếu sản phẩm trong cart bị `isActive = false`: vẫn hiển thị trong cart nhưng đánh dấu `isAvailable = false`, không cho checkout

**BR-CART-06: Cart expiry**
- Cart items không tự hết hạn trong MVP

---

### GET /cart

**Permission:** USER

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "cart_abc123",
    "items": [
      {
        "id": "item_001",
        "product": {
          "id": "prod_abc123",
          "name": "Ghế Sofa Oslo",
          "slug": "ghe-sofa-oslo",
          "thumbnailUrl": "https://res.cloudinary.com/.../oslo-thumb.jpg",
          "isActive": true
        },
        "variant": {
          "id": "var_001",
          "name": "Walnut Brown",
          "hexColor": "#C9A882"
        },
        "quantity": 2,
        "unitPrice": 3500000,
        "subtotal": 7000000,
        "isAvailable": true,
        "stockQuantity": 15,
        "addedAt": "2025-01-15T10:00:00.000Z"
      }
    ],
    "summary": {
      "itemCount": 1,
      "totalQuantity": 2,
      "subtotal": 7000000,
      "unavailableItems": 0
    }
  }
}
```

---

### POST /cart/items

**Permission:** USER

**Request Body:**
```json
{
  "productId": "prod_abc123",
  "variantId": "var_001",
  "quantity": 1
}
```

**Validation:**
| Field | Rule |
|---|---|
| `productId` | required, phải tồn tại và `isActive = true` |
| `variantId` | optional, phải thuộc product này |
| `quantity` | required, integer 1–99 |

**Response 200** (trả về cart đầy đủ sau khi cập nhật):
```json
{
  "success": true,
  "data": { /* cart object đầy đủ */ }
}
```

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 404 | `PRODUCT_NOT_FOUND` | Product không tồn tại hoặc inactive |
| 400 | `OUT_OF_STOCK` | `stockQuantity = 0` |
| 400 | `INSUFFICIENT_STOCK` | `quantity > stockQuantity`, kèm `availableQuantity` trong details |
| 400 | `INVALID_VARIANT` | variantId không thuộc product này |

---

### PATCH /cart/items/:itemId

**Permission:** OWNER (item phải thuộc cart của user)

**Request Body:**
```json
{
  "quantity": 3
}
```

**Validation:** `quantity` required, integer 1–99

Nếu `quantity > stockQuantity`: trả lỗi `INSUFFICIENT_STOCK`

**Response 200:** Cart object đầy đủ sau cập nhật

---

### DELETE /cart/items/:itemId

**Permission:** OWNER

**Response 200:** Cart object đầy đủ sau khi xóa

---

### DELETE /cart

**Permission:** USER

Xóa toàn bộ items trong cart (clear cart).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "cart_abc123",
    "items": [],
    "summary": {
      "itemCount": 0,
      "totalQuantity": 0,
      "subtotal": 0,
      "unavailableItems": 0
    }
  }
}
```

---

## 8. Module Orders — Đơn Hàng

### Business Rules

**BR-ORDER-01: Tạo đơn hàng**
- Chỉ được checkout khi cart có ít nhất 1 item `isAvailable = true`
- Tại thời điểm tạo đơn: snapshot giá của tất cả sản phẩm vào `Order` (giá không đổi sau này)
- Sau khi tạo đơn thành công: clear cart
- Tạo đơn trừ `stockQuantity` ngay (reserve stock)

**BR-ORDER-02: Order status flow**
```
PENDING_PAYMENT → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → COMPLETED
                                                               → RETURN_REQUESTED → RETURNED
      ↓
   CANCELLED (từ PENDING_PAYMENT, CONFIRMED)
```
- User chỉ có thể hủy đơn khi status = `PENDING_PAYMENT` hoặc `CONFIRMED`
- Khi hủy: cộng lại `stockQuantity`
- Admin có thể thay đổi mọi status

**BR-ORDER-03: Khi DELIVERED**
- Trigger mở khóa quyền review cho user đối với các sản phẩm trong đơn
- Cập nhật user stats (`totalOrders`)

**BR-ORDER-04: Scope MVP**
- Không tích hợp payment gateway thật
- `paymentMethod` = `MOCK` | `COD`
- `paymentStatus` = `PENDING` | `PAID` | `REFUNDED`
- Khi tạo đơn với `paymentMethod = MOCK`: tự động set `paymentStatus = PAID`, `status = CONFIRMED`

---

### POST /orders

**Permission:** USER

**Request Body:**
```json
{
  "shippingAddress": {
    "fullName": "Nguyen Van Minh",
    "phone": "0901234567",
    "addressLine1": "123 Nguyen Hue",
    "addressLine2": "Quận 1",
    "city": "Hồ Chí Minh",
    "province": "Hồ Chí Minh"
  },
  "paymentMethod": "MOCK",
  "note": "Giao giờ hành chính"
}
```

**Validation:**
| Field | Rule |
|---|---|
| `shippingAddress.fullName` | required, 2–100 chars |
| `shippingAddress.phone` | required, valid Vietnamese phone: `^(0\|84)(3\|5\|7\|8\|9)\d{8}$` |
| `shippingAddress.addressLine1` | required, 5–200 chars |
| `shippingAddress.city` | required |
| `shippingAddress.province` | required |
| `paymentMethod` | required, enum: `MOCK` \| `COD` |
| `note` | optional, max 500 chars |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "ord_abc123",
    "orderNumber": "TS-20250115-0001",
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "paymentMethod": "MOCK",
    "items": [
      {
        "id": "oi_001",
        "product": {
          "id": "prod_abc123",
          "name": "Ghế Sofa Oslo",
          "thumbnailUrl": "..."
        },
        "variant": {
          "id": "var_001",
          "name": "Walnut Brown"
        },
        "quantity": 2,
        "unitPrice": 3500000,
        "subtotal": 7000000
      }
    ],
    "shippingAddress": { "..." },
    "subtotal": 7000000,
    "shippingFee": 0,
    "total": 7000000,
    "note": "Giao giờ hành chính",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 400 | `CART_EMPTY` | Giỏ hàng trống |
| 400 | `CART_HAS_UNAVAILABLE_ITEMS` | Có item không available |
| 400 | `INSUFFICIENT_STOCK` | Hết hàng ngay lúc checkout (race condition) |

---

### GET /orders

**Permission:** USER

Lấy danh sách đơn hàng của user hiện tại.

**Query Params:** `status`, `page`, `limit`

**Response 200:** Danh sách order objects rút gọn (không cần chi tiết từng item)

---

### GET /orders/:id

**Permission:** OWNER (hoặc ADMIN)

**Response 200:** Order object đầy đủ như response POST /orders

---

### POST /orders/:id/cancel

**Permission:** OWNER

Không cần body.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "ord_abc123",
    "status": "CANCELLED",
    "cancelledAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 400 | `ORDER_CANNOT_BE_CANCELLED` | Status không phải PENDING_PAYMENT hoặc CONFIRMED, kèm `currentStatus` |

---

### PATCH /admin/orders/:id/status

**Permission:** ADMIN

**Request Body:**
```json
{
  "status": "SHIPPED",
  "trackingNumber": "VN123456789",
  "note": "Đã bàn giao cho GHTK"
}
```

**Response 200:** Order object đầy đủ

---

### GET /admin/orders

**Permission:** ADMIN

**Query Params:** `status`, `paymentStatus`, `userId`, `search` (orderNumber), `page`, `limit`

---

## 9. Module Designs — Thiết Kế Phòng

### Business Rules

**BR-DESIGN-01: Ownership & Access**
- User đã đăng nhập mới được lưu design
- Guest có thể xem design qua `shareToken` (public access)
- User chỉ xem/sửa/xóa design của chính mình
- Admin có thể xem tất cả designs

**BR-DESIGN-02: Share Token**
- `shareToken` được tạo tự động khi save design (UUID v4)
- Share token là bất biến — không thể thay đổi sau khi tạo
- Link chia sẻ: `https://tryspace.app/design/{shareToken}`
- Người xem qua share link KHÔNG cần đăng nhập

**BR-DESIGN-03: Design items**
- Mỗi design có thể chứa tối đa 20 items (sản phẩm trong phòng)
- Cùng 1 sản phẩm có thể xuất hiện nhiều lần trong 1 design (ví dụ: 2 chiếc ghế giống nhau)
- `transform` lưu position/rotation/scale trong không gian AR
- `variantId = null` nghĩa là dùng default variant

**BR-DESIGN-04: Thumbnail**
- Thumbnail là base64 PNG screenshot từ AR session
- Khi save: upload thumbnail lên Cloudinary, lưu URL vào DB
- Nếu không có thumbnail: dùng ảnh thumbnail của sản phẩm đầu tiên trong design

**BR-DESIGN-05: Clone design**
- User có thể "clone" design của người khác (qua share link) về tài khoản của mình
- Clone tạo bản sao design với `userId` là user clone, `shareToken` mới

**BR-DESIGN-06: Giới hạn**
- Mỗi user tối đa 50 designs active
- Khi vượt quá: phải xóa design cũ trước khi tạo mới

---

### GET /designs

**Permission:** USER

Lấy danh sách designs của user hiện tại.

**Query Params:** `page`, `limit`, `sortBy` (`createdAt` | `updatedAt` | `name`)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "design_abc123",
      "name": "Phòng khách nhà mình",
      "thumbnailUrl": "https://res.cloudinary.com/.../design-thumb.jpg",
      "shareToken": "8f14e45f-ceea-467a-a866-1234abcd",
      "shareUrl": "https://tryspace.app/design/8f14e45f-ceea-467a-a866-1234abcd",
      "itemCount": 3,
      "totalValue": 12000000,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T11:00:00.000Z"
    }
  ],
  "meta": { "total": 7, "page": 1, "limit": 12, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false }
}
```

---

### POST /designs

**Permission:** USER

**Request Body:**
```json
{
  "name": "Phòng khách nhà mình",
  "thumbnail": "data:image/png;base64,iVBORw0KGgo...",
  "items": [
    {
      "productId": "prod_abc123",
      "variantId": "var_001",
      "transform": {
        "position": { "x": 0.5, "y": 0.0, "z": -1.2 },
        "rotation": { "x": 0, "y": 45, "z": 0 },
        "scale": 1.0
      }
    },
    {
      "productId": "prod_def456",
      "variantId": null,
      "transform": {
        "position": { "x": -1.0, "y": 0.0, "z": -0.8 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "scale": 1.0
      }
    }
  ]
}
```

**Validation:**
| Field | Rule |
|---|---|
| `name` | required, 1–100 chars |
| `thumbnail` | optional, base64 PNG string (max 5MB khi decoded) |
| `items` | required, array 1–20 items |
| `items[].productId` | required, phải tồn tại |
| `items[].variantId` | optional, phải thuộc product nếu được cung cấp |
| `items[].transform.position.x/y/z` | required, float |
| `items[].transform.rotation.x/y/z` | required, float (degrees) |
| `items[].transform.scale` | required, float 0.1–10.0 |

**Xử lý thumbnail:**
1. Nếu `thumbnail` được gửi: decode base64, upload lên Cloudinary, lưu URL
2. Nếu không: set `thumbnailUrl = null` (frontend dùng product thumbnail)

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "design_abc123",
    "name": "Phòng khách nhà mình",
    "thumbnailUrl": "https://res.cloudinary.com/.../design-thumb.jpg",
    "shareToken": "8f14e45f-ceea-467a-a866-1234abcd",
    "shareUrl": "https://tryspace.app/design/8f14e45f-ceea-467a-a866-1234abcd",
    "items": [
      {
        "id": "di_001",
        "product": {
          "id": "prod_abc123",
          "name": "Ghế Sofa Oslo",
          "thumbnailUrl": "...",
          "basePrice": 3500000
        },
        "variant": {
          "id": "var_001",
          "name": "Walnut Brown",
          "hexColor": "#C9A882"
        },
        "transform": {
          "position": { "x": 0.5, "y": 0.0, "z": -1.2 },
          "rotation": { "x": 0, "y": 45, "z": 0 },
          "scale": 1.0
        },
        "unitPrice": 3500000
      }
    ],
    "totalValue": 3500000,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 400 | `DESIGN_LIMIT_EXCEEDED` | Đã có 50 designs |
| 400 | `INVALID_PRODUCT` | productId không tồn tại hoặc inactive |

---

### GET /designs/:id

**Permission:** OWNER

**Response 200:** Design object đầy đủ như POST response

---

### GET /designs/shared/:shareToken

**Permission:** PUBLIC

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "design_abc123",
    "name": "Phòng khách nhà mình",
    "thumbnailUrl": "...",
    "shareToken": "8f14e45f...",
    "owner": {
      "displayName": "Nguyen Minh",
      "avatarUrl": null
    },
    "items": [ /* chi tiết từng item */ ],
    "totalValue": 12000000,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error cases:**
| HTTP | Code | Khi nào |
|---|---|---|
| 404 | `DESIGN_NOT_FOUND` | shareToken không tồn tại |

---

### PATCH /designs/:id

**Permission:** OWNER

**Request Body:** (partial update)
```json
{
  "name": "Phòng khách mới",
  "thumbnail": "data:image/png;base64,...",
  "items": [ /* mảng items đầy đủ — replace toàn bộ */ ]
}
```

Khi `items` được gửi: replace toàn bộ design items (delete old + insert new)

**Response 200:** Design object đầy đủ

---

### DELETE /designs/:id

**Permission:** OWNER

**Response 204:** No content

---

### POST /designs/shared/:shareToken/clone

**Permission:** USER

Không cần body. Clone design từ share link về tài khoản user.

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "design_xyz789",
    "name": "Phòng khách nhà mình (copy)",
    "shareToken": "new-unique-token",
    "clonedFrom": "8f14e45f-ceea-467a-a866-1234abcd",
    "createdAt": "2025-01-15T12:00:00.000Z"
  }
}
```

---

### POST /designs/:id/add-all-to-cart

**Permission:** USER + OWNER

Thêm tất cả sản phẩm trong design vào giỏ hàng của user.

Nếu sản phẩm đã trong giỏ (cùng productId + variantId): tăng quantity
Sản phẩm `isActive = false`: bỏ qua, ghi vào `skipped`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "added": 3,
    "skipped": 1,
    "skippedItems": [
      {
        "productId": "prod_old999",
        "name": "Sản phẩm đã ngừng bán",
        "reason": "PRODUCT_INACTIVE"
      }
    ],
    "cart": { /* cart object đầy đủ */ }
  }
}
```

---

## 10. Module Wishlist — Yêu Thích

### Business Rules

**BR-WISH-01:** Mỗi user có 1 wishlist
**BR-WISH-02:** Toggle — nếu sản phẩm đã trong wishlist, gọi lại endpoint sẽ xóa khỏi wishlist
**BR-WISH-03:** Tối đa 200 items trong wishlist
**BR-WISH-04:** Sản phẩm inactive vẫn hiển thị trong wishlist nhưng đánh dấu `isAvailable = false`

---

### GET /wishlist

**Permission:** USER

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "wi_001",
        "product": {
          "id": "prod_abc123",
          "name": "Ghế Sofa Oslo",
          "thumbnailUrl": "...",
          "basePrice": 3500000,
          "comparePrice": 4200000,
          "averageRating": 4.3,
          "isActive": true
        },
        "addedAt": "2025-01-14T10:00:00.000Z"
      }
    ],
    "totalItems": 1
  }
}
```

---

### POST /wishlist/toggle

**Permission:** USER

**Request Body:**
```json
{
  "productId": "prod_abc123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "productId": "prod_abc123",
    "action": "added",
    "totalItems": 5
  }
}
```

`action`: `"added"` hoặc `"removed"`

---

### GET /wishlist/check/:productId

**Permission:** USER

Kiểm tra nhanh xem sản phẩm có trong wishlist không (dùng cho icon trái tim trên UI).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "productId": "prod_abc123",
    "isInWishlist": true
  }
}
```

---

## 11. Module Search — Tìm Kiếm

### Business Rules

**BR-SEARCH-01:** Full-text search dùng PostgreSQL `tsvector` trên: `name`, `description`, `tags`
**BR-SEARCH-02:** Search chỉ trả về sản phẩm `isActive = true`
**BR-SEARCH-03:** Lưu search history (nếu user đã đăng nhập, tối đa 20 queries gần nhất)
**BR-SEARCH-04:** Search suggestions dựa trên: product names, category names, popular tags

---

### GET /search

**Permission:** PUBLIC

**Query Params:**
| Param | Type | Mô tả |
|---|---|---|
| `q` | string | Search query (required, min 2 chars) |
| Các filter params giống /products | | |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "query": "ghế sofa",
    "products": [ /* product objects */ ],
    "categories": [
      { "id": "cat_01", "name": "Ghế", "slug": "ghe", "matchCount": 48 }
    ]
  },
  "meta": { "total": 52, "page": 1, "limit": 12, "totalPages": 5, "hasNextPage": true, "hasPrevPage": false }
}
```

---

### GET /search/suggestions

**Permission:** PUBLIC

**Query Params:** `q` (min 1 char)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      { "type": "product", "text": "Ghế Sofa Oslo", "slug": "ghe-sofa-oslo" },
      { "type": "product", "text": "Ghế Sofa Bergen", "slug": "ghe-sofa-bergen" },
      { "type": "category", "text": "Ghế", "slug": "ghe" },
      { "type": "tag", "text": "ghế bắc âu" }
    ]
  }
}
```

---

## 12. Module Upload — Tải File

### Business Rules

**BR-UP-01:** Tất cả file upload đều qua Cloudinary (không lưu local)
**BR-UP-02:** Chỉ chấp nhận: JPEG, PNG, WebP (ảnh), GLB, GLTF (3D model)
**BR-UP-03:** Giới hạn kích thước: ảnh = 10MB, 3D model = 50MB
**BR-UP-04:** Upload ảnh avatar: chỉ JPEG/PNG/WebP, tối đa 5MB, tự động resize về 400x400
**BR-UP-05:** Upload review images: max 5 ảnh, tự động resize về 1200px width
**BR-UP-06:** Upload 3D models: chỉ Admin

---

### POST /upload/image

**Permission:** USER

**Request:** `multipart/form-data`
| Field | Type | Mô tả |
|---|---|---|
| `file` | File | Image file (JPEG/PNG/WebP) |
| `purpose` | string | `avatar` \| `review` \| `design-thumbnail` |

**Validation:**
| Rule | |
|---|---|
| MIME type | `image/jpeg`, `image/png`, `image/webp` |
| Max size | avatar: 5MB, review: 10MB, design: 5MB |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/tryspace/image/upload/v1/uploads/abc123.jpg",
    "publicId": "uploads/abc123",
    "width": 400,
    "height": 400,
    "format": "jpg",
    "bytes": 45231
  }
}
```

---

### POST /upload/model

**Permission:** ADMIN

**Request:** `multipart/form-data`
| Field | Type | Mô tả |
|---|---|---|
| `file` | File | GLB/GLTF file |

**Validation:** MIME type `model/gltf-binary` hoặc `model/gltf+json`, max 50MB

**Response 201:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/tryspace/raw/upload/v1/models/product123.glb",
    "publicId": "models/product123",
    "bytes": 3500000
  }
}
```

---

## 13. Error Reference

### HTTP Status → Error Code Mapping

| HTTP | Error Code | Mô tả |
|---|---|---|
| **400** | `VALIDATION_ERROR` | Request body/params không hợp lệ |
| **400** | `CART_EMPTY` | Checkout với giỏ trống |
| **400** | `CART_HAS_UNAVAILABLE_ITEMS` | Có item không khả dụng |
| **400** | `OUT_OF_STOCK` | Hết hàng |
| **400** | `INSUFFICIENT_STOCK` | Không đủ số lượng |
| **400** | `SAME_PASSWORD` | Mật khẩu mới trùng cũ |
| **400** | `CANNOT_DEACTIVATE_SELF` | Admin tự deactivate |
| **400** | `CANNOT_VOTE_OWN_REVIEW` | Vote review của chính mình |
| **400** | `ORDER_CANNOT_BE_CANCELLED` | Đơn không thể hủy |
| **400** | `DESIGN_LIMIT_EXCEEDED` | Vượt quá 50 designs |
| **400** | `NO_DEFAULT_VARIANT` | Có variants nhưng không có default |
| **401** | `AUTH_TOKEN_MISSING` | Không có access token |
| **401** | `AUTH_TOKEN_INVALID` | Token sai hoặc hết hạn |
| **401** | `INVALID_CREDENTIALS` | Sai email/password |
| **401** | `INVALID_CURRENT_PASSWORD` | Sai mật khẩu hiện tại |
| **401** | `REFRESH_TOKEN_MISSING` | Không có refresh token cookie |
| **401** | `REFRESH_TOKEN_INVALID` | Refresh token không hợp lệ |
| **401** | `REFRESH_TOKEN_EXPIRED` | Refresh token hết hạn |
| **403** | `FORBIDDEN` | Không có quyền với resource này |
| **403** | `ACCOUNT_LOCKED` | Tài khoản bị lock |
| **403** | `ACCOUNT_INACTIVE` | Tài khoản bị vô hiệu hóa |
| **403** | `REVIEW_NOT_PURCHASED` | Chưa mua sản phẩm |
| **404** | `USER_NOT_FOUND` | User không tồn tại |
| **404** | `PRODUCT_NOT_FOUND` | Product không tồn tại |
| **404** | `CATEGORY_NOT_FOUND` | Category không tồn tại |
| **404** | `ORDER_NOT_FOUND` | Order không tồn tại |
| **404** | `DESIGN_NOT_FOUND` | Design không tồn tại |
| **404** | `REVIEW_NOT_FOUND` | Review không tồn tại |
| **404** | `CART_ITEM_NOT_FOUND` | Cart item không tồn tại |
| **409** | `EMAIL_ALREADY_EXISTS` | Email đã được đăng ký |
| **409** | `REVIEW_ALREADY_EXISTS` | Đã review sản phẩm này |
| **409** | `CATEGORY_HAS_PRODUCTS` | Category vẫn còn sản phẩm |
| **413** | `FILE_TOO_LARGE` | File vượt quá giới hạn |
| **415** | `UNSUPPORTED_FILE_TYPE` | Loại file không được chấp nhận |
| **429** | `RATE_LIMIT_EXCEEDED` | Quá nhiều requests |
| **500** | `INTERNAL_ERROR` | Lỗi server |

### Error Response với Details

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [
      {
        "field": "email",
        "message": "Email không đúng định dạng",
        "received": "not-an-email"
      },
      {
        "field": "password",
        "message": "Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số"
      }
    ]
  }
}
```

---

## 14. Middleware Stack

### Thứ tự middleware (global, áp dụng cho mọi request):

```
Request
  │
  ▼
1. cors()                  — Allow origins: localhost:5173, tryspace.vercel.app
  │
  ▼
2. helmet()                — Security headers (CSP, HSTS, X-Frame-Options...)
  │
  ▼
3. morgan('combined')      — Request logging
  │
  ▼
4. express.json({ limit: '10mb' })   — Parse JSON body
  │
  ▼
5. express.urlencoded()    — Parse URL-encoded body
  │
  ▼
6. rateLimiter             — 100 req/min per IP (200 cho /auth routes)
  │
  ▼
7. Routes...
  │
  ▼ (chỉ khi route yêu cầu auth)
8. authenticate()          — Verify JWT, attach req.user
  │
  ▼ (chỉ khi route yêu cầu admin)
9. requireAdmin()          — Check req.user.role === 'ADMIN'
  │
  ▼ (trên các route có body)
10. validate(schema)       — Zod validation middleware
  │
  ▼
11. Controller handler
  │
  ▼
12. errorHandler()         — Global error handler (catch all)
```

### authenticate() middleware logic:

```typescript
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'AUTH_TOKEN_MISSING'));
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return next(new ApiError(401, 'AUTH_TOKEN_INVALID'));
    if (!user.isActive) return next(new ApiError(403, 'ACCOUNT_INACTIVE'));
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'AUTH_TOKEN_INVALID', 'Token đã hết hạn'));
    }
    return next(new ApiError(401, 'AUTH_TOKEN_INVALID'));
  }
};
```

### validate() middleware:

```typescript
export const validate = (schema: ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return next(new ApiError(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', details));
  }
  req.body = result.data; // sanitized data
  next();
};
```

---

## 15. Database Indexes

### Indexes cần tạo để đảm bảo hiệu năng:

```sql
-- User
CREATE UNIQUE INDEX idx_user_email ON "User"(lower(email));
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_isActive ON "User"("isActive");

-- Product
CREATE INDEX idx_product_category ON "Product"("categoryId");
CREATE INDEX idx_product_isActive ON "Product"("isActive");
CREATE INDEX idx_product_basePrice ON "Product"("basePrice");
CREATE INDEX idx_product_averageRating ON "Product"("averageRating");
CREATE INDEX idx_product_createdAt ON "Product"("createdAt");
-- Full-text search
CREATE INDEX idx_product_fts ON "Product" USING gin(
  to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- Review
CREATE UNIQUE INDEX idx_review_user_product ON "Review"("userId", "productId");
CREATE INDEX idx_review_productId ON "Review"("productId");
CREATE INDEX idx_review_status ON "Review"(status);
CREATE INDEX idx_review_rating ON "Review"(rating);

-- Order
CREATE INDEX idx_order_userId ON "Order"("userId");
CREATE INDEX idx_order_status ON "Order"(status);
CREATE INDEX idx_order_createdAt ON "Order"("createdAt");

-- OrderItem
CREATE INDEX idx_orderitem_order ON "OrderItem"("orderId");
CREATE INDEX idx_orderitem_product ON "OrderItem"("productId");

-- Design
CREATE UNIQUE INDEX idx_design_shareToken ON "Design"("shareToken");
CREATE INDEX idx_design_userId ON "Design"("userId");

-- CartItem
CREATE UNIQUE INDEX idx_cartitem_unique ON "CartItem"("userId", "productId", "variantId");
CREATE INDEX idx_cartitem_userId ON "CartItem"("userId");

-- Wishlist
CREATE UNIQUE INDEX idx_wishlist_unique ON "WishlistItem"("userId", "productId");

-- RefreshToken
CREATE INDEX idx_refreshtoken_userId ON "RefreshToken"("userId");
CREATE INDEX idx_refreshtoken_expiresAt ON "RefreshToken"("expiresAt");
```

---

## Phụ Lục A: Prisma Schema Hoàn Chỉnh

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

enum OrderStatus {
  PENDING_PAYMENT
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  COMPLETED
  CANCELLED
  RETURN_REQUESTED
  RETURNED
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
}

enum PaymentMethod {
  MOCK
  COD
}

enum VariantType {
  COLOR
  MATERIAL
}

model User {
  id                  String         @id @default(cuid())
  email               String         @unique
  passwordHash        String
  displayName         String
  avatarUrl           String?
  role                Role           @default(USER)
  isActive            Boolean        @default(true)
  failedLoginAttempts Int            @default(0)
  lockedUntil         DateTime?
  lastLoginAt         DateTime?
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  refreshTokens       RefreshToken[]
  orders              Order[]
  reviews             Review[]
  helpfulVotes        HelpfulVote[]
  designs             Design[]
  cartItems           CartItem[]
  wishlistItems       WishlistItem[]
}

model RefreshToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Category {
  id           String    @id @default(cuid())
  name         String    @unique
  slug         String    @unique
  description  String?
  iconUrl      String?
  thumbnailUrl String?
  displayOrder Int       @default(0)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  products     Product[]
}

model Product {
  id               String           @id @default(cuid())
  name             String
  slug             String           @unique
  description      String
  category         Category         @relation(fields: [categoryId], references: [id])
  categoryId       String
  basePrice        Int
  comparePrice     Int?
  thumbnailUrl     String
  modelUrl         String?
  hasArSupport     Boolean          @default(false)
  dimensions       Json
  materials        String[]
  tags             String[]
  stockQuantity    Int?
  averageRating    Float            @default(0)
  totalReviews     Int              @default(0)
  isActive         Boolean          @default(true)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  variants         ProductVariant[]
  images           ProductImage[]
  reviews          Review[]
  cartItems        CartItem[]
  wishlistItems    WishlistItem[]
  designItems      DesignItem[]
  orderItems       OrderItem[]
}

model ProductVariant {
  id            String      @id @default(cuid())
  product       Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId     String
  name          String
  type          VariantType
  hexColor      String?
  textureUrl    String?
  priceAddon    Int         @default(0)
  isDefault     Boolean     @default(false)
  stockQuantity Int?
  createdAt     DateTime    @default(now())
  cartItems     CartItem[]
  orderItems    OrderItem[]
  designItems   DesignItem[]
  reviews       Review[]

  @@unique([productId, name])
}

model ProductImage {
  id           String   @id @default(cuid())
  product      Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId    String
  url          String
  alt          String?
  displayOrder Int      @default(0)
}

model Review {
  id           String         @id @default(cuid())
  product      Product        @relation(fields: [productId], references: [id])
  productId    String
  user         User           @relation(fields: [userId], references: [id])
  userId       String
  variant      ProductVariant? @relation(fields: [variantId], references: [id])
  variantId    String?
  rating       Int
  title        String?
  body         String?
  images       ReviewImage[]
  status       ReviewStatus   @default(APPROVED)
  rejectionReason String?
  isEdited     Boolean        @default(false)
  helpfulCount Int            @default(0)
  adminReply   String?
  adminRepliedAt DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  helpfulVotes HelpfulVote[]

  @@unique([userId, productId])
}

model ReviewImage {
  id           String  @id @default(cuid())
  review       Review  @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  reviewId     String
  url          String
  displayOrder Int     @default(0)
}

model HelpfulVote {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  review    Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  reviewId  String
  createdAt DateTime @default(now())

  @@unique([userId, reviewId])
}

model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique
  user            User          @relation(fields: [userId], references: [id])
  userId          String
  status          OrderStatus   @default(PENDING_PAYMENT)
  paymentStatus   PaymentStatus @default(PENDING)
  paymentMethod   PaymentMethod
  shippingAddress Json
  subtotal        Int
  shippingFee     Int           @default(0)
  total           Int
  note            String?
  trackingNumber  String?
  cancelledAt     DateTime?
  deliveredAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  items           OrderItem[]
}

model OrderItem {
  id        String          @id @default(cuid())
  order     Order           @relation(fields: [orderId], references: [id])
  orderId   String
  product   Product         @relation(fields: [productId], references: [id])
  productId String
  variant   ProductVariant? @relation(fields: [variantId], references: [id])
  variantId String?
  quantity  Int
  unitPrice Int
  subtotal  Int
  snapshot  Json
}

model Design {
  id           String       @id @default(cuid())
  user         User?        @relation(fields: [userId], references: [id])
  userId       String?
  name         String
  thumbnailUrl String?
  shareToken   String       @unique @default(cuid())
  clonedFrom   String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  items        DesignItem[]
}

model DesignItem {
  id        String          @id @default(cuid())
  design    Design          @relation(fields: [designId], references: [id], onDelete: Cascade)
  designId  String
  product   Product         @relation(fields: [productId], references: [id])
  productId String
  variant   ProductVariant? @relation(fields: [variantId], references: [id])
  variantId String?
  transform Json
  sortOrder Int             @default(0)
}

model CartItem {
  id        String          @id @default(cuid())
  user      User            @relation(fields: [userId], references: [id])
  userId    String
  product   Product         @relation(fields: [productId], references: [id])
  productId String
  variant   ProductVariant? @relation(fields: [variantId], references: [id])
  variantId String?
  quantity  Int             @default(1)
  addedAt   DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  @@unique([userId, productId, variantId])
}

model WishlistItem {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  addedAt   DateTime @default(now())

  @@unique([userId, productId])
}
```

---

## Phụ Lục B: Rate Limiting Config

| Endpoint group | Limit | Window |
|---|---|---|
| `/auth/login` | 10 req | 15 phút / IP |
| `/auth/register` | 5 req | 1 giờ / IP |
| `/auth/refresh` | 30 req | 15 phút / IP |
| `/upload/*` | 20 req | 1 giờ / User |
| `/admin/*` | 200 req | 1 phút / User |
| Còn lại | 100 req | 1 phút / IP |

---

## Phụ Lục C: Seed Data tối thiểu

Để app chạy được cần seed:
- 1 Admin account: `admin@tryspace.app` / `Admin@123456`
- 1 User account: `test@tryspace.app` / `Test@123456`
- 5 Categories: Ghế, Bàn, Kệ, Giường, Đèn
- 15 Products (3 mỗi category), mỗi product có 3 variants
- 1 Order DELIVERED cho user test (để test review)

*TrySpace Backend Specification v1.0.0*
