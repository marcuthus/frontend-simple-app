import { AuthOptions, User as NextAuthUser } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

import { UserRole } from "@/types/user"
import { AuthResponse } from "@/types/user"

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null

                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                        method: "POST",
                        body: JSON.stringify(credentials),
                        headers: { "Content-Type": "application/json" },
                    })

                    const data: AuthResponse = await res.json()

                    if (res.ok && data) {
                        return {
                            ...data.user,
                            accessToken: data.accessToken,
                            refreshToken: data.refreshToken,
                        }
                    }
                    return null
                } catch (error) {
                    console.error("Auth error:", error)
                    return null
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const u = user as NextAuthUser
                token.id = u.id
                token.username = u.username
                token.role = u.role
                token.apiKey = u.apiKey
                token.accessToken = u.accessToken
                token.refreshToken = u.refreshToken
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.username = token.username as string
                session.user.role = token.role as UserRole
                session.user.apiKey = token.apiKey as string
                session.user.accessToken = token.accessToken as string
                session.user.refreshToken = token.refreshToken as string
            }
            return session
        },
    },
    pages: {
        signIn: "/sign-in",
    },
    secret: process.env.NEXTAUTH_SECRET,
}
