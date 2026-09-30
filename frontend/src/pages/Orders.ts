import { fetchMyOrders } from "../services/resources";
import { resolveImage, isLoggedIn } from "../services/api";
import { escapeHtml } from "../services/ui";
import { downloadInvoice } from "./OrderSuccess";
import { openLogin } from "../components/Login";
import type { Order } from "../services/types";

const STATUS_FLOW = ["Order Placed", "Confirmed", "Packed", "Out for Delivery", "Delivered"];

export function Orders(): string {

    if (!isLoggedIn()) {

        return `
            <main class="orders-page">

                <div class="empty-orders">
                    <div class="empty-orders-icon">🔐</div>
                    <h2>Login Required</h2>
                    <p>Please login to view your orders.</p>
                    <button type="button" class="continue-shopping" id="orders-login-btn">Login Now 👤</button>
                </div>

            </main>
        `;

    }

    return `
        <main class="orders-page">

            <div class="orders-header">
                <h1>My Orders 📦</h1>
                <p>Track your grocery orders here.</p>
            </div>

            <div id="orders-root">
                <p style="padding: 40px; text-align:center;">Loading your orders...</p>
            </div>

        </main>
    `;
}


export async function mountOrders(): Promise<void> {

    document.getElementById("orders-login-btn")?.addEventListener("click", () => {
        localStorage.setItem("smtRedirectAfterLogin", "/orders");
        openLogin();
    });

    const root = document.getElementById("orders-root");
    if (!root) return;

    try {

        const { orders } = await fetchMyOrders();
        renderOrders(root, orders);

    } catch {

        root.innerHTML = `<p style="padding: 40px; text-align:center;">Could not load your orders. Please try again.</p>`;

    }

}


function renderOrders(root: HTMLElement, orders: Order[]): void {

    if (orders.length === 0) {

        root.innerHTML = `
            <div class="empty-orders">
                <div class="empty-orders-icon">📦</div>
                <h2>No Orders Yet</h2>
                <p>You haven't placed any orders yet.</p>
                <a href="/products" class="continue-shopping">Start Shopping 🛒</a>
            </div>
        `;

        return;

    }

    root.innerHTML = `
        <div class="orders-list">

            ${orders
                .map(
                    (order) => `

                <div class="order-card" data-order-id="${order._id}">

                    <div class="order-top">
                        <div>
                            <span class="order-label">ORDER ID</span>
                            <h3>${escapeHtml(order.orderId)}</h3>
                        </div>
                        <div class="order-status">
                            ${order.orderStatus === "Cancelled" ? "✕ Cancelled" : "✓ " + escapeHtml(order.orderStatus)}
                        </div>
                    </div>

                    ${order.orderStatus !== "Cancelled" ? renderStatusStepper(order.orderStatus) : ""}

                    <div class="order-info">

                        <div>
                            <span>Order Date</span>
                            <strong>${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
                        </div>

                        <div>
                            <span>Payment</span>
                            <strong>${getPaymentName(order.paymentMethod)} · ${escapeHtml(order.paymentStatus)}</strong>
                        </div>

                        <div>
                            <span>Total</span>
                            <strong class="order-price">₹${order.total}</strong>
                        </div>

                    </div>

                    <div class="ordered-products">

                        <h4>Products</h4>

                        ${order.products
                            .map(
                                (item) => `
                            <div class="ordered-product">
                                <div class="ordered-product-image">
                                    <img src="${resolveImage(item.image)}" alt="${escapeHtml(item.name)}">
                                </div>
                                <div class="ordered-product-details">
                                    <strong>${escapeHtml(item.name)}</strong>
                                    <span>₹${item.price} × ${item.quantity}</span>
                                </div>
                                <strong>₹${item.price * item.quantity}</strong>
                            </div>
                        `
                            )
                            .join("")}

                    </div>

                    <div class="delivery-info">
                        <h4>Delivery Address</h4>
                        <p>${escapeHtml(order.shippingAddress.fullName)}</p>
                        <p>${escapeHtml(order.shippingAddress.address)}, ${escapeHtml(order.shippingAddress.city)} - ${escapeHtml(order.shippingAddress.pincode)}</p>
                        <p>📱 ${escapeHtml(order.shippingAddress.mobile)}</p>
                    </div>

                    <div class="order-actions">

                        <button
                            class="order-shop-btn download-invoice-btn"
                            data-mongo-id="${order._id}"
                            data-order-id="${escapeHtml(order.orderId)}"
                            type="button"
                            style="border:none; cursor:pointer;"
                        >
                            Download Bill 🧾
                        </button>

                        <a href="/products" class="order-shop-btn">Buy Again 🛒</a>

                    </div>

                </div>

            `
                )
                .join("")}

        </div>
    `;

    root.querySelectorAll<HTMLButtonElement>(".download-invoice-btn").forEach((button) => {

        button.addEventListener("click", async () => {

            const originalText = button.textContent;
            button.textContent = "Preparing...";
            button.disabled = true;

            await downloadInvoice(button.dataset.mongoId!, button.dataset.orderId!);

            button.textContent = originalText;
            button.disabled = false;

        });

    });

}


function renderStatusStepper(currentStatus: string): string {

    const currentIndex = STATUS_FLOW.indexOf(currentStatus);

    return `
        <div class="order-status-stepper" style="display:flex; gap:6px; margin: 14px 0;">

            ${STATUS_FLOW.map((step, index) => `
                <div style="flex:1; text-align:center;">
                    <div style="
                        height:6px;
                        border-radius:4px;
                        background:${index <= currentIndex ? "#15803d" : "#e5e7eb"};
                        margin-bottom:4px;
                    "></div>
                    <span style="font-size:10px; color:${index <= currentIndex ? "#15803d" : "#9ca3af"};">
                        ${step}
                    </span>
                </div>
            `).join("")}

        </div>
    `;

}


function getPaymentName(payment: string): string {

    if (payment === "upi") return "📱 UPI";
    if (payment === "card") return "💳 Card";
    if (payment === "netbanking") return "🏦 Net Banking";
    return "💵 Cash on Delivery";

}
