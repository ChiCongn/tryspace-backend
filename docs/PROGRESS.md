# TrySpace Backend — Build Progress Log

## 🏗️ PHASE 0 — Project Setup

- [x] P0-01 · `package.json` — dependencies đầy đủ — done 2026-05-08
- [x] P0-02 · `tsconfig.json` — strict mode, paths alias — done 2026-05-08
- [x] P0-03 · `.env.example` — tất cả env vars — done 2026-05-08
- [x] P0-04 · `nodemon.json` + `ts-node` dev setup — done 2026-05-08
- [ ] P0-05 · ESLint + Prettier config
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
- [ ] P2-13 · `src/schemas/` — Zod schemas cho mỗi module
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

- [ ] P8-01 · `GET /cart` — giỏ hàng với summary
- [ ] P8-02 · `POST /cart/items` — thêm item, check stock, handle duplicate
- [ ] P8-03 · `PATCH /cart/items/:itemId` — cập nhật quantity, check stock
- [ ] P8-04 · `DELETE /cart/items/:itemId` — xóa item
- [ ] P8-05 · `DELETE /cart` — xóa toàn bộ
- [ ] **TEST** · Test duplicate item (phải tăng quantity), test hết hàng

---

## 📋 PHASE 9 — Module Orders

- [ ] P9-01 · `POST /orders` — checkout, snapshot giá, trừ stock, clear cart
- [ ] P9-02 · `POST /orders` — MOCK payment tự set CONFIRMED + PAID
- [ ] P9-03 · `GET /orders` — list của user hiện tại
- [ ] P9-04 · `GET /orders/:id` — chi tiết đơn
- [ ] P9-05 · `POST /orders/:id/cancel` — chỉ PENDING/CONFIRMED, cộng lại stock
- [ ] P9-06 · `PATCH /admin/orders/:id/status` — cập nhật status + trigger DELIVERED
- [ ] P9-07 · `GET /admin/orders` — list tất cả + filter
- [ ] P9-08 · Trigger: khi status → DELIVERED, unlock review cho các items
- [ ] **TEST** · Test full checkout flow, test cancel, test review unlock

---

## 🎨 PHASE 10 — Module Designs

- [ ] P10-01 · `GET /designs` — list của user
- [ ] P10-02 · `POST /designs` — tạo, upload thumbnail base64 → Cloudinary
- [ ] P10-03 · `GET /designs/:id` — owner only
- [ ] P10-04 · `GET /designs/shared/:shareToken` — public, không cần auth
- [ ] P10-05 · `PATCH /designs/:id` — update name/thumbnail/items (replace items)
- [ ] P10-06 · `DELETE /designs/:id` — owner only
- [ ] P10-07 · `POST /designs/shared/:shareToken/clone` — clone về account
- [ ] P10-08 · `POST /designs/:id/add-all-to-cart` — add all to cart
- [ ] P10-09 · Giới hạn 50 designs / user
- [ ] **TEST** · Test share link public access, test clone

---

## ❤️ PHASE 11 — Module Wishlist

- [ ] P11-01 · `GET /wishlist` — list items
- [ ] P11-02 · `POST /wishlist/toggle` — toggle (add/remove)
- [ ] P11-03 · `GET /wishlist/check/:productId` — check nhanh
- [ ] **TEST** · Toggle behavior

---

## 🔍 PHASE 12 — Module Search

- [ ] P12-01 · `GET /search` — full-text với filter
- [ ] P12-02 · `GET /search/suggestions` — autocomplete
- [ ] **TEST** · Test search tiếng Việt có dấu

---

## 📤 PHASE 13 — Module Upload

- [ ] P13-01 · `POST /upload/image` — user upload (avatar, review, design)
- [ ] P13-02 · `POST /upload/model` — admin upload GLB
- [ ] P13-03 · Cloudinary SDK integration
- [ ] **TEST** · Test file type validation, size limit

---

## 🚀 PHASE 14 — Deploy & Final

- [ ] P14-01 · Railway setup — PostgreSQL + Node.js service
- [ ] P14-02 · Environment variables trên Railway
- [ ] P14-03 · `npx prisma migrate deploy` trên production
- [ ] P14-04 · Seed data trên production (chỉ admin + categories + products)
- [ ] P14-05 · GitHub Actions CI: test build on PR
- [ ] P14-06 · GitHub Actions CD: deploy to Railway on push main
- [ ] P14-07 · Health check endpoint `GET /health`
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
| P8 Cart | 6 | 0 | 0% |
| P9 Orders | 9 | 0 | 0% |
| P10 Designs | 10 | 0 | 0% |
| P11 Wishlist | 4 | 0 | 0% |
| P12 Search | 3 | 0 | 0% |
| P13 Upload | 4 | 0 | 0% |
| P14 Deploy | 8 | 0 | 0% |
| **TOTAL** | **113** | **67** | **59%** |

---

## 📝 Notes / Blockers

<!-- Ghi lại bugs, blockers, quyết định kỹ thuật ở đây -->

- 2026-05-08 scan: No backend implementation files exist yet. Workspace contains only `.gitignore` and docs (`docs/PROGRESS.md`, `docs/PROMPTS.md`, `docs/TrySpace_Backend_Spec.md`); `.agents/` and `.codex/` are empty.
- Requested files are under `docs/`, not the repository root.
- `.gitignore` currently ignores `docs/`, so the progress/spec/prompt files are ignored by Git unless force-added or the ignore rule is changed.
- 2026-05-08 Phase 0 setup: Created Node.js + Express + TypeScript scaffold, installed npm dependencies, and verified `npm run build` passes. ESLint + Prettier remain missing because they were not included in the Phase 0 setup prompt.
- 2026-05-08 Phase 1 database: Created exact Prisma schema, initial migration, raw index migration, Prisma singleton, and seed data. Local PostgreSQL runs on host port `5433` because `5432` was already in use.
- 2026-05-08 Phase 2 core: Created utilities, auth/admin/validation/rate-limit middleware, global error handler, Express request typing, and stub module routers. Auth, user, category, product, and review schemas exist so far; remaining module-specific Zod schemas should be added with their module implementations.
- 2026-05-08 Phase 3 auth: Implemented register, login with lockout, refresh-token rotation, logout, current-user stats, and change-password token invalidation. Verified with manual curl API tests.
- 2026-05-08 Phase 4 users: Implemented profile update, public profile, admin user listing, and admin activate/deactivate safeguards. Verified with manual curl API tests.
- 2026-05-08 Phase 5 categories: Implemented public category reads with active product counts and admin category create/update/delete with unique slug generation and active-product delete protection. Verified with manual curl API tests.
- 2026-05-08 Phase 6 products: Implemented product list raw SQL filtering/search, product detail, related products, admin create/update with variant replacement, and soft delete. Verified with manual curl API tests.
- 2026-05-09 Phase 7 reviews: Implemented purchased-only review creation, duplicate prevention, owner updates, admin deletion/moderation/replies, helpful votes, user review history, and approved-review rating recalculation. Verified with manual curl API tests.

---

*Cập nhật lần cuối: 2026-05-09*
