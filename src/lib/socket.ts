import { io } from "socket.io-client";
import { backendOrigin } from "./backendUrl";

export const socket = io(import.meta.env.VITE_SOCKET_URL || backendOrigin, {
    autoConnect: false,
});
