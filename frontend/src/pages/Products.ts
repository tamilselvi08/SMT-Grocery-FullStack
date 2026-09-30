import { fetchProducts } from "../services/resources";
import { addToCart } from "../services/cart";
import { resolveImage } from "../services/api";
import { refreshCartBadge, debounce, escapeHtml } from "../services/ui";
import type { Product } from "../services/types";

const CATEGORY_OPTIONS = [
    "All",
    "Vegetables",
    "Fruits",
    "Dairy",
    "Rice & Grains",
    "Cooking Essentials",
    "Personal Care",
    "Bakery",
    "Beverages",
    "Snacks",
    "Household",
];

function getUrlState(): { category: string; search: string } {

    const params = new URLSearchParams(window.location.search);

    return {
        category: params.get("category") || "All",
        search: params.get("search") || "",
    };

}

export function Products(): string {

    const { category, search } = getUrlState();

    return `

        <main class="products-page">

            <section class="products-header">

                <div>
                    <span class="small-title">SHOP</span>

                    <h1>Our Products</h1>

                    <p>
                        Fresh and quality products for your everyday needs.
                    </p>
                </div>

                <div class="products-controls">

                    <input
                        type="text"
                        id="product-search"
                        placeholder="🔍 Search products..."
                        value="${escapeHtml(search)}"
                    >

                    <select id="category-filter">

                        ${CATEGORY_OPTIONS.map(
                            (opt) => `
                                <option value="${opt}" ${category === opt ? "selected" : ""}>
                                    ${opt === "All" ? "All Categories" : opt}
                                </option>
                            `
                        ).join("")}

                    </select>

                </div>

            </section>


            <section class="products-grid" id="products-grid">

                <p style="padding: 40px; text-align: center; grid-column: 1/-1;">
                    Loading products...
                </p>

            </section>

            <p
                id="no-products"
                style="
                    display:none;
                    text-align:center;
                    padding:40px;
                    font-size:18px;
                "
            >
                No products found.
            </p>

        </main>

        <style>

            .products-page {
                padding: 30px;
                max-width: 1400px;
                margin: auto;
            }

            .products-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 20px;
                margin-bottom: 30px;
                flex-wrap: wrap;
            }

            .products-header h1 {
                margin: 5px 0;
            }

            .small-title {
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 1px;
            }

            .products-controls {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }

            #product-search,
            #category-filter {
                padding: 12px 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
            }

            #product-search {
                width: 230px;
            }

            .products-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
            }

            .product-card {
                background: white;
                border: 1px solid #eee;
                border-radius: 14px;
                overflow: hidden;
                transition: 0.2s;
                cursor: pointer;
            }

            .product-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.08);
            }

            .product-image {
                width: 100%;
                height: 210px;
                background: #f5f5f5;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }

            .product-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            .product-content {
                padding: 15px;
            }

            .product-category {
                font-size: 12px;
                color: #777;
            }

            .product-content h3 {
                margin: 7px 0;
                font-size: 17px;
            }

            .product-quantity {
                margin: 0 0 12px;
                color: #777;
                font-size: 14px;
            }

            .product-bottom {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
            }

            .product-bottom strong {
                font-size: 18px;
            }

            .add-cart-btn {
                border: none;
                background: #198754;
                color: white;
                padding: 9px 12px;
                border-radius: 7px;
                cursor: pointer;
                font-weight: 600;
            }

            .add-cart-btn:hover {
                background: #146c43;
            }

            .add-cart-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .image-error::after {
                content: "🛒";
                font-size: 40px;
            }

            @media (max-width: 1100px) {

                .products-grid {
                    grid-template-columns: repeat(3, 1fr);
                }

            }

            @media (max-width: 750px) {

                .products-grid {
                    grid-template-columns: repeat(2, 1fr);
                }

                .products-page {
                    padding: 20px;
                }

            }

            @media (max-width: 500px) {

                .products-grid {
                    grid-template-columns: 1fr;
                }

                #product-search {
                    width: 100%;
                }

                .products-controls {
                    width: 100%;
                }

                #category-filter {
                    width: 100%;
                }

            }

        </style>
    `;
}


