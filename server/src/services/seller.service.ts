import { Types } from "mongoose";
import { Product } from "../models/product.model";
import { Bid } from "../models/bid.model";
import { User } from "../models/index.model";
import { Order, OrderStatus } from "../models/order.model";
import { SellerMessages } from "../constants/messages";
import {
  sendAuctionEndedSellerEmail,
  sendAuctionWonEmail,
  sendRatingReceivedEmail,
} from "../utils/email.util";

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

    // EMAIL: Notify rejected bidder
    const { sendBidRejectedEmail } = await import("../utils/email.util");
    if (bidder.email) {
      sendBidRejectedEmail(
        bidder.email,
        bidder.name,
        product.name,
        (product as any)._id.toString(),
        "Seller rejected your bid."
      ).catch(console.error);
    }

    const updatedProduct = await Product.findById(productId)
      .populate([
        {
          path: "currentBidder",
          select: "name email positiveRatings negativeRatings",
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
    }).populate("questions.questioner", "name email");

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

    // EMAIL: Notify questioner
    const { sendAnswerNotificationEmail } = await import("../utils/email.util");
    const questioner = question.questioner as any;
    if (questioner && questioner.email) {
      sendAnswerNotificationEmail(
        questioner.email,
        questioner.name,
        product.name,
        (product as any)._id.toString(),
        question.question,
        trimmedAnswer
      ).catch(console.error);
    }

    // TODO: Send to all other involved users (bidders + previous questioners)
    // For now, doing just questioner to satisfy basic loop.

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
      status?:
        | "all"
        | "ongoing"
        | "ended"
        | "awaiting"
        | "bid_winner"
        | "history";
    } = {}
  ) {
    const {
      page = 1,
      limit = 12,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      status = "all",
    } = options;

    const query: any = { seller: userId };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const Order = (await import("../models/order.model")).Order;
    const cancelledOrders = await Order.find({
      seller: userId,
      status: OrderStatus.CANCELLED,
    }).distinct("product");

    const now = new Date();
    if (status === "ongoing") {
      query.endTime = { $gt: now };
    } else if (status === "ended") {
      // Legacy "ended" - generic
      query.endTime = { $lte: now };
      query._id = { $nin: cancelledOrders };
    } else if (status === "awaiting") {
      // Awaiting Confirmation: Ended + Bids + Not Confirmed
      // EXCLUDE Cancelled transactions (they go to "Bid Winners")
      query.endTime = { $lte: now };
      query.bidCount = { $gt: 0 };
      query.winnerConfirmed = { $ne: true };
      query._id = { $nin: cancelledOrders };
      query._id = { $nin: cancelledOrders };
    } else if (status === "bid_winner") {
      // Confirm Winner / Active Transaction: Confirmed + Not Completed
      // OR Cancelled Transaction (so it stays in list for resolution)
      query.$or = [
        { winnerConfirmed: true, transactionCompleted: { $ne: true } },
        {
          _id: { $in: cancelledOrders },
          transactionCompleted: { $ne: true },
          bidCount: { $gt: 0 },
        },
      ];
    } else if (status === "history") {
      // History: Unsold (Ended + No Bids) OR Completed (Any Completed Transaction)
      query.$or = [
        { endTime: { $lte: now }, bidCount: 0 },
        { transactionCompleted: true },
      ];
      // If it has 0 bids (e.g. all rejected), it should be in history.
      query.$and = [
        {
          $or: [
            { _id: { $nin: cancelledOrders } },
            { bidCount: 0 },
            { transactionCompleted: true },
          ],
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("currentBidder", "name positiveRatings negativeRatings")
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const productIds = products.map((p) => p._id);

    // Fetch latest orders for context (e.g. cancelled transactions)
    const orders = await Order.find({ product: { $in: productIds } })
      .sort({ createdAt: -1 })
      .populate("buyer", "name email rating positiveRatings negativeRatings")
      .populate("ratingBySeller")
      .lean();

    const { Rating } = await import("../models/rating.model");
    const ratings = await Rating.find({
      product: { $in: productIds },
      type: "bidder",
      rater: userId,
    });

    const productsWithRating = products.map((product) => {
      const isRated = ratings.some(
        (r) => r.product?.toString() === product._id.toString()
      );

      const ratingObject = ratings.find(
        (r) =>
          r.product?.toString() === product._id.toString() &&
          product.currentBidder &&
          r.ratee.toString() === (product.currentBidder as any)._id.toString()
      );

      // Find latest order for this product
      const productOrders = orders.filter(
        (o) => o.product.toString() === product._id.toString()
      );
      // Sort in memory just in case (though DB sort helps)
      productOrders.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latestOrder = productOrders[0];

      if (latestOrder && latestOrder.buyer) {
        const buyer = latestOrder.buyer as any;
        const totalRatings =
          (buyer.positiveRatings || 0) + (buyer.negativeRatings || 0);
        const reputationScore =
          totalRatings === 0 ? 0 : (buyer.positiveRatings || 0) / totalRatings;
        const calculatedRating =
          totalRatings === 0 ? undefined : reputationScore * 5;

        (latestOrder.buyer as any).rating = calculatedRating;
      }

      // Calculate bidder rating manually since lean() drops virtuals
      let bidderWithRating = product.currentBidder;
      if (product.currentBidder && (product.currentBidder as any).name) {
        const bidder = product.currentBidder as any;
        const totalRatings =
          (bidder.positiveRatings || 0) + (bidder.negativeRatings || 0);
        const reputationScore =
          totalRatings === 0 ? 0 : (bidder.positiveRatings || 0) / totalRatings;
        const calculatedRating =
          totalRatings === 0 ? undefined : reputationScore * 5;

        bidderWithRating = {
          ...bidder,
          rating: calculatedRating,
        };
      }

      return {
        ...product,
        isRatedBySeller: isRated,
        sellerRating: ratingObject
          ? { score: ratingObject.score, comment: ratingObject.comment }
          : undefined,
        currentBidder: bidderWithRating,
        latestOrder: latestOrder,
      };
    });

    return {
      products: productsWithRating,
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
        length: totalBids,
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
      console.log(
        `[ConfirmWinner] Product ${productId} already has winnerConfirmed=true`
      );
      // Check if there is an active order (non-cancelled)
      const Order = (await import("../models/order.model")).Order;
      const activeOrder = await Order.findOne({
        product: productId,
        status: { $ne: "CANCELLED" },
      });

      if (activeOrder) {
        console.log(`[ConfirmWinner] Active order found: ${activeOrder._id}`);
        throw new Error(SellerMessages.WINNER_ALREADY_CONFIRMED);
      }
      console.log(
        `[ConfirmWinner] No active order found (previous might be cancelled). Proceeding.`
      );
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

    // CREATE NEW ORDER for the new winner
    const { OrderService } = await import("./order.service");
    await OrderService.createOrder(productId, userId, winningBidderId).catch(
      (err) => {
        // Log but don't fail if order creation fails (e.g. duplicate), just continue
        console.warn("Order creation warning:", err.message);
      }
    );

    const updatedProduct = await Product.findById(productId)
      .populate([
        {
          path: "currentBidder",
          select: "name email positiveRatings negativeRatings",
        },
        { path: "category", select: "name parentCategoryId" },
      ])
      .lean();

    if (updatedProduct?.currentBidder) {
      const bidder = updatedProduct.currentBidder as any;
      const totalRatings =
        (bidder.positiveRatings || 0) + (bidder.negativeRatings || 0);
      const score =
        totalRatings === 0 ? 0 : (bidder.positiveRatings || 0) / totalRatings;
      const rating = totalRatings === 0 ? undefined : score * 5;
      (updatedProduct.currentBidder as any).rating = rating;
    }

    // EMAIL: Send notifications
    const [User] = await Promise.all([import("../models/user.model")]);
    const seller = await User.User.findById(userId);

    if (updatedProduct?.currentBidder) {
      const bidder = updatedProduct.currentBidder as any;
      if (bidder.email) {
        sendAuctionWonEmail(
          bidder.email,
          bidder.name,
          updatedProduct.name,
          updatedProduct._id.toString(),
          updatedProduct.currentPrice
        ).catch(console.error);
      }
    }

    if (seller?.email) {
      sendAuctionEndedSellerEmail(
        seller.email,
        seller.name,
        updatedProduct?.name ?? "Product",
        updatedProduct?._id.toString() ?? productId,
        (updatedProduct?.currentBidder as any)?.name ?? "Winner",
        updatedProduct?.currentPrice ?? 0
      ).catch(console.error);
    }

    return updatedProduct;
  }

  static async completeTransaction(userId: string, productId: string) {
    const product = await Product.findOne({
      _id: productId,
      seller: userId,
    });

    if (!product) {
      throw new Error(SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED);
    }

    if (!product.winnerConfirmed) {
      throw new Error("Cannot complete transaction without a confirmed winner");
    }

    product.transactionCompleted = true;
    await product.save();

    return product;
  }

  static async rateWinner(
    userId: string,
    productId: string,
    score: 1 | -1,
    comment: string
  ) {
    try {
      const product = await Product.findOne({
        _id: productId,
        seller: userId,
      });

      if (!product) {
        throw new Error(SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED);
      }

      if (!product.winnerConfirmed || !product.currentBidder) {
        throw new Error("Winner must be confirmed before rating");
      }

      const { Rating } = await import("../models/rating.model");

      // Check if rating exists for this transaction
      let rating = await Rating.findOne({
        type: "bidder", // Seller rating Bidder
        rater: userId,
        ratee: product.currentBidder,
        product: productId,
      });

      if (rating) {
        // Update existing rating logic
        // First revert old score impact on user
        const [User] = await Promise.all([import("../models/user.model")]);
        const oldField =
          rating.score === 1 ? "positiveRatings" : "negativeRatings";
        await User.User.findByIdAndUpdate(product.currentBidder, {
          $inc: { [oldField]: -1 },
        });

        rating.score = score;
        rating.comment = comment;
        await rating.save();

        // Re-apply new score impact
        const newField = score === 1 ? "positiveRatings" : "negativeRatings";
        await User.User.findByIdAndUpdate(product.currentBidder, {
          $inc: { [newField]: 1 },
        });
      } else {
        // Create new rating
        rating = await Rating.create({
          type: "bidder",
          rater: userId,
          ratee: product.currentBidder,
          product: productId,
          score,
          comment,
        });

        console.log("Created rating for:", product.currentBidder);
        // Note: Rating model post-save hook handles the user reputation update automatically.
      }

      // SYNC WITH ORDER
      const Order = (await import("../models/order.model")).Order;
      const order = await Order.findOne({
        product: productId,
        buyer: product.currentBidder,
      });
      if (order) {
        order.ratingBySeller = {
          score,
          comment,
          updatedAt: new Date(),
        };

        if (order.ratingByBuyer) {
          order.status = OrderStatus.COMPLETED;
          product.transactionCompleted = true;
          await product.save();
        }

        await order.save();
      }

      // EMAIL: Notify Bidder
      const [User] = await Promise.all([import("../models/user.model")]);
      const seller = await User.User.findById(userId);
      const bidder = await User.User.findById(product.currentBidder);
      if (seller && bidder && bidder.email) {
        sendRatingReceivedEmail(
          bidder.email,
          bidder.name,
          product.name,
          productId,
          seller.name,
          score,
          comment
        ).catch(console.error);
      }

      return rating;
    } catch (error) {
      console.error("Error in rateWinner:", error);
      throw error;
    }
  }

  static async cancelTransaction(userId: string, productId: string) {
    const product = await Product.findOne({
      _id: productId,
      seller: userId,
    });

    if (!product) {
      throw new Error(SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED);
    }

    if (!product.winnerConfirmed || !product.currentBidder) {
      console.warn(
        `[CancelTrans] Failed check - WinnerConfirmed: ${product.winnerConfirmed}, CurrentBidder: ${product.currentBidder}`
      );
      throw new Error("No confirmed transaction to cancel");
    }

    const bidderId = product.currentBidder.toString();

    // 1. Auto-rate Negative
    try {
      await this.rateWinner(
        userId,
        productId,
        -1,
        "Winner did not pay in time - Transaction Cancelled"
      );
    } catch (error) {
      console.warn("Auto-rating failed during cancellation:", error);
      // Continue cancellation regardless
    }

    // 2. CANCEL ORDER via OrderService
    const { OrderService } = await import("./order.service");
    const { Order } = await import("../models/order.model");

    // Find the order to cancel
    console.log(
      `[CancelTrans] Searching for order to cancel. Product: ${productId}, Buyer: ${bidderId}, Seller: ${userId}`
    );

    const orderToCancel = await Order.findOne({
      product: productId,
      buyer: bidderId,
      status: { $ne: OrderStatus.CANCELLED },
    });

    console.log(
      `[CancelTrans] Order found: ${orderToCancel ? orderToCancel._id : "NULL"}`
    );

    if (orderToCancel) {
      try {
        orderToCancel.status = OrderStatus.CANCELLED;

        // Auto-rate if not already rated
        if (!orderToCancel.ratingBySeller) {
          orderToCancel.ratingBySeller = {
            score: -1,
            comment: "Order cancelled by seller due to non-payment/issues.",
            updatedAt: new Date(),
          };

          // Update buyer reputation
          const User = (await import("../models/user.model")).User;
          await User.findByIdAndUpdate(orderToCancel.buyer, {
            $inc: { negativeRatings: 1 },
          });
        }

        await orderToCancel.save();
        console.log(
          `[CancelTrans] Order ${orderToCancel._id} cancelled successfully.`
        );
      } catch (err: any) {
        console.error("Failed to cancel order locally:", err);
      }
    } else {
      console.warn(
        "No active order found to cancel, proceeding with bidder rejection."
      );
    }

    // Add to rejected list if not already
    try {
      if (!product.rejectedBidders) {
        product.rejectedBidders = [];
      }
      const alreadyRejected = product.rejectedBidders.some(
        (id) => id.toString() === bidderId
      );
      if (!alreadyRejected) {
        product.rejectedBidders.push(new Types.ObjectId(bidderId));
      }
    } catch (pushErr) {
      console.error("Error updating rejectedBidders:", pushErr);
    }

    // 3. DELETE BIDS from this user (Clean up eligibility)
    const Bid = (await import("../models/bid.model")).Bid;
    await Bid.deleteMany({ product: productId, bidder: bidderId });

    const remainingBidCount = await Bid.countDocuments({
      product: productId,
      bidder: { $nin: product.rejectedBidders },
    });
    console.log(
      `[CancelTrans] Remaining Bid Count: ${remainingBidCount}. Rejected Bidders: ${product.rejectedBidders.length}`
    );
    product.bidCount = remainingBidCount;

    const removedCurrentWinner =
      product.currentBidder && product.currentBidder.toString() === bidderId;

    if (removedCurrentWinner || remainingBidCount === 0) {
      // Find next highest
      const nextHighestBid = await Bid.findOne({
        product: productId,
        bidder: { $nin: product.rejectedBidders },
      }).sort({
        price: -1,
        createdAt: 1,
      });
      if (nextHighestBid) {
        product.currentPrice = nextHighestBid.price;
        product.currentBidder = nextHighestBid.bidder as any;
      } else {
        product.currentPrice = product.startingPrice;
        product.currentBidder = null as any;
      }
    }

    product.winnerConfirmed = false;

    try {
      await product.save();
    } catch (saveError) {
      console.error("Failed to save product during cancellation:", saveError);
      throw new Error("Failed to update product state after cancellation");
    }

    return product;
  }

  static async transferWinner(userId: string, productId: string) {
    // This is effectively "Confirm Winner" for the next person
    return this.confirmWinner(userId, productId);
  }

  static async archiveCancelledProduct(userId: string, productId: string) {
    const product = await Product.findOne({
      _id: productId,
      seller: userId,
    });

    if (!product) {
      throw new Error(SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED);
    }

    // Force completion (Archival)
    product.transactionCompleted = true;
    product.winnerConfirmed = false;

    await product.save();
    return product;
  }
}
