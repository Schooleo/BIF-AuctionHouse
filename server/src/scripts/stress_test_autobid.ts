import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  User,
  Product,
  AutoBid,
  Bid,
  Category,
  SystemConfig,
} from "../models/index.model";
import { bidderService } from "../services/bidder.service";
import fs from "fs";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/bif-auctionhouse";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const runStressTest = async () => {
  await connectDB();

  try {
    // 1. Khởi tạo dữ liệu
    console.log("Creating test data...");

    // Tạo người bán
    const seller = await User.create({
      name: "Stress Seller",
      email: `seller_${Date.now()}@test.com`,
      password: "password123",
      role: "seller",
      address: "Test Address",
      positiveRatings: 10,
      negativeRatings: 0,
    });

    // Tạo danh mục
    const category = await Category.create({ name: "Stress Test Category" });

    // Tạo sản phẩm
    const product = await Product.create({
      name: "Stress Test Product",
      description: "Testing concurrency",
      seller: seller._id,
      startingPrice: 1000,
      stepPrice: 100,
      currentPrice: 1000,
      buyNowPrice: 1000000, // High enough
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000), // 1 hour
      bidCount: 0,
      address: "Test Address",
      allowUnratedBidders: true,
      category: category._id,
      mainImage: "test.jpg",
      subImages: ["test1.jpg", "test2.jpg", "test3.jpg"],
    });

    // Tạo 500 người dùng
    const NUM_USERS = 500;
    const users = [];
    for (let i = 0; i < NUM_USERS; i++) {
      users.push({
        name: `Bidder ${i}`,
        email: `bidder_${i}_${Date.now()}@test.com`,
        password: "password123",
        role: "bidder",
        address: "Test Address",
        positiveRatings: 10,
        negativeRatings: 0,
      });
    }
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users.`);

    // 2. Kích hoạt đặt giá tự động đồng thời
    console.log("Launching concurrent auto-bids...");
    const start = Date.now();

    const promises = createdUsers.map((user: any, index) => {
      // Mỗi người dùng đặt giá trần khác nhau để tạo thang giá
      // Giá trần từ 2000 đến 2000 + 500*100 = 52000
      const maxPrice = 2000 + index * 100;
      return bidderService
        .createOrUpdateAutoBid(
          user._id.toString(),
          (product as any)._id.toString(),
          maxPrice,
          100
        )
        .catch((err) => ({ error: err.message })); // Catch để Promise.all không fail ngay lập tức
    });

    await Promise.all(promises);

    console.log("Changing system config...");
    await SystemConfig.findOneAndUpdate({}, { autoBidDelay: 0 });

    const end = Date.now();
    console.log(`All requests fired in ${(end - start) / 1000}s.`);

    // 3. Theo dõi kết quả
    // Chờ xử lý nền hoàn tất (vì processAutoBids chạy bất đồng bộ)
    console.log("Waiting for background processing (10s)...");
    await new Promise((r) => setTimeout(r, 10000));

    const finalProduct = await Product.findById(product._id);
    const bidCount = await Bid.countDocuments({ product: product._id });
    const autoBidCount = await AutoBid.countDocuments({ product: product._id });

    console.log("--------------------------------");
    console.log(`Final Price: ${finalProduct?.currentPrice}`);
    console.log(`Total Bids Recorded: ${bidCount}`);
    console.log(`Total AutoBids Set: ${autoBidCount}`);
    console.log("--------------------------------");

    if (bidCount < 100) {
      // Số lượt đấu giá thấp hơn mong đợi nếu thất bại
      console.log(
        "WARNING: Bid count seems low for 500 concurrent users. High contention likely caused failures."
      );
    }

    // Ghi log ra file
    const log = `Final Price: ${finalProduct?.currentPrice}\nTotal Bids Recorded: ${bidCount}\nTotal AutoBids Set: ${autoBidCount}`;
    fs.writeFileSync("stress_test.log", log);
  } catch (error) {
    console.error("Test execution error:", error);
  } finally {
    console.log("Cleaning up...");

    // Tìm sản phẩm để xóa dữ liệu liên quan
    const product = await Product.findOne({ name: "Stress Test Product" });
    if (product) {
      await AutoBid.deleteMany({ product: product._id });
      await Bid.deleteMany({ product: product._id });
    }
    await Product.deleteMany({ name: "Stress Test Product" });

    await User.deleteMany({ email: /@test.com/ });
    await Category.deleteMany({ name: "Stress Test Category" });

    // Khôi phục cấu hình
    await SystemConfig.findOneAndUpdate({}, { autoBidDelay: 1000 });
    console.log("Reverted autoBidDelay to 1000ms.");

    await mongoose.disconnect();

    process.exit(0);
  }
};

runStressTest();