/* =========================================================
   MOUNT - fetches from the backend and wires up interactivity.
   Called after Products() has been injected into the DOM.
========================================================= */

export function mountProducts(): void {

    const grid = document.getElementById("products-grid");
    const noProducts = document.getElementById("no-products");
    const searchInput = document.getElementById("product-search") as HTMLInputElement | null;
    const categoryFilter = document.getElementById("category-filter") as HTMLSelectElement | null;

    if (!grid || !noProducts || !searchInput || !categoryFilter) {
        return;
    }

    function renderCards(products: Product[]): void {

        if (!grid || !noProducts) return;

        if (products.length === 0) {
            grid.innerHTML = "";
            noProducts.style.display = "block";
            return;
        }

        noProducts.style.display = "none";

        grid.innerHTML = products
            .map(
                (product) => `

                <article class="product-card" data-id="${product._id}">

                    <div class="product-image">

                        <img
                            src="${resolveImage(product.image)}"
                            alt="${escapeHtml(product.name)}"
                            loading="lazy"
                            onerror="this.style.display='none'; this.parentElement.classList.add('image-error');"
                        >

                    </div>

                    <div class="product-content">

                        <span class="product-category">
                            ${escapeHtml(product.category)}
                        </span>

                        <h3>${escapeHtml(product.name)}</h3>

                        <p class="product-quantity">
                            ${escapeHtml(product.unit)}
                            ${product.stock <= 0 ? " · Out of stock" : ""}
                        </p>

                        <div class="product-bottom">

                            <strong>
                                ₹${product.price}
                            </strong>

                            <button
                                class="add-cart-btn"
                                data-id="${product._id}"
                                ${product.stock <= 0 ? "disabled" : ""}
                            >
                                ${product.stock <= 0 ? "Out of stock" : "Add to Cart"}
                            </button>

                        </div>

                    </div>

                </article>

            `
            )
            .join("");

        // Card click (outside the button) -> product details page.
        grid.querySelectorAll<HTMLElement>(".product-card").forEach((card) => {

            card.addEventListener("click", (event) => {

                if ((event.target as HTMLElement).closest(".add-cart-btn")) {
                    return;
                }

                window.location.href = `/product?id=${card.dataset.id}`;

            });

        });

        // Add to Cart.
        grid.querySelectorAll<HTMLButtonElement>(".add-cart-btn").forEach((button) => {

            button.addEventListener("click", async () => {

                const product = products.find((p) => p._id === button.dataset.id);
                if (!product) return;

                button.disabled = true;
                const originalText = button.textContent;
                button.textContent = "Adding...";

                try {

                    await addToCart(product, 1);
                    refreshCartBadge();
                    alert(product.name + " added to cart 🛒");

                } catch (error) {

                    alert(error instanceof Error ? error.message : "Could not add to cart.");

                } finally {

                    button.disabled = false;
                    button.textContent = originalText;

                }

            });

        });

    }

    async function loadProducts(): Promise<void> {

        if (!grid) return;

        grid.innerHTML = `<p style="padding: 40px; text-align: center; grid-column: 1/-1;">Loading products...</p>`;
        noProducts!.style.display = "none";

        try {

            const { products } = await fetchProducts({
                category: categoryFilter!.value,
                search: searchInput!.value.trim(),
            });

            renderCards(products);

        } catch {

            grid.innerHTML = `<p style="padding: 40px; text-align: center; grid-column: 1/-1;">Could not load products. Please check your connection and try again.</p>`;

        }

    }

    function syncUrl(): void {

        const category = categoryFilter!.value;
        const search = searchInput!.value.trim();

        const params = new URLSearchParams();
        if (category !== "All") params.set("category", category);
        if (search) params.set("search", search);

        const query = params.toString();
        window.history.replaceState({}, "", query ? `/products?${query}` : "/products");

    }

    const debouncedSearch = debounce(() => {
        syncUrl();
        loadProducts();
    }, 300);

    searchInput.addEventListener("input", debouncedSearch);

    categoryFilter.addEventListener("change", () => {
        syncUrl();
        loadProducts();
    });

    loadProducts();

}
