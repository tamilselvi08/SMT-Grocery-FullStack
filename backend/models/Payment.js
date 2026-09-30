import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
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
    transactionId: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
