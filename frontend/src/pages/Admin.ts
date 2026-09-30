import { isAdmin, isLoggedIn, resolveImage } from "../services/api";
import { escapeHtml } from "../services/ui";
import {
    fetchDashboardStats,
    fetchAdminUsers,
    updateUserRole,
    fetchAdminOrders,
    updateOrderStatusApi,
    fetchProducts,
    createProductApi,
    updateProductApi,
    deleteProductApi,
    uploadProductImage,
    fetchCategories,
    fetchAdminCoupons,
    createCouponApi,
    updateCouponApi,
    deleteCouponApi,
} from "../services/resources";
import type { Product, Coupon } from "../services/types";

const ORDER_STATUSES = ["Order Placed", "Confirmed", "Packed", "Out for Delivery", "Delivered", "Cancelled"];
const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Pay on Delivery"];

export function Admin(): string {

    if (!isLoggedIn() || !isAdmin()) {

        return `
            <main class="orders-page">
                <div class="empty-orders">
                    <div class="empty-orders-icon">🚫</div>
                    <h2>Admin Access Required</h2>
                    <p>You don't have permission to view this page.</p>
                    <a href="/" class="continue-shopping">Back to Home</a>
                </div>
            </main>
        `;

    }

    return `
        <main class="admin-page">

            <div class="admin-header">
                <h1>Admin Dashboard</h1>
                <p>Manage products, categories, orders, users and coupons.</p>
            </div>

            <div class="admin-tabs">
                <button class="admin-tab active" data-tab="dashboard">📊 Dashboard</button>
                <button class="admin-tab" data-tab="products">🛒 Products</button>
                <button class="admin-tab" data-tab="orders">📦 Orders</button>
                <button class="admin-tab" data-tab="users">👥 Users</button>
                <button class="admin-tab" data-tab="coupons">🏷️ Coupons</button>
            </div>

            <div id="admin-tab-content">
                <p style="padding: 40px; text-align:center;">Loading...</p>
            </div>

        </main>

        <style>

            .admin-page {
                max-width: 1200px;
                margin: auto;
                padding: 30px;
            }

            .admin-header h1 { margin-bottom: 4px; }
            .admin-header p { color: #6b7280; margin-bottom: 20px; }

            .admin-tabs {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin-bottom: 24px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 10px;
            }

            .admin-tab {
                border: none;
                background: #f3f4f6;
                padding: 10px 18px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                color: #374151;
            }

            .admin-tab.active {
                background: #15803d;
                color: #fff;
            }

            .admin-stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin-bottom: 10px;
            }

            .admin-stat-card {
                background: #fff;
                border: 1px solid #eee;
                border-radius: 12px;
                padding: 20px;
            }

            .admin-stat-card span {
                font-size: 13px;
                color: #6b7280;
            }

            .admin-stat-card strong {
                display: block;
                font-size: 26px;
                margin-top: 6px;
                color: #15803d;
            }

            .admin-table {
                width: 100%;
                border-collapse: collapse;
                background: #fff;
                border-radius: 12px;
                overflow: hidden;
            }

            .admin-table th, .admin-table td {
                text-align: left;
                padding: 12px 14px;
                border-bottom: 1px solid #f0f0f0;
                font-size: 14px;
            }

            .admin-table th {
                background: #f0fdf4;
                color: #15803d;
            }

            .admin-table img {
                width: 40px;
                height: 40px;
                object-fit: cover;
                border-radius: 6px;
            }

            .admin-section-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                flex-wrap: wrap;
                gap: 10px;
            }

            .admin-btn {
                border: none;
                background: #15803d;
                color: #fff;
                padding: 9px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
            }

            .admin-btn.danger { background: #dc2626; }
            .admin-btn.secondary { background: #6b7280; }

            .admin-form {
                background: #fff;
                border: 1px solid #eee;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                display: none;
            }

            .admin-form.open { display: block; }

            .admin-form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 12px;
            }

            .admin-form label {
                font-size: 13px;
                font-weight: 600;
                color: #374151;
                display: block;
                margin-bottom: 4px;
            }

            .admin-form input, .admin-form select, .admin-form textarea {
                width: 100%;
                padding: 9px 10px;
                border: 1px solid #ddd;
                border-radius: 7px;
                font-size: 14px;
            }

            .admin-table-wrap {
                overflow-x: auto;
            }

            select.admin-status-select {
                padding: 6px 8px;
                border-radius: 6px;
                border: 1px solid #ddd;
            }

        </style>
    `;

}


