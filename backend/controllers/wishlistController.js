import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function getOrCreateWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
}

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  await wishlist.populate("products");
  res.json({ products: wishlist.products });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found." });

  const wishlist = await getOrCreateWishlist(req.user._id);
  if (!wishlist.products.some((p) => p.toString() === productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }
  await wishlist.populate("products");
  res.json({ products: wishlist.products });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const wishlist = await getOrCreateWishlist(req.user._id);
  wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
  await wishlist.save();
  await wishlist.populate("products");
  res.json({ products: wishlist.products });
});
