import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  downloadInvoice,
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.post("/", createOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);
router.get("/:id/invoice", downloadInvoice);
router.put("/:id/status", adminOnly, updateOrderStatus);

export default router;
