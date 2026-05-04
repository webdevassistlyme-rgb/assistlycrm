import { Router } from "express";
import { loginWithEmployeeCode } from "../controllers/authController";

export const authRouter = Router();

authRouter.post("/login", loginWithEmployeeCode);
