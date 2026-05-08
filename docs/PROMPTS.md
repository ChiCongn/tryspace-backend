# TrySpace Backend — Agent Prompts

## 🔍 PROMPT 0 — Project Scan & Checklist Update (LUÔN CHẠY ĐẦU TIÊN)

```
Read the file PROGRESS.md and TrySpace_Backend_Spec.md in the current workspace.

Then scan the entire project structure — check which files exist, read their contents, and determine what has actually been implemented vs what is missing.

For PROGRESS.md, update each checklist item:
- Mark [x] for items that are FULLY implemented and working
- Keep [ ] for items that are missing or incomplete
- Add a short inline note after each completed item: e.g. `[x] P3-01 · POST /auth/register — done 2025-01-15`

After updating PROGRESS.md, print a summary:
1. What phases are complete
2. What is the next recommended task to work on
3. Any inconsistencies found (e.g. route registered but controller missing)

Do not write any new code yet. Only scan, read, and update PROGRESS.md.
```

---

## 🏗️ PROMPT 1 — Phase 0: Project Setup

```
You are building the TrySpace backend API. Reference: TrySpace_Backend_Spec.md

Set up the complete Node.js + Express + TypeScript project from scratch. Do the following in order:

1. Create package.json with these exact dependencies:
   - express, cors, helmet, morgan, cookie-parser, dotenv, compression
   - bcryptjs, jsonwebtoken, crypto (built-in)
   - @prisma/client, zod, express-rate-limit, multer
   - cloudinary
   Dev: typescript, @types/express, @types/node, @types/bcryptjs, @types/jsonwebtoken, @types/multer, @types/morgan, @types/cookie-parser, @types/compression, ts-node, nodemon, prisma

2. Create tsconfig.json with:
   - strict: true, target: ES2022, module: CommonJS
   - outDir: ./dist, rootDir: ./src
   - paths: { "@/*": ["./src/*"] }

3. Create .env.example with ALL variables:
   DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRES_IN=15m, JWT_REFRESH_EXPIRES_IN=7d
   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
   PORT=3000, NODE_ENV=development, FRONTEND_URL=http://localhost:5173

4. Create nodemon.json for ts-node + src/index.ts watch

5. Create src/index.ts (server entry — just starts the server, imports app from app.ts)

6. Create src/app.ts (Express app factory):
   - cors({ origin: FRONTEND_URL, credentials: true })
   - helmet()
   - morgan('dev' in dev / 'combined' in prod)
   - express.json({ limit: '10mb' })
   - cookie-parser
   - compression
   - Mount /api/v1 router
   - 404 handler
   - Global errorHandler

7. Create docker-compose.yml for local PostgreSQL 15

8. Add npm scripts: dev, build, start, db:migrate, db:seed, db:studio

After creating all files, run `npm install` and verify no errors.
```

---

## 🗄️ PROMPT 2 — Phase 1: Database Schema & Seed

```
Reference: TrySpace_Backend_Spec.md — Phụ Lục A (Prisma Schema) and Phụ Lục C (Seed Data).

1. Create prisma/schema.prisma with the EXACT schema from the spec. Copy every model, enum, relation, and @@unique constraint verbatim.

2. Create src/lib/prisma.ts — Prisma client singleton:
   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
   export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

3. Run: npx prisma migrate dev --name init

4. Create prisma/seed.ts with:
   - Admin user: email=admin@tryspace.app, password=Admin@123456, role=ADMIN
   - Test user: email=test@tryspace.app, password=Test@123456, role=USER
   - 5 Categories: Ghế (slug:ghe), Bàn (slug:ban), Kệ (slug:ke), Giường (slug:giuong), Đèn (slug:den)
   - 15 Products total (3 per category). Each product must have:
     - A valid thumbnailUrl (use placeholder: https://placehold.co/400x400/EDE9E0/C9714E?text=ProductName)
     - modelUrl: null (will be updated later with real GLB)
     - 3 ProductVariants each (type: MATERIAL, names like "Oak Natural", "Walnut Brown", "White")
     - Realistic Vietnamese furniture names, descriptions in Vietnamese
     - basePrice between 1_500_000 and 15_000_000
     - dimensions JSON: { width, height, depth, unit: "cm" }
   - 1 Order for test user:
     - status: DELIVERED, paymentStatus: PAID, paymentMethod: MOCK
     - Contains 2 OrderItems (2 different products from the seed)
     - shippingAddress: realistic Vietnamese address JSON

5. Add "prisma": { "seed": "ts-node prisma/seed.ts" } to package.json

6. Run: npx prisma db seed

7. Add the DB indexes from spec §15 as raw SQL in a new migration file:
   npx prisma migrate dev --name add_indexes
   Then add the CREATE INDEX statements to the migration SQL file.

Verify seed ran with: npx prisma studio (check data looks correct)
```

