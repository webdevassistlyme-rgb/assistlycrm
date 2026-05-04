import axios from "axios";
import { backendOrigin } from "./backendUrl";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || `${backendOrigin}/api`,
});
