export interface Product {
    _id: string;
    name: string;
    category: string;
    price: number;
    originalPrice: number;
    discount: number;
    image: string;
    description: string;
    unit: string;
    stock: number;
    keywords: string[];
}

export interface Category {
    _id: string;
    name: string;
    slug: string;
    image: string;
    description: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
    itemTotal: number;
}

export interface CartResponse {
    items: CartItem[];
    subtotal: number;
}

export interface Coupon {
    _id: string;
    code: string;
    discountType: "percentage" | "flat";
    discountValue: number;
    minimumOrder: number;
    maximumDiscount: number | null;
    expiryDate: string;
    usageLimit: number | null;
    usedCount: number;
    active: boolean;
}

export interface ShippingAddress {
    fullName: string;
    mobile: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
}

export interface OrderProductLine {
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
}

export type PaymentMethod = "cod" | "upi" | "card" | "netbanking";
export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Pay on Delivery";
export type OrderStatus =
    | "Order Placed"
    | "Confirmed"
    | "Packed"
    | "Out for Delivery"
    | "Delivered"
    | "Cancelled";

export interface Order {
    _id: string;
    orderId: string;
    user: string;
    products: OrderProductLine[];
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
    coupon: string | null;
    gift: string | null;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    orderStatus: OrderStatus;
    shippingAddress: ShippingAddress;
    createdAt: string;
}

export interface Gift {
    code: string;
    label: string;
    detail: string;
}
