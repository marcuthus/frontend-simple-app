export enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER",
}

export interface User {
    id: string
    createdAt: string
    updatedAt: string | null
    name: string
    role: UserRole
    email: string
    username: string
    apiKey: string
}

export interface AuthResponse {
    user: User
    accessToken: string
    refreshToken: string
}
