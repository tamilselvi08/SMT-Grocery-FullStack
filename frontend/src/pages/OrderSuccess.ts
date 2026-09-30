import { fetchOrderById } from "../services/resources";
import { apiFetchBlob } from "../services/api";
import { escapeHtml } from "../services/ui";

export function OrderSuccess(): string {

    return `
        <main class="checkout-page">

            <div id="order-success-root">
                <p style="padding: 60px; text-align:center;">Loading your order...</p>
            </div>

        </main>

        <style>
            .order-success-card {
                max-width: 600px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 18px;
                padding: 40px 30px;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0,0,0,0.06);
            }
            .order-success-check {
                width: 80px;
                height: 80px;
                margin: 0 auto 18px;
                border-radius: 50%;
                background: #dcfce7;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
            }
            .order-success-id {
                display: inline-block;
                margin: 14px 0;
                padding: 10px 20px;
                background: #f0fdf4;
                color: #15803d;
                font-weight: 700;
                border-radius: 10px;
                font-size: 18px;
            }
            .order-success-gift {
                margin: 16px 0;
                padding: 14px;
                background: #fef3c7;
                border-radius: 10px;
                color: #92400e;
                font-weight: 600;
            }
            .order-success-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 24px;
                flex-wrap: wrap;
            }
        </style>
    `;

}


export async function mountOrderSuccess(): Promise<void> {

    const root = document.getElementById("order-success-root");
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("id");
    const giftLabel = params.get("gift");

    if (!orderId) {
        root.innerHTML = `<p style="padding: 60px; text-align:center;">Order not found.</p>`;
        return;
    }

    try {

        const { order } = await fetchOrderById(orderId);

        root.innerHTML = `
            <div class="order-success-card">

                <div class="order-success-check">✅</div>

                <h1>Order Placed Successfully!</h1>

                <p>Thank you for shopping with SMT Grocery.</p>

                <div class="order-success-id">${escapeHtml(order.orderId)}</div>

                ${
                    giftLabel
                        ? `<div class="order-success-gift">🎁 You've unlocked: ${escapeHtml(giftLabel)}</div>`
                        : ""
                }

                <p style="color:#6b7280;">
                    Payment: <strong>${escapeHtml(order.paymentMethod.toUpperCase())}</strong>
                    &nbsp;·&nbsp;
                    Status: <strong>${escapeHtml(order.paymentStatus)}</strong>
                </p>

                <p style="font-size: 22px; margin-top: 10px;">
                    <strong>Total Paid: ₹${order.total}</strong>
                </p>

                <div class="order-success-actions">

                    <button id="download-invoice-btn" class="checkout-btn" style="width:auto; padding: 12px 24px;">
                        Download Bill 🧾
                    </button>

                    <a href="/orders" class="continue-shopping" style="background:#ecfdf5; color:#15803d;">
                        View My Orders
                    </a>

                    <a href="/products" class="continue-shopping">
                        Continue Shopping
                    </a>

                </div>

            </div>
        `;

        document.getElementById("download-invoice-btn")?.addEventListener("click", async () => {
            await downloadInvoice(order._id, order.orderId);
        });

    } catch {

        root.innerHTML = `<p style="padding: 60px; text-align:center;">Could not load your order.</p>`;

    }

}


export async function downloadInvoice(mongoOrderId: string, humanOrderId: string): Promise<void> {

    try {

        const blob = await apiFetchBlob(`/api/orders/${mongoOrderId}/invoice`);
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `SMT-Grocery-Invoice-${humanOrderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

    } catch {

        alert("Could not download the invoice. Please try again.");

    }

}
