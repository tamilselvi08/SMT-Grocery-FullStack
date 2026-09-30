/* =========================================================
   SMT GROCERY - API CLIENT

   Every backend call in the app goes through `apiFetch` below.
   Auth/session state lives in localStorage under the `smt*` keys
   the original project already used, so the rest of the app
   (Navbar's synchronous cart-count read, etc.) keeps working
   unchanged.
========================================================= */

export const API_URL: string =
    (import.meta.env.VITE_API_URL as string | undefined) ||
    "http://localhost:5000";

/** Turns a backend-relative path like "/uploads/products/apple.png"
 *  (or an already-absolute URL) into a full URL the <img> tag can load. */
export function resolveImage(image: string | undefined | null): string {

    if (!image) {
        return "";
    }

    if (image.startsWith("http://") || image.startsWith("https://")) {
        return image;
    }

    return `${API_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

/* =========================================================
   SESSION HELPERS
========================================================= */

export interface SmtUser {
    id: string;
    name: string;
    email: string;
    mobile?: string;
    role: "customer" | "admin";
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
}

export function getToken(): string | null {
    return localStorage.getItem("smtToken");
}

export function getUser(): SmtUser | null {

    const raw = localStorage.getItem("smtUser");

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as SmtUser;
    } catch {
        return null;
    }
}

export function isLoggedIn(): boolean {
    return localStorage.getItem("smtLoggedIn") === "true" && Boolean(getToken());
}

export function isAdmin(): boolean {
    return getUser()?.role === "admin";
}

export function saveSession(user: SmtUser, token: string): void {
    localStorage.setItem("smtLoggedIn", "true");
    localStorage.setItem("smtUser", JSON.stringify(user));
    localStorage.setItem("smtToken", token);
}

export function clearSession(): void {
    localStorage.removeItem("smtLoggedIn");
    localStorage.removeItem("smtUser");
    localStorage.removeItem("smtToken");
}

/* =========================================================
   FETCH WRAPPER
========================================================= */

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

interface ApiFetchOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    auth?: boolean; // attach Authorization header if a token exists
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {

    const headers: Record<string, string> = {};

    let body: string | undefined;

    if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(options.body);
    }

    if (options.auth !== false) {
        const token = getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    let response: Response;

    try {

        response = await fetch(`${API_URL}${path}`, {
            method: options.method || "GET",
            headers,
            body,
        });

    } catch {

        throw new ApiError(
            "Could not reach the server. Please check your connection and try again.",
            0
        );

    }

    let data: any = null;

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {

        try {
            data = await response.json();
        } catch {
            data = null;
        }

    }

    if (!response.ok) {

        const message =
            (data && data.message) ||
            `Request failed (${response.status}). Please try again.`;

        throw new ApiError(message, response.status);

    }

    return data as T;
}

/** For endpoints that return a raw file (PDF invoice etc). */
export async function apiFetchBlob(path: string): Promise<Blob> {

    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, { headers });

    if (!response.ok) {
        throw new ApiError("Could not download the file. Please try again.", response.status);
    }

    return response.blob();
}