---

## 🛠️ PROMPT 3 — Phase 2: Core Infrastructure

```
Reference: TrySpace_Backend_Spec.md §1 (conventions), §13 (errors), §14 (middleware).

Create all core utilities and middleware. Every file must use TypeScript with proper types.

1. src/utils/ApiError.ts:
   class ApiError extends Error {
     constructor(public statusCode: number, public code: string, public message: string, public details?: unknown)
   }

2. src/utils/response.ts:
   - sendSuccess(res, data, statusCode=200): void
   - sendPaginated(res, data, meta): void
   - (no sendError — that's errorHandler's job)
   Response shape must EXACTLY match spec §1.1

3. src/utils/jwt.ts:
   - signAccessToken(payload: { sub: string; role: string }): string — expires JWT_ACCESS_EXPIRES_IN
   - signRefreshToken(): string — returns 64-char random hex string
   - verifyAccessToken(token: string): JwtPayload
   - hashToken(token: string): string — SHA-256 hex digest

4. src/utils/password.ts:
   - hashPassword(plain: string): Promise<string> — bcrypt saltRounds=12
   - comparePassword(plain: string, hash: string): Promise<boolean>

5. src/utils/pagination.ts:
   - parsePaginationQuery(query: unknown): { page: number; limit: number; skip: number }
   - buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta

6. src/utils/slugify.ts:
   Convert Vietnamese text to URL slug:
   - Normalize unicode (remove diacritics)
   - Lowercase
   - Replace spaces with hyphens
   - Remove non-alphanumeric except hyphens
   Examples: "Ghế Sofa Oslo" → "ghe-sofa-oslo"

7. src/utils/orderNumber.ts:
   - generate(): Promise<string> — format TS-YYYYMMDD-XXXX where XXXX is zero-padded count for that day

8. src/middleware/errorHandler.ts:
   Global error handler — catches ApiError and generic Error:
   - ApiError: return its statusCode, code, message, details
   - Zod errors: status 400, code VALIDATION_ERROR, map issues to [{field, message}]
   - Prisma P2002 (unique): status 409, derive code from field name
   - Default: status 500, code INTERNAL_ERROR
   Never expose stack traces in production.

9. src/middleware/authenticate.ts:
   Exact logic from spec §14. Attaches req.user (full User object from DB).
   Export also: optionalAuthenticate (sets req.user if token exists, doesn't error if missing)

10. src/middleware/requireAdmin.ts:
    After authenticate: check req.user.role === 'ADMIN', else throw ApiError(403, 'FORBIDDEN')

11. src/middleware/validate.ts:
    (req, res, next) factory with Zod schema. Parse req.body, replace with parsed result.

12. src/middleware/rateLimiter.ts:
    Create separate limiters per spec §Appendix B:
    - authLoginLimiter: 10/15min
    - authRegisterLimiter: 5/60min
    - authRefreshLimiter: 30/15min
    - uploadLimiter: 20/60min (by user ID)
    - adminLimiter: 200/1min
    - defaultLimiter: 100/1min

13. src/routes/index.ts:
    Mount all module routers (leave them as stubs for now):
    app.use('/api/v1/auth', authRouter)
    app.use('/api/v1/users', userRouter)
    app.use('/api/v1/categories', categoryRouter)
    app.use('/api/v1/products', productRouter)
    app.use('/api/v1/cart', cartRouter)
    app.use('/api/v1/orders', orderRouter)
    app.use('/api/v1/designs', designRouter)
    app.use('/api/v1/wishlist', wishlistRouter)
    app.use('/api/v1/search', searchRouter)
    app.use('/api/v1/upload', uploadRouter)
    app.use('/api/v1/admin', adminRouter)
    app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

Run `npm run dev` and verify server starts on port 3000 with no TypeScript errors.
```

