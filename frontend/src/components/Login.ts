import { registerUser, loginUser } from "../services/resources";
import { saveSession } from "../services/api";
import { mergeGuestCartIntoAccount } from "../services/cart";

export function Login(): string {
    return `
        <div
            id="loginModal"
            class="login-modal"
            style="
                position: fixed !important;
                inset: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 999999 !important;
                box-sizing: border-box !important;
            "
        >

            <!-- OVERLAY -->

            <div
                class="login-overlay"
                style="
                    position: fixed !important;
                    inset: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    background: rgba(0,0,0,0.60) !important;
                    z-index: 999998 !important;
                "
            ></div>


            <!-- LOGIN BOX -->

            <div
                class="login-box"
                style="
                    position: relative !important;
                    z-index: 1000000 !important;
                    width: 420px !important;
                    max-width: calc(100vw - 30px) !important;
                    margin: auto !important;
                    box-sizing: border-box !important;
                    background: #ffffff !important;
                    border-radius: 20px !important;
                    padding: 35px !important;
                    box-shadow: 0 25px 70px rgba(0,0,0,0.30) !important;
                "
            >

                <!-- CLOSE -->

                <button
                    type="button"
                    id="closeLogin"
                    class="close-login"
                    style="
                        position: absolute !important;
                        top: 12px !important;
                        right: 15px !important;
                        width: 35px !important;
                        height: 35px !important;
                        border: none !important;
                        border-radius: 50% !important;
                        background: #f3f4f6 !important;
                        color: #333 !important;
                        font-size: 25px !important;
                        cursor: pointer !important;
                    "
                >
                    ×
                </button>


                <!-- ICON -->

                <div
                    class="login-icon"
                    style="
                        width: 65px;
                        height: 65px;
                        margin: 0 auto 15px;
                        border-radius: 50%;
                        background: #dcfce7;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 32px;
                    "
                >
                    🛒
                </div>


                <!-- TITLE -->

                <h2>
                    Welcome to SMT Grocery
                </h2>


                <p class="login-subtitle">
                    Login to continue shopping
                </p>


                <!-- LOGIN FORM -->

                <form id="loginForm">

                    <div class="login-field">

                        <label for="loginEmail">
                            Email
                        </label>

                        <input
                            type="email"
                            id="loginEmail"
                            placeholder="Enter your email"
                            required
                        >

                    </div>


                    <div class="login-field">

                        <label for="loginPassword">
                            Password
                        </label>

                        <input
                            type="password"
                            id="loginPassword"
                            placeholder="Enter your password"
                            required
                        >

                    </div>


                    <button
                        type="submit"
                        class="login-submit"
                        id="loginSubmitBtn"
                    >
                        Login
                    </button>

                </form>


                <!-- SIGNUP -->

                <p class="signup-text">

                    Don't have an account?

                    <button
                        type="button"
                        id="signupButton"
                        class="signup-link"
                    >
                        Sign Up
                    </button>

                </p>

            </div>

        </div>
    `;
}


/* =========================================================
   OPEN LOGIN
========================================================= */

export function openLogin(): void {

    const oldModal = document.getElementById("loginModal");

    if (oldModal) {
        oldModal.remove();
    }

    document.body.insertAdjacentHTML("beforeend", Login());

    setupLogin();

}


/* =========================================================
   SHARED: after a successful login OR signup+auto-login
========================================================= */

async function onAuthenticated(modal: HTMLElement): Promise<void> {

    // Bring any items added while browsing as a guest into the account.
    await mergeGuestCartIntoAccount();

    modal.remove();

    const redirect = localStorage.getItem("smtRedirectAfterLogin");

    if (redirect) {

        localStorage.removeItem("smtRedirectAfterLogin");

        window.history.pushState({}, "", redirect);
        window.dispatchEvent(new PopStateEvent("popstate"));

    } else {

        window.location.reload();

    }

}


/* =========================================================
   LOGIN SETUP
========================================================= */

function setupLogin(): void {

    const modal = document.getElementById("loginModal") as HTMLElement | null;
    const closeButton = document.getElementById("closeLogin") as HTMLButtonElement | null;
    const overlay = document.querySelector("#loginModal .login-overlay") as HTMLElement | null;
    const form = document.getElementById("loginForm") as HTMLFormElement | null;
    const signupButton = document.getElementById("signupButton") as HTMLButtonElement | null;

    if (!modal) {
        return;
    }

    closeButton?.addEventListener("click", () => modal.remove());
    overlay?.addEventListener("click", () => modal.remove());

    form?.addEventListener("submit", async (event) => {

        event.preventDefault();

        const emailInput = document.getElementById("loginEmail") as HTMLInputElement | null;
        const passwordInput = document.getElementById("loginPassword") as HTMLInputElement | null;
        const submitBtn = document.getElementById("loginSubmitBtn") as HTMLButtonElement | null;

        if (!emailInput || !passwordInput) {
            return;
        }

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Logging in...";
        }

        try {

            const { user, token } = await loginUser({ email, password });
            saveSession(user, token);
            await onAuthenticated(modal);

        } catch (error) {

            alert(error instanceof Error ? error.message : "Login failed. Please try again.");

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Login";
            }

        }

    });

    signupButton?.addEventListener("click", () => showSignup());

}


