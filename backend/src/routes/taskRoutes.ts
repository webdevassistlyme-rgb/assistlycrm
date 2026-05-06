import { Router } from "express";
import { archiveTask, createTask, listTasks, updateTask, updateTaskStatus } from "../controllers/taskController";

export const taskRouter = Router();

taskRouter.get("/", listTasks);
taskRouter.post("/", createTask);
taskRouter.put("/:id", updateTask);
taskRouter.patch("/:id/status", updateTaskStatus);
taskRouter.patch("/:id/archive", archiveTask);
