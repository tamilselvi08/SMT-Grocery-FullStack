import { fetchWishlist, removeFromWishlistApi } from "../services/resources";
import { addToCart } from "../services/cart";
import { resolveImage, isLoggedIn } from "../services/api";
import { refreshCartBadge, escapeHtml } from "../services/ui";
import { openLogin } from "../components/Login";
import type { Product } from "../services/types";

export function Wishlist(): string {

    if (!isLoggedIn()) {

        return `
            <main class="orders-page">

                <div class="empty-orders">
                    <div class="empty-orders-icon">🔐</div>
                    <h2>Login Required</h2>
                    <p>Please login to view your wishlist.</p>
                    <button type="button" class="continue-shopping" id="wishlist-login-btn">Login Now 👤</button>
                </div>

            </main>
        `;

    }

    return `
        <main class="products-page">

            <section class="products-header">
                <div>
                    <span class="small-title">SAVED FOR LATER</span>
                    <h1>My Wishlist ❤️</h1>
                    <p>Products you've saved to buy later.</p>
                </div>
            </section>

            <section class="products-grid" id="wishlist-grid">
                <p style="padding: 40px; text-align:center; grid-column: 1/-1;">Loading your wishlist...</p>
            </section>

        </main>
    `;

}


export async function mountWishlist(): Promise<void> {

    document.getElementById("wishlist-login-btn")?.addEventListener("click", () => {
        localStorage.setItem("smtRedirectAfterLogin", "/wishlist");
        openLogin();
    });

    const grid = document.getElementById("wishlist-grid");
    if (!grid) return;

    try {

        const { products } = await fetchWishlist();
        renderWishlist(grid, products);

    } catch {

        grid.innerHTML = `<p style="padding: 40px; text-align:center; grid-column: 1/-1;">Could not load your wishlist.</p>`;

    }

}


function renderWishlist(grid: HTMLElement, products: Product[]): void {

    if (products.length === 0) {

        grid.innerHTML = `
            <div class="empty-cart" style="grid-column: 1/-1;">
                <div class="empty-cart-icon">🤍</div>
                <h2>Your Wishlist is Empty</h2>
                <p>Save products you love to find them here later.</p>
                <a href="/products" class="continue-shopping">Browse Products 🛍️</a>
            </div>
        `;

        return;

    }

    grid.innerHTML = products
        .map(
            (product) => `

            <article class="product-card" data-id="${product._id}">

                <div class="product-image">
                    <img src="${resolveImage(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
                </div>

                <div class="product-content">

                    <span class="product-category">${escapeHtml(product.category)}</span>
                    <h3>${escapeHtml(product.name)}</h3>
                    <p class="product-quantity">${escapeHtml(product.unit)}</p>

                    <div class="product-bottom">
                        <strong>₹${product.price}</strong>
                        <button class="add-cart-btn wishlist-add-btn" data-id="${product._id}" ${product.stock <= 0 ? "disabled" : ""}>
                            ${product.stock <= 0 ? "Out of stock" : "Add to Cart"}
                        </button>
                    </div>

                    <button
                        class="wishlist-remove-btn"
                        data-id="${product._id}"
                        type="button"
                        style="
                            margin-top: 10px;
                            width: 100%;
                            border: 1px solid #fee2e2;
                            background: #fff;
                            color: #dc2626;
                            padding: 8px;
                            border-radius: 7px;
                            cursor: pointer;
                            font-weight: 600;
                        "
                    >
                        Remove from Wishlist
                    </button>

                </div>

            </article>

        `
        )
        .join("");

    grid.querySelectorAll<HTMLElement>(".product-card").forEach((card) => {
        card.addEventListener("click", (event) => {
            if ((event.target as HTMLElement).closest("button")) return;
            window.location.href = `/product?id=${card.dataset.id}`;
        });
    });

    grid.querySelectorAll<HTMLButtonElement>(".wishlist-add-btn").forEach((button) => {

        button.addEventListener("click", async () => {

            const product = products.find((p) => p._id === button.dataset.id);
            if (!product) return;

            try {
                await addToCart(product, 1);
                refreshCartBadge();
                alert(`${product.name} added to cart 🛒`);
            } catch (error) {
                alert(error instanceof Error ? error.message : "Could not add to cart.");
            }

        });

    });

    grid.querySelectorAll<HTMLButtonElement>(".wishlist-remove-btn").forEach((button) => {

        button.addEventListener("click", async () => {

            try {
                await removeFromWishlistApi(button.dataset.id!);
                await mountWishlist();
            } catch (error) {
                alert(error instanceof Error ? error.message : "Could not update wishlist.");
            }

        });

    });

}
