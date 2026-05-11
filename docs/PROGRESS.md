# TrySpace Backend — Build Progress Log

## 🏗️ PHASE 0 — Project Setup

- [x] P0-01 · `package.json` — dependencies đầy đủ — done 2026-05-08
- [x] P0-02 · `tsconfig.json` — strict mode, paths alias — done 2026-05-08
- [x] P0-03 · `.env.example` — tất cả env vars — done 2026-05-08
- [x] P0-04 · `nodemon.json` + `ts-node` dev setup — done 2026-05-08
- [ ] P0-05 · ESLint + Prettier config — missing: no ESLint/Prettier config files found
- [x] P0-06 · `src/index.ts` — Express app entry point — done 2026-05-08
- [x] P0-07 · `src/app.ts` — Express app factory (tách khỏi server) — done 2026-05-08
- [x] P0-08 · Middleware stack: cors, helmet, morgan, express.json — done 2026-05-08
- [x] P0-09 · Docker Compose cho local PostgreSQL — done 2026-05-08
- [x] P0-10 · `Makefile` hoặc npm scripts đầy đủ — done 2026-05-08

---

## 🗄️ PHASE 1 — Database & Schema

- [x] P1-01 · `prisma/schema.prisma` — full schema từ spec Phụ Lục A — done 2026-05-08
- [x] P1-02 · `npx prisma migrate dev --name init` — migration đầu tiên — done 2026-05-08
- [x] P1-03 · `prisma/seed.ts` — seed admin + test user — done 2026-05-08
- [x] P1-04 · `prisma/seed.ts` — seed 5 categories — done 2026-05-08
- [x] P1-05 · `prisma/seed.ts` — seed 15 products + 3 variants mỗi cái — done 2026-05-08
- [x] P1-06 · `prisma/seed.ts` — seed 1 order DELIVERED cho test user — done 2026-05-08
- [x] P1-07 · Database indexes (xem spec §15) — done 2026-05-08
- [x] P1-08 · `src/lib/prisma.ts` — Prisma client singleton — done 2026-05-08

---

## 🛠️ PHASE 2 — Core Infrastructure

- [x] P2-01 · `src/utils/ApiError.ts` — custom error class — done 2026-05-08
- [x] P2-02 · `src/utils/response.ts` — success/error response helpers — done 2026-05-08
- [x] P2-03 · `src/utils/jwt.ts` — sign/verify access + refresh token — done 2026-05-08
- [x] P2-04 · `src/utils/password.ts` — hash + compare bcrypt — done 2026-05-08
- [x] P2-05 · `src/utils/pagination.ts` — parse & build pagination meta — done 2026-05-08
- [x] P2-06 · `src/utils/slugify.ts` — generate slug từ tên — done 2026-05-08
- [x] P2-07 · `src/utils/orderNumber.ts` — generate order number `TS-YYYYMMDD-XXXX` — done 2026-05-08
- [x] P2-08 · `src/middleware/errorHandler.ts` — global error handler — done 2026-05-08
- [x] P2-09 · `src/middleware/authenticate.ts` — JWT verify middleware — done 2026-05-08
- [x] P2-10 · `src/middleware/requireAdmin.ts` — role check middleware — done 2026-05-08
- [x] P2-11 · `src/middleware/validate.ts` — Zod validation middleware — done 2026-05-08
- [x] P2-12 · `src/middleware/rateLimiter.ts` — per-route rate limiters — done 2026-05-08
- [ ] P2-13 · `src/schemas/` — Zod schemas cho mỗi module — incomplete: search/upload have no Zod schema files; validation is handled in services
- [x] P2-14 · `src/routes/index.ts` — router tổng hợp — done 2026-05-08

---

## 🔐 PHASE 3 — Module Auth

- [x] P3-01 · `POST /auth/register` — tạo user, hash password, trả JWT — done 2026-05-08
- [x] P3-02 · `POST /auth/login` — verify, failedAttempts, lock logic — done 2026-05-08
- [x] P3-03 · `POST /auth/refresh` — token rotation từ httpOnly cookie — done 2026-05-08
- [x] P3-04 · `POST /auth/logout` — revoke refresh token, clear cookie — done 2026-05-08
- [x] P3-05 · `GET /auth/me` — profile + stats — done 2026-05-08
- [x] P3-06 · `PATCH /auth/change-password` — verify old, invalidate all tokens — done 2026-05-08
- [x] **TEST** · Tất cả auth endpoints qua Thunder Client / Postman — done 2026-05-08 via manual curl API tests

