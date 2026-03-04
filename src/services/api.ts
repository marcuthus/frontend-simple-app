import { getSession } from "next-auth/react"

const API_URL = process.env.NEXT_PUBLIC_API_URL

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const session = await getSession()

    const headers = new Headers(options.headers)
    if (session?.user?.accessToken) {
        headers.set("Authorization", `Bearer ${session.user.accessToken}`)
    }
    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown error" }))
        throw new Error(error.message || "Request failed")
    }

    return response.json()
}

export const api = {
    get: <T>(endpoint: string, options?: RequestInit) =>
        request<T>(endpoint, { ...options, method: "GET" }),
    post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
        request<T>(endpoint, {
            ...options,
            method: "POST",
            body: JSON.stringify(body),
        }),
    put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
        request<T>(endpoint, {
            ...options,
            method: "PUT",
            body: JSON.stringify(body),
        }),
    patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
        request<T>(endpoint, {
            ...options,
            method: "PATCH",
            body: JSON.stringify(body),
        }),
    delete: <T>(endpoint: string, options?: RequestInit) =>
        request<T>(endpoint, { ...options, method: "DELETE" }),
}