---

## 🔐 PROMPT 4 — Phase 3: Auth Module

```
Reference: TrySpace_Backend_Spec.md §2 (Auth module) — read EVERY business rule carefully.

Implement the complete Auth module. Structure:
- src/schemas/auth.schema.ts — Zod schemas
- src/services/auth.service.ts — business logic
- src/controllers/auth.controller.ts — request/response handling
- src/routes/auth.routes.ts — route definitions

CRITICAL BUSINESS RULES to implement exactly:
1. BR-AUTH-01: Email normalize to lowercase before save and compare
2. BR-AUTH-02: Track failedLoginAttempts, lock account for 15min after 5 failures
   - On lock: return 403 ACCOUNT_LOCKED with lockedUntil + remainingSeconds
3. BR-AUTH-03: Refresh token = 64-char random hex, stored as SHA-256 hash in DB
   - httpOnly cookie: name=refreshToken, Path=/api/v1/auth, Secure in prod, SameSite=Strict
   - Token rotation: each refresh creates new token, deletes old one
4. BR-AUTH-04: change-password invalidates ALL refresh tokens for user

Implement endpoints:
- POST /auth/register → 201 with accessToken + user + set-cookie refreshToken
- POST /auth/login → 200 with accessToken + user + set-cookie refreshToken
- POST /auth/refresh → reads cookie, rotates token, returns new accessToken + set-cookie
- POST /auth/logout → authenticate middleware, delete refreshToken from DB, clear cookie → 204
- GET /auth/me → authenticate middleware, return user + stats (count orders, designs, reviews)
- PATCH /auth/change-password → authenticate + verify current + delete all refresh tokens

Apply rate limiters:
- register: authRegisterLimiter
- login: authLoginLimiter
- refresh: authRefreshLimiter

After implementation, test manually:
1. Register new user → should get 201 + token
2. Login wrong password 5 times → should get ACCOUNT_LOCKED on 5th
3. Refresh token → should get new accessToken
4. Change password → all other sessions should be invalidated
```

---

## 📂 PROMPT 5 — Phases 4 & 5: Users & Categories

```
Reference: TrySpace_Backend_Spec.md §3 (Users) and §4 (Categories).

Implement Users module:
- PATCH /users/me — update displayName, avatarUrl (validate Cloudinary domain)
- GET /users/:userId — public profile (only displayName, avatarUrl, createdAt, stats)
- GET /admin/users — list with search/filter/pagination (ADMIN only)
- PATCH /admin/users/:userId/status — cannot deactivate self (check req.user.id !== userId)

Implement Categories module:
- GET /categories — include productCount (COUNT of active products per category)
- GET /categories/:slug — single category detail
- POST /admin/categories — auto-generate slug with slugify util, ensure unique
- PATCH /admin/categories/:id — can update displayOrder
- DELETE /admin/categories/:id — check: if any Product with isActive=true exists in this category, throw 409 CATEGORY_HAS_PRODUCTS

For all admin routes, apply both authenticate + requireAdmin middleware.
Structure each module as: schema → service → controller → routes
```

---

## 📦 PROMPT 6 — Phase 6: Products Module

```
Reference: TrySpace_Backend_Spec.md §5 (Products) — read ALL business rules.

Implement complete Products module. This is the most complex query module.

GET /products — List with ALL these filters working simultaneously:
  - search: full-text via PostgreSQL. Use Prisma raw query:
    WHERE to_tsvector('simple', name || ' ' || description || ' ' || array_to_string(tags, ' '))
          @@ plainto_tsquery('simple', $search)
  - categoryId, categorySlug (join category table)
  - minPrice, maxPrice (filter on basePrice)
  - color: match against ProductVariant.hexColor (contains search)
  - material: match against ProductVariant.name (contains search)
  - hasArSupport: boolean
  - sortBy: price|createdAt|rating|popular (popular = totalReviews DESC)
  - pagination: page, limit (max 48 for products)

GET /products/:idOrSlug — detect if param is cuid or slug, query accordingly
  Include: category, variants, images (ordered by displayOrder), ratingDistribution
  ratingDistribution: { "5": count, "4": count, ... } from Review table GROUP BY rating
  Guest sees only isActive=true. Admin sees all.

GET /products/:id/related — same category, active, not same product, limit 8, sort by averageRating desc

POST /admin/products — create with:
  - auto-generate slug from name (ensure unique — append -2, -3 if exists)
  - validate: if hasArSupport=true then modelUrl required
  - if variants array provided: validate exactly one isDefault=true
  - create variants in same transaction as product

PATCH /admin/products/:id — variants update is REPLACE:
  - items with id → update
  - items without id → create new
  - variants in DB not in request → delete (but only if not referenced in orders/cart/designs)
  
DELETE /admin/products/:id — soft delete: set isActive=false, updatedAt=now()

For each product response, compute: finalPrice = basePrice (no variant selected context)
For variant responses, compute: finalPrice = product.basePrice + variant.priceAddon
```

