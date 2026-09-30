import { openLogin } from "./Login";
import { isAdmin, clearSession } from "../services/api";


export function Navbar(): string {

    // =========================
    // LOGIN STATUS
    // =========================

    const loggedIn =
        localStorage.getItem(
            "smtLoggedIn"
        ) === "true";


    // =========================
    // USER DETAILS
    // =========================

    let userName = "";

    try {

        const userData =
            localStorage.getItem(
                "smtUser"
            );

        if (userData) {

            const user = JSON.parse(
                userData
            );

            userName =
                user.name || "";

        }

    } catch {

        userName = "";

    }


    // =========================
    // CART COUNT
    // =========================

    let cartCount = 0;

    try {

        const cart =
            JSON.parse(
                localStorage.getItem(
                    "smtCart"
                ) || "[]"
            );

        cartCount =
            cart.reduce(
                (
                    total: number,
                    item: any
                ) => {

                    return (
                        total +
                        (
                            Number(
                                item.quantity
                            ) || 0
                        )
                    );

                },
                0
            );

    } catch {

        cartCount = 0;

    }


    // =========================
    // NAVBAR HTML
    // =========================

    const navbar = `

        <nav class="navbar">

            <div class="navbar-container">


                <!-- LOGO -->

                <a
                    href="/"
                    class="navbar-logo"
                >

                    <span class="logo-icon">
                        🛒
                    </span>

                    <span class="logo-text">
                        SMT Grocery
                    </span>

                </a>


                <!-- DESKTOP NAVIGATION -->

                <div class="nav-links">

                    <a
                        href="/"
                        class="nav-link"
                    >
                        Home
                    </a>

                    <a
                        href="/products"
                        class="nav-link"
                    >
                        Products
                    </a>

                    <a
                        href="/categories"
                        class="nav-link"
                    >
                        Categories
                    </a>

                    <a
                        href="/offers"
                        class="nav-link"
                    >
                        Offers
                    </a>

                    <a
                        href="/orders"
                        class="nav-link"
                    >
                        Orders
                    </a>

                    ${
                        loggedIn
                            ? `
                                <a
                                    href="/wishlist"
                                    class="nav-link"
                                >
                                    Wishlist
                                </a>
                            `
                            : ""
                    }

                    ${
                        loggedIn && isAdmin()
                            ? `
                                <a
                                    href="/admin"
                                    class="nav-link"
                                >
                                    Admin
                                </a>
                            `
                            : ""
                    }

                </div>


                <!-- RIGHT SIDE -->

                <div class="navbar-actions">


                    <!-- CART -->

                    <a
                        href="/cart"
                        class="cart-btn"
                        aria-label="Shopping Cart"
                    >

                        🛒

                        <span>
                            ${cartCount}
                        </span>

                    </a>


                    ${
                        loggedIn
                            ? `

                                <!-- USER -->

                                <div
                                    class="user-section"
                                >

                                    <span
                                        class="welcome-user"
                                    >
                                        Hi,
                                        ${
                                            userName ||
                                            "User"
                                        }
                                    </span>


                                    <button
                                        type="button"
                                        class="logout-btn"
                                        id="logoutButton"
                                    >
                                        Logout
                                    </button>

                                </div>

                            `
                            : `

                                <!-- LOGIN -->

                                <button
                                    type="button"
                                    class="login-btn"
                                    id="navbarLoginButton"
                                >
                                    Login
                                </button>

                            `
                    }

                </div>


                <!-- MOBILE MENU BUTTON -->

                <button
                    type="button"
                    class="mobile-menu-btn"
                    id="mobileMenuButton"
                    aria-label="Open menu"
                >
                    ☰
                </button>

            </div>


            <!-- MOBILE NAVIGATION -->

            <div
                class="mobile-nav"
                id="mobileNav"
            >

                <a href="/">
                    Home
                </a>

                <a href="/products">
                    Products
                </a>

                <a href="/categories">
                    Categories
                </a>

                <a href="/offers">
                    Offers
                </a>

                <a href="/orders">
                    Orders
                </a>

                ${loggedIn ? `<a href="/wishlist">Wishlist</a>` : ""}

                ${loggedIn && isAdmin() ? `<a href="/admin">Admin</a>` : ""}

                <a href="/cart">
                    Cart 🛒
                    <span class="mobile-cart-count">
                        ${cartCount}
                    </span>
                </a>

            </div>

        </nav>

    `;


    // =========================
    // EVENT LISTENERS
    // =========================

    setTimeout(() => {


        // =========================
        // LOGIN
        // =========================

        const loginButton =
            document.querySelector<HTMLButtonElement>(
                "#navbarLoginButton"
            );


        loginButton?.addEventListener(
            "click",
            () => {

                openLogin();

            }
        );


        // =========================
        // LOGOUT
        // =========================

        const logoutButton =
            document.querySelector<HTMLButtonElement>(
                "#logoutButton"
            );


        logoutButton?.addEventListener(
            "click",
            () => {

                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmLogout) {
                    return;
                }


                clearSession();


                localStorage.removeItem(
                    "smtRedirectAfterLogin"
                );


                alert(
                    "Logged out successfully! 👋"
                );


                window.location.reload();

            }
        );


        // =========================
        // MOBILE MENU
        // =========================

        const mobileMenuButton =
            document.querySelector<HTMLButtonElement>(
                "#mobileMenuButton"
            );


        const mobileNav =
            document.querySelector<HTMLElement>(
                "#mobileNav"
            );


        mobileMenuButton?.addEventListener(
            "click",
            () => {

                mobileNav?.classList.toggle(
                    "mobile-nav-show"
                );

            }
        );


        // =========================
        // CLOSE MOBILE MENU
        // =========================

        const mobileLinks =
            mobileNav?.querySelectorAll<HTMLAnchorElement>(
                "a"
            );


        mobileLinks?.forEach(
            (link) => {

                link.addEventListener(
                    "click",
                    () => {

                        mobileNav?.classList.remove(
                            "mobile-nav-show"
                        );

                    }
                );

            }
        );


        // =========================
        // ACTIVE NAV LINK
        // =========================

        const currentPath =
            window.location.pathname;


        const navLinks =
            document.querySelectorAll<HTMLAnchorElement>(
                ".nav-link"
            );


        navLinks.forEach(
            (link) => {

                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    href === currentPath ||
                    (
                        href === "/" &&
                        currentPath === "/"
                    )
                ) {

                    link.classList.add(
                        "active"
                    );

                }

            }
        );

    }, 0);


    return navbar;
}