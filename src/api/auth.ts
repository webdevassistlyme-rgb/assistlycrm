import { api } from "../lib/api";
import type { Employee } from "./employees";

export type AuthUser =
    | { userType: "admin"; user: { id: string; name: string; role: string; employeeCode: string } }
    | { userType: "employee"; user: Employee };

export async function loginWithEmployeeCode(employeeCode: string) {
    const response = await api.post<AuthUser>("/auth/login", { employeeCode });
    return response.data;
}

export function getAuthUser() {
    const rawUser = localStorage.getItem("authUser");
    return rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
}

export function setAuthUser(user: AuthUser) {
    localStorage.setItem("authUser", JSON.stringify(user));
}

export function clearAuthUser() {
    localStorage.removeItem("authUser");
}