export async function mountAdmin(): Promise<void> {

    if (!isLoggedIn() || !isAdmin()) return;

    const tabs = document.querySelectorAll<HTMLButtonElement>(".admin-tab");
    const content = document.getElementById("admin-tab-content");
    if (!content) return;

    async function loadTab(tab: string): Promise<void> {

        tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
        content!.innerHTML = `<p style="padding: 40px; text-align:center;">Loading...</p>`;

        if (tab === "dashboard") return renderDashboard(content!);
        if (tab === "products") return renderProducts(content!);
        if (tab === "orders") return renderOrders(content!);
        if (tab === "users") return renderUsers(content!);
        if (tab === "coupons") return renderCoupons(content!);

    }

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => loadTab(tab.dataset.tab!));
    });

    await loadTab("dashboard");

}


/* =========================================================
   DASHBOARD
========================================================= */

async function renderDashboard(content: HTMLElement): Promise<void> {

    try {

        const stats = await fetchDashboardStats();

        content.innerHTML = `
            <div class="admin-stats-grid">

                <div class="admin-stat-card"><span>Total Users</span><strong>${stats.totalUsers}</strong></div>
                <div class="admin-stat-card"><span>Total Products</span><strong>${stats.totalProducts}</strong></div>
                <div class="admin-stat-card"><span>Total Orders</span><strong>${stats.totalOrders}</strong></div>
                <div class="admin-stat-card"><span>Total Sales</span><strong>₹${stats.totalSales}</strong></div>
                <div class="admin-stat-card"><span>Pending Orders</span><strong>${stats.pendingOrders}</strong></div>
                <div class="admin-stat-card"><span>Delivered Orders</span><strong>${stats.deliveredOrders}</strong></div>

            </div>
        `;

    } catch {

        content.innerHTML = `<p style="padding: 40px; text-align:center;">Could not load dashboard stats.</p>`;

    }

}


/* =========================================================
   PRODUCTS
========================================================= */

