import { api } from "../lib/api";

export type ProductCategory = {
    _id: string;
    name: string;
    description: string;
    isArchived: boolean;
};

export type ProductCategoryInput = {
    name: string;
    description: string;
};

export async function getProductCategories() {
    const response = await api.get<ProductCategory[]>("/product-categories");
    return response.data;
}

export async function createProductCategory(category: ProductCategoryInput) {
    const response = await api.post<ProductCategory>("/product-categories", category);
    return response.data;
}

export async function updateProductCategory(id: string, category: ProductCategoryInput) {
    const response = await api.put<ProductCategory>(`/product-categories/${id}`, category);
    return response.data;
}

export async function archiveProductCategory(id: string) {
    const response = await api.patch<ProductCategory>(`/product-categories/${id}/archive`);
    return response.data;
}
