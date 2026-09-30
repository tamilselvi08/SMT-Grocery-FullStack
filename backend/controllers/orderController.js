import Order, { ORDER_STATUS_FLOW } from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateOrderId } from "../utils/generateOrderId.js";
import { calculateDeliveryCharge, getEligibleGift, computeCouponDiscount } from "../utils/pricing.js";
import { streamInvoicePDF } from "../utils/invoice.js";

// POST /api/orders
// Body: { items: [{ productId, quantity }], shippingAddress, paymentMethod, couponCode }
// Every price is re-read from the database here. Nothing the client sends
// about pricing is trusted.
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ message: "Your cart is empty." });
  }
  if (!shippingAddress) {
    return res.status(400).json({ message: "Shipping address is required." });
  }
  const requiredAddressFields = ["fullName", "mobile", "email", "address", "city", "pincode"];
  for (const field of requiredAddressFields) {
    if (!shippingAddress[field]) {
      return res.status(400).json({ message: `${field} is required in the shipping address.` });
    }
  }
  if (!["cod", "upi", "card", "netbanking"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method." });
  }

  // Re-price every item from the DB and validate stock.
  const orderItems = [];
  let subtotal = 0;

  for (const line of items) {
    const product = await Product.findById(line.productId);
    if (!product) {
      return res.status(400).json({ message: `A product in your cart no longer exists.` });
    }
    const quantity = Number(line.quantity) || 0;
    if (quantity < 1) {
      return res.status(400).json({ message: `Invalid quantity for ${product.name}.` });
    }
    if (quantity > product.stock) {
      return res.status(400).json({
        message: `${product.name} has only ${product.stock} ${product.unit} left in stock.`,
      });
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity,
    });
    subtotal += product.price * quantity;
  }
  subtotal = Math.round(subtotal * 100) / 100;

  // Coupon (re-validated and re-priced here, ignoring any discount the
  // client might have sent).
  let discount = 0;
  let appliedCouponCode = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
    if (!coupon) {
      return res.status(400).json({ message: "Invalid coupon code." });
    }
    try {
      discount = computeCouponDiscount(coupon, subtotal);
      appliedCouponCode = coupon.code;
      coupon.usedCount += 1;
      await coupon.save();
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  const deliveryCharge = calculateDeliveryCharge(subtotal - discount);
  const total = Math.round((subtotal - discount + deliveryCharge) * 100) / 100;

  const isFirstOrder = (await Order.countDocuments({ user: req.user._id })) === 0;
  const gift = getEligibleGift(subtotal, isFirstOrder && !req.user.firstOrderGiftClaimed);

  const orderId = await generateOrderId();

  const order = await Order.create({
    orderId,
    user: req.user._id,
    products: orderItems,
    subtotal,
    discount,
    deliveryCharge,
    total,
    coupon: appliedCouponCode,
    gift: gift ? gift.label : null,
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ? "Pay on Delivery" : "Pending",
    orderStatus: "Order Placed",
    shippingAddress,
  });

  // Decrement stock now that the order is confirmed.
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }

  if (gift && gift.code === "WELCOME_GIFT") {
    req.user.firstOrderGiftClaimed = true;
    await req.user.save();
  }

  // Clear the user's server-side cart.
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  res.status(201).json({ order, gift });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found." });

  const isOwner = order.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized to view this order." });
  }
  res.json({ order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found." });

  if (orderStatus) {
    const validStatuses = [...ORDER_STATUS_FLOW, "Cancelled"];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status." });
    }
    order.orderStatus = orderStatus;
  }
  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }

  await order.save();
  res.json({ order });
});

export const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found." });

  const isOwner = order.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized to view this invoice." });
  }

  streamInvoicePDF(order, res);
});
