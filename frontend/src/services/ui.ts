/** Re-reads the cart line count from localStorage ("smtCart", which both
 *  the guest cart and the logged-in cart mirror keep up to date) and
 *  updates the two badge elements the Navbar already renders, so users see
 *  the new count immediately after Add to Cart without a full reload. */
export function refreshCartBadge(): void {

    let count = 0;

    try {

        const cart = JSON.parse(localStorage.getItem("smtCart") || "[]");

        count = Array.isArray(cart)
            ? cart.reduce((total: number, item: any) => total + (Number(item.quantity) || 0), 0)
            : 0;

    } catch {

        count = 0;

    }

    document.querySelectorAll<HTMLElement>(".cart-btn span").forEach((el) => {
        el.textContent = String(count);
    });

    document.querySelectorAll<HTMLElement>(".mobile-cart-count").forEach((el) => {
        el.textContent = String(count);
    });

}

/** Simple, dependency-free debounce for search inputs etc. */
export function debounce<Args extends unknown[]>(
    fn: (...args: Args) => void,
    delayMs: number
): (...args: Args) => void {

    let timer: ReturnType<typeof setTimeout> | undefined;

    return (...args: Args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delayMs);
    };

}

export function escapeHtml(value: string): string {

    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

}
