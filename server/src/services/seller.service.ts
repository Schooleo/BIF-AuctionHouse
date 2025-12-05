import mongoose, { Types } from "mongoose";
import { Product } from "../models/product.model";
import { Bid } from "../models/bid.model";
import { User } from "../models/index.model";
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

  static async rejectBidder(
    userId: string,
    productId: string,
    bidderId: string
  ) {
    const product = await Product.findOne({
      _id: productId,
      seller: userId,
    });

    if (!product) {
      throw new Error(SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED);
    }

    const bidder = await User.findById(bidderId);
    if (!bidder) {
      throw new Error(SellerMessages.BIDDER_NOT_FOUND);
    }

    const alreadyRejected =
      product.rejectedBidders?.some((id) => id.toString() === bidderId) ??
      false;

    if (alreadyRejected) {
      throw new Error(SellerMessages.BIDDER_ALREADY_REJECTED);
    }

    product.rejectedBidders = [
      ...(product.rejectedBidders ?? []),
      bidder._id as any,
    ];

    await Bid.deleteMany({
      product: productId,
      bidder: bidderId,
    });

    const remainingBidCount = await Bid.countDocuments({
      product: productId,
    });

    product.bidCount = remainingBidCount;

    const removedCurrentWinner =
      product.currentBidder && product.currentBidder.toString() === bidderId;

    if (removedCurrentWinner) {
      const nextHighestBid = await Bid.findOne({
        product: productId,
      }).sort({ price: -1, createdAt: 1 });

      if (nextHighestBid) {
        product.currentPrice = nextHighestBid.price;
        product.currentBidder = nextHighestBid.bidder as any;
      } else {
        product.currentPrice = product.startingPrice;
        product.currentBidder = null as any;
      }
    } else if (remainingBidCount === 0) {
      product.currentPrice = product.startingPrice;
      product.currentBidder = null as any;
    }

    await product.save();

    const updatedProduct = await Product.findById(productId)
      .populate([
        {
          path: "currentBidder",
          select: "name email positiveRatings negativeRatings rating",
        },
        { path: "category", select: "name" },
      ])
      .lean();

    return updatedProduct;
  }

  static async answerQuestion(
    userId: string,
    productId: string,
    questionId: string,
    answer: string
  ) {
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      throw new Error(SellerMessages.ANSWER_REQUIRED);
    }

    const product = await Product.findOne({
      _id: productId,
      seller: userId,
    });

    if (!product) {
      throw new Error(SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED);
    }

    const question = product.questions.find(
      (q) => q._id?.toString() === questionId
    );

    if (!question) {
      throw new Error(SellerMessages.QUESTION_NOT_FOUND);
    }

    const alreadyAnswered = Boolean(question.answer);

    question.answer = trimmedAnswer;
    question.answeredAt = new Date();
    question.answerer = new Types.ObjectId(userId);

    await product.save();

    const refreshedProduct = await Product.findById(productId)
      .populate([
        {
          path: "questions.questioner",
          select: "name email positiveRatings negativeRatings rating",
        },
        {
          path: "questions.answerer",
          select: "name email positiveRatings negativeRatings rating",
        },
      ])
      .lean();

    const updatedQuestion = refreshedProduct?.questions?.find(
      (q: any) => q._id.toString() === questionId
    );

    return {
      question: updatedQuestion,
      updated: alreadyAnswered,
    };
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

  static async getProductBidHistory(
    userId: string,
    productId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const product = await Product.findOne({
      _id: productId,
      seller: userId,
    });

    if (!product) {
      throw new Error(SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED);
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [bids, totalBids] = await Promise.all([
      Bid.find({ product: productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate("bidder", "name email rating"),
      Bid.countDocuments({ product: productId }),
    ]);

    const bidHistory = bids.map((bid) => ({
      _id: (bid as any)._id.toString(),
      bidder: bid.bidder
        ? {
            _id: (bid.bidder as any)._id.toString(),
            name: (bid.bidder as any).name ?? "Unknown bidder",
            rating:
              typeof (bid.bidder as any).rating === "number"
                ? (bid.bidder as any).rating
                : undefined,
          }
        : null,
      price: bid.price,
      createdAt: bid.createdAt.toISOString(),
    }));

    return {
      bidHistory,
      pagination: {
        currentPage: safePage,
        totalPages: Math.ceil(totalBids / safeLimit),
        totalBids,
        limit: safeLimit,
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

  static async confirmWinner(userId: string, productId: string) {
    const product = await Product.findOne({
      _id: productId,
      seller: userId,
    });

    if (!product) {
      throw new Error(SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED);
    }

    if (product.winnerConfirmed) {
      throw new Error(SellerMessages.WINNER_ALREADY_CONFIRMED);
    }

    const now = new Date();
    if (product.endTime > now) {
      throw new Error(SellerMessages.AUCTION_NOT_ENDED);
    }

    const rejectedIds = new Set(
      (product.rejectedBidders ?? []).map((id) => id.toString())
    );

    const bidQuery: Record<string, unknown> = { product: productId };
    if (rejectedIds.size > 0) {
      bidQuery.bidder = { $nin: Array.from(rejectedIds) };
    }

    const winningBid = await Bid.findOne(bidQuery)
      .sort({ price: -1, createdAt: 1 })
      .populate("bidder", "name email positiveRatings negativeRatings rating");

    if (!winningBid) {
      throw new Error(SellerMessages.NO_ELIGIBLE_BIDDER);
    }

    const winningBidderId =
      (winningBid.bidder as any)?._id ?? winningBid.bidder;

    product.currentBidder = winningBidderId as any;
    product.currentPrice = winningBid.price;
    product.winnerConfirmed = true;

    await product.save();

    const updatedProduct = await Product.findById(productId)
      .populate([
        {
          path: "currentBidder",
          select: "name email positiveRatings negativeRatings rating",
        },
        { path: "category", select: "name parentCategoryId" },
      ])
      .lean();

    return updatedProduct;
  }
}
