import { Product } from "../models/product.model";
import { SellerMessages } from "../constants/messages";

export class SellerService {
  static async createProduct(userId: string, productData: any) {
    const product = new Product({
      ...productData,
      seller: userId,
    });

    await product.save();
    return product;
  }

  static async appendDescription(
    userId: string,
    productId: string,
    description: string
  ) {
    const product = await Product.findOne({
      _id: productId,
      seller: userId,
    });

    if (!product) {
      throw new Error(SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED);
    }

    product.descriptionHistory.push({
      content: description,
      updatedAt: new Date(),
    } as any);

    await product.save();
    return product;
  }

  static async getSellerProducts(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      status?: "all" | "ongoing" | "ended";
    } = {}
  ) {
    const {
      page = 1,
      limit = 12,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      status = "all", // "all", "ongoing", "ended"
    } = options;

    const query: any = { seller: userId };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const now = new Date();
    if (status === "ongoing") {
      query.endTime = { $gt: now };
    } else if (status === "ended") {
      query.endTime = { $lte: now };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name")
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getSellerProfile(userId: string) {
    const [User] = await Promise.all([import("../models/user.model")]);
    const user = await User.User.findById(userId).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    // Statistics
    const totalProducts = await Product.countDocuments({ seller: userId });
    const successfulAuctions = await Product.countDocuments({
      seller: userId,
      endTime: { $lte: new Date() },
      bidCount: { $gt: 0 },
    });

    // Find most successful product (highest updated price aka currentBid)
    const mostSuccessfulProduct = await Product.findOne({
      seller: userId,
      endTime: { $lte: new Date() },
      bidCount: { $gt: 0 },
    })
      .sort({ currentPrice: -1 })
      .select("name currentPrice mainImage bidCount currentBidder")
      .populate("currentBidder", "name");

    // Find least successful product (lowest updated price, ended, with bids)
    const leastSuccessfulProduct = await Product.findOne({
      seller: userId,
      endTime: { $lte: new Date() },
      bidCount: { $gt: 0 },
    })
      .sort({ currentPrice: 1 })
      .select("name currentPrice mainImage bidCount currentBidder")
      .populate("currentBidder", "name");

    return {
      profile: user,
      stats: {
        totalProducts,
        successfulAuctions,
        mostSuccessfulProduct,
        leastSuccessfulProduct,
        averageRating: user.reputationScore ? user.reputationScore * 5 : 0,
        positiveRatings: user.positiveRatings || 0,
        negativeRatings: user.negativeRatings || 0,
      },
    };
  }

  static async updateProfile(
    userId: string,
    updates: { name?: string; address?: string }
  ) {
    const [User] = await Promise.all([import("../models/user.model")]);
    const seller = await User.User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!seller) {
      throw new Error("User not found");
    }

    return seller;
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const [User] = await Promise.all([import("../models/user.model")]);
    // Get user with password field
    const seller = await User.User.findById(userId).select("+password");
    if (!seller) {
      throw new Error("User not found");
    }

    // Verify current password
    const isMatch = await seller.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error("Invalid current password");
    }

    // Update password
    seller.password = newPassword;
    await seller.save();

    return { message: "Password changed successfully" };
  }
}
