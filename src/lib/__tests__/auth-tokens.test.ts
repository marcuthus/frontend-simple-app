import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { authOptions } from "../auth-options"
import {
    authenticate,
    getTokenExpiration,
    isAccessTokenExpired,
    refreshAccessToken,
} from "../auth-tokens"

function makeJwt(payload: Record<string, unknown>) {
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url")
    return `${encode({ alg: "HS256" })}.${encode(payload)}.signature`
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    })
}

describe("auth-tokens", () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
        vi.stubGlobal("fetch", fetchMock)
        fetchMock.mockReset()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("lê a expiração do access token", () => {
        expect(getTokenExpiration(makeJwt({ exp: 100 }))).toBe(100_000)
        expect(getTokenExpiration("invalid")).toBeNull()
    })

    it("considera o token expirado perto do vencimento", () => {
        expect(isAccessTokenExpired({ accessTokenExpires: 1_000_000 }, 1_000_000)).toBe(true)
        expect(isAccessTokenExpired({ accessTokenExpires: 1_000_000 }, 0)).toBe(false)
    })

    it("autentica em /auth/sign-in e busca o usuário em /auth/me quando necessário", async () => {
        const accessToken = makeJwt({ exp: 100 })

        fetchMock
            .mockResolvedValueOnce(jsonResponse({ accessToken, refreshToken: "refresh" }))
            .mockResolvedValueOnce(jsonResponse({ id: "user-1", email: "a@b.com" }))

        const user = await authenticate("a@b.com", "senha")

        expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/sign-in$/)
        expect(fetchMock.mock.calls[1][0]).toMatch(/\/auth\/me$/)
        expect(user).toMatchObject({ id: "user-1", accessToken, refreshToken: "refresh" })
    })

    it("retorna null com credenciais inválidas", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ message: "invalid" }, 401))
        await expect(authenticate("a@b.com", "errada")).resolves.toBeNull()
    })

    it("renova o access token com o refresh token", async () => {
        const newAccessToken = makeJwt({ exp: 200 })
        fetchMock.mockResolvedValueOnce(
            jsonResponse({ accessToken: newAccessToken, refreshToken: "new-refresh" })
        )

        const token = await refreshAccessToken({ refreshToken: "old-refresh" } as any)

        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ refreshToken: "old-refresh" })
        expect(token).toMatchObject({
            accessToken: newAccessToken,
            refreshToken: "new-refresh",
            accessTokenExpires: 200_000,
        })
        expect(token.error).toBeUndefined()
    })

    it("marca erro quando o refresh falha", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({}, 401))
        const token = await refreshAccessToken({ refreshToken: "old-refresh" } as any)
        expect(token.error).toBe("RefreshAccessTokenError")
    })

    it("não expõe o refresh token na sessão", async () => {
        const session = await authOptions.callbacks!.session!({
            session: { user: {} } as any,
            token: { id: "1", accessToken: "access", refreshToken: "refresh" } as any,
        } as any)

        expect(JSON.stringify(session)).not.toContain("refresh")
        expect((session.user as any).accessToken).toBe("access")
    })
})
