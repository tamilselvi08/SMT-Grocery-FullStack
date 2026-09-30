export const FREE_DELIVERY_THRESHOLD = 499;
export const DELIVERY_CHARGE = 40;

export function calculateDeliveryCharge(subtotal) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
}

// Returns the best gift the customer qualifies for, or null.
// isFirstOrder is decided by the caller (checked against the user's order history).
export function getEligibleGift(subtotal, isFirstOrder) {
  if (isFirstOrder) {
    return { code: "WELCOME_GIFT", label: "Welcome Gift 🎁", detail: "A free welcome gift on your first order!" };
  }
  if (subtotal >= 999) {
    return { code: "PREMIUM_GIFT", label: "Premium Gift 🎁", detail: "You unlocked a Premium Gift for orders above ₹999!" };
  }
  if (subtotal >= 500) {
    return { code: "FREE_GROCERY_GIFT", label: "Free Grocery Gift 🎁", detail: "You unlocked a Free Grocery Gift for orders above ₹500!" };
  }
  return null;
}

// Computes the discount amount for a coupon document against a subtotal.
// Never trust a discount value sent by the client - this is the single
// source of truth, used by both the "validate coupon" endpoint and order
// creation.
export function computeCouponDiscount(coupon, subtotal) {
  if (!coupon || !coupon.active) {
    throw new Error("This coupon is not valid.");
  }
  if (new Date(coupon.expiryDate).getTime() < Date.now()) {
    throw new Error("This coupon has expired.");
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("This coupon has reached its usage limit.");
  }
  if (subtotal < coupon.minimumOrder) {
    throw new Error(`Add items worth ₹${coupon.minimumOrder - subtotal} more to use this coupon.`);
  }

  let discount =
    coupon.discountType === "percentage"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.maximumDiscount != null) {
    discount = Math.min(discount, coupon.maximumDiscount);
  }

  discount = Math.min(discount, subtotal); // never discount more than the order itself
  return Math.round(discount);
}
