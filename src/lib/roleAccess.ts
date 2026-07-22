import { getAuthUser, type AuthUser } from "../api/authStorage";

export const pocOperationsPaths = ["/poc/employees", "/poc/tasks", "/poc/credentials"] as const;

export function isPocOperationsUser(authUser: AuthUser | null) {
    return authUser?.userType === "employee" && String(authUser.user.role || "").trim().toUpperCase() === "POC";
}

export function isPocOperationsPath(pathname: string) {
    return pocOperationsPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function roleWorkspacePath(adminPath: string, authUser: AuthUser | null = getAuthUser()) {
    return isPocOperationsUser(authUser) ? adminPath.replace(/^\/admin(?=\/)/, "/poc") : adminPath;
}
