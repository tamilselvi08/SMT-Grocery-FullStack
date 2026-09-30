import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function populateAndShape(cart) {
  await cart.populate("items.product");
  const items = cart.items
    .filter((item) => item.product) // drop items whose product was deleted
    .map((item) => ({
      product: item.product,
      quantity: item.quantity,
      itemTotal: Math.round(item.product.price * item.quantity * 100) / 100,
    }));
  const subtotal = Math.round(items.reduce((sum, i) => sum + i.itemTotal, 0) * 100) / 100;
  return { items, subtotal };
}

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json(await populateAndShape(cart));
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ message: "productId is required." });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found." });

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((i) => i.product.toString() === productId);
  const desiredQty = (existing ? existing.quantity : 0) + Number(quantity);

  if (desiredQty > product.stock) {
    return res.status(400).json({ message: `Only ${product.stock} ${product.unit} left in stock.` });
  }
  if (desiredQty < 1) {
    return res.status(400).json({ message: "Quantity must be at least 1." });
  }

  if (existing) {
    existing.quantity = desiredQty;
  } else {
    cart.items.push({ product: productId, quantity: desiredQty });
  }
  await cart.save();
  res.json(await populateAndShape(cart));
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found." });
  if (quantity > product.stock) {
    return res.status(400).json({ message: `Only ${product.stock} ${product.unit} left in stock.` });
  }
  if (quantity < 1) {
    return res.status(400).json({ message: "Quantity must be at least 1." });
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) return res.status(404).json({ message: "Item not in cart." });

  item.quantity = quantity;
  await cart.save();
  res.json(await populateAndShape(cart));
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();
  res.json(await populateAndShape(cart));
});

// POST /api/cart/merge - called right after login with the guest's
// localStorage cart so it merges into the user's DB cart.
export const mergeCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body; // [{ productId, quantity }]
  const cart = await getOrCreateCart(req.user._id);

  for (const guestItem of items) {
    const product = await Product.findById(guestItem.productId);
    if (!product) continue;

    const existing = cart.items.find((i) => i.product.toString() === guestItem.productId);
    const combinedQty = (existing ? existing.quantity : 0) + Number(guestItem.quantity || 1);
    const cappedQty = Math.min(combinedQty, product.stock);

    if (existing) existing.quantity = cappedQty;
    else if (cappedQty > 0) cart.items.push({ product: guestItem.productId, quantity: cappedQty });
  }

  await cart.save();
  res.json(await populateAndShape(cart));
});