---

## 👤 PHASE 4 — Module Users

- [x] P4-01 · `PATCH /users/me` — update displayName, avatarUrl — done 2026-05-08
- [x] P4-02 · `GET /users/:userId` — public profile — done 2026-05-08
- [x] P4-03 · `GET /admin/users` — list + filter + pagination — done 2026-05-08
- [x] P4-04 · `PATCH /admin/users/:userId/status` — activate/deactivate — done 2026-05-08
- [x] **TEST** · Tất cả user endpoints — done 2026-05-08 via manual curl API tests

---

## 📂 PHASE 5 — Module Categories

- [x] P5-01 · `GET /categories` — list với productCount — done 2026-05-08
- [x] P5-02 · `GET /categories/:slug` — single category — done 2026-05-08
- [x] P5-03 · `POST /admin/categories` — tạo, auto-generate slug — done 2026-05-08
- [x] P5-04 · `PATCH /admin/categories/:id` — cập nhật — done 2026-05-08
- [x] P5-05 · `DELETE /admin/categories/:id` — check còn product không — done 2026-05-08
- [x] **TEST** · Tất cả category endpoints — done 2026-05-08 via manual curl API tests

---

## 📦 PHASE 6 — Module Products

- [x] P6-01 · `GET /products` — list với search + filter + pagination — done 2026-05-08
- [x] P6-02 · `GET /products` — full-text search (PostgreSQL tsvector) — done 2026-05-08
- [x] P6-03 · `GET /products/:idOrSlug` — by id hoặc slug — done 2026-05-08
- [x] P6-04 · `GET /products/:id/related` — cùng category, sort by rating — done 2026-05-08
- [x] P6-05 · `POST /admin/products` — tạo với variants + images — done 2026-05-08
- [x] P6-06 · `PATCH /admin/products/:id` — update kể cả variants (replace) — done 2026-05-08
- [x] P6-07 · `DELETE /admin/products/:id` — soft delete (isActive=false) — done 2026-05-08
- [x] **TEST** · Tất cả product endpoints + search/filter — done 2026-05-08 via manual curl API tests

---

## ⭐ PHASE 7 — Module Reviews

- [x] P7-01 · `GET /products/:productId/reviews` — list + filter — done 2026-05-09
- [x] P7-02 · `POST /products/:productId/reviews` — **check đã mua chưa** — done 2026-05-09
- [x] P7-03 · `POST /products/:productId/reviews` — **check đã review chưa** — done 2026-05-09
- [x] P7-04 · `PATCH /products/:productId/reviews/:reviewId` — owner only — done 2026-05-09
- [x] P7-05 · `DELETE /products/:productId/reviews/:reviewId` — admin only — done 2026-05-09
- [x] P7-06 · `POST .../reviews/:reviewId/helpful` — toggle vote — done 2026-05-09
- [x] P7-07 · `POST /admin/.../reviews/:reviewId/reply` — admin reply — done 2026-05-09
- [x] P7-08 · `PATCH /admin/.../reviews/:reviewId/status` — approve/reject — done 2026-05-09
- [x] P7-09 · `GET /users/me/reviews` — my reviews — done 2026-05-09
- [x] P7-10 · Trigger cập nhật `averageRating` + `totalReviews` sau mọi thao tác — done 2026-05-09
- [x] **TEST** · Đặc biệt test business rule "chỉ người mua được review" — done 2026-05-09 via manual curl API tests

---

## 🛒 PHASE 8 — Module Cart

- [x] P8-01 · `GET /cart` — giỏ hàng với summary — done 2026-05-09
- [x] P8-02 · `POST /cart/items` — thêm item, check stock, handle duplicate — done 2026-05-09
- [x] P8-03 · `PATCH /cart/items/:itemId` — cập nhật quantity, check stock — done 2026-05-09
- [x] P8-04 · `DELETE /cart/items/:itemId` — xóa item — done 2026-05-09
- [x] P8-05 · `DELETE /cart` — xóa toàn bộ — done 2026-05-09
- [x] **TEST** · Test duplicate item (phải tăng quantity), test hết hàng — done 2026-05-09 via manual curl API tests

---

## 📋 PHASE 9 — Module Orders

