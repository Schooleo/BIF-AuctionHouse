import cron from "node-cron";
import { UpgradeRequest } from "../models/upgradeRequest.model";

/**
 * Run every hour to automatically expire pending requests that have passed their expiration date
 */
export const startUpgradeRequestCron = () => {
  cron.schedule("0 * * * *", async () => {
    // Runs at the start of every hour
    const now = new Date();

    try {
      // Find all pending requests that have expired
      const result = await UpgradeRequest.updateMany(
        {
          status: "pending",
          expiresAt: { $lt: now },
        },
        {
          $set: { status: "expired" },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Expired ${result.modifiedCount} upgrade request(s)`);
      }
    } catch (error) {
      console.error("Error in upgrade request cron job:", error);
    }
  });

  console.log("✓ Upgrade Request cron job started (runs every hour)");
};
