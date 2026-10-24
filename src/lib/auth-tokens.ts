import { JWT } from "next-auth/jwt"

import { AuthResponse, User } from "@/types/user"

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Renova o access token um pouco antes de expirar para evitar requisições com token vencido.
const EXPIRATION_MARGIN_MS = 30 * 1000

type TokenPair = Pick<AuthResponse, "accessToken" | "refreshToken">

/**
 * Lê o "exp" do JWT (sem validar a assinatura, isso é papel do backend) e retorna em milissegundos.
 */
export function getTokenExpiration(accessToken: string): number | null {
    try {
        const [, payload] = accessToken.split(".")
        const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
        return typeof decoded.exp === "number" ? decoded.exp * 1000 : null
    } catch {
        return null
    }
}

export function isAccessTokenExpired(token: Pick<JWT, "accessTokenExpires">, now = Date.now()) {
    return !!token.accessTokenExpires && now >= token.accessTokenExpires - EXPIRATION_MARGIN_MS
}

async function fetchCurrentUser(accessToken: string): Promise<Partial<User> | null> {
    const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) return null

    return await res.json()
}

/**
 * Autentica no backend. O endpoint é /auth/sign-in (antes apontava para /auth/login, que não
 * existe nos backends do ecossistema). Se o backend não devolver o usuário junto com os tokens,
 * os dados são buscados em /auth/me.
 */
export async function authenticate(login: string, password: string) {
    const res = await fetch(`${API_URL}/auth/sign-in`, {
        method: "POST",
        body: JSON.stringify({ email: login, username: login, password: password }),
        headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) return null

    const data: Partial<AuthResponse> & TokenPair = await res.json()

    if (!data?.accessToken || !data.refreshToken) return null

    const user = data.user ?? (await fetchCurrentUser(data.accessToken))

    if (!user?.id) return null

    return {
        ...user,
        id: user.id,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
    }
}

/**
 * Troca o refresh token por um novo par de tokens. Em caso de falha marca o token com erro
 * para que a aplicação possa forçar um novo login.
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
    try {
        const res = await fetch(`${API_URL}/auth/refresh-token`, {
            method: "POST",
            body: JSON.stringify({ refreshToken: token.refreshToken }),
            headers: { "Content-Type": "application/json" },
        })

        if (!res.ok) {
            throw new Error(`Refresh failed with status ${res.status}`)
        }

        const data: TokenPair = await res.json()

        return {
            ...token,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? token.refreshToken,
            accessTokenExpires: getTokenExpiration(data.accessToken),
            error: undefined,
        }
    } catch (error) {
        console.error("Refresh token error:", error)

        return {
            ...token,
            error: "RefreshAccessTokenError",
        }
    }
}
