import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { uploadProductImage } from "../middleware/upload.js";

const router = Router();

router.get("/", getProducts);

// Admin image upload -> returns a URL to store on the product's `image` field.
// Declared before "/:id" so the literal path takes priority over the param route.
router.post(
  "/upload-image",
  protect,
  adminOnly,
  uploadProductImage.single("image"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No image uploaded." });
    res.json({ url: `/uploads/products/${req.file.filename}` });
  }
);

router.get("/:id", getProductById);
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
