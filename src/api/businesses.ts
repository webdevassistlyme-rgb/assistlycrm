import { api } from "../lib/api";
import type { BusinessOption } from "./businessStorage";

export async function getBusinesses() {
    const response = await api.get<BusinessOption[]>("/businesses");
    return response.data;
}

export async function createBusiness(name: string) {
    const response = await api.post<BusinessOption>("/businesses", { name });
    return response.data;
}

export async function updateBusinessName(id: string, name: string) {
    const response = await api.patch<BusinessOption>(`/businesses/${id}`, { name });
    return response.data;
}
