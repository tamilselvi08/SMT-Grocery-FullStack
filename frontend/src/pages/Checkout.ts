import { getCart, clearGuestCart } from "../services/cart";
import { createOrder, createPaymentIntent, validateCoupon } from "../services/resources";
import { getUser, isLoggedIn } from "../services/api";
import { refreshCartBadge, escapeHtml } from "../services/ui";
import { openLogin } from "../components/Login";
import type { PaymentMethod } from "../services/types";

const FREE_DELIVERY_THRESHOLD = 499;
const DELIVERY_CHARGE = 40;
const APPLIED_COUPON_KEY = "smtCoupon";

export function Checkout(): string {

    if (!isLoggedIn()) {

        return `
            <main class="checkout-page">

                <div class="empty-checkout">

                    <div class="empty-cart-icon">🔐</div>

                    <h1>Login Required</h1>

                    <p>Please login to continue with checkout.</p>

                    <button type="button" class="continue-shopping" id="checkoutLoginButton">
                        Login Now 👤
                    </button>

                </div>

            </main>
        `;

    }

    return `
        <main class="checkout-page">

            <div class="checkout-header">
                <h1>Checkout 📦</h1>
                <p>Complete your order details</p>
            </div>

            <div id="checkout-root">
                <p style="padding: 40px; text-align:center;">Loading your cart...</p>
            </div>

        </main>
    `;
}


export async function mountCheckout(): Promise<void> {

    document.getElementById("checkoutLoginButton")?.addEventListener("click", () => {
        localStorage.setItem("smtRedirectAfterLogin", "/checkout");
        openLogin();
    });

    const root = document.getElementById("checkout-root");
    if (!root) return; // not logged in - the login-required panel is already shown

    try {

        const { items, subtotal } = await getCart();

        if (items.length === 0) {

            root.innerHTML = `
                <div class="empty-checkout">
                    <div class="empty-cart-icon">🛒</div>
                    <h1>Your Cart is Empty</h1>
                    <p>Please add products before checkout.</p>
                    <a href="/products" class="continue-shopping">Go to Products 🛍️</a>
                </div>
            `;
            return;

        }

        renderCheckout(root, items, subtotal);

    } catch {

        root.innerHTML = `<p style="padding: 40px; text-align:center;">Could not load your cart. Please try again.</p>`;

    }

}