async function renderProducts(content: HTMLElement): Promise<void> {

    try {

        const [{ products }, { categories }] = await Promise.all([fetchProducts({}), fetchCategories()]);

        content.innerHTML = `

            <div class="admin-section-top">
                <h2>Products (${products.length})</h2>
                <button class="admin-btn" id="admin-add-product-btn">+ Add Product</button>
            </div>

            <div class="admin-form" id="admin-product-form-wrap">
                ${productFormHtml(categories.map((c) => c.name))}
            </div>

            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products
                            .map(
                                (p) => `
                            <tr data-id="${p._id}">
                                <td><img src="${resolveImage(p.image)}" alt="${escapeHtml(p.name)}"></td>
                                <td>${escapeHtml(p.name)}</td>
                                <td>${escapeHtml(p.category)}</td>
                                <td>₹${p.price}</td>
                                <td>${p.stock}</td>
                                <td>
                                    <button class="admin-btn secondary edit-product-btn" data-id="${p._id}">Edit</button>
                                    <button class="admin-btn danger delete-product-btn" data-id="${p._id}">Delete</button>
                                </td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
            </div>
        `;

        const formWrap = document.getElementById("admin-product-form-wrap")!;
        let uploadedImageUrl = "";
        let editingId: string | null = null;

        function openForm(product?: Product): void {

            formWrap.classList.add("open");
            editingId = product?._id || null;

            (document.getElementById("pf-name") as HTMLInputElement).value = product?.name || "";
            (document.getElementById("pf-category") as HTMLSelectElement).value = product?.category || categories[0]?.name || "";
            (document.getElementById("pf-price") as HTMLInputElement).value = String(product?.price ?? "");
            (document.getElementById("pf-original-price") as HTMLInputElement).value = String(product?.originalPrice ?? "");
            (document.getElementById("pf-unit") as HTMLInputElement).value = product?.unit || "";
            (document.getElementById("pf-stock") as HTMLInputElement).value = String(product?.stock ?? "");
            (document.getElementById("pf-keywords") as HTMLInputElement).value = (product?.keywords || []).join(", ");
            (document.getElementById("pf-description") as HTMLTextAreaElement).value = product?.description || "";
            uploadedImageUrl = product?.image || "";

            document.getElementById("pf-title")!.textContent = product ? "Edit Product" : "Add Product";

        }

        document.getElementById("admin-add-product-btn")?.addEventListener("click", () => openForm());

        document.getElementById("pf-cancel")?.addEventListener("click", () => {
            formWrap.classList.remove("open");
        });

        document.getElementById("pf-image")?.addEventListener("change", async (event) => {

            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const { url } = await uploadProductImage(file);
                uploadedImageUrl = url;
                alert("Image uploaded. Save the product to apply it.");
            } catch (error) {
                alert(error instanceof Error ? error.message : "Image upload failed.");
            }

        });

        document.getElementById("pf-save")?.addEventListener("click", async () => {

            const payload = {
                name: (document.getElementById("pf-name") as HTMLInputElement).value.trim(),
                category: (document.getElementById("pf-category") as HTMLSelectElement).value,
                price: Number((document.getElementById("pf-price") as HTMLInputElement).value),
                originalPrice: Number((document.getElementById("pf-original-price") as HTMLInputElement).value),
                unit: (document.getElementById("pf-unit") as HTMLInputElement).value.trim(),
                stock: Number((document.getElementById("pf-stock") as HTMLInputElement).value),
                keywords: (document.getElementById("pf-keywords") as HTMLInputElement).value
                    .split(",")
                    .map((k) => k.trim())
                    .filter(Boolean),
                description: (document.getElementById("pf-description") as HTMLTextAreaElement).value.trim(),
                image: uploadedImageUrl,
            };

            if (!payload.name || !payload.category || !payload.unit) {
                alert("Please fill all required fields.");
                return;
            }

            try {

                if (editingId) {
                    await updateProductApi(editingId, payload);
                } else {
                    await createProductApi(payload);
                }

                await renderProducts(content);

            } catch (error) {

                alert(error instanceof Error ? error.message : "Could not save product.");

            }

        });

        content.querySelectorAll<HTMLButtonElement>(".edit-product-btn").forEach((button) => {
            button.addEventListener("click", () => {
                const product = products.find((p) => p._id === button.dataset.id);
                if (product) openForm(product);
            });
        });

        content.querySelectorAll<HTMLButtonElement>(".delete-product-btn").forEach((button) => {
            button.addEventListener("click", async () => {
                if (!confirm("Delete this product?")) return;
                try {
                    await deleteProductApi(button.dataset.id!);
                    await renderProducts(content);
                } catch (error) {
                    alert(error instanceof Error ? error.message : "Could not delete product.");
                }
            });
        });

    } catch {

        content.innerHTML = `<p style="padding: 40px; text-align:center;">Could not load products.</p>`;

    }

}


function productFormHtml(categoryNames: string[]): string {

    return `
        <h3 id="pf-title">Add Product</h3>

        <div class="admin-form-grid" style="margin-top: 14px;">

            <div>
                <label>Name *</label>
                <input type="text" id="pf-name" placeholder="e.g. Fresh Apple">
            </div>

            <div>
                <label>Category *</label>
                <select id="pf-category">
                    ${categoryNames.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
                </select>
            </div>

            <div>
                <label>Price (₹) *</label>
                <input type="number" id="pf-price" min="0">
            </div>

            <div>
                <label>Original Price (₹)</label>
                <input type="number" id="pf-original-price" min="0">
            </div>

            <div>
                <label>Unit *</label>
                <input type="text" id="pf-unit" placeholder="e.g. 1 kg">
            </div>

            <div>
                <label>Stock *</label>
                <input type="number" id="pf-stock" min="0">
            </div>

            <div>
                <label>Keywords (comma separated)</label>
                <input type="text" id="pf-keywords" placeholder="apple, fruit">
            </div>

            <div>
                <label>Image</label>
                <input type="file" id="pf-image" accept="image/*">
            </div>

        </div>

        <label>Description</label>
        <textarea id="pf-description" rows="3" style="margin-bottom: 14px;"></textarea>

        <button class="admin-btn" id="pf-save" type="button">Save Product</button>
        <button class="admin-btn secondary" id="pf-cancel" type="button">Cancel</button>
    `;

}


/* =========================================================
   ORDERS
========================================================= */

async function renderOrders(content: HTMLElement): Promise<void> {

    try {

        const { orders } = await fetchAdminOrders();

        content.innerHTML = `
            <h2 style="margin-bottom: 14px;">Orders (${orders.length})</h2>

            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Payment</th><th>Order Status</th></tr>
                    </thead>
                    <tbody>
                        ${orders
                            .map(
                                (o) => `
                            <tr data-id="${o._id}">
                                <td>${escapeHtml(o.orderId)}</td>
                                <td>${escapeHtml(o.user?.name || "")}<br><small>${escapeHtml(o.user?.email || "")}</small></td>
                                <td>₹${o.total}</td>
                                <td>
                                    <select class="admin-status-select payment-status-select" data-id="${o._id}">
                                        ${PAYMENT_STATUSES.map((s) => `<option value="${s}" ${s === o.paymentStatus ? "selected" : ""}>${s}</option>`).join("")}
                                    </select>
                                </td>
                                <td>
                                    <select class="admin-status-select order-status-select" data-id="${o._id}">
                                        ${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === o.orderStatus ? "selected" : ""}>${s}</option>`).join("")}
                                    </select>
                                </td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
            </div>
        `;

        content.querySelectorAll<HTMLSelectElement>(".order-status-select").forEach((select) => {
            select.addEventListener("change", async () => {
                try {
                    await updateOrderStatusApi(select.dataset.id!, { orderStatus: select.value });
                } catch (error) {
                    alert(error instanceof Error ? error.message : "Could not update order status.");
                }
            });
        });

        content.querySelectorAll<HTMLSelectElement>(".payment-status-select").forEach((select) => {
            select.addEventListener("change", async () => {
                try {
                    await updateOrderStatusApi(select.dataset.id!, { paymentStatus: select.value });
                } catch (error) {
                    alert(error instanceof Error ? error.message : "Could not update payment status.");
                }
            });
        });

    } catch {

        content.innerHTML = `<p style="padding: 40px; text-align:center;">Could not load orders.</p>`;

    }

}


/* =========================================================
   USERS
========================================================= */

async function renderUsers(content: HTMLElement): Promise<void> {

    try {

        const { users } = await fetchAdminUsers();

        content.innerHTML = `
            <h2 style="margin-bottom: 14px;">Users (${users.length})</h2>

            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th></tr>
                    </thead>
                    <tbody>
                        ${users
                            .map(
                                (u) => `
                            <tr data-id="${u.id}">
                                <td>${escapeHtml(u.name)}</td>
                                <td>${escapeHtml(u.email)}</td>
                                <td>${escapeHtml(u.mobile || "-")}</td>
                                <td>
                                    <select class="admin-status-select role-select" data-id="${u.id}">
                                        <option value="customer" ${u.role === "customer" ? "selected" : ""}>Customer</option>
                                        <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                                    </select>
                                </td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
            </div>
        `;

        content.querySelectorAll<HTMLSelectElement>(".role-select").forEach((select) => {
            select.addEventListener("change", async () => {
                try {
                    await updateUserRole(select.dataset.id!, select.value as "customer" | "admin");
                } catch (error) {
                    alert(error instanceof Error ? error.message : "Could not update role.");
                }
            });
        });

    } catch {

        content.innerHTML = `<p style="padding: 40px; text-align:center;">Could not load users.</p>`;

    }

}


/* =========================================================
   COUPONS
========================================================= */

async function renderCoupons(content: HTMLElement): Promise<void> {

    try {

        const { coupons } = await fetchAdminCoupons();

        content.innerHTML = `

            <div class="admin-section-top">
                <h2>Coupons (${coupons.length})</h2>
                <button class="admin-btn" id="admin-add-coupon-btn">+ Add Coupon</button>
            </div>

            <div class="admin-form" id="admin-coupon-form-wrap">
                ${couponFormHtml()}
            </div>

            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Expiry</th><th>Active</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        ${coupons
                            .map(
                                (c) => `
                            <tr data-id="${c._id}">
                                <td>${escapeHtml(c.code)}</td>
                                <td>${c.discountType === "percentage" ? c.discountValue + "%" : "₹" + c.discountValue}</td>
                                <td>₹${c.minimumOrder}</td>
                                <td>${new Date(c.expiryDate).toLocaleDateString("en-IN")}</td>
                                <td>${c.active ? "✅" : "❌"}</td>
                                <td>
                                    <button class="admin-btn secondary edit-coupon-btn" data-id="${c._id}">Edit</button>
                                    <button class="admin-btn danger delete-coupon-btn" data-id="${c._id}">Delete</button>
                                </td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
            </div>
        `;

        const formWrap = document.getElementById("admin-coupon-form-wrap")!;
        let editingId: string | null = null;

        function openForm(coupon?: Coupon): void {

            formWrap.classList.add("open");
            editingId = coupon?._id || null;

            (document.getElementById("cf-code") as HTMLInputElement).value = coupon?.code || "";
            (document.getElementById("cf-type") as HTMLSelectElement).value = coupon?.discountType || "flat";
            (document.getElementById("cf-value") as HTMLInputElement).value = String(coupon?.discountValue ?? "");
            (document.getElementById("cf-min-order") as HTMLInputElement).value = String(coupon?.minimumOrder ?? 0);
            (document.getElementById("cf-max-discount") as HTMLInputElement).value =
                coupon?.maximumDiscount != null ? String(coupon.maximumDiscount) : "";
            (document.getElementById("cf-expiry") as HTMLInputElement).value = coupon
                ? new Date(coupon.expiryDate).toISOString().slice(0, 10)
                : "";
            (document.getElementById("cf-active") as HTMLInputElement).checked = coupon ? coupon.active : true;

            document.getElementById("cf-title")!.textContent = coupon ? "Edit Coupon" : "Add Coupon";

        }

        document.getElementById("admin-add-coupon-btn")?.addEventListener("click", () => openForm());
        document.getElementById("cf-cancel")?.addEventListener("click", () => formWrap.classList.remove("open"));

        document.getElementById("cf-save")?.addEventListener("click", async () => {

            const maxDiscountRaw = (document.getElementById("cf-max-discount") as HTMLInputElement).value;

            const payload = {
                code: (document.getElementById("cf-code") as HTMLInputElement).value.trim().toUpperCase(),
                discountType: (document.getElementById("cf-type") as HTMLSelectElement).value as "flat" | "percentage",
                discountValue: Number((document.getElementById("cf-value") as HTMLInputElement).value),
                minimumOrder: Number((document.getElementById("cf-min-order") as HTMLInputElement).value || 0),
                maximumDiscount: maxDiscountRaw ? Number(maxDiscountRaw) : null,
                expiryDate: (document.getElementById("cf-expiry") as HTMLInputElement).value,
                active: (document.getElementById("cf-active") as HTMLInputElement).checked,
            };

            if (!payload.code || !payload.discountValue || !payload.expiryDate) {
                alert("Please fill all required fields.");
                return;
            }

            try {

                if (editingId) {
                    await updateCouponApi(editingId, payload);
                } else {
                    await createCouponApi(payload);
                }

                await renderCoupons(content);

            } catch (error) {

                alert(error instanceof Error ? error.message : "Could not save coupon.");

            }

        });

        content.querySelectorAll<HTMLButtonElement>(".edit-coupon-btn").forEach((button) => {
            button.addEventListener("click", () => {
                const coupon = coupons.find((c) => c._id === button.dataset.id);
                if (coupon) openForm(coupon);
            });
        });

        content.querySelectorAll<HTMLButtonElement>(".delete-coupon-btn").forEach((button) => {
            button.addEventListener("click", async () => {
                if (!confirm("Delete this coupon?")) return;
                try {
                    await deleteCouponApi(button.dataset.id!);
                    await renderCoupons(content);
                } catch (error) {
                    alert(error instanceof Error ? error.message : "Could not delete coupon.");
                }
            });
        });

    } catch {

        content.innerHTML = `<p style="padding: 40px; text-align:center;">Could not load coupons.</p>`;

    }

}


function couponFormHtml(): string {

    return `
        <h3 id="cf-title">Add Coupon</h3>

        <div class="admin-form-grid" style="margin-top: 14px;">

            <div>
                <label>Code *</label>
                <input type="text" id="cf-code" placeholder="e.g. SAVE50" style="text-transform:uppercase;">
            </div>

            <div>
                <label>Discount Type *</label>
                <select id="cf-type">
                    <option value="flat">Flat (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                </select>
            </div>

            <div>
                <label>Discount Value *</label>
                <input type="number" id="cf-value" min="0">
            </div>

            <div>
                <label>Minimum Order (₹)</label>
                <input type="number" id="cf-min-order" min="0">
            </div>

            <div>
                <label>Maximum Discount (₹, optional)</label>
                <input type="number" id="cf-max-discount" min="0">
            </div>

            <div>
                <label>Expiry Date *</label>
                <input type="date" id="cf-expiry">
            </div>

        </div>

        <label style="display:flex; align-items:center; gap:8px; margin-bottom: 14px;">
            <input type="checkbox" id="cf-active" style="width:auto;"> Active
        </label>

        <button class="admin-btn" id="cf-save" type="button">Save Coupon</button>
        <button class="admin-btn secondary" id="cf-cancel" type="button">Cancel</button>
    `;

}
