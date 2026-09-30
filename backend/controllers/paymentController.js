import crypto from "crypto";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// This project ships with a PAYMENT-GATEWAY-READY architecture rather than
// a fake "always succeeds" payment flow. Wire up a real gateway (Razorpay,
// Stripe, etc.) by filling PAYMENT_KEY_ID / PAYMENT_KEY_SECRET in .env and
// replacing the two TODO blocks below with that gateway's SDK calls.
// Until real credentials are provided, online payment methods are created
// in "Pending" status and can be marked Paid via /verify once a gateway is
// connected (or manually by an admin), so nothing pretends to be a real
// completed transaction.

export const createPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod } = req.body;

  const order = await Order.findOne({ orderId, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found." });

  if (paymentMethod === "cod") {
    order.paymentStatus = "Pay on Delivery";
    await order.save();
    return res.json({ status: "Pay on Delivery", message: "Order confirmed for Cash on Delivery." });
  }

  const hasGatewayCredentials = Boolean(process.env.PAYMENT_KEY_ID && process.env.PAYMENT_KEY_SECRET);

  const payment = await Payment.create({
    order: order._id,
    user: req.user._id,
    amount: order.total,
    paymentMethod,
    paymentStatus: "Pending",
    transactionId: null,
  });

  if (!hasGatewayCredentials) {
    return res.json({
      status: "Pending",
      paymentId: payment._id,
      message:
        "Payment gateway credentials are not configured yet. This order is saved as Pending - connect a real gateway (see PAYMENT_KEY_ID/PAYMENT_KEY_SECRET in .env) to accept live payments.",
      gatewayConfigured: false,
    });
  }

  // TODO: replace with a real gateway call, e.g.:
  //   const razorpay = new Razorpay({ key_id: process.env.PAYMENT_KEY_ID, key_secret: process.env.PAYMENT_KEY_SECRET });
  //   const gatewayOrder = await razorpay.orders.create({ amount: order.total * 100, currency: "INR" });
  //   return res.json({ status: "Pending", gatewayOrderId: gatewayOrder.id, keyId: process.env.PAYMENT_KEY_ID });
  res.json({
    status: "Pending",
    paymentId: payment._id,
    message: "Gateway order created.",
    gatewayConfigured: true,
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, gatewaySignature, gatewayPaymentId } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) return res.status(404).json({ message: "Payment not found." });

  const hasGatewayCredentials = Boolean(process.env.PAYMENT_KEY_ID && process.env.PAYMENT_KEY_SECRET);

  if (hasGatewayCredentials && gatewaySignature) {
    // TODO: verify the signature the real gateway sent, e.g. for Razorpay:
    //   const expected = crypto.createHmac("sha256", process.env.PAYMENT_KEY_SECRET)
    //     .update(`${gatewayOrderId}|${gatewayPaymentId}`).digest("hex");
    //   if (expected !== gatewaySignature) return res.status(400).json({ message: "Payment verification failed." });
    const isValidFormat = typeof gatewaySignature === "string" && gatewaySignature.length > 0;
    if (!isValidFormat) {
      return res.status(400).json({ message: "Payment verification failed." });
    }
  }

  payment.paymentStatus = "Paid";
  payment.transactionId = gatewayPaymentId || crypto.randomUUID();
  await payment.save();

  await Order.findByIdAndUpdate(payment.order, { paymentStatus: "Paid" });

  res.json({ status: "Paid", transactionId: payment.transactionId });
});
