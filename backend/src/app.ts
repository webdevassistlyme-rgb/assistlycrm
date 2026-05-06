import cors from "cors";
import express from "express";
import path from "node:path";
import { employeeRouter } from "./routes/employeeRoutes";
import { roleRouter } from "./routes/roleRoutes";
import { branchRouter } from "./routes/branchRoutes";
import { toolRouter } from "./routes/toolRoutes";
import { productCategoryRouter } from "./routes/productCategoryRoutes";
import { mediaRouter } from "./routes/mediaRoutes";
import { featureFlagRouter } from "./routes/featureFlagRoutes";
import { systemSettingsRouter } from "./routes/systemSettingsRoutes";
import { taskRouter } from "./routes/taskRoutes";
import { hrRouter } from "./routes/hrRoutes";
import { teamRouter } from "./routes/teamRoutes";
import { leadRouter } from "./routes/leadRoutes";
import { messageRouter } from "./routes/messageRoutes";
import { noticeRouter } from "./routes/noticeRoutes";
import { knowledgeBaseRouter } from "./routes/knowledgeBaseRoutes";
import { credentialRouter } from "./routes/credentialRoutes";
import { payrollRouter } from "./routes/payrollRoutes";
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
  app.use(express.json({ limit: "100mb" }));
  app.use("/uploads", express.static(path.resolve("uploads")));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/employees", employeeRouter);
  app.use("/api/roles", roleRouter);
  app.use("/api/branches", branchRouter);
  app.use("/api/tools", toolRouter);
  app.use("/api/product-categories", productCategoryRouter);
  app.use("/api/media", mediaRouter);
  app.use("/api/features", featureFlagRouter);
  app.use("/api/system-settings", systemSettingsRouter);
  app.use("/api/tasks", taskRouter);
  app.use("/api/hr", hrRouter);
  app.use("/api/teams", teamRouter);
  app.use("/api/leads", leadRouter);
  app.use("/api/knowledge-base", knowledgeBaseRouter);
  app.use("/api/credentials", credentialRouter);
  app.use("/api/payroll", payrollRouter);
  app.use("/api/messages", messageRouter);
  app.use("/api", noticeRouter);
  app.use("/api", attendanceRouter);
  app.use("/api", employeeTransactionRouter);
  app.use(errorHandler);

  return app;
}
