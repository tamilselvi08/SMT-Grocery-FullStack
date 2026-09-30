import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  mergeCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect); // every cart route requires login

router.get("/", getCart);
router.post("/", addToCart);
router.post("/merge", mergeCart);
router.put("/:productId", updateCartItem);
router.delete("/:productId", removeCartItem);

export default router;
