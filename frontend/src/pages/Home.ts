import { fetchCategories, fetchProducts } from "../services/resources";
import { addToCart } from "../services/cart";
import { resolveImage } from "../services/api";
import { refreshCartBadge, escapeHtml } from "../services/ui";
import type { Product } from "../services/types";

export function Home(): string {

    return `

    <main class="home-page">


        <!-- =====================================================
             HERO
        ====================================================== -->

        <section class="home-hero">

            <div class="hero-content">

                <span class="hero-badge">
                    🌱 FRESH • FAST • AFFORDABLE
                </span>

                <h1>
                    Fresh Groceries.<br>
                    <span>Happy Home.</span>
                </h1>

                <p>
                    Fresh vegetables, fruits, dairy and everyday
                    essentials delivered straight to your doorstep.
                </p>


                <div class="hero-buttons">

                    <button class="home-shop-btn primary-home-btn">
                        Shop Fresh Products 🛒
                    </button>

                    <button class="home-offers-btn secondary-home-btn">
                        Today's Offers 🔥
                    </button>

                </div>


                <div class="hero-stats">

                    <div>
                        <strong>100+</strong>
                        <span>Products</span>
                    </div>

                    <div>
                        <strong>10 min</strong>
                        <span>Quick Delivery</span>
                    </div>

                    <div>
                        <strong>24/7</strong>
                        <span>Easy Shopping</span>
                    </div>

                </div>

            </div>


            <div class="hero-images">

                <img
                    class="hero-main-image"
                    src="/images/hero.png"
                    alt="Fresh vegetables and groceries"
                >

                <div class="hero-fresh-card">

                    <span>✓</span>

                    <div>
                        <strong>Fresh Choice</strong>
                        <small>Quality checked</small>
                    </div>

                </div>

            </div>

        </section>



        <!-- =====================================================
             FRESH CATEGORIES
        ====================================================== -->

        <section class="home-categories">

            <div class="section-heading">

                <div>

                    <span>🥬 FRESH EVERY DAY</span>

                    <h2>
                        Shop Fresh Categories
                    </h2>

                </div>

                <button class="home-shop-btn view-all-btn">
                    View All →
                </button>

            </div>


            <div class="home-category-grid" id="home-category-grid">

                <p style="padding: 20px; grid-column: 1/-1;">Loading categories...</p>

            </div>

        </section>



        <!-- =====================================================
             FRESH DEALS
        ====================================================== -->

        <section class="fresh-deals">

            <div class="section-heading">

                <div>

                    <span>🔥 TODAY'S PICKS</span>

                    <h2>
                        Fresh Deals For You
                    </h2>

                </div>

                <button class="home-offers-btn view-all-btn">
                    View Offers →
                </button>

            </div>


            <div class="fresh-products-grid" id="fresh-products-grid">

                <p style="padding: 20px; grid-column: 1/-1;">Loading today's deals...</p>

            </div>

        </section>



        <!-- =====================================================
             WHY SMT
        ====================================================== -->

        <section class="why-smt">

            <div class="why-heading">

                <span>
                    ⭐ WHY SMT?
                </span>

                <h2>
                    Freshness You Can Trust
                </h2>

                <p>
                    We make everyday grocery shopping simple,
                    fresh and reliable.
                </p>

            </div>


            <div class="why-grid">


                <div class="why-card">

                    <div class="why-icon">
                        🥬
                    </div>

                    <h3>
                        Fresh First
                    </h3>

                    <p>
                        Fresh fruits and vegetables selected
                        for your everyday needs.
                    </p>

                </div>



                <div class="why-card">

                    <div class="why-icon">
                        🚚
                    </div>

                    <h3>
                        Fast Delivery
                    </h3>

                    <p>
                        Get your groceries delivered quickly
                        to your doorstep.
                    </p>

                </div>



                <div class="why-card">

                    <div class="why-icon">
                        💰
                    </div>

                    <h3>
                        Best Prices
                    </h3>

                    <p>
                        Great products at affordable prices
                        for your daily shopping.
                    </p>

                </div>



                <div class="why-card">

                    <div class="why-icon">
                        🔒
                    </div>

                    <h3>
                        Secure Checkout
                    </h3>

                    <p>
                        Safe and simple checkout for
                        stress-free shopping.
                    </p>

                </div>

            </div>

        </section>



        <!-- =====================================================
             FINAL CTA
        ====================================================== -->

        <section class="home-final-cta">

            <div>

                <span>
                    🛒 SMT GROCERY
                </span>

                <h2>
                    Fresh groceries are<br>
                    just a click away.
                </h2>

                <p>
                    Shop fresh. Save more. Live better.
                </p>

            </div>


            <button class="home-shop-btn">
                Start Shopping →
            </button>

        </section>


    </main>

    `;
}


