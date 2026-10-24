import { api } from "./api"
import { User } from "@/types/user"

export const userService = {
    findAll: () => api.get<User[]>("/users"),
    findById: (id: string) => api.get<User>(`/users/${id}`),
    findByUsername: (username: string) => api.get<User>(`/users/username/${username}`),
    create: (data: Partial<User>) => api.post<User>("/users", data),
    // Os backends do ecossistema expõem PATCH /users/:id (não há rota PUT)
    update: (id: string, data: Partial<User>) => api.patch<User>(`/users/${id}`, data),
    delete: (id: string) => api.delete<void>(`/users/${id}`),
}
