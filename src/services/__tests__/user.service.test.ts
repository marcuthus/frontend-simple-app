import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "../api"
import { userService } from "../user.service"
import { UserRole } from "@/types/user"

// Mock the API helper
vi.mock("../api", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))

describe("UserService", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const mockUser = {
        id: "user-id",
        name: "John Doe",
        email: "john@example.com",
        username: "johndoe",
        role: UserRole.USER,
        apiKey: "api_key",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }

    it("should fetch all users", async () => {
        vi.mocked(api.get).mockResolvedValue([mockUser])
        const result = await userService.findAll()
        expect(api.get).toHaveBeenCalledWith("/users")
        expect(result).toEqual([mockUser])
    })

    it("should fetch user by id", async () => {
        vi.mocked(api.get).mockResolvedValue(mockUser)
        const result = await userService.findById("user-id")
        expect(api.get).toHaveBeenCalledWith("/users/user-id")
        expect(result).toEqual(mockUser)
    })

    it("should fetch user by username", async () => {
        vi.mocked(api.get).mockResolvedValue(mockUser)
        const result = await userService.findByUsername("johndoe")
        expect(api.get).toHaveBeenCalledWith("/users/username/johndoe")
        expect(result).toEqual(mockUser)
    })

    it("should create a user", async () => {
        const createData = { name: "New User" }
        vi.mocked(api.post).mockResolvedValue({ ...mockUser, ...createData })
        const result = await userService.create(createData)
        expect(api.post).toHaveBeenCalledWith("/users", createData)
        expect(result.name).toBe("New User")
    })

    it("should update a user", async () => {
        const updateData = { name: "Updated Name" }
        vi.mocked(api.put).mockResolvedValue({ ...mockUser, ...updateData })
        const result = await userService.update("user-id", updateData)
        expect(api.put).toHaveBeenCalledWith("/users/user-id", updateData)
        expect(result.name).toBe("Updated Name")
    })

    it("should delete a user", async () => {
        vi.mocked(api.delete).mockResolvedValue(undefined)
        await userService.delete("user-id")
        expect(api.delete).toHaveBeenCalledWith("/users/user-id")
    })
})