export async function mountHome(): Promise<void> {

    // =========================
    // SHOP / OFFERS BUTTONS
    // =========================

    document.querySelectorAll<HTMLElement>(".home-shop-btn").forEach((button) => {
        button.addEventListener("click", () => {
            window.location.href = "/products";
        });
    });

    document.querySelectorAll<HTMLElement>(".home-offers-btn").forEach((button) => {
        button.addEventListener("click", () => {
            window.location.href = "/offers";
        });
    });

    // =========================
    // CATEGORY TILES (from backend)
    // =========================

    const categoryGrid = document.getElementById("home-category-grid");

    if (categoryGrid) {

        try {

            const { categories } = await fetchCategories();
            const topFour = categories.slice(0, 4);

            categoryGrid.innerHTML = topFour
                .map(
                    (category) => `
                        <div class="home-category-card" data-category="${escapeHtml(category.name)}">

                            <img
                                src="${resolveImage(category.image)}"
                                alt="${escapeHtml(category.name)}"
                            >

                            <div class="category-info">

                                <h3>${escapeHtml(category.name)}</h3>

                                <p>${escapeHtml(category.description)}</p>

                                <span>Explore →</span>

                            </div>

                        </div>
                    `
                )
                .join("");

            categoryGrid.querySelectorAll<HTMLElement>(".home-category-card").forEach((card) => {
                card.addEventListener("click", () => {
                    const category = card.dataset.category || "";
                    window.location.href = `/products?category=${encodeURIComponent(category)}`;
                });
            });

        } catch {

            categoryGrid.innerHTML = `<p style="padding: 20px; grid-column: 1/-1;">Could not load categories.</p>`;

        }

    }

    // =========================
    // FRESH DEALS (from backend - top discounted products)
    // =========================

    const dealsGrid = document.getElementById("fresh-products-grid");

    if (dealsGrid) {

        try {

            const { products } = await fetchProducts({});

            const deals = products
                .filter((p) => p.discount > 0 && p.stock > 0)
                .sort((a, b) => b.discount - a.discount)
                .slice(0, 4);

            const fallback = deals.length > 0 ? deals : products.slice(0, 4);

            dealsGrid.innerHTML = fallback
                .map(
                    (product) => `
                        <div class="fresh-product-card" data-id="${product._id}">

                            <div class="product-image-box">

                                ${
                                    product.discount > 0
                                        ? `<span class="discount-badge">${product.discount}% OFF</span>`
                                        : ""
                                }

                                <img
                                    src="${resolveImage(product.image)}"
                                    alt="${escapeHtml(product.name)}"
                                >

                            </div>


                            <div class="fresh-product-info">

                                <small>${escapeHtml(product.category)}</small>

                                <h3>${escapeHtml(product.name)}</h3>

                                <div class="price-row">

                                    <strong>₹${product.price}</strong>

                                    ${
                                        product.originalPrice > product.price
                                            ? `<del>₹${product.originalPrice}</del>`
                                            : ""
                                    }

                                </div>


                                <button
                                    class="fresh-add-btn"
                                    data-id="${product._id}"
                                    data-name="${escapeHtml(product.name)}"
                                >
                                    Add to Cart +
                                </button>

                            </div>

                        </div>
                    `
                )
                .join("");

            dealsGrid.querySelectorAll<HTMLElement>(".fresh-product-card").forEach((card) => {
                card.addEventListener("click", (event) => {
                    if ((event.target as HTMLElement).closest(".fresh-add-btn")) return;
                    window.location.href = `/product?id=${card.dataset.id}`;
                });
            });

            dealsGrid.querySelectorAll<HTMLButtonElement>(".fresh-add-btn").forEach((button) => {

                button.addEventListener("click", async (event) => {

                    event.stopPropagation();

                    const product = fallback.find((p: Product) => p._id === button.dataset.id);
                    if (!product) return;

                    button.disabled = true;

                    try {

                        await addToCart(product, 1);
                        refreshCartBadge();
                        alert(`${product.name} added to cart! 🛒`);

                    } catch (error) {

                        alert(error instanceof Error ? error.message : "Could not add to cart.");

                    } finally {

                        button.disabled = false;

                    }

                });

            });

        } catch {

            dealsGrid.innerHTML = `<p style="padding: 20px; grid-column: 1/-1;">Could not load today's deals.</p>`;

        }

    }

}
