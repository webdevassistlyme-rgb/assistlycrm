import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app";
import { connectDatabase } from "./config/db";
import { refreshConfiguredBusinessesFromStore } from "./config/tenancy";
import { startLeadAutoAssignmentScheduler } from "./controllers/leadController";
import { ensureEmployeeIndexes } from "./models/Employee";
import { createSocketServer } from "./socket";

const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI || "";

await connectDatabase(mongoUri);
await refreshConfiguredBusinessesFromStore();
await ensureEmployeeIndexes();

const app = createApp();
const httpServer = createServer(app);

createSocketServer(httpServer);
startLeadAutoAssignmentScheduler();

httpServer.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
