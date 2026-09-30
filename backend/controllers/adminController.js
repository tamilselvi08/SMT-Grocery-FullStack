import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map((u) => u.toSafeObject()) });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["customer", "admin"].includes(role)) {
    return res.status(400).json({ message: "Role must be 'customer' or 'admin'." });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found." });

  user.role = role;
  await user.save();
  res.json({ user: user.toSafeObject() });
});

export const getAdminOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json({ orders });
});

export const getAdminProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ products });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, orders, pendingOrders, deliveredOrders] =
    await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.find({}, "total orderStatus"),
      Order.countDocuments({ orderStatus: { $nin: ["Delivered", "Cancelled"] } }),
      Order.countDocuments({ orderStatus: "Delivered" }),
    ]);

  const totalSales = Math.round(orders.reduce((sum, o) => sum + o.total, 0) * 100) / 100;

  res.json({
    totalUsers,
    totalProducts,
    totalOrders,
    totalSales,
    pendingOrders,
    deliveredOrders,
  });
});