- [x] P9-01 · `POST /orders` — checkout, snapshot giá, trừ stock, clear cart — done 2026-05-09
- [x] P9-02 · `POST /orders` — MOCK payment tự set CONFIRMED + PAID — done 2026-05-09
- [x] P9-03 · `GET /orders` — list của user hiện tại — done 2026-05-09
- [x] P9-04 · `GET /orders/:id` — chi tiết đơn — done 2026-05-09
- [x] P9-05 · `POST /orders/:id/cancel` — chỉ PENDING/CONFIRMED, cộng lại stock — done 2026-05-09
- [x] P9-06 · `PATCH /admin/orders/:id/status` — cập nhật status + trigger DELIVERED — done 2026-05-09
- [x] P9-07 · `GET /admin/orders` — list tất cả + filter — done 2026-05-09
- [x] P9-08 · Trigger: khi status → DELIVERED, unlock review cho các items — done 2026-05-09 via review eligibility query
- [x] **TEST** · Test full checkout flow, test cancel, test review unlock — done 2026-05-09 via manual curl API tests

---

## 🎨 PHASE 10 — Module Designs

- [x] P10-01 · `GET /designs` — list của user — done 2026-05-09
- [x] P10-02 · `POST /designs` — tạo, upload thumbnail base64 → Cloudinary — done 2026-05-09
- [x] P10-03 · `GET /designs/:id` — owner only — done 2026-05-09
- [x] P10-04 · `GET /designs/shared/:shareToken` — public, không cần auth — done 2026-05-09
- [x] P10-05 · `PATCH /designs/:id` — update name/thumbnail/items (replace items) — done 2026-05-09
- [x] P10-06 · `DELETE /designs/:id` — owner only — done 2026-05-09
- [x] P10-07 · `POST /designs/shared/:shareToken/clone` — clone về account — done 2026-05-09
- [x] P10-08 · `POST /designs/:id/add-all-to-cart` — add all to cart — done 2026-05-09
- [x] P10-09 · Giới hạn 50 designs / user — done 2026-05-09
- [x] **TEST** · Test share link public access, test clone — done 2026-05-09 via manual curl API tests

---

## ❤️ PHASE 11 — Module Wishlist

- [x] P11-01 · `GET /wishlist` — list items — done 2026-05-09
- [x] P11-02 · `POST /wishlist/toggle` — toggle (add/remove) — done 2026-05-09
- [x] P11-03 · `GET /wishlist/check/:productId` — check nhanh — done 2026-05-09
- [x] **TEST** · Toggle behavior — done 2026-05-09 via manual curl API tests

---

## 🔍 PHASE 12 — Module Search

- [ ] P12-01 · `GET /search` — full-text với filter — incomplete: full-text search exists, but product-style filters are not implemented
- [x] P12-02 · `GET /search/suggestions` — autocomplete — done 2026-05-09
- [x] **TEST** · Test search tiếng Việt có dấu — done 2026-05-09 via manual curl API tests

---

## 📤 PHASE 13 — Module Upload

- [x] P13-01 · `POST /upload/image` — user upload (avatar, review, design) — done 2026-05-09
- [x] P13-02 · `POST /upload/model` — admin upload GLB — done 2026-05-09
- [x] P13-03 · Cloudinary SDK integration — done 2026-05-09
- [x] **TEST** · Test file type validation, size limit — done 2026-05-09 via manual curl API validation tests

---

## 🚀 PHASE 14 — Deploy & Final

- [ ] P14-01 · Railway setup — PostgreSQL + Node.js service
- [ ] P14-02 · Environment variables trên Railway
- [ ] P14-03 · `npx prisma migrate deploy` trên production
- [ ] P14-04 · Seed data trên production (chỉ admin + categories + products)
- [x] P14-05 · GitHub Actions CI: test build on PR — done 2026-05-10
- [x] P14-06 · GitHub Actions CD: deploy to Railway on push main — done 2026-05-10
- [x] P14-07 · Health check endpoint `GET /health` — done 2026-05-10
- [ ] P14-08 · Test toàn bộ API trên production URL

---

## 📊 Progress Summary

| Phase | Total | Done | % |
|-------|-------|------|---|
| P0 Setup | 10 | 9 | 90% |
| P1 Database | 8 | 8 | 100% |
| P2 Core | 14 | 13 | 93% |
| P3 Auth | 7 | 7 | 100% |
| P4 Users | 5 | 5 | 100% |
| P5 Categories | 6 | 6 | 100% |
| P6 Products | 8 | 8 | 100% |
| P7 Reviews | 11 | 11 | 100% |
| P8 Cart | 6 | 6 | 100% |
| P9 Orders | 9 | 9 | 100% |
| P10 Designs | 10 | 10 | 100% |
| P11 Wishlist | 4 | 4 | 100% |
| P12 Search | 3 | 2 | 67% |
| P13 Upload | 4 | 4 | 100% |
| P14 Deploy | 8 | 3 | 38% |
| **TOTAL** | **113** | **105** | **93%** |

