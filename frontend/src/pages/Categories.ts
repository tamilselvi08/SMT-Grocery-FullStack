import { fetchCategories } from "../services/resources";
import { resolveImage } from "../services/api";
import { escapeHtml } from "../services/ui";

export function Categories(): string {

    return `
        <main class="categories-page">

            <!-- HEADER -->

            <section class="categories-header">

                <p class="small-title">
                    🛒 SMT GROCERY
                </p>

                <h1>
                    Shop by Category
                </h1>

                <p>
                    Find everything you need for your
                    everyday grocery shopping.
                </p>

            </section>


            <!-- CATEGORY CARDS -->

            <section class="categories-grid" id="categories-grid">

                <p style="padding: 40px; text-align:center; grid-column: 1/-1;">
                    Loading categories...
                </p>

            </section>


            <!-- BANNER -->

            <section class="categories-banner">

                <div>

                    <p class="small-title">
                        💚 SMT GROCERY
                    </p>

                    <h2>
                        Fresh Products.
                        Better Prices.
                    </h2>

                    <p>
                        Choose your favourite category
                        and start shopping today.
                    </p>

                </div>


                <a
                    href="/products"
                    class="category-main-btn"
                >
                    View All Products 🛒
                </a>

            </section>

        </main>
    `;
}


export async function mountCategories(): Promise<void> {

    const grid = document.getElementById("categories-grid");
    if (!grid) return;

    try {

        const { categories } = await fetchCategories();

        if (categories.length === 0) {
            grid.innerHTML = `<p style="padding: 40px; text-align:center; grid-column: 1/-1;">No categories yet.</p>`;
            return;
        }

        grid.innerHTML = categories
            .map(
                (category) => `

                <a
                    href="/products?category=${encodeURIComponent(category.name)}"
                    class="category-card"
                    data-category="${escapeHtml(category.name)}"
                >

                    <div class="category-image">

                        <img
                            src="${resolveImage(category.image)}"
                            alt="${escapeHtml(category.name)}"
                            loading="lazy"
                        >

                    </div>


                    <div class="category-content">

                        <h2>
                            ${escapeHtml(category.name)}
                        </h2>

                        <p>
                            ${escapeHtml(category.description)}
                        </p>

                        <span>
                            Shop Now →
                        </span>

                    </div>

                </a>

            `
            )
            .join("");

    } catch {

        grid.innerHTML = `<p style="padding: 40px; text-align:center; grid-column: 1/-1;">Could not load categories. Please try again.</p>`;

    }

}
