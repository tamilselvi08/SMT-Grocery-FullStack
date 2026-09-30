import { getCart, updateCartItemQuantity, removeCartItem } from "../services/cart";
import { validateCoupon } from "../services/resources";
import { resolveImage } from "../services/api";
import { refreshCartBadge, escapeHtml } from "../services/ui";
import { openLogin } from "../components/Login";
import { isLoggedIn } from "../services/api";

const FREE_DELIVERY_THRESHOLD = 499;
const DELIVERY_CHARGE = 40;
const APPLIED_COUPON_KEY = "smtCoupon";

export function Cart(): string {

    return `
        <main class="cart-page">

            <div class="cart-header">

                <h1>
                    My Cart 🛒
                </h1>

                <p>
                    Review your groceries before checkout.
                </p>

            </div>

            <div id="cart-root">

                <p style="padding: 40px; text-align:center;">
                    Loading your cart...
                </p>

            </div>

        </main>
    `;
}


export async function mountCart(): Promise<void> {

    const root = document.getElementById("cart-root");
    if (!root) return;

    try {

        const { items, subtotal } = await getCart();
        renderCart(root, items, subtotal);

    } catch {

        root.innerHTML = `<p style="padding: 40px; text-align:center;">Could not load your cart. Please try again.</p>`;

    }

}


function renderCart(
    root: HTMLElement,
    items: Awaited<ReturnType<typeof getCart>>["items"],
    subtotal: number
): void {

    if (items.length === 0) {

        root.innerHTML = `
            <div class="empty-cart">

                <div class="empty-cart-icon">
                    🛒
                </div>

                <h2>
                    Your Cart is Empty
                </h2>

                <p>
                    Add some fresh groceries to your cart.
                </p>

                <a href="/products" class="continue-shopping">
                    Start Shopping 🛍️
                </a>

            </div>
        `;

        return;

    }

    const appliedCode = localStorage.getItem(APPLIED_COUPON_KEY) || "";

    const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;

    root.innerHTML = `

        <div class="cart-layout">

            <!-- CART ITEMS -->

            <div class="cart-items">

                ${items
                    .map(
                        (item) => `

                    <div class="cart-item" data-id="${item.product._id}">

                        <div class="cart-item-image">
                            <img src="${resolveImage(item.product.image)}" alt="${escapeHtml(item.product.name)}">
                        </div>

                        <div class="cart-item-details">
                            <h3>${escapeHtml(item.product.name)}</h3>
                            <p>${escapeHtml(item.product.unit)}</p>
                            <p>${escapeHtml(item.product.category)}</p>
                        </div>

                        <div class="cart-item-price">
                            ₹${item.product.price}
                        </div>

                        <div class="quantity-controls">

                            <button class="decrease-btn" data-id="${item.product._id}" type="button">−</button>

                            <span>${item.quantity}</span>

                            <button
                                class="increase-btn"
                                data-id="${item.product._id}"
                                data-stock="${item.product.stock}"
                                type="button"
                            >+</button>

                        </div>

                        <button class="remove-btn remove-cart-btn" data-id="${item.product._id}" type="button">
                            Remove
                        </button>

                    </div>

                `
                    )
                    .join("")}

            </div>


            <!-- SUMMARY -->

            <div class="cart-summary">

                <h2>Order Summary</h2>

                <div class="checkout-input" style="margin-bottom: 14px;">
                    <label>Have a coupon?</label>
                    <div style="display:flex; gap:8px;">
                        <input
                            type="text"
                            id="cart-coupon-input"
                            placeholder="Enter coupon code"
                            value="${escapeHtml(appliedCode)}"
                            style="flex:1; text-transform: uppercase;"
                        >
                        <button type="button" id="cart-coupon-apply" class="add-cart-btn">Apply</button>
                    </div>
                    <p id="cart-coupon-message" style="font-size: 13px; margin-top: 6px;"></p>
                </div>

                <div class="summary-row">
                    <span>Subtotal</span>
                    <strong>₹${subtotal}</strong>
                </div>

                <div class="summary-row" id="cart-discount-row" style="display:none;">
                    <span>Discount</span>
                    <strong id="cart-discount-value">-₹0</strong>
                </div>

                <div class="summary-row">
                    <span>Delivery</span>
                    <strong id="cart-delivery-value">${delivery === 0 ? "FREE" : "₹" + delivery}</strong>
                </div>

                <p id="cart-delivery-hint" style="color:#15803d; font-size:13px; margin-top:10px;">
                    ${
                        subtotal < FREE_DELIVERY_THRESHOLD
                            ? `Add ₹${FREE_DELIVERY_THRESHOLD - subtotal} more for FREE delivery 🚚`
                            : `🎉 You got FREE delivery!`
                    }
                </p>

                <div class="summary-row summary-total">
                    <span>Total</span>
                    <strong id="cart-total-value">₹${subtotal + delivery}</strong>
                </div>

                <button id="checkoutButton" class="checkout-btn" type="button">
                    Proceed to Checkout →
                </button>

                <a
                    href="/products"
                    class="continue-shopping"
                    style="display:block; text-align:center; margin-top:10px; background:#ecfdf5; color:#15803d;"
                >
                    ← Continue Shopping
                </a>

            </div>

        </div>
    `;

    wireCartEvents(subtotal);

    if (appliedCode) {
        applyCoupon(appliedCode, subtotal);
    }

}


