import { Router } from "express";
import {
  getCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAllCouponsAdmin,
} from "../controllers/couponController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

router.get("/", getCoupons);
router.post("/validate", protect, validateCoupon);

router.get("/admin/all", protect, adminOnly, getAllCouponsAdmin);
router.post("/", protect, adminOnly, createCoupon);
router.put("/:id", protect, adminOnly, updateCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

export default router;
