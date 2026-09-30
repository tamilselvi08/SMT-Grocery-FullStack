import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    unit: { type: String, default: "1 unit" },
    stock: { type: Number, required: true, min: 0, default: 0 },
    keywords: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Discount is always derived from price vs originalPrice - never trust a
// client-supplied discount value.
productSchema.virtual("discount").get(function computeDiscount() {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

productSchema.index({ name: "text", keywords: "text", category: "text" });
productSchema.index({ category: 1 });

export default mongoose.model("Product", productSchema);
