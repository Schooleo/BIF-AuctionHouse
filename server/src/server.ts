import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { createServer } from "http";
import { initSocket } from "./socket";

import { startAuctionCron } from "./cron/auction.cron";

connectDB();
startAuctionCron();

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
