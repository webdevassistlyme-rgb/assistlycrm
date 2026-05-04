import cors from "cors";
import express from "express";
import { employeeRouter } from "./routes/employeeRoutes";
import { roleRouter } from "./routes/roleRoutes";
import { teamRouter } from "./routes/teamRoutes";
import { leadRouter } from "./routes/leadRoutes";
import { messageRouter } from "./routes/messageRoutes";
import { noticeRouter } from "./routes/noticeRoutes";
import { authRouter } from "./routes/authRoutes";
import { attendanceRouter } from "./routes/attendanceRoutes";
import { employeeTransactionRouter } from "./routes/employeeTransactionRoutes";
import { errorHandler } from "./middleware/errorHandler";

const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedDevOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && url.port === "5173";
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || clientOrigins.includes(origin) || isAllowedDevOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked origin: ${origin}`));
      },
    })
  );
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/employees", employeeRouter);
  app.use("/api/roles", roleRouter);
  app.use("/api/teams", teamRouter);
  app.use("/api/leads", leadRouter);
  app.use("/api/messages", messageRouter);
  app.use("/api", noticeRouter);
  app.use("/api", attendanceRouter);
  app.use("/api", employeeTransactionRouter);
  app.use(errorHandler);

  return app;
}
