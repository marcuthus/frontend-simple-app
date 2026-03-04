import { api } from "./api"
import { SignUpValues } from "@/schemas/users/auth.schema"
import { User } from "@/types/user"

export const authService = {
    signUp: (data: SignUpValues) => api.post<User>("/auth/sign-up", data),
    signIn: (data: SignUpValues) => api.post<User>("/auth/sign-in", data),
    signOut: () => api.post<void>("/auth/sign-out"),
}
