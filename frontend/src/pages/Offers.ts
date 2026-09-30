import { fetchCoupons } from "../services/resources";
import { escapeHtml } from "../services/ui";
import type { Coupon } from "../services/types";

export function Offers(): string {
    return `
        <main class="offers-page">

            <section class="offers-header">
                <p class="small-title">🛒 SMT GROCERY</p>

                <h1>Special Offers 🎉</h1>

                <p>
                    Save more on your everyday grocery shopping.
                </p>
            </section>


            <section class="offers-grid">

                <div class="offer-card">

                    <div class="offer-icon">
                        🥬
                    </div>

                    <div class="offer-content">

                        <span class="offer-tag">
                            VEGETABLES
                        </span>

                        <h2>
                            Fresh Vegetables
                        </h2>

                        <p>
                            Get fresh vegetables at special prices.
                        </p>

                        <strong>
                            Up to 20% OFF
                        </strong>

                        <a
                            href="/products?category=Vegetables"
                            class="offer-btn"
                        >
                            Shop Now →
                        </a>

                    </div>

                </div>


                <div class="offer-card">

                    <div class="offer-icon">
                        🍎
                    </div>

                    <div class="offer-content">

                        <span class="offer-tag">
                            FRUITS
                        </span>

                        <h2>
                            Fresh Fruits
                        </h2>

                        <p>
                            Enjoy healthy and fresh fruits every day.
                        </p>

                        <strong>
                            Up to 15% OFF
                        </strong>

                        <a
                            href="/products?category=Fruits"
                            class="offer-btn"
                        >
                            Shop Now →
                        </a>

                    </div>

                </div>


                <div class="offer-card">

                    <div class="offer-icon">
                        🫗
                    </div>

                    <div class="offer-content">

                        <span class="offer-tag">
                            COOKING
                        </span>

                        <h2>
                            Cooking Essentials
                        </h2>

                        <p>
                            Save on oils, salt and kitchen essentials.
                        </p>

                        <strong>
                            Up to 10% OFF
                        </strong>

                        <a
                            href="/products?category=Cooking%20Essentials"
                            class="offer-btn"
                        >
                            Shop Now →
                        </a>

                    </div>

                </div>


                <div class="offer-card">

                    <div class="offer-icon">
                        🚚
                    </div>

                    <div class="offer-content">

                        <span class="offer-tag">
                            SPECIAL
                        </span>

                        <h2>
                            Free Delivery
                        </h2>

                        <p>
                            Shop for ₹499 or more and get free delivery.
                        </p>

                        <strong>
                            FREE DELIVERY
                        </strong>

                        <a
                            href="/products"
                            class="offer-btn"
                        >
                            Start Shopping →
                        </a>

                    </div>

                </div>

            </section>


            <!-- LIVE COUPONS -->

            <section class="offers-header" style="margin-top: 50px;">
                <p class="small-title">🏷️ COUPON CODES</p>
                <h1>Apply at Checkout</h1>
                <p>Tap a coupon to copy the code, then paste it in your cart or checkout.</p>
            </section>

            <section class="offers-grid" id="coupons-grid">
                <p style="padding: 20px; grid-column: 1/-1; text-align:center;">Loading coupons...</p>
            </section>


            <section class="offer-banner">

                <div>

                    <p class="small-title">
                        💚 SMT SMART DEAL
                    </p>

                    <h2>
                        More Shopping. More Savings.
                    </h2>

                    <p>
                        Buy your daily essentials from SMT Grocery
                        and enjoy amazing deals.
                    </p>

                </div>

                <a
                    href="/products"
                    class="offer-main-btn"
                >
                    Explore Products 🛒
                </a>

            </section>

        </main>
    `;
}


export async function mountOffers(): Promise<void> {

    const grid = document.getElementById("coupons-grid");
    if (!grid) return;

    try {

        const { coupons } = await fetchCoupons();

        if (coupons.length === 0) {
            grid.innerHTML = `<p style="padding: 20px; grid-column: 1/-1; text-align:center;">No active coupons right now.</p>`;
            return;
        }

        grid.innerHTML = coupons.map((coupon) => renderCouponCard(coupon)).join("");

        grid.querySelectorAll<HTMLButtonElement>(".coupon-copy-btn").forEach((button) => {

            button.addEventListener("click", () => {

                const code = button.dataset.code!;
                localStorage.setItem("smtCoupon", code);

                navigator.clipboard?.writeText(code).catch(() => {});

                button.textContent = "Copied! Go to Cart →";

                setTimeout(() => {
                    window.location.href = "/cart";
                }, 500);

            });

        });

    } catch {

        grid.innerHTML = `<p style="padding: 20px; grid-column: 1/-1; text-align:center;">Could not load coupons.</p>`;

    }

}


function renderCouponCard(coupon: Coupon): string {

    const valueLabel =
        coupon.discountType === "percentage" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`;

    return `
        <div class="offer-card">

            <div class="offer-icon">🏷️</div>

            <div class="offer-content">

                <span class="offer-tag">CODE: ${escapeHtml(coupon.code)}</span>

                <h2>${valueLabel}</h2>

                <p>
                    ${coupon.minimumOrder > 0 ? `On orders above ₹${coupon.minimumOrder}` : "On all orders"}
                    ${coupon.maximumDiscount ? ` · Max discount ₹${coupon.maximumDiscount}` : ""}
                </p>

                <button
                    class="offer-btn coupon-copy-btn"
                    data-code="${escapeHtml(coupon.code)}"
                    type="button"
                    style="border:none; cursor:pointer;"
                >
                    Copy Code
                </button>

            </div>

        </div>
    `;

}
