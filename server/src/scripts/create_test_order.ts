import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model";
import { Product } from "../models/product.model";
import { Order, OrderStatus } from "../models/order.model";
import { Chat } from "../models/chat.model";
import { connectDB } from "../config/db";

dotenv.config();

const createTestOrder = async () => {
  await connectDB();

  console.log("🔍 Finding users and products...");

  // Find a seller
  const seller = await User.findOne({ role: "seller" });
  if (!seller) {
    console.error("❌ No seller found. Please run 'npm run seed' first.");
    process.exit(1);
  }

  // Find a bidder (buyer)
  const buyer = await User.findOne({ role: "bidder" });
  if (!buyer) {
    console.error("❌ No bidder found. Please run 'npm run seed' first.");
    process.exit(1);
  }

  // Find a product
  const product = await Product.findOne({ seller: seller._id });
  if (!product) {
    console.error("❌ No product found for seller.");
    process.exit(1);
  }

  console.log(
    `✅ Found Seller: ${seller.name}, Buyer: ${buyer.name}, Product: ${product.name}`
  );

  // Create Completed Order
  console.log("🛠 Creating COMPLETED order...");

  const now = new Date();

  const order = await Order.create({
    product: product._id,
    seller: seller._id,
    buyer: buyer._id,
    amount: product.currentPrice || 1000000,
    status: OrderStatus.COMPLETED,
    step: 4,
    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Created 1 day ago
    updatedAt: now,
    shippingAddress: "123 Test Street, City",
    paymentProof: "https://picsum.photos/200",
    shippingProof: "TRACKING123",
  });

  // Create Chat linked to order
  const chat = await Chat.create({
    participants: [buyer._id, seller._id],
    product: product._id,
    order: order._id,
    messages: [
      {
        sender: buyer._id,
        content: "I received the item. It's great! Completing order now.",
        timestamp: now,
      },
    ],
  });

  order.chat = chat._id as any;
  await order.save();

  console.log(`🎉 Order Created Successfully!`);
  console.log(`🆔 Order ID: ${order._id}`);
  console.log(`ℹ️  Status: ${order.status}`);
  console.log(
    `\n👉 Go to Admin Orders and filter by "Completed" or "All" to see it.`
  );

  process.exit(0);
};

createTestOrder().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
