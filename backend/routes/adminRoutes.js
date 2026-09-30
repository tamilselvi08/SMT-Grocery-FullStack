import { Router } from "express";
import {
  getUsers,
  updateUserRole,
  getAdminOrders,
  getAdminProducts,
  getDashboardStats,
} from "../controllers/adminController.js";
import { updateOrderStatus } from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/dashboard", getDashboardStats);
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.get("/orders", getAdminOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.get("/products", getAdminProducts);

export default router;
