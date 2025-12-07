import cron from "node-cron";
import { Product } from "../models/product.model";
import { User } from "../models/user.model";
import {
  sendAuctionEndedSellerEmail,
  sendAuctionEndedNoBuyerEmail,
  sendAuctionWonEmail,
} from "../utils/email.util";

/**
 * Run every minute to check for ended auctions that haven't sent emails yet
 */
export const startAuctionCron = () => {
  cron.schedule("* * * * *", async () => {
    // console.log("Running auction cron job..."); // Disabled to avoid noise
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
    }
  });
};
