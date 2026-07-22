import { Router } from "express";
import { loginWithEmployeeCode, logoutEmployee, switchEmployeeBusiness } from "../controllers/authController";

export const authRouter = Router();

authRouter.post("/login", loginWithEmployeeCode);
authRouter.post("/switch-business", switchEmployeeBusiness);
authRouter.post("/logout", logoutEmployee);
