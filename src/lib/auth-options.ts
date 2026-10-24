import { AuthOptions, User as NextAuthUser } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

import {
    authenticate,
    getTokenExpiration,
    isAccessTokenExpired,
    refreshAccessToken,
} from "./auth-tokens"

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
                    return (await authenticate(
                        credentials.username,
                        credentials.password
                    )) as NextAuthUser | null
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
                token.accessToken = u.accessToken
                token.refreshToken = u.refreshToken
                token.accessTokenExpires = getTokenExpiration(u.accessToken)
                return token
            }

            // Antes o access token nunca era renovado: a sessão do NextAuth continuava válida,
            // mas todas as chamadas à API passavam a falhar quando o token expirava.
            if (isAccessTokenExpired(token)) {
                return await refreshAccessToken(token)
            }

            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id
                session.user.username = token.username
                session.user.role = token.role
                session.user.accessToken = token.accessToken
                session.error = token.error
                // O refresh token (e a API key) ficam só no JWT criptografado do NextAuth (cookie httpOnly).
                // Antes eram copiados para a sessão e ficavam acessíveis a qualquer JavaScript da página.
            }
            return session
        },
    },
    pages: {
        signIn: "/sign-in",
    },
    secret: process.env.NEXTAUTH_SECRET,
}
