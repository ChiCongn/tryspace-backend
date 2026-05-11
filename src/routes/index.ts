import { Router } from "express";

import adminRouter from "./admin.routes";
import authRouter from "./auth.routes";
import cartRouter from "./cart.routes";
import categoryRouter from "./category.routes";
import designRouter from "./design.routes";
import orderRouter from "./order.routes";
import productRouter from "./product.routes";
import searchRouter from "./search.routes";
import uploadRouter from "./upload.routes";
import userRouter from "./user.routes";
import wishlistRouter from "./wishlist.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/categories", categoryRouter);
router.use("/products", productRouter);
router.use("/cart", cartRouter);
router.use("/orders", orderRouter);
router.use("/designs", designRouter);
router.use("/wishlist", wishlistRouter);
router.use("/search", searchRouter);
router.use("/upload", uploadRouter);
router.use("/admin", adminRouter);

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
    env: process.env.NODE_ENV
  });
});

export default router;
