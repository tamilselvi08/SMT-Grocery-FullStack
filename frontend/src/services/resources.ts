import { apiFetch, getToken, API_URL } from "./api";
import type { SmtUser } from "./api";
import type {
    Product,
    Category,
    Coupon,
    Order,
    Gift,
    PaymentMethod,
    ShippingAddress,
} from "./types";

/* =========================================================
   AUTH
========================================================= */

export function registerUser(payload: {
    name: string;
    email: string;
    password: string;
    mobile?: string;
}): Promise<{ user: SmtUser; token: string }> {

    return apiFetch("/api/auth/register", { method: "POST", body: payload, auth: false });
}

export function loginUser(payload: {
    email: string;
    password: string;
}): Promise<{ user: SmtUser; token: string }> {

    return apiFetch("/api/auth/login", { method: "POST", body: payload, auth: false });
}

export function updateProfile(payload: Partial<SmtUser>): Promise<{ user: SmtUser }> {
    return apiFetch("/api/auth/profile", { method: "PUT", body: payload });
}

/* =========================================================
   PRODUCTS & CATEGORIES
========================================================= */

export function fetchProducts(params: {
    category?: string;
    search?: string;
} = {}): Promise<{ products: Product[]; total: number }> {

    const query = new URLSearchParams();

    if (params.category && params.category !== "All") {
        query.set("category", params.category);
    }
    if (params.search) {
        query.set("search", params.search);
    }
    query.set("limit", "200");

    return apiFetch(`/api/products?${query.toString()}`, { auth: false });
}

export function fetchProductById(id: string): Promise<{ product: Product }> {
    return apiFetch(`/api/products/${id}`, { auth: false });
}

export function fetchCategories(): Promise<{ categories: Category[] }> {
    return apiFetch("/api/categories", { auth: false });
}

/* =========================================================
   WISHLIST
========================================================= */

export function fetchWishlist(): Promise<{ products: Product[] }> {
    return apiFetch("/api/wishlist");
}

export function addToWishlistApi(productId: string): Promise<{ products: Product[] }> {
    return apiFetch("/api/wishlist", { method: "POST", body: { productId } });
}

export function removeFromWishlistApi(productId: string): Promise<{ products: Product[] }> {
    return apiFetch(`/api/wishlist/${productId}`, { method: "DELETE" });
}

/* =========================================================
   COUPONS
========================================================= */

export function fetchCoupons(): Promise<{ coupons: Coupon[] }> {
    return apiFetch("/api/coupons", { auth: false });
}

export function validateCoupon(
    code: string,
    subtotal: number
): Promise<{ valid: boolean; code: string; discount: number; message: string }> {

    return apiFetch("/api/coupons/validate", { method: "POST", body: { code, subtotal } });
}

/* =========================================================
   ORDERS
========================================================= */

export function createOrder(payload: {
    items: { productId: string; quantity: number }[];
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
    couponCode?: string;
}): Promise<{ order: Order; gift: Gift | null }> {

    return apiFetch("/api/orders", { method: "POST", body: payload });
}

export function fetchMyOrders(): Promise<{ orders: Order[] }> {
    return apiFetch("/api/orders");
}

export function fetchOrderById(id: string): Promise<{ order: Order }> {
    return apiFetch(`/api/orders/${id}`);
}

/* =========================================================
   PAYMENT
========================================================= */

export function createPaymentIntent(payload: {
    orderId: string;
    paymentMethod: PaymentMethod;
}): Promise<{ status: string; message?: string; paymentId?: string; gatewayConfigured?: boolean }> {

    return apiFetch("/api/payment/create", { method: "POST", body: payload });
}

/* =========================================================
   ADMIN
========================================================= */

export interface DashboardStats {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalSales: number;
    pendingOrders: number;
    deliveredOrders: number;
}

export function fetchDashboardStats(): Promise<DashboardStats> {
    return apiFetch("/api/admin/dashboard");
}

export function fetchAdminUsers(): Promise<{ users: SmtUser[] }> {
    return apiFetch("/api/admin/users");
}

export function updateUserRole(userId: string, role: "customer" | "admin"): Promise<{ user: SmtUser }> {
    return apiFetch(`/api/admin/users/${userId}/role`, { method: "PUT", body: { role } });
}

export function fetchAdminOrders(): Promise<{ orders: (Order & { user: { name: string; email: string } })[] }> {
    return apiFetch("/api/admin/orders");
}

export function updateOrderStatusApi(
    orderId: string,
    payload: { orderStatus?: string; paymentStatus?: string }
): Promise<{ order: Order }> {
    return apiFetch(`/api/admin/orders/${orderId}/status`, { method: "PUT", body: payload });
}

export function createProductApi(payload: Partial<Product> & { name: string }): Promise<{ product: Product }> {
    return apiFetch("/api/products", { method: "POST", body: payload });
}

export function updateProductApi(id: string, payload: Partial<Product>): Promise<{ product: Product }> {
    return apiFetch(`/api/products/${id}`, { method: "PUT", body: payload });
}

export function deleteProductApi(id: string): Promise<{ message: string }> {
    return apiFetch(`/api/products/${id}`, { method: "DELETE" });
}

export async function uploadProductImage(file: File): Promise<{ url: string }> {

    const formData = new FormData();
    formData.append("image", file);

    const token = getToken();

    const response = await fetch(`${API_URL}/api/products/upload-image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Image upload failed.");
    }

    return response.json();
}

export function createCategoryApi(payload: {
    name: string;
    image?: string;
    description?: string;
}): Promise<{ category: Category }> {
    return apiFetch("/api/categories", { method: "POST", body: payload });
}

export function updateCategoryApi(
    id: string,
    payload: { name?: string; image?: string; description?: string }
): Promise<{ category: Category }> {
    return apiFetch(`/api/categories/${id}`, { method: "PUT", body: payload });
}

export function deleteCategoryApi(id: string): Promise<{ message: string }> {
    return apiFetch(`/api/categories/${id}`, { method: "DELETE" });
}

export function fetchAdminCoupons(): Promise<{ coupons: Coupon[] }> {
    return apiFetch("/api/coupons/admin/all");
}

export function createCouponApi(payload: Partial<Coupon> & { code: string }): Promise<{ coupon: Coupon }> {
    return apiFetch("/api/coupons", { method: "POST", body: payload });
}

export function updateCouponApi(id: string, payload: Partial<Coupon>): Promise<{ coupon: Coupon }> {
    return apiFetch(`/api/coupons/${id}`, { method: "PUT", body: payload });
}

export function deleteCouponApi(id: string): Promise<{ message: string }> {
    return apiFetch(`/api/coupons/${id}`, { method: "DELETE" });
}
