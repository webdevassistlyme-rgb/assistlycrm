import axios from "axios";
import { backendOrigin } from "./backendUrl";
import { emitToast } from "../components/ToastProvider";
import { getActiveBusinessId } from "../api/businessStorage";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || `${backendOrigin}/api`,
});

const writeMethods = new Set(["post", "put", "patch", "delete"]);
const quietRequestPaths = ["/auth/", "/activity", "/browser-activity"];

api.interceptors.request.use((config) => {
    const businessId = getActiveBusinessId();

    if (businessId) {
        config.headers["X-Business-Id"] = businessId;
    }

    return config;
});

function shouldToastForRequest(method?: string, url = "") {
    const normalizedMethod = method?.toLowerCase() || "";
    return writeMethods.has(normalizedMethod) && !quietRequestPaths.some((path) => url.includes(path));
}

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const method = error?.config?.method;
        const url = error?.config?.url || "";

        if (shouldToastForRequest(method, url)) {
            emitToast({
                tone: "error",
                message: error?.response?.data?.message || "Unable to save changes.",
            });
        }

        return Promise.reject(error);
    }
);