/* =========================================================
   SIGN UP PAGE
========================================================= */

function showSignup(): void {

    const modal = document.getElementById("loginModal") as HTMLElement | null;

    if (!modal) {
        return;
    }

    modal.innerHTML = `

        <!-- SIGNUP OVERLAY -->

        <div
            class="login-overlay"
            style="
                position: fixed !important;
                inset: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0,0,0,0.60) !important;
                z-index: 999998 !important;
            "
        ></div>


        <!-- SIGNUP BOX -->

        <div
            class="login-box"
            style="
                position: relative !important;
                z-index: 1000000 !important;
                width: 420px !important;
                max-width: calc(100vw - 30px) !important;
                margin: auto !important;
                box-sizing: border-box !important;
                background: #ffffff !important;
                border-radius: 20px !important;
                padding: 35px !important;
                box-shadow: 0 25px 70px rgba(0,0,0,0.30) !important;
            "
        >

            <!-- CLOSE -->

            <button
                type="button"
                id="closeSignup"
                class="close-login"
            >
                ×
            </button>


            <!-- ICON -->

            <div class="login-icon">
                🛒
            </div>


            <h2>
                Create Account
            </h2>


            <p class="login-subtitle">
                Join SMT Grocery today
            </p>


            <!-- SIGNUP FORM -->

            <form id="signupForm">

                <div class="login-field">

                    <label for="signupName">
                        Full Name
                    </label>

                    <input
                        type="text"
                        id="signupName"
                        placeholder="Enter your name"
                        required
                    >

                </div>


                <div class="login-field">

                    <label for="signupEmail">
                        Email
                    </label>

                    <input
                        type="email"
                        id="signupEmail"
                        placeholder="Enter your email"
                        required
                    >

                </div>


                <div class="login-field">

                    <label for="signupMobile">
                        Mobile Number
                    </label>

                    <input
                        type="tel"
                        id="signupMobile"
                        placeholder="Enter your mobile number"
                    >

                </div>


                <div class="login-field">

                    <label for="signupPassword">
                        Password
                    </label>

                    <input
                        type="password"
                        id="signupPassword"
                        placeholder="Create a password"
                        minlength="6"
                        required
                    >

                </div>


                <button
                    type="submit"
                    class="login-submit"
                    id="signupSubmitBtn"
                >
                    Create Account
                </button>

            </form>


            <!-- BACK LOGIN -->

            <p class="signup-text">

                Already have an account?

                <button
                    type="button"
                    id="backToLogin"
                    class="signup-link"
                >
                    Login
                </button>

            </p>

        </div>

    `;

    document.getElementById("closeSignup")?.addEventListener("click", () => modal.remove());

    document
        .querySelector("#loginModal .login-overlay")
        ?.addEventListener("click", () => modal.remove());

    document.getElementById("backToLogin")?.addEventListener("click", () => {
        modal.innerHTML = Login();
        setupLogin();
    });

    document.getElementById("signupForm")?.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name = (document.getElementById("signupName") as HTMLInputElement)?.value.trim() || "";
        const email =
            (document.getElementById("signupEmail") as HTMLInputElement)?.value.trim().toLowerCase() ||
            "";
        const mobile = (document.getElementById("signupMobile") as HTMLInputElement)?.value.trim() || "";
        const password = (document.getElementById("signupPassword") as HTMLInputElement)?.value || "";
        const submitBtn = document.getElementById("signupSubmitBtn") as HTMLButtonElement | null;

        if (!name || !email || !password) {
            alert("Please fill all required fields.");
            return;
        }

        if (password.length < 6) {
            alert("Password must contain at least 6 characters.");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Creating account...";
        }

        try {

            const { user, token } = await registerUser({ name, email, password, mobile });
            saveSession(user, token);

            alert("Account created successfully! 🎉");

            await onAuthenticated(modal);

        } catch (error) {

            alert(error instanceof Error ? error.message : "Sign up failed. Please try again.");

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Create Account";
            }

        }

    });

}
