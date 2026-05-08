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
