import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app";
import { connectDatabase } from "./config/db";
import { startLeadAutoAssignmentScheduler } from "./controllers/leadController";
import { createSocketServer } from "./socket";

const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI || "";

await connectDatabase(mongoUri);

const app = createApp();
const httpServer = createServer(app);

createSocketServer(httpServer);
startLeadAutoAssignmentScheduler();

httpServer.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
