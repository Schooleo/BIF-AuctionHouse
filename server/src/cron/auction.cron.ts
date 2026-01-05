import cron from "node-cron";
import { Product } from "../models/product.model";
import {
  sendAuctionEndedSellerEmail,
  sendAuctionEndedNoBuyerEmail,
  sendAuctionWonEmail,
} from "../utils/email.util";
import { maskBidderName } from "../utils/mask.util";

// Flag to prevent overlapping executions
let isAuctionJobRunning = false;

/**
 * Run every minute to check for ended auctions that haven't sent emails yet
 */
export const startAuctionCron = () => {
  cron.schedule("* * * * *", async () => {
    if (isAuctionJobRunning) {
      console.log("⚠️ Auction cron job already running. Skipping...");
      return;
    }

    isAuctionJobRunning = true;
    const now = new Date();

    try {
      const endedProducts = await Product.find({
        endTime: { $lt: now },
        isEndedEmailSent: { $ne: true },
        // Only process if it hasn't been handled yet
      }).populate("seller currentBidder");

      for (const product of endedProducts) {
        const seller = product.seller as any;
        const winner = product.currentBidder as any;

        if (winner) {
          // Has winner
          console.log(`Sending ENDED emails for product ${product._id} (WON)`);

          await Promise.allSettled([
            // Email to Seller
            sendAuctionEndedSellerEmail(
              seller.email,
              seller.name,
              product.name,
              (product as any)._id.toString(),
              winner.name,
              product.currentPrice
            ),
            // Email to Winner
            sendAuctionWonEmail(
              winner.email,
              winner.name,
              product.name,
              (product as any)._id.toString(),
              product.currentPrice
            ),
          ]);
        } else {
          // No winner
          console.log(
            `Sending ENDED emails for product ${(product as any)._id} (NO BIDS)`
          );

          await sendAuctionEndedNoBuyerEmail(
            seller.email,
            seller.name,
            product.name,
            (product as any)._id.toString()
          );
        }

        // Mark as sent
        product.isEndedEmailSent = true;
        await product.save();
      }
    } catch (error) {
      console.error("Error in auction cron job:", error);
    } finally {
      isAuctionJobRunning = false;
    }
  });

  // Flag to prevent overlapping executions for throttled emails
  let isThrottledBidJobRunning = false;

  /**
   * Run every minute to check for throttled bid emails
   */
  cron.schedule("* * * * *", async () => {
    if (isThrottledBidJobRunning) {
      console.log("⚠️ Throttled bid cron job already running. Skipping...");
      return;
    }

    isThrottledBidJobRunning = true;
    try {
      // 1. Get System Config
      const { SystemConfig } = await import("../models/systemConfig.model");
      const config = await SystemConfig.findOne();

      // Default: 30 mins window, 6 hours cooldown
      const throttlingWindowMinutes = config?.bidEmailThrottlingWindow ?? 30;
      const cooldownHours = config?.bidEmailCooldown ?? 6;

      const now = new Date();

      // 2. Find eligible products
      const products = await Product.find({
        firstPendingBidAt: { $exists: true, $ne: null },
      }).populate("seller currentBidder");

      if (products.length === 0) return;

      for (const product of products) {
        if (!product.firstPendingBidAt) continue;

        // Check 1: Accumulation Window
        const minutesSinceFirstBid =
          (now.getTime() - new Date(product.firstPendingBidAt).getTime()) /
          (1000 * 60);

        if (minutesSinceFirstBid < throttlingWindowMinutes) {
          // Still accumulating
          continue;
        }

        // Ready to process this batch!
        console.log(
          `Processing THROTTLED bid emails for product ${product._id}`
        );

        // --- PREPARE RECIPIENTS ---
        const { Bid } = await import("../models/bid.model");
        const { User } = await import("../models/user.model");
        const {
          sendBidNotificationToSeller,
          sendBidConfirmationToBidder,
          sendOutbidNotificationToBidders,
        } = await import("../utils/email.util");

        const currentPrice = product.currentPrice;
        const currentBidder = product.currentBidder as any;

        if (!currentBidder) {
          product.firstPendingBidAt = undefined;
          await product.save();
          continue;
        }

        const seller = product.seller as any;
        const nextMinPrice = currentPrice + product.stepPrice;
        const maskedBidderName = maskBidderName(currentBidder.name);

        // Fetch outbid participants
        const participatingBidderIds = await Bid.find({
          product: product._id,
          bidder: { $ne: currentBidder._id },
        }).distinct("bidder");

        console.log(
          `[DEBUG] Product ${product._id}: Found ${participatingBidderIds.length} potentially outbid bidders.`
        );

        const participatingBidders = await User.find({
          _id: { $in: participatingBidderIds },
        }).select("email name");

        // --- HELPER TO CHECK & UPDATE COOLDOWN ---
        // Helper: Check if user should receive email (not in cooldown)
        const shouldSendToUser = (userId: string) => {
          const userNotif = product.emailNotifications?.find(
            (n) => n.user.toString() === userId.toString()
          );
          if (!userNotif) return true; // Never sent -> Send immediately
          const hoursSinceLast =
            (now.getTime() - new Date(userNotif.lastSentAt).getTime()) /
            (1000 * 60 * 60);
          return hoursSinceLast >= cooldownHours;
        };

        // Debug filtering
        console.log(`[DEBUG] Product ${product._id}: Checking recipients...`);
        console.log(
          `[DEBUG] Seller ${seller._id}: Should send? ${shouldSendToUser(
            seller._id
          )}`
        );
        console.log(
          `[DEBUG] Current Bidder ${
            currentBidder._id
          }: Should send? ${shouldSendToUser(currentBidder._id)}`
        );

        // Helper: Update lastSentAt for user
        const updateLastSent = (userId: string) => {
          if (!product.emailNotifications) {
            product.emailNotifications = [];
          }

          const existingIndex = product.emailNotifications.findIndex(
            (n) => n.user.toString() === userId.toString()
          );
          if (existingIndex !== undefined && existingIndex > -1) {
            product.emailNotifications[existingIndex]!.lastSentAt = now;
          } else {
            product.emailNotifications.push({
              user: userId as any,
              lastSentAt: now,
            });
          }
        };

        // --- SEND EMAILS ---
        const emailPromises: Promise<any>[] = [];

        // 1. Seller
        if (shouldSendToUser(seller._id)) {
          emailPromises.push(
            sendBidNotificationToSeller(
              seller.email,
              seller.name,
              product.name,
              (product as any)._id.toString(),
              maskedBidderName,
              currentPrice,
              currentPrice
            ).then(() => updateLastSent(seller._id))
          );
        }

        // 2. Current Bidder
        if (shouldSendToUser(currentBidder._id)) {
          emailPromises.push(
            sendBidConfirmationToBidder(
              currentBidder.email,
              currentBidder.name,
              product.name,
              (product as any)._id.toString(),
              currentPrice,
              nextMinPrice,
              product.endTime
            ).then(() => updateLastSent(currentBidder._id))
          );
        }

        // 3. Outbid Bidders
        const validOutbidBidders = participatingBidders.filter((b: any) =>
          shouldSendToUser(b._id.toString())
        );

        if (validOutbidBidders.length > 0) {
          // Send bulk email to all valid recipients
          emailPromises.push(
            sendOutbidNotificationToBidders(
              validOutbidBidders.map((b: any) => ({
                email: b.email,
                name: b.name,
              })),
              product.name,
              (product as any)._id.toString(),
              currentPrice,
              nextMinPrice
            ).then(() => {
              // Update status for all of them
              validOutbidBidders.forEach((b: any) =>
                updateLastSent(b._id.toString())
              );
            })
          );
        }

        console.log(
          `[DEBUG] Product ${product._id}: Generated ${emailPromises.length} email promises.`
        );

        await Promise.allSettled(emailPromises);
        console.log(`[DEBUG] Product ${product._id}: Email promises settled.`);

        // --- RESET ACCUMULATION ---
        product.firstPendingBidAt = undefined;
        await product.save();
      }
    } catch (error) {
      console.error("Error in bid throttling cron job:", error);
    } finally {
      isThrottledBidJobRunning = false;
    }
  });
};
