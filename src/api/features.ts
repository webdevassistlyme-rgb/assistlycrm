import { api } from "../lib/api";

export type FeatureKey =
    | "dashboard"
    | "leads"
    | "lead-search"
    | "lead-add"
    | "lead-categories"
    | "tasks"
    | "tracking"
    | "knowledge-base"
    | "teams"
    | "sales"
    | "calendar"
    | "attendance"
    | "profile"
    | "settings"
    | "messages"
    | "employees"
    | "hr"
    | "media"
    | "payroll"
    | "credentials";

export type FeatureFlag = {
    _id: string;
    key: FeatureKey;
    label: string;
    description: string;
    adminEnabled: boolean;
    employeeEnabled: boolean;
};

export async function getFeatures() {
    const response = await api.get<FeatureFlag[]>("/features");
    return response.data;
}

export async function updateFeature(
    key: FeatureKey,
    feature: Pick<FeatureFlag, "adminEnabled" | "employeeEnabled">
) {
    const response = await api.put<FeatureFlag>(`/features/${key}`, feature);
    return response.data;
}