---

## 📝 Notes / Blockers

<!-- Ghi lại bugs, blockers, quyết định kỹ thuật ở đây -->

- 2026-05-08 scan: No backend implementation files exist yet. Workspace contains only `.gitignore` and docs (`docs/PROGRESS.md`, `docs/PROMPTS.md`, `docs/TrySpace_Backend_Spec.md`); `.agents/` and `.codex/` are empty.
- Requested files are under `docs/`, not the repository root.
- `.gitignore` currently ignores `docs/`, so the progress/spec/prompt files are ignored by Git unless force-added or the ignore rule is changed.
- 2026-05-08 Phase 0 setup: Created Node.js + Express + TypeScript scaffold, installed npm dependencies, and verified `npm run build` passes. ESLint + Prettier remain missing because they were not included in the Phase 0 setup prompt.
- 2026-05-08 Phase 1 database: Created exact Prisma schema, initial migration, raw index migration, Prisma singleton, and seed data. Local PostgreSQL runs on host port `5433` because `5432` was already in use.
- 2026-05-08 Phase 2 core: Created utilities, auth/admin/validation/rate-limit middleware, global error handler, Express request typing, and stub module routers. Module-specific schemas exist for body-validated modules; search parses query params in service and upload validates multipart payloads in service.
- 2026-05-08 Phase 3 auth: Implemented register, login with lockout, refresh-token rotation, logout, current-user stats, and change-password token invalidation. Verified with manual curl API tests.
- 2026-05-08 Phase 4 users: Implemented profile update, public profile, admin user listing, and admin activate/deactivate safeguards. Verified with manual curl API tests.
- 2026-05-08 Phase 5 categories: Implemented public category reads with active product counts and admin category create/update/delete with unique slug generation and active-product delete protection. Verified with manual curl API tests.
- 2026-05-08 Phase 6 products: Implemented product list raw SQL filtering/search, product detail, related products, admin create/update with variant replacement, and soft delete. Verified with manual curl API tests.
- 2026-05-09 Phase 7 reviews: Implemented purchased-only review creation, duplicate prevention, owner updates, admin deletion/moderation/replies, helpful votes, user review history, and approved-review rating recalculation. Verified with manual curl API tests.
- 2026-05-09 Phase 8 cart: Implemented cart reads with summary, add/increment with explicit null-variant lookup, stock checks, ownership-checked item updates/deletes, and clear cart. Verified with manual curl API tests.
- 2026-05-09 Phase 9 orders: Implemented atomic checkout, order listing/detail, cancellation with stock restore, admin listing, and admin status updates with deliveredAt handling. Verified with manual curl API tests.
- 2026-05-09 Phase 10 designs: Implemented design CRUD, resilient Cloudinary thumbnail upload, public shared views, cloning, item replacement, add-all-to-cart, and 50-design limit. Verified with manual curl API tests.
- 2026-05-09 Phase 11 wishlist: Implemented wishlist list, toggle add/remove, and membership check. Verified with manual curl API tests.
- 2026-05-09 Phase 12 search: Implemented full-text product search, category matches, and product/category/tag suggestions. Verified with manual curl API tests including Vietnamese text with diacritics.
- 2026-05-09 Phase 13 upload: Implemented Cloudinary-backed image/model upload routes with memory storage, image purpose validation, avatar transformation, GLB magic-byte validation, and file size/type checks. Verified validation paths with manual curl API tests; real Cloudinary upload success depends on configured credentials.
- 2026-05-09 full codebase scan: All routers mounted in `src/routes/index.ts` resolve to real route modules and controllers; no mounted stub routers remain. Admin route groups apply `authenticate` + `requireAdmin`; Prisma relation references line up with `schema.prisma`. Remaining checklist gaps are ESLint/Prettier, strict per-module Zod schema coverage, `/search` product-style filters, root `/health`, and deploy/CI items.
- 2026-05-10 Phase 14 deployment setup: Added GitHub Actions CI/CD workflows, Railway config, production startup migration command, root `/health`, and README deployment documentation. Railway service creation, Railway environment variables, production seeding, and production URL testing are still manual follow-up tasks.

---

*Cập nhật lần cuối: 2026-05-10*
