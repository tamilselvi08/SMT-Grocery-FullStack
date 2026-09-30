import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true }, // price at time of order
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: "" },
    pincode: { type: String, required: true },
  },
  { _id: false }
);

export const ORDER_STATUS_FLOW = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Out for Delivery",
  "Delivered",
];

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, required: true },
    total: { type: Number, required: true },
    coupon: { type: String, default: null },
    gift: { type: String, default: null },
    paymentMethod: {
      type: String,
      enum: ["cod", "upi", "card", "netbanking"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Pay on Delivery"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: [...ORDER_STATUS_FLOW, "Cancelled"],
      default: "Order Placed",
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
