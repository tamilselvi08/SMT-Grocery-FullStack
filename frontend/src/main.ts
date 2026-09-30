import "./style.css";

import { Navbar } from "./components/Navbar";
import { Home, mountHome } from "./pages/Home";
import { Products, mountProducts } from "./pages/Products";
import { Cart, mountCart } from "./pages/Cart";
import { Checkout, mountCheckout } from "./pages/Checkout";
import { Categories, mountCategories } from "./pages/Categories";
import { Offers, mountOffers } from "./pages/Offers";
import { Orders, mountOrders } from "./pages/Orders";
import { ProductDetails, mountProductDetails } from "./pages/ProductDetails";
import { Wishlist, mountWishlist } from "./pages/Wishlist";
import { OrderSuccess, mountOrderSuccess } from "./pages/OrderSuccess";
import { Admin, mountAdmin } from "./pages/Admin";

const app = document.querySelector<HTMLDivElement>("#app");

function renderPage(): void {

    if (!app) {
        return;
    }

    const path = window.location.pathname;

    let pageHtml = "";
    let mount: (() => void | Promise<void>) | null = null;

    if (path === "/") {
        pageHtml = Home();
        mount = mountHome;
    } else if (path === "/products") {
        pageHtml = Products();
        mount = mountProducts;
    } else if (path === "/product") {
        pageHtml = ProductDetails();
        mount = mountProductDetails;
    } else if (path === "/cart") {
        pageHtml = Cart();
        mount = mountCart;
    } else if (path === "/checkout") {
        pageHtml = Checkout();
        mount = mountCheckout;
    } else if (path === "/order-success") {
        pageHtml = OrderSuccess();
        mount = mountOrderSuccess;
    } else if (path === "/categories") {
        pageHtml = Categories();
        mount = mountCategories;
    } else if (path === "/offers") {
        pageHtml = Offers();
        mount = mountOffers;
    } else if (path === "/orders") {
        pageHtml = Orders();
        mount = mountOrders;
    } else if (path === "/wishlist") {
        pageHtml = Wishlist();
        mount = mountWishlist;
    } else if (path === "/admin") {
        pageHtml = Admin();
        mount = mountAdmin;
    } else {
        pageHtml = Home();
        mount = mountHome;
    }

    app.innerHTML = `
        ${Navbar()}
        ${pageHtml}
    `;

    window.scrollTo({ top: 0 });

    mount?.();

}


// Initial page load
renderPage();


// Browser back / forward
window.addEventListener("popstate", renderPage);


// Intercept same-site link clicks so the SPA re-renders instead of doing a
// full page reload for every internal navigation (external links and links
// with a target/download attribute are left alone).
document.addEventListener("click", (event) => {

    const anchor = (event.target as HTMLElement)?.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("//")) return;
    if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
    if (!href.startsWith("/")) return;

    event.preventDefault();

    if (href !== window.location.pathname + window.location.search) {
        window.history.pushState({}, "", href);
        renderPage();
    }

});
