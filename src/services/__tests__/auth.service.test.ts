import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "../api"
import { authService } from "../auth.service"

// Mock the API helper
vi.mock("../api", () => ({
    api: {
        post: vi.fn(),
    },
}))

describe("AuthService", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("signUp", () => {
        it("should successfully call the sign-up endpoint", async () => {
            const signUpData = {
                name: "John Doe",
                email: "john@example.com",
                username: "johndoe",
                password: "password123",
                confirmPassword: "password123",
            }

            const mockUser = {
                id: "user-id",
                name: "John Doe",
                email: "john@example.com",
                username: "johndoe",
                role: "USER" as const,
                apiKey: "api_key",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }

            vi.mocked(api.post).mockResolvedValue(mockUser)

            const result = await authService.signUp(signUpData)

            expect(api.post).toHaveBeenCalledWith("/auth/sign-up", signUpData)
            expect(result).toEqual(mockUser)
        })
    })

    describe("signIn", () => {
        it("should successfully call the sign-in endpoint", async () => {
            const signInData = {
                username: "johndoe",
                password: "password123",
            } as any

            const mockUser = {
                id: "user-id",
                username: "johndoe",
            }

            vi.mocked(api.post).mockResolvedValue(mockUser)

            const result = await authService.signIn(signInData)

            expect(api.post).toHaveBeenCalledWith("/auth/sign-in", signInData)
            expect(result).toEqual(mockUser)
        })
    })

    describe("signOut", () => {
        it("should call the sign-out endpoint", async () => {
            vi.mocked(api.post).mockResolvedValue(undefined)

            await authService.signOut()

            expect(api.post).toHaveBeenCalledWith("/auth/sign-out")
        })
    })
})