---

## ⭐ PROMPT 7 — Phase 7: Reviews Module

```
Reference: TrySpace_Backend_Spec.md §6 (Reviews) — THE MOST RULES-HEAVY MODULE.

Implement Reviews module. Read every business rule. The key constraint:

BR-REV-01 CHECK (implement this as a database query in review.service.ts):
  async function hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: { some: { productId } }
      }
    })
    return order !== null
  }

If this returns false → throw ApiError(403, 'REVIEW_NOT_PURCHASED', 'Chỉ người đã mua sản phẩm mới có thể đánh giá')

Implement:
- GET /products/:productId/reviews — filter by rating, hasImages, sort; include isHelpful (null for guests)
- POST /products/:productId/reviews — authenticate + check purchased + check not already reviewed
- PATCH /products/:productId/reviews/:reviewId — authenticate + owner check, set isEdited=true
- DELETE /products/:productId/reviews/:reviewId — authenticate + requireAdmin
- POST /products/:productId/reviews/:reviewId/helpful — authenticate, cannot vote own review
- POST /admin/products/:productId/reviews/:reviewId/reply — admin only, upsert adminReply
- PATCH /admin/products/:productId/reviews/:reviewId/status — approve/reject with reason
- GET /users/me/reviews — my reviews with product info

CRITICAL: Create helper updateProductRating(productId: string):
  Recalculate averageRating and totalReviews from APPROVED reviews only.
  Call this after: create review, delete review, status change (approve/reject).
  
  async function updateProductRating(productId: string) {
    const result = await prisma.review.aggregate({
      where: { productId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { id: true }
    })
    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: result._avg.rating ?? 0,
        totalReviews: result._count.id
      }
    })
  }
```

---

## 🛒 PROMPT 8 — Phase 8: Cart Module

```
Reference: TrySpace_Backend_Spec.md §7 (Cart).

Implement Cart module. Key constraint: CartItem has @@unique([userId, productId, variantId]).

IMPORTANT for variantId null handling in Prisma unique constraint:
Prisma treats null specially in unique constraints. Two rows with variantId=null and same userId+productId are NOT considered duplicates by the DB. Handle this in the service:
  - When adding item: first try findFirst with exact match (including variantId: variantId ?? null)
  - If found: increment quantity
  - If not found: create new

GET /cart — include isAvailable flag (product.isActive && stockQuantity > 0 || null)
POST /cart/items — validate product exists and isActive, check stock
PATCH /cart/items/:itemId — validate itemId belongs to req.user (ownership check)
DELETE /cart/items/:itemId — same ownership check
DELETE /cart — deleteMany where userId = req.user.id

Stock check helper:
  function checkStock(stockQuantity: number | null, requestedQty: number) {
    if (stockQuantity === null) return // no stock management
    if (stockQuantity === 0) throw ApiError(400, 'OUT_OF_STOCK', ...)
    if (requestedQty > stockQuantity) throw ApiError(400, 'INSUFFICIENT_STOCK', ..., { availableQuantity: stockQuantity })
  }

Cart response must include summary: { itemCount, totalQuantity, subtotal, unavailableItems }
```

---

## 📋 PROMPT 9 — Phase 9: Orders Module