function renderCheckout(
    root: HTMLElement,
    items: Awaited<ReturnType<typeof getCart>>["items"],
    subtotal: number
): void {

    const user = getUser();
    const appliedCode = localStorage.getItem(APPLIED_COUPON_KEY) || "";
    const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;

    root.innerHTML = `

        <div class="checkout-container">

            <!-- CUSTOMER DETAILS -->

            <section class="checkout-details">

                <div class="checkout-card">

                    <h2>Delivery Information</h2>

                    <form id="checkoutForm">

                        <div class="checkout-input">
                            <label>Full Name</label>
                            <input type="text" id="customerName" placeholder="Enter your full name" value="${escapeHtml(user?.name || "")}" required>
                        </div>

                        <div class="checkout-input">
                            <label>Email</label>
                            <input type="email" id="customerEmail" placeholder="Enter your email" value="${escapeHtml(user?.email || "")}" required>
                        </div>

                        <div class="checkout-input">
                            <label>Phone Number</label>
                            <input type="tel" id="customerPhone" placeholder="Enter 10 digit phone number" maxlength="10" value="${escapeHtml(user?.mobile || "")}" required>
                        </div>

                        <div class="checkout-input">
                            <label>Delivery Address</label>
                            <textarea id="customerAddress" placeholder="Enter your complete address" rows="4" required>${escapeHtml(user?.address || "")}</textarea>
                        </div>

                        <div class="checkout-row">

                            <div class="checkout-input">
                                <label>City</label>
                                <input type="text" id="customerCity" placeholder="City" value="${escapeHtml(user?.city || "")}" required>
                            </div>

                            <div class="checkout-input">
                                <label>State</label>
                                <input type="text" id="customerState" placeholder="State" value="${escapeHtml(user?.state || "")}">
                            </div>

                            <div class="checkout-input">
                                <label>Pincode</label>
                                <input type="text" id="customerPincode" placeholder="6 digit pincode" maxlength="6" value="${escapeHtml(user?.pincode || "")}" required>
                            </div>

                        </div>

                        <h2 class="payment-title">Payment Method</h2>

                        <div class="payment-options">

                            <label class="payment-option">
                                <input type="radio" name="payment" value="cod" checked>
                                <span>💵 Cash on Delivery</span>
                            </label>

                            <label class="payment-option">
                                <input type="radio" name="payment" value="upi">
                                <span>📱 UPI</span>
                            </label>

                            <label class="payment-option">
                                <input type="radio" name="payment" value="card">
                                <span>💳 Credit/Debit Card</span>
                            </label>

                            <label class="payment-option">
                                <input type="radio" name="payment" value="netbanking">
                                <span>🏦 Net Banking</span>
                            </label>

                        </div>

                        <p id="checkout-payment-note" style="font-size: 13px; color: #6b7280; margin: -6px 0 14px;"></p>

                        <button type="submit" class="place-order-btn" id="placeOrderBtn">
                            Place Order ₹${subtotal - 0 + delivery}
                        </button>

                    </form>

                </div>

            </section>

            <!-- ORDER SUMMARY -->

            <aside class="checkout-summary">

                <h2>Order Summary</h2>

                <div class="checkout-products">

                    ${items
                        .map(
                            (item) => `
                        <div class="checkout-product">
                            <div>
                                <strong>${escapeHtml(item.product.name)}</strong>
                                <small>${item.quantity} × ₹${item.product.price}</small>
                            </div>
                            <strong>₹${item.itemTotal}</strong>
                        </div>
                    `
                        )
                        .join("")}

                </div>

                <hr>

                <div class="checkout-input" style="margin: 12px 0;">
                    <label>Coupon code</label>
                    <div style="display:flex; gap:8px;">
                        <input type="text" id="checkout-coupon-input" placeholder="Enter coupon code" value="${escapeHtml(appliedCode)}" style="flex:1; text-transform: uppercase;">
                        <button type="button" id="checkout-coupon-apply" class="add-cart-btn">Apply</button>
                    </div>
                    <p id="checkout-coupon-message" style="font-size: 13px; margin-top: 6px;"></p>
                </div>

                <div class="summary-row">
                    <span>Subtotal</span>
                    <strong id="checkout-subtotal-value">₹${subtotal}</strong>
                </div>

                <div class="summary-row" id="checkout-discount-row" style="display:none;">
                    <span>Discount</span>
                    <strong id="checkout-discount-value">-₹0</strong>
                </div>

                <div class="summary-row">
                    <span>Delivery</span>
                    <strong id="checkout-delivery-value">${delivery === 0 ? "FREE 🎉" : "₹" + delivery}</strong>
                </div>

                <hr>

                <div class="summary-total">
                    <span>Total</span>
                    <strong id="checkout-total-value">₹${subtotal + delivery}</strong>
                </div>

                <p id="checkout-gift-hint" style="color:#15803d; font-size:13px; margin-top:12px;">
                    ${giftHint(subtotal)}
                </p>

            </aside>

        </div>
    `;

    wireCheckoutEvents(items, subtotal);

    if (appliedCode) {
        applyCheckoutCoupon(appliedCode, subtotal);
    }

}


function giftHint(subtotal: number): string {

    if (subtotal >= 999) return "🎁 This order qualifies for a Premium Gift!";
    if (subtotal >= 500) return "🎁 This order qualifies for a Free Grocery Gift!";
    return `Spend ₹${500 - subtotal} more to unlock a Free Grocery Gift 🎁`;

}


