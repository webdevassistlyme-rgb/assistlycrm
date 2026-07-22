import { Router } from "express";
import { addTaskComment, archiveTask, createTask, getTask, listTasks, updateTask, updateTaskStatus } from "../controllers/taskController";

export const taskRouter = Router();

taskRouter.get("/", listTasks);
taskRouter.get("/:id", getTask);
taskRouter.post("/", createTask);
taskRouter.put("/:id", updateTask);
taskRouter.patch("/:id/status", updateTaskStatus);
taskRouter.post("/:id/comments", addTaskComment);
taskRouter.patch("/:id/archive", archiveTask);