```
Reference: TrySpace_Backend_Spec.md §8 (Orders).

Implement Orders module. The checkout flow must be atomic (use Prisma $transaction).

POST /orders — checkout flow in ONE Prisma transaction:
  1. Fetch user's cart with items
  2. Validate cart not empty → CART_EMPTY
  3. For each item: check isAvailable → CART_HAS_UNAVAILABLE_ITEMS if any
  4. For each item: re-check stock (race condition protection)
  5. Generate orderNumber using orderNumber util
  6. Create Order with all fields
  7. Create OrderItems — SNAPSHOT price at this moment:
     snapshot JSON = { productName, variantName, thumbnailUrl, basePrice, priceAddon, unitPrice }
  8. Update stockQuantity for each item (decrement)
  9. Delete all CartItems for user
  10. If paymentMethod = 'MOCK': set status=CONFIRMED, paymentStatus=PAID
  All of steps 1-10 must be in one prisma.$transaction([...])

GET /orders — paginated, filter by status, user's own orders only
GET /orders/:id — owner OR admin can view
POST /orders/:id/cancel:
  - Check status is PENDING_PAYMENT or CONFIRMED → else 400 ORDER_CANNOT_BE_CANCELLED
  - In transaction: set status=CANCELLED, cancelledAt=now(), restore stockQuantity for each item

PATCH /admin/orders/:id/status:
  When newStatus = 'DELIVERED':
    - Set deliveredAt = now()
    - No extra action needed (review eligibility is checked at review creation time by querying orders)

GET /admin/orders — filter by status, paymentStatus, userId, search by orderNumber
```

---

## 🎨 PROMPT 10 — Phase 10: Designs Module

```
Reference: TrySpace_Backend_Spec.md §9 (Designs).

Implement Designs module.

For thumbnail upload (POST /designs and PATCH /designs/:id):
  If body.thumbnail is provided (base64 string starting with 'data:image/'):
  1. Decode base64 to Buffer
  2. Upload to Cloudinary using upload_stream:
     cloudinary.uploader.upload_stream(
       { folder: 'tryspace/designs', resource_type: 'image', transformation: [{ width: 800, crop: 'limit' }] },
       callback
     ).end(buffer)
  3. Use returned secure_url as thumbnailUrl
  
  Wrap in try/catch — if Cloudinary fails, still create the design with thumbnailUrl=null

Design items replacement on PATCH:
  Use prisma.$transaction:
  1. deleteMany DesignItems where designId
  2. createMany new DesignItems from request body

GET /designs/shared/:shareToken — PUBLIC route (no auth), return design with owner info
  (only displayName and avatarUrl of owner, not email)

POST /designs/shared/:shareToken/clone:
  - Fetch source design
  - Create new Design with userId=req.user.id, name=sourceName+" (copy)", new shareToken
  - Copy all DesignItems with new designId
  - clonedFrom = source design shareToken

POST /designs/:id/add-all-to-cart:
  - For each designItem: call cart addItem logic
  - Skip items where product.isActive = false
  - Return { added, skipped, skippedItems, cart }

Limit: before POST /designs, count user's designs. If >= 50 → 400 DESIGN_LIMIT_EXCEEDED
```

---

## ❤️🔍📤 PROMPT 11 — Phases 11, 12, 13: Wishlist, Search, Upload

```
Reference: TrySpace_Backend_Spec.md §10, §11, §12.

Implement three remaining modules:

--- WISHLIST ---
GET /wishlist — include product with isActive flag
POST /wishlist/toggle — toggle: if exists delete, if not exists create. Return action: 'added'|'removed'
GET /wishlist/check/:productId — simple { isInWishlist: boolean }

--- SEARCH ---
GET /search?q= — full-text search. Use same Prisma raw approach as products module.
  Also return matching categories (where name ILIKE %q%).
  Min q length: 2 chars → else return empty results (no error).

GET /search/suggestions?q= — quick suggestions. Query:
  - Up to 5 products: name ILIKE %q% (active only), return {type:'product', text:name, slug}
  - Up to 2 categories: name ILIKE %q%, return {type:'category', text:name, slug}
  - Up to 3 tags: scan Product.tags array for matches, return {type:'tag', text:tag}
  Total max 10 suggestions. No auth required.

--- UPLOAD ---
Setup Cloudinary:
  import { v2 as cloudinary } from 'cloudinary'
  cloudinary.config({ cloud_name, api_key, api_secret })

POST /upload/image (USER):
  - Use multer memoryStorage (not disk)
  - Validate MIME: image/jpeg, image/png, image/webp
  - Validate size by purpose: avatar=5MB, review=10MB, design=5MB (read purpose from body)
  - Upload to Cloudinary with folder based on purpose:
    avatar → 'tryspace/avatars', review → 'tryspace/reviews', design → 'tryspace/designs'
  - For avatar: add transformation { width:400, height:400, crop:'fill', gravity:'face' }
  - Return { url, publicId, width, height, format, bytes }

POST /upload/model (ADMIN):
  - Validate MIME: check file buffer magic bytes (GLB starts with 0x67 0x6C 0x54 0x46)
  - Max 50MB
  - Upload with resource_type: 'raw', folder: 'tryspace/models'
  - Return { url, publicId, bytes }
```

