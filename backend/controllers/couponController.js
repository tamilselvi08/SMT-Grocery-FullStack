import Coupon from "../models/Coupon.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { computeCouponDiscount } from "../utils/pricing.js";

export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ active: true, expiryDate: { $gte: new Date() } }).sort({
    createdAt: -1,
  });
  res.json({ coupons });
});

// POST /api/coupons/validate  { code, subtotal }
// The discount is always computed here on the backend - the frontend only
// ever displays what this endpoint returns.
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code || subtotal === undefined) {
    return res.status(400).json({ message: "code and subtotal are required." });
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (!coupon) {
    return res.status(404).json({ message: "Invalid coupon code." });
  }

  try {
    const discount = computeCouponDiscount(coupon, Number(subtotal));
    res.json({
      valid: true,
      code: coupon.code,
      discount,
      message: `Coupon applied! You saved ₹${discount}.`,
    });
  } catch (error) {
    res.status(400).json({ valid: false, message: error.message });
  }
});

// --- Admin CRUD ---

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) return res.status(404).json({ message: "Coupon not found." });
  res.json({ coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ message: "Coupon not found." });
  res.json({ message: "Coupon deleted." });
});

export const getAllCouponsAdmin = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ coupons });
});