function wireCheckoutEvents(
    items: Awaited<ReturnType<typeof getCart>>["items"],
    subtotal: number
): void {

    let appliedDiscount = 0;

    document.getElementById("checkout-coupon-apply")?.addEventListener("click", async () => {

        const input = document.getElementById("checkout-coupon-input") as HTMLInputElement | null;
        const code = input?.value.trim().toUpperCase();
        if (!code) return;

        appliedDiscount = await applyCheckoutCoupon(code, subtotal);

    });

    const paymentNote = document.getElementById("checkout-payment-note");

    function updatePaymentNote(): void {

        const method = (document.querySelector('input[name="payment"]:checked') as HTMLInputElement)?.value;

        if (paymentNote) {
            paymentNote.textContent =
                method === "cod"
                    ? "Pay in cash when your order arrives."
                    : "Online payments are integration-ready - without live gateway credentials configured, this order is saved as Pending until a gateway is connected.";
        }

    }

    document.querySelectorAll('input[name="payment"]').forEach((radio) => {
        radio.addEventListener("change", updatePaymentNote);
    });
    updatePaymentNote();

    const form = document.getElementById("checkoutForm") as HTMLFormElement | null;

    form?.addEventListener("submit", async (event) => {

        event.preventDefault();

        const get = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement)?.value.trim();

        const fullName = get("customerName");
        const email = get("customerEmail");
        const mobile = get("customerPhone");
        const address = get("customerAddress");
        const city = get("customerCity");
        const state = get("customerState");
        const pincode = get("customerPincode");
        const paymentMethod = (document.querySelector('input[name="payment"]:checked') as HTMLInputElement)
            ?.value as PaymentMethod;

        if (!fullName || !email || !mobile || !address || !city || !pincode) {
            alert("Please fill all required fields.");
            return;
        }

        if (!/^\d{10}$/.test(mobile)) {
            alert("Please enter a valid 10 digit phone number.");
            return;
        }

        if (!/^\d{6}$/.test(pincode)) {
            alert("Please enter a valid 6 digit pincode.");
            return;
        }

        const submitBtn = document.getElementById("placeOrderBtn") as HTMLButtonElement | null;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Placing order...";
        }

        try {

            const orderPayload = {
                items: items.map((item) => ({ productId: item.product._id, quantity: item.quantity })),
                shippingAddress: { fullName, email, mobile, address, city, state, pincode },
                paymentMethod,
                couponCode: localStorage.getItem(APPLIED_COUPON_KEY) || undefined,
            };

            const { order, gift } = await createOrder(orderPayload);

            if (paymentMethod !== "cod") {
                try {
                    await createPaymentIntent({ orderId: order.orderId, paymentMethod });
                } catch {
                    // Non-fatal - the order already exists as Pending; payment can be
                    // completed/retried once a real gateway is connected.
                }
            }

            localStorage.removeItem(APPLIED_COUPON_KEY);
            clearGuestCart();
            refreshCartBadge();

            const giftParam = gift ? `&gift=${encodeURIComponent(gift.label)}` : "";
            window.location.href = `/order-success?id=${order._id}${giftParam}`;

        } catch (error) {

            alert(error instanceof Error ? error.message : "Could not place order. Please try again.");

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = `Place Order ₹${subtotal - appliedDiscount + (subtotal - appliedDiscount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE)}`;
            }

        }

    });

}


async function applyCheckoutCoupon(code: string, subtotal: number): Promise<number> {

    const messageEl = document.getElementById("checkout-coupon-message");
    const discountRow = document.getElementById("checkout-discount-row");
    const discountValueEl = document.getElementById("checkout-discount-value");
    const deliveryValueEl = document.getElementById("checkout-delivery-value");
    const totalValueEl = document.getElementById("checkout-total-value");
    const placeOrderBtn = document.getElementById("placeOrderBtn");

    if (!messageEl) return 0;

    try {

        const result = await validateCoupon(code, subtotal);
        localStorage.setItem(APPLIED_COUPON_KEY, code);

        messageEl.style.color = "#15803d";
        messageEl.textContent = result.message;

        const discountedSubtotal = subtotal - result.discount;
        const delivery = discountedSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
        const total = discountedSubtotal + delivery;

        if (discountRow && discountValueEl) {
            discountRow.style.display = "flex";
            discountValueEl.textContent = `-₹${result.discount}`;
        }

        if (deliveryValueEl) deliveryValueEl.textContent = delivery === 0 ? "FREE 🎉" : `₹${delivery}`;
        if (totalValueEl) totalValueEl.textContent = `₹${total}`;
        if (placeOrderBtn) placeOrderBtn.textContent = `Place Order ₹${total}`;

        return result.discount;

    } catch (error) {

        localStorage.removeItem(APPLIED_COUPON_KEY);
        messageEl.style.color = "#dc2626";
        messageEl.textContent = error instanceof Error ? error.message : "Invalid coupon.";
        return 0;

    }

}
