import { fetchProductById } from "../services/resources";
import { addToCart } from "../services/cart";
import { resolveImage, isLoggedIn } from "../services/api";
import { refreshCartBadge, escapeHtml } from "../services/ui";
import { addToWishlistApi, removeFromWishlistApi, fetchWishlist } from "../services/resources";
import { openLogin } from "../components/Login";
import type { Product } from "../services/types";

export function ProductDetails(): string {

    return `
        <main class="product-details-page">

            <div id="product-details-root">
                <p style="padding: 60px; text-align:center;">Loading product...</p>
            </div>

        </main>

        <style>

            .product-details-page {
                max-width: 1100px;
                margin: auto;
                padding: 30px;
            }

            .pd-layout {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                background: #fff;
                border-radius: 16px;
                padding: 30px;
                border: 1px solid #eee;
            }

            .pd-image {
                width: 100%;
                aspect-ratio: 1 / 1;
                border-radius: 14px;
                overflow: hidden;
                background: #f5f5f5;
            }

            .pd-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            .pd-category {
                font-size: 13px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .pd-title {
                font-size: 28px;
                margin: 8px 0;
            }

            .pd-price-row {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 14px 0;
            }

            .pd-price {
                font-size: 26px;
                font-weight: 700;
                color: #15803d;
            }

            .pd-original-price {
                color: #9ca3af;
                text-decoration: line-through;
                font-size: 16px;
            }

            .pd-discount-badge {
                background: #fee2e2;
                color: #dc2626;
                font-size: 12px;
                font-weight: 700;
                padding: 4px 10px;
                border-radius: 20px;
            }

            .pd-unit {
                color: #6b7280;
                margin-bottom: 12px;
            }

            .pd-stock {
                font-size: 14px;
                margin-bottom: 16px;
            }

            .pd-stock.in-stock { color: #15803d; }
            .pd-stock.low-stock { color: #b45309; }
            .pd-stock.out-of-stock { color: #dc2626; }

            .pd-description {
                color: #374151;
                line-height: 1.7;
                margin-bottom: 20px;
            }

            .pd-qty-row {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 20px;
            }

            .pd-qty-controls {
                display: flex;
                align-items: center;
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
            }

            .pd-qty-controls button {
                border: none;
                background: #f3f4f6;
                width: 38px;
                height: 38px;
                font-size: 18px;
                cursor: pointer;
            }

            .pd-qty-controls span {
                width: 40px;
                text-align: center;
                font-weight: 600;
            }

            .pd-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }

            .pd-btn {
                padding: 13px 22px;
                border-radius: 10px;
                border: none;
                font-weight: 700;
                cursor: pointer;
                font-size: 15px;
            }

            .pd-add-btn {
                background: #ecfdf5;
                color: #15803d;
                border: 2px solid #15803d;
            }

            .pd-buy-btn {
                background: #15803d;
                color: white;
            }

            .pd-wishlist-btn {
                background: #fff;
                border: 2px solid #e5e7eb;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            }

            .pd-wishlist-btn.active {
                border-color: #dc2626;
                color: #dc2626;
            }

            @media (max-width: 800px) {
                .pd-layout {
                    grid-template-columns: 1fr;
                }
            }

        </style>
    `;

}


export async function mountProductDetails(): Promise<void> {

    const root = document.getElementById("product-details-root");
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        root.innerHTML = `<p style="padding: 60px; text-align:center;">Product not found.</p>`;
        return;
    }

    try {

        const { product } = await fetchProductById(id);
        let isWishlisted = false;

        if (isLoggedIn()) {
            try {
                const { products } = await fetchWishlist();
                isWishlisted = products.some((p) => p._id === product._id);
            } catch {
                isWishlisted = false;
            }
        }

        renderProduct(root, product, isWishlisted);

    } catch {

        root.innerHTML = `<p style="padding: 60px; text-align:center;">This product could not be found.</p>`;

    }

}


