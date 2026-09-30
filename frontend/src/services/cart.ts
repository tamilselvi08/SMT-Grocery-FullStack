import { apiFetch, isLoggedIn } from "./api";
import { fetchProductById } from "./resources";
import type { CartResponse, CartItem, Product } from "./types";

interface GuestCartLine {
    productId: string;
    quantity: number;
}

const GUEST_CART_KEY = "smtCart";

function readGuestCart(): GuestCartLine[] {

    try {

        const raw = localStorage.getItem(GUEST_CART_KEY);
        const parsed = raw ? JSON.parse(raw) : [];

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter((line: any) => line && typeof line.productId === "string")
            .map((line: any) => ({
                productId: line.productId,
                quantity: Number(line.quantity) || 1,
            }));

    } catch {

        return [];

    }

}

function writeGuestCart(lines: GuestCartLine[]): void {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(lines));
}

/** Mirrors a logged-in user's server cart into the same localStorage key
 *  the Navbar already reads synchronously for the cart-count badge. */
function mirrorServerCartToLocalStorage(cart: CartResponse): void {

    const lines: GuestCartLine[] = cart.items.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
    }));

    writeGuestCart(lines);

}

/** Fetches the current cart (server-backed if logged in, else built from
 *  localStorage + live product data so prices/stock are always fresh). */
export async function getCart(): Promise<CartResponse> {

    if (isLoggedIn()) {

        const cart = await apiFetch<CartResponse>("/api/cart");
        mirrorServerCartToLocalStorage(cart);
        return cart;

    }

    const guestLines = readGuestCart();

    if (guestLines.length === 0) {
        return { items: [], subtotal: 0 };
    }

    const products = await Promise.all(
        guestLines.map(async (line) => {

            try {

                const { product } = await fetchProductById(line.productId);
                return { product, quantity: line.quantity };

            } catch {

                return null; // product deleted since it was added to the guest cart

            }

        })
    );

    const items: CartItem[] = products
        .filter((entry): entry is { product: Product; quantity: number } => entry !== null)
        .map((entry) => {

            const quantity = Math.min(entry.quantity, entry.product.stock || entry.quantity);

            return {
                product: entry.product,
                quantity,
                itemTotal: Math.round(entry.product.price * quantity * 100) / 100,
            };

        });

    // Drop any lines whose product no longer exists, and persist the
    // stock-capped quantities back to storage.
    writeGuestCart(items.map((item) => ({ productId: item.product._id, quantity: item.quantity })));

    const subtotal = Math.round(items.reduce((sum, item) => sum + item.itemTotal, 0) * 100) / 100;

    return { items, subtotal };

}

export async function addToCart(product: Product, quantity: number = 1): Promise<CartResponse> {

    if (isLoggedIn()) {

        const cart = await apiFetch<CartResponse>("/api/cart", {
            method: "POST",
            body: { productId: product._id, quantity },
        });
        mirrorServerCartToLocalStorage(cart);
        return cart;

    }

    const lines = readGuestCart();
    const existing = lines.find((line) => line.productId === product._id);
    const desiredQty = (existing ? existing.quantity : 0) + quantity;

    if (desiredQty > product.stock) {
        throw new Error(`Only ${product.stock} ${product.unit} left in stock.`);
    }

    if (existing) {
        existing.quantity = desiredQty;
    } else {
        lines.push({ productId: product._id, quantity: desiredQty });
    }

    writeGuestCart(lines);
    return getCart();

}

export async function updateCartItemQuantity(
    productId: string,
    quantity: number,
    stock?: number
): Promise<CartResponse> {

    if (isLoggedIn()) {

        const cart = await apiFetch<CartResponse>(`/api/cart/${productId}`, {
            method: "PUT",
            body: { quantity },
        });
        mirrorServerCartToLocalStorage(cart);
        return cart;

    }

    if (stock !== undefined && quantity > stock) {
        throw new Error(`Only ${stock} left in stock.`);
    }

    const lines = readGuestCart();
    const existing = lines.find((line) => line.productId === productId);

    if (existing) {
        existing.quantity = Math.max(1, quantity);
    }

    writeGuestCart(lines);
    return getCart();

}

export async function removeCartItem(productId: string): Promise<CartResponse> {

    if (isLoggedIn()) {

        const cart = await apiFetch<CartResponse>(`/api/cart/${productId}`, { method: "DELETE" });
        mirrorServerCartToLocalStorage(cart);
        return cart;

    }

    const lines = readGuestCart().filter((line) => line.productId !== productId);
    writeGuestCart(lines);
    return getCart();

}

export function clearGuestCart(): void {
    localStorage.removeItem(GUEST_CART_KEY);
}

/** Called right after a successful login so items added while browsing as a
 *  guest aren't lost - they get merged into the user's DB cart. */
export async function mergeGuestCartIntoAccount(): Promise<void> {

    const guestLines = readGuestCart();

    if (guestLines.length === 0) {
        return;
    }

    try {

        const cart = await apiFetch<CartResponse>("/api/cart/merge", {
            method: "POST",
            body: { items: guestLines },
        });
        mirrorServerCartToLocalStorage(cart);

    } catch {
        // If the merge fails for any reason, don't block login - the user
        // just keeps whatever was already in their account cart.
    }

}
