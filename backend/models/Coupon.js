import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percentage", "flat"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minimumOrder: { type: Number, default: 0 },
    maximumDiscount: { type: Number, default: null }, // null = uncapped
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);
