import mongoose from "mongoose";
import { env } from "../config/env";
import { Product } from "../models/product.model";
import { User } from "../models/user.model";
import { Category } from "../models/category.model";
import {
  createAuctionProduct,
  appendProductDescription,
  viewSellerProducts,
} from "../controllers/seller.controller";
import { Request, Response } from "express";

const run = async () => {
  try {
    const mongoUri = "mongodb://localhost:27017/auction-house";
    await mongoose.connect(mongoUri);
    console.log("Connected to DB");

    // Create dummy seller
    const seller = await User.create({
      name: "Test Seller",
      email: `seller_${Date.now()}@test.com`,
      password: "password123",
      role: "seller",
    });

    // Create dummy category
    const category = await Category.create({
      name: "Test Category " + Date.now(),
    });

    // Mock Request and Response
    const mockReq = (body: any, params: any = {}, user: any = seller) =>
      ({
        body,
        params,
        user,
      } as unknown as Request);

    const mockRes = () => {
      const res: any = {};
      res.status = (code: number) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data: any) => {
        res.data = data;
        return res;
      };
      return res as Response & { statusCode: number; data: any };
    };

    // 1. Test createAuctionProduct
    console.log("Testing createAuctionProduct...");
    const req1 = mockReq({
      name: "Test Product",
      category: category.id.toString(),
      mainImage: "http://example.com/image.jpg",
      subImages: [
        "http://example.com/1.jpg",
        "http://example.com/2.jpg",
        "http://example.com/3.jpg",
      ],
      description: "Test Description",
      endTime: new Date(Date.now() + 86400000).toISOString(),
      startingPrice: 100,
      stepPrice: 10,
      buyNowPrice: 200,
      autoExtends: true,
      allowUnratedBidders: false,
    });
    const res1 = mockRes();
    await createAuctionProduct(req1, res1);

    if (res1.statusCode !== 201) {
      throw new Error(
        `createAuctionProduct failed with status ${
          res1.statusCode
        }: ${JSON.stringify(res1.data, null, 2)}`
      );
    }
    console.log("createAuctionProduct passed");
    const productId = res1.data._id;

    // 2. Test appendProductDescription
    console.log("Testing appendProductDescription...");
    const req2 = mockReq(
      { description: "Updated Description" },
      { id: productId }
    );
    const res2 = mockRes();
    await appendProductDescription(req2, res2);

    if (res2.statusCode !== 200) {
      throw new Error(
        `appendProductDescription failed with status ${
          res2.statusCode
        }: ${JSON.stringify(res2.data)}`
      );
    }
    if (res2.data.descriptionHistory.length !== 1) {
      throw new Error("Description history not updated");
    }
    console.log("appendProductDescription passed");

    // 3. Test viewSellerProducts
    console.log("Testing viewSellerProducts...");
    const req3 = mockReq({});
    const res3 = mockRes();
    await viewSellerProducts(req3, res3);

    if (res3.statusCode !== 200) {
      throw new Error(
        `viewSellerProducts failed with status ${
          res3.statusCode
        }: ${JSON.stringify(res3.data)}`
      );
    }
    if (!Array.isArray(res3.data) || res3.data.length === 0) {
      throw new Error("Products list is empty or invalid");
    }
    console.log("viewSellerProducts passed");

    // Cleanup
    await Product.deleteMany({ seller: seller._id });
    await User.findByIdAndDelete(seller._id);
    await Category.findByIdAndDelete(category._id);

    console.log("Cleanup done");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
};

run();
