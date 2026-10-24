import { User as AppUser, UserRole } from "./user"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name: string
            email: string
            username: string
            role: UserRole
            accessToken: string
        } & DefaultSession["user"]
        error?: "RefreshAccessTokenError"
    }

    interface User extends AppUser {
        accessToken: string
        refreshToken: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        username: string
        role: UserRole
        accessToken: string
        refreshToken: string
        accessTokenExpires?: number | null
        error?: "RefreshAccessTokenError"
    }
}