---

## 🚀 PROMPT 12 — Phase 14: Deploy

```
Set up deployment for TrySpace backend.

1. Create .github/workflows/deploy-backend.yml:
   Trigger: push to main branch, changes in apps/api/**
   Steps:
   - checkout
   - setup node 20
   - npm ci
   - npx tsc --noEmit (type check, fail if errors)
   - Deploy to Railway via: railway up (using RAILWAY_TOKEN secret)

2. Create .github/workflows/ci.yml:
   Trigger: pull_request to main
   Steps:
   - checkout, setup node 20, npm ci
   - npx tsc --noEmit
   - (no tests yet, just type check)

3. Create railway.json or Procfile:
   web: node dist/index.js
   
4. Add build script that runs: prisma generate && tsc

5. Create GET /health endpoint that returns:
   { status: 'ok', uptime: process.uptime(), timestamp: new Date(), env: process.env.NODE_ENV }

6. Update README.md with:
   - Local setup instructions
   - Environment variables table
   - API base URL
   - Available npm scripts
   - Production URL (Railway)

Verify deployment checklist:
- [ ] DATABASE_URL set in Railway
- [ ] All other env vars set
- [ ] Prisma migrate deploy runs on startup (add to package.json start script)
- [ ] Health endpoint accessible at /health
```

---

## 🔄 PROMPT 13 — Scan & Update Progress (CHẠY SAU MỖI PHASE)

```
Scan the entire TrySpace backend project structure and codebase.

For each item in PROGRESS.md:
1. Check if the corresponding file/route/feature actually exists in the codebase
2. If exists AND correctly implements the spec requirement → mark [x] with today's date
3. If exists but incomplete or has issues → keep [ ] and add inline note about what's missing
4. If missing entirely → keep [ ]

Then update the Progress Summary table with accurate counts.

Also check for these common issues:
- Routes registered in routes/index.ts but controller not created
- Schema created but not used in controller
- Middleware imported but not applied to route
- Prisma model referenced but relation missing in schema

Print final summary: total done / total items, and the top 3 next items to implement.
```

---

## 🐛 PROMPT 14 — Debug & Fix (dùng khi có lỗi)

```
The following error is occurring in the TrySpace backend:

[PASTE ERROR HERE]

Context:
- File: [file path if known]
- Endpoint: [HTTP method + path if known]
- Expected behavior per spec: [quote relevant spec section]

Please:
1. Identify the root cause
2. Fix the issue
3. Check if the same issue might exist in similar code elsewhere
4. Verify the fix doesn't break the response format (must match spec §1.1 exactly)
5. Mark the corresponding PROGRESS.md item as done if it was blocking
```

---

## 📋 PROMPT 15 — API Contract Verification

```
Read TrySpace_Backend_Spec.md carefully.

For each implemented endpoint, verify the response shape EXACTLY matches the spec:
- Response envelope: { success, data } or { success, data, meta }
- All required fields present with correct types
- Pagination meta fields: total, page, limit, totalPages, hasNextPage, hasPrevPage
- Error format: { success: false, error: { code, message, details? } }
- HTTP status codes correct
- Timestamps as ISO 8601 strings
- Prices as integers (not floats)

List all mismatches found and fix them.

Then test these specific business rule scenarios:
1. POST /products/{id}/reviews without buying → should get 403 REVIEW_NOT_PURCHASED
2. POST /cart/items when stockQuantity=0 → should get 400 OUT_OF_STOCK
3. POST /orders when cart has unavailable item → should get 400 CART_HAS_UNAVAILABLE_ITEMS
4. POST /auth/login wrong password 5 times → 6th attempt should get 403 ACCOUNT_LOCKED
5. GET /designs/shared/{shareToken} without auth → should return 200 with design data
```
