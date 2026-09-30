import Order from "../models/Order.js";

// Produces IDs like SMT-20260925-0001, sequential within each calendar day.
export async function generateOrderId() {
  const now = new Date();
  const datePart =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  const prefix = `SMT-${datePart}-`;

  const todaysCount = await Order.countDocuments({
    orderId: { $regex: `^${prefix}` },
  });

  const sequence = String(todaysCount + 1).padStart(4, "0");
  return `${prefix}${sequence}`;
}