function renderProduct(root: HTMLElement, product: Product, isWishlisted: boolean): void {

    const stockClass = product.stock <= 0 ? "out-of-stock" : product.stock <= 10 ? "low-stock" : "in-stock";
    const stockText =
        product.stock <= 0
            ? "Out of stock"
            : product.stock <= 10
                ? `Only ${product.stock} left in stock!`
                : `In stock (${product.stock} ${product.unit} available)`;

    root.innerHTML = `

        <div class="pd-layout">

            <div class="pd-image">
                <img src="${resolveImage(product.image)}" alt="${escapeHtml(product.name)}">
            </div>

            <div class="pd-info">

                <span class="pd-category">${escapeHtml(product.category)}</span>

                <h1 class="pd-title">${escapeHtml(product.name)}</h1>

                <div class="pd-price-row">
                    <span class="pd-price">₹${product.price}</span>
                    ${product.originalPrice > product.price ? `<span class="pd-original-price">₹${product.originalPrice}</span>` : ""}
                    ${product.discount > 0 ? `<span class="pd-discount-badge">${product.discount}% OFF</span>` : ""}
                </div>

                <p class="pd-unit">Sold per ${escapeHtml(product.unit)}</p>

                <p class="pd-stock ${stockClass}">${stockText}</p>

                <p class="pd-description">${escapeHtml(product.description)}</p>

                <div class="pd-qty-row">

                    <div class="pd-qty-controls">
                        <button id="pd-qty-minus" type="button">−</button>
                        <span id="pd-qty-value">1</span>
                        <button id="pd-qty-plus" type="button">+</button>
                    </div>

                    <button
                        id="pd-wishlist-btn"
                        class="pd-wishlist-btn ${isWishlisted ? "active" : ""}"
                        type="button"
                        title="Add to wishlist"
                    >${isWishlisted ? "❤️" : "🤍"}</button>

                </div>

                <div class="pd-actions">

                    <button id="pd-add-btn" class="pd-btn pd-add-btn" type="button" ${product.stock <= 0 ? "disabled" : ""}>
                        Add to Cart
                    </button>

                    <button id="pd-buy-btn" class="pd-btn pd-buy-btn" type="button" ${product.stock <= 0 ? "disabled" : ""}>
                        Buy Now
                    </button>

                </div>

            </div>

        </div>
    `;

    let quantity = 1;
    const qtyValueEl = document.getElementById("pd-qty-value")!;

    document.getElementById("pd-qty-minus")?.addEventListener("click", () => {
        if (quantity > 1) quantity -= 1;
        qtyValueEl.textContent = String(quantity);
    });

    document.getElementById("pd-qty-plus")?.addEventListener("click", () => {
        if (quantity < product.stock) quantity += 1;
        qtyValueEl.textContent = String(quantity);
    });

    document.getElementById("pd-add-btn")?.addEventListener("click", async () => {

        try {
            await addToCart(product, quantity);
            refreshCartBadge();
            alert(`${product.name} added to cart 🛒`);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Could not add to cart.");
        }

    });

    document.getElementById("pd-buy-btn")?.addEventListener("click", async () => {

        try {
            await addToCart(product, quantity);
            refreshCartBadge();
            window.location.href = "/checkout";
        } catch (error) {
            alert(error instanceof Error ? error.message : "Could not add to cart.");
        }

    });

    document.getElementById("pd-wishlist-btn")?.addEventListener("click", async (event) => {

        if (!isLoggedIn()) {
            localStorage.setItem("smtRedirectAfterLogin", `/product?id=${product._id}`);
            openLogin();
            return;
        }

        const button = event.currentTarget as HTMLButtonElement;
        const currentlyActive = button.classList.contains("active");

        try {

            if (currentlyActive) {
                await removeFromWishlistApi(product._id);
                button.classList.remove("active");
                button.textContent = "🤍";
            } else {
                await addToWishlistApi(product._id);
                button.classList.add("active");
                button.textContent = "❤️";
            }

        } catch (error) {

            alert(error instanceof Error ? error.message : "Could not update wishlist.");

        }

    });

}