function wireCartEvents(subtotal: number): void {

    document.querySelectorAll<HTMLButtonElement>(".increase-btn").forEach((button) => {

        button.addEventListener("click", async () => {

            const id = button.dataset.id!;
            const stock = Number(button.dataset.stock);
            const span = button.parentElement?.querySelector("span");
            const currentQty = Number(span?.textContent || "1");

            try {

                await updateCartItemQuantity(id, currentQty + 1, stock);
                refreshCartBadge();
                await mountCart();

            } catch (error) {

                alert(error instanceof Error ? error.message : "Could not update quantity.");

            }

        });

    });

    document.querySelectorAll<HTMLButtonElement>(".decrease-btn").forEach((button) => {

        button.addEventListener("click", async () => {

            const id = button.dataset.id!;
            const span = button.parentElement?.querySelector("span");
            const currentQty = Number(span?.textContent || "1");

            try {

                if (currentQty <= 1) {
                    await removeCartItem(id);
                } else {
                    await updateCartItemQuantity(id, currentQty - 1);
                }

                refreshCartBadge();
                await mountCart();

            } catch (error) {

                alert(error instanceof Error ? error.message : "Could not update quantity.");

            }

        });

    });

    document.querySelectorAll<HTMLButtonElement>(".remove-cart-btn").forEach((button) => {

        button.addEventListener("click", async () => {

            try {

                await removeCartItem(button.dataset.id!);
                refreshCartBadge();
                await mountCart();

            } catch (error) {

                alert(error instanceof Error ? error.message : "Could not remove item.");

            }

        });

    });

    document.getElementById("cart-coupon-apply")?.addEventListener("click", () => {

        const input = document.getElementById("cart-coupon-input") as HTMLInputElement | null;
        const code = input?.value.trim().toUpperCase();

        if (!code) return;

        applyCoupon(code, subtotal);

    });

    document.getElementById("checkoutButton")?.addEventListener("click", () => {

        if (!isLoggedIn()) {

            localStorage.setItem("smtRedirectAfterLogin", "/checkout");
            openLogin();
            return;

        }

        window.location.href = "/checkout";

    });

}


async function applyCoupon(code: string, subtotal: number): Promise<void> {

    const messageEl = document.getElementById("cart-coupon-message");
    const discountRow = document.getElementById("cart-discount-row");
    const discountValueEl = document.getElementById("cart-discount-value");
    const deliveryValueEl = document.getElementById("cart-delivery-value");
    const totalValueEl = document.getElementById("cart-total-value");
    const hintEl = document.getElementById("cart-delivery-hint");

    if (!messageEl) return;

    try {

        const result = await validateCoupon(code, subtotal);

        localStorage.setItem(APPLIED_COUPON_KEY, code);

        messageEl.style.color = "#15803d";
        messageEl.textContent = result.message;

        const discountedSubtotal = subtotal - result.discount;
        const delivery = discountedSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;

        if (discountRow && discountValueEl) {
            discountRow.style.display = "flex";
            discountValueEl.textContent = `-₹${result.discount}`;
        }

        if (deliveryValueEl) {
            deliveryValueEl.textContent = delivery === 0 ? "FREE" : `₹${delivery}`;
        }

        if (totalValueEl) {
            totalValueEl.textContent = `₹${discountedSubtotal + delivery}`;
        }

        if (hintEl) {
            hintEl.textContent =
                delivery === 0
                    ? "🎉 You got FREE delivery!"
                    : `Add ₹${FREE_DELIVERY_THRESHOLD - discountedSubtotal} more for FREE delivery 🚚`;
        }

    } catch (error) {

        localStorage.removeItem(APPLIED_COUPON_KEY);
        messageEl.style.color = "#dc2626";
        messageEl.textContent = error instanceof Error ? error.message : "Invalid coupon.";

    }

}
