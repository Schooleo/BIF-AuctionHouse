import { User, IUser } from "../models/user.model";
import { Product } from "../models/product.model";
import { Order } from "../models/order.model";
import { Bid } from "../models/bid.model";
import { AutoBid } from "../models/autoBid.model";
import { Rating } from "../models/rating.model";
import { Chat } from "../models/chat.model";
import { Category } from "../models/category.model";
import { SystemConfig } from "../models/systemConfig.model";
import { Watchlist } from "../models/watchlist.model";
import { UpgradeRequest } from "../models/upgradeRequest.model";
import { UnbanRequest } from "../models/unbanRequest.model";
import { BlacklistedEmail } from "../models/blacklistedEmail.model";
import mongoose from "mongoose";
import * as bcrypt from "bcrypt";
import { UpdateProfileDto, ChangePasswordDto } from "../types/admin.types";

// Enum for bid status from admin perspective
enum BidStatus {
  WON = "Won",
  LOST = "Lost",
  LEADING = "Leading",
  OUTBID = "Outbid",
  ONGOING = "Ongoing",
  UNKNOWN = "Unknown (Product Deleted)",
}

export const getDashboardStats = async (timeRange: string = "24h") => {
  const now = new Date();
  let startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default 24h

  switch (timeRange) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      startDate = new Date(0); // Beginning of time
      break;
    case "24h":
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
  }

  // 1. User Stats
  const users = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);
  const userStats = {
    total: users.reduce((acc, curr) => acc + curr.count, 0),
    byRole: users.reduce(
      (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
      {}
    ),
  };

  // 2. Product Stats
  const getProductStats = async (matchDates = true) => {
    const matchStage = matchDates
      ? {
          $match: {
            startTime: { $lte: now },
            endTime: { $gt: now },
          },
        }
      : { $match: {} };

    const stats = await Product.aggregate([
      matchStage,
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: "$categoryInfo" },
      {
        $group: {
          _id: "$categoryInfo.name",
          count: { $sum: 1 },
        },
      },
    ]);
    return {
      total: stats.reduce((acc, curr) => acc + curr.count, 0),
      byCategory: stats.map((p) => ({ name: p._id, count: p.count })),
    };
  };

  const ongoingStats = await getProductStats(true);
  const allStats = await getProductStats(false);

  const productStats = {
    ongoing: ongoingStats,
    all: allStats,
  };

  // 3. Order Stats
  const orderStatsRaw = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
  const orderStats = orderStatsRaw.map((o) => ({
    status: o._id,
    count: o.count,
  }));

  // 4. Bid Stats
  let bidPipeline: any[] = [];
  let autoBidPipeline: any[] = [];
  startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  if (timeRange === "all") {
    // Dynamic Bucketing: 30 points
    const firstBid = await Bid.findOne().sort({ createdAt: 1 });
    const minDate = firstBid
      ? new Date(firstBid.createdAt.getTime() - 60000)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const totalDuration = now.getTime() - minDate.getTime();

    // If no data or very short duration, fallback to 24h logic roughly or just one bucket
    if (totalDuration < 1000 * 60) {
      // Fallback to simple 24h view if practically no time passed
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const step = Math.max(1, Math.ceil(totalDuration / 30));
    const boundaries = [];
    for (let i = 0; i <= 30; i++) {
      boundaries.push(new Date(minDate.getTime() + i * step));
    }

    // Ensure the last boundary covers 'now'
    if (boundaries.length > 0 && boundaries[boundaries.length - 1]! < now) {
      boundaries.push(new Date(now.getTime() + 1000));
    }

    const bucketStage = {
      $bucket: {
        groupBy: "$createdAt",
        boundaries: boundaries,
        default: "Other",
        output: { count: { $sum: 1 } },
      },
    };

    bidPipeline = [bucketStage];
    autoBidPipeline = [bucketStage];
  } else {
    // Fixed Time Ranges
    let groupBy: any = {};
    if (timeRange === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
        // 0 for 00:00-11:59, 1 for 12:00-23:59
        half: { $floor: { $divide: [{ $hour: "$createdAt" }, 12] } },
      };
    } else if (timeRange === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };
    } else {
      // 24h (Default)
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
        hour: { $hour: "$createdAt" },
      };
    }

    const matchStage = { $match: { createdAt: { $gte: startDate } } };
    const groupStage = { $group: { _id: groupBy, count: { $sum: 1 } } };
    // Sort logic depends on group keys.
    const sortStage = {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1,
        "_id.hour": 1,
        "_id.half": 1,
      },
    };

    bidPipeline = [matchStage, groupStage, sortStage];
    autoBidPipeline = [matchStage, groupStage, sortStage];
  }

  const bidsByHour = await Bid.aggregate(bidPipeline);
  const autoBidsByHour = await AutoBid.aggregate(autoBidPipeline);

  // Top 10 Bids (Recent within range or Overall if 'all')
  const top10Match =
    timeRange === "all" ? {} : { createdAt: { $gte: startDate } };

  const top10Bids = await Bid.find(top10Match)
    .sort({ price: -1 })
    .limit(10)
    .populate("bidder", "name email")
    .populate("product", "name");

  return {
    userStats,
    productStats,
    orderStats,
    bidStats: {
      hourly: bidsByHour,
      hourlyAuto: autoBidsByHour,
      top10: top10Bids,
    },
  };
};

// ==========================================
// USER MANAGEMENT
// ==========================================

import { UserSearchParams } from "../types/admin";

export const getAllUsers = async (params: UserSearchParams) => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const query: any = {};

  // Search by name or email
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  // Filter by role
  if (role) {
    query.role = role;
  }

  // Filter by status (ACTIVE/BLOCKED)
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  // Build sort object
  const sortOptions: any = {};

  // Map frontend sortBy values to DB fields
  const sortFieldMap: Record<string, string> = {
    createdAt: "createdAt",
    name: "name",
    email: "email",
    reputation: "reputationScore",
  };

  const dbSortField = sortFieldMap[sortBy] || "createdAt";
  sortOptions[dbSortField] = sortOrder === "asc" ? 1 : -1;

  const [users, totalDocs] = await Promise.all([
    User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort(sortOptions)
      .lean(),
    User.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalDocs / limit);

  return {
    users,
    totalDocs,
    totalPages,
    currentPage: page,
  };
};

interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  address: string;
  role: "bidder" | "seller";
}

export const createUser = async (data: CreateUserDto) => {
  // Check if email already exists
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new Error("Email already exists");
  }

  // Create new user
  const user = new User({
    name: data.name,
    email: data.email,
    password: data.password,
    address: data.address,
    role: data.role,
    status: "ACTIVE",
    positiveRatings: 0,
    negativeRatings: 0,
    reputationScore: 0,
  });

  await user.save();

  // Return user without password
  const userObj = user.toObject();
  delete (userObj as any).password;

  return userObj;
};

export const blockUser = async (userId: string, reason: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "admin") {
    throw new Error("Cannot block admin accounts");
  }

  if (user.status === "BLOCKED") {
    throw new Error("User is already blocked");
  }

  user.status = "BLOCKED";
  user.blockReason = reason;
  user.blockedAt = new Date();
  await user.save();

  // Delete all AutoBid records for this user to stop automatic bidding
  await AutoBid.deleteMany({ user: userId });

  return {
    status: user.status,
    blockReason: user.blockReason,
    blockedAt: user.blockedAt,
  };
};

export const unblockUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.status === "ACTIVE") {
    throw new Error("User is already active");
  }

  // Use updateOne with $unset for optional fields to avoid TS error
  await User.updateOne(
    { _id: userId },
    {
      $set: { status: "ACTIVE" },
      $unset: { blockReason: 1, blockedAt: 1 },
    }
  );

  // Delete any pending unban requests for this user
  await UnbanRequest.deleteMany({ user: userId, status: "PENDING" });

  return { status: "ACTIVE" };
};

export const deleteUser = async (userId: string, adminId?: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Prevent admin from deleting themselves
  if (adminId && userId === adminId) {
    throw new Error("Cannot delete your own account");
  }

  // Prevent deleting other admins
  if (user.role === "admin") {
    throw new Error("Cannot delete admin accounts");
  }

  // Check if user has active orders (as buyer or seller)
  const activeOrders = await Order.countDocuments({
    $or: [{ buyer: userId }, { seller: userId }],
    status: { $nin: ["COMPLETED", "CANCELLED"] },
  });

  if (activeOrders > 0) {
    throw new Error("Cannot delete user with active orders");
  }

  const now = new Date();

  // Additional checks for sellers
  if (user.role === "seller") {
    // Check for active auctions (products currently being auctioned)
    const activeAuctions = await Product.countDocuments({
      seller: userId,
      startTime: { $lte: now },
      endTime: { $gt: now },
    });

    if (activeAuctions > 0) {
      throw new Error("Cannot delete seller with active auctions");
    }

    // Check for ended auctions with winner but no order created yet
    const endedWithWinner = await Product.countDocuments({
      seller: userId,
      endTime: { $lte: now },
      winner: { $ne: null },
      // No order exists for this product
    });

    // Get product IDs to check if orders exist
    const endedProducts = await Product.find({
      seller: userId,
      endTime: { $lte: now },
      winner: { $ne: null },
    }).select("_id");

    const productIds = endedProducts.map((p) => p._id);

    if (productIds.length > 0) {
      const ordersForProducts = await Order.countDocuments({
        product: { $in: productIds },
      });

      // If there are ended auctions with winners but fewer orders than products
      if (ordersForProducts < productIds.length) {
        throw new Error(
          "Cannot delete seller with pending auction results. Please ensure all ended auctions have been processed."
        );
      }
    }

    // Get all product IDs of this seller for cleanup
    const sellerProducts = await Product.find({ seller: userId }).select("_id");
    const sellerProductIds = sellerProducts.map((p) => p._id);

    // Delete related data for seller's products
    if (sellerProductIds.length > 0) {
      await Promise.all([
        // Delete bids on seller's products
        Bid.deleteMany({ product: { $in: sellerProductIds } }),
        // Delete auto bids on seller's products
        AutoBid.deleteMany({ product: { $in: sellerProductIds } }),
        // Delete watchlists for seller's products
        Watchlist.deleteMany({ product: { $in: sellerProductIds } }),
        // Delete seller's products
        Product.deleteMany({ seller: userId }),
      ]);
    }
  }

  // Check for ACTIVE Auto Bids (for any user role)
  // Prevent deletion if user has an Auto Bid on an ONGOING auction
  const activeAutoBids = await AutoBid.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $match: {
        "productInfo.endTime": { $gt: now },
      },
    },
    { $count: "count" },
  ]);

  if (activeAutoBids.length > 0 && activeAutoBids[0].count > 0) {
    throw new Error(
      "Cannot delete user with active Auto Bids on ongoing auctions"
    );
  }

  // Additional checks for bidders
  if (user.role === "bidder") {
    // Check if user is the current highest bidder on any ACTIVE auction
    const leadingAuctions = await Product.countDocuments({
      startTime: { $lte: now },
      endTime: { $gt: now },
      currentBidder: userId,
    });

    if (leadingAuctions > 0) {
      throw new Error(
        "Cannot delete user who is currently leading in an active auction"
      );
    }

    // Check if user is a winner of an ENDED auction but NO ORDER created yet
    const wonProducts = await Product.find({
      endTime: { $lte: now },
      winner: userId, // User is marked as winner
    }).select("_id");

    const wonProductIds = wonProducts.map((p) => p._id);

    if (wonProductIds.length > 0) {
      // Check if orders exist for these won products
      // We check if there's any order linked to these products where user is buyer
      const ordersForWonProducts = await Order.countDocuments({
        product: { $in: wonProductIds },
        buyer: userId,
      });

      if (ordersForWonProducts < wonProductIds.length) {
        throw new Error(
          "Cannot delete user who has won auctions with pending orders"
        );
      }
    }
  }

  // Delete user's own related data (common for both bidder and seller)
  await Promise.all([
    // User's watchlist
    Watchlist.deleteMany({ user: userId }),
    // User's auto bids
    AutoBid.deleteMany({ user: userId }),
    // User's upgrade requests
    UpgradeRequest.deleteMany({ user: userId }),
    // User's unban requests
    UnbanRequest.deleteMany({ user: userId }),
    // Ratings given BY this user (rater)
    Rating.deleteMany({ rater: userId }),
    // Bids placed by this user (for bidders)
    Bid.deleteMany({ bidder: userId }),
  ]);

  // Note: We keep ratings RECEIVED by this user (ratee) for historical purposes
  // But the rater reference will be null - handled in frontend with optional chaining

  // Delete user
  await User.findByIdAndDelete(userId);

  return { message: "User deleted successfully", userId };
};

export const getUserDetail = async (
  userId: string,
  options: { page?: number; limit?: number } = {}
) => {
  const { page = 1, limit = 10 } = options;

  const user = await User.findById(userId).select("-password -googleId");
  if (!user) {
    throw new Error("User not found");
  }

  // Calculate star rating (0-5 scale) using stored reputationScore
  const starRating = (user.reputationScore || 0) * 5;
  const ratingCount = user.positiveRatings + user.negativeRatings;

  // Pagination setup for reviews
  const skip = (page - 1) * limit;

  // Parallel Fetching
  const [bids, reviewsData, totalReviews, products, statsAggregation] =
    await Promise.all([
      // 1. Bid History (Last 10)
      Bid.find({ bidder: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate(
          "product",
          "name endTime currentPrice winnerConfirmed currentBidder"
        )
        .lean(),

      // 2. Paginated Reviews (ALL types: + and -)
      Rating.find({ ratee: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("rater", "name avatar")
        .lean(),

      // 4. Total review count
      Rating.countDocuments({ ratee: userId }),

      // 5. Selling Info (If Seller) - Active products
      user.role === "seller"
        ? Product.find({ seller: userId, endTime: { $gt: new Date() } })
            .select("name currentPrice mainImage endTime bidCount")
            .limit(10)
            .lean()
        : Promise.resolve([]),

      // 6. Stats from actual ratings (not user fields which may be stale)
      Rating.aggregate([
        { $match: { ratee: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            positiveCount: {
              $sum: { $cond: [{ $eq: ["$score", 1] }, 1, 0] },
            },
            negativeCount: {
              $sum: { $cond: [{ $eq: ["$score", -1] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

  // Process Bids to determine status from admin perspective
  // Status represents the state of INDIVIDUAL BID, not the auction
  const bidHistory = bids.map((bid: any) => {
    const product = bid.product;
    let status: string = BidStatus.ONGOING;

    if (!product) {
      // Product was deleted
      status = BidStatus.UNKNOWN;
    } else {
      const now = new Date();
      const isEnded = new Date(product.endTime) < now;

      if (isEnded) {
        // Auction has ended - determine if this bid won or lost
        const isWinner =
          product.currentBidder?.toString() === userId &&
          bid.price === product.currentPrice;
        status = isWinner ? BidStatus.WON : BidStatus.LOST;
      } else {
        // Auction is still ongoing - check if bid is leading or outbid
        if (bid.price < product.currentPrice) {
          status = BidStatus.OUTBID; // Someone bid higher
        } else {
          status = BidStatus.LEADING; // This bid is currently winning
        }
      }
    }

    return {
      _id: bid._id,
      productName: product?.name || "Unknown Product",
      amount: bid.price,
      date: bid.createdAt,
      status,
    };
  });

  // Stats breakdown from actual Rating collection
  const statsResult = statsAggregation[0] || {
    positiveCount: 0,
    negativeCount: 0,
  };
  const stats = {
    positiveCount: statsResult.positiveCount,
    negativeCount: statsResult.negativeCount,
  };

  return {
    profile: {
      ...user.toObject(),
      starRating,
      ratingCount,
      reputationParam: {
        positive: user.positiveRatings || 0,
        negative: user.negativeRatings || 0,
        score: user.reputationScore || 0,
      },
    },
    bidHistory,
    reviews: {
      docs: reviewsData,
      totalDocs: totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      page,
      limit,
    },
    sellingHistory: products,
    stats,
  };
};

export const updateUser = async (userId: string, data: any) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Prevent updating sensitive fields directly if needed, strictly generic for now as per request
  Object.assign(user, data);
  await user.save();
  return user;
};

// ==========================================
// NEW: Linked Account & Extended User Stats
// ==========================================

/**
 * Get linked account profile for upgraded accounts (seller <-> bidder)
 */
export const getLinkedAccountProfile = async (
  userId: string,
  options: { page?: number; limit?: number } = {}
) => {
  const { page = 1, limit = 10 } = options;

  const user = await User.findById(userId).select("-password -googleId");
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isUpgradedAccount || !user.linkedAccountId) {
    throw new Error(
      "This account is not an upgraded account with linked profile"
    );
  }

  // Call getUserDetail for the linked account to get complete data
  const linkedUserDetail = await getUserDetail(
    user.linkedAccountId.toString(),
    {
      page,
      limit,
    }
  );

  return linkedUserDetail;
};

/**
 * Get user products based on role
 * - Seller: Products they created
 * - Bidder: Auctions they participated in (placed bids)
 */
export const getUserProducts = async (
  userId: string,
  role: "seller" | "bidder",
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;
  const now = new Date();

  if (role === "seller") {
    // Get seller's products
    const [products, total] = await Promise.all([
      Product.find({ seller: userId })
        .select("name currentPrice mainImage endTime startTime bidCount winner")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments({ seller: userId }),
    ]);

    // Add status to each product
    const productsWithStatus = products.map((product: any) => {
      let status = "scheduled";
      if (
        new Date(product.startTime) <= now &&
        new Date(product.endTime) > now
      ) {
        status = "ongoing";
      } else if (new Date(product.endTime) <= now) {
        status = product.winner ? "sold" : "ended";
      }
      return { ...product, status };
    });

    return {
      products: productsWithStatus,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    };
  } else {
    // Get bidder's participated auctions (products they bid on)
    const bidProducts = await Bid.aggregate([
      { $match: { bidder: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$product",
          lastBidAmount: { $max: "$price" },
          bidCount: { $sum: 1 },
        },
      },
      { $sort: { lastBidAmount: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          _id: "$productInfo._id",
          name: "$productInfo.name",
          currentPrice: "$productInfo.currentPrice",
          mainImage: "$productInfo.mainImage",
          endTime: "$productInfo.endTime",
          startTime: "$productInfo.startTime",
          myBidCount: "$bidCount",
          myHighestBid: "$lastBidAmount",
          winner: "$productInfo.winner",
          currentBidder: "$productInfo.currentBidder",
        },
      },
    ]);

    const total = await Bid.aggregate([
      { $match: { bidder: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$product" } },
      { $count: "total" },
    ]);

    // Add status to each product
    const productsWithStatus = bidProducts.map((product: any) => {
      let status = "ongoing";
      const isEnded = new Date(product.endTime) <= now;
      const isWinner =
        product.currentBidder?.toString() === userId ||
        product.winner?.toString() === userId;

      if (isEnded) {
        status = isWinner ? "won" : "lost";
      } else {
        status =
          product.currentBidder?.toString() === userId ? "leading" : "outbid";
      }
      return { ...product, status };
    });

    return {
      products: productsWithStatus,
      total: total[0]?.total || 0,
      totalPages: Math.ceil((total[0]?.total || 0) / limit),
      page,
    };
  }
};

/**
 * Get user's orders summary grouped by status
 */
export const getUserOrdersSummary = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Determine query based on role
  const queryField = user.role === "seller" ? "seller" : "buyer";

  const ordersSummary = await Order.aggregate([
    { $match: { [queryField]: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Convert to object with all status keys
  const summary: Record<string, number> = {
    PENDING_PAYMENT: 0,
    PAID_CONFIRMED: 0,
    SHIPPED: 0,
    RECEIVED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  ordersSummary.forEach((item: any) => {
    summary[item._id] = item.count;
  });

  const total = Object.values(summary).reduce((a, b) => a + b, 0);

  return { summary, total, role: user.role };
};

/**
 * Update review comment by admin
 */
export const updateReview = async (reviewId: string, comment: string) => {
  const review = await Rating.findById(reviewId);
  if (!review) {
    throw new Error("Review not found");
  }

  review.comment = comment;
  await review.save();

  // Return updated review with populated fields
  const updatedReview = await Rating.findById(reviewId)
    .populate("rater", "name avatar")
    .populate("ratee", "name avatar")
    .populate("product", "name mainImage");

  return updatedReview;
};

/**
 * Delete review by admin (will cascade to update user reputation via model hooks)
 */
export const deleteReview = async (reviewId: string) => {
  const review = await Rating.findById(reviewId);
  if (!review) {
    throw new Error("Review not found");
  }

  // Use findOneAndDelete to trigger the post hook for reputation update
  await Rating.findOneAndDelete({ _id: reviewId });

  // Recalculate ratee's reputation score
  const rateeId = review.ratee;
  const ratee = await User.findById(rateeId);
  if (ratee) {
    const totalRatings = ratee.positiveRatings + ratee.negativeRatings;
    ratee.reputationScore =
      totalRatings === 0 ? 0 : ratee.positiveRatings / totalRatings;
    await ratee.save();
  }

  return { message: "Review deleted successfully", reviewId };
};

export const listOrdersPaginated = async (
  page: number,
  limit: number,
  filterStatus?: string,
  sortBy?: string,
  search?: string
) => {
  const skip = (page - 1) * limit;
  let matchStage: any = {};
  if (filterStatus && filterStatus !== "all") {
    if (filterStatus === "ongoing") {
      matchStage.status = { $nin: ["COMPLETED", "CANCELLED"] };
    } else {
      matchStage.status = filterStatus;
    }
  }

  const pipeline: any[] = [
    { $match: matchStage },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "seller",
        foreignField: "_id",
        as: "sellerInfo",
      },
    },
    { $unwind: { path: "$sellerInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "buyer",
        foreignField: "_id",
        as: "buyerInfo",
      },
    },
    { $unwind: { path: "$buyerInfo", preserveNullAndEmptyArrays: true } },
  ];

  if (search) {
    const searchRegex = new RegExp(
      search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    pipeline.push({
      $addFields: {
        orderIdStr: { $toString: "$_id" },
      },
    });
    pipeline.push({
      $match: {
        $or: [
          { orderIdStr: searchRegex },
          { "productInfo.name": searchRegex },
          { "sellerInfo.name": searchRegex },
          { "buyerInfo.name": searchRegex },
        ],
      },
    });
  }

  let sortStage: any = {};
  if (sortBy) {
    switch (sortBy) {
      case "newest":
        sortStage = { createdAt: -1 };
        break;
      case "oldest":
        sortStage = { createdAt: 1 };
        break;
      case "price_desc":
        sortStage = { "productInfo.currentPrice": -1 };
        break;
      case "price_asc":
        sortStage = { "productInfo.currentPrice": 1 };
        break;
      default:
        sortStage = { createdAt: -1 };
    }
  } else {
    if (!filterStatus || filterStatus === "all") {
      pipeline.push({
        $addFields: {
          isOngoing: {
            $cond: [{ $in: ["$status", ["COMPLETED", "CANCELLED"]] }, 0, 1],
          },
        },
      });
      sortStage = { isOngoing: -1, createdAt: -1 };
    } else {
      sortStage = { createdAt: -1 };
    }
  }

  pipeline.push({ $sort: sortStage });

  pipeline.push({
    $facet: {
      metadata: [{ $count: "total" }],
      data: [{ $skip: skip }, { $limit: limit }],
    },
  });

  const result = await Order.aggregate(pipeline);
  const metadata = result[0].metadata[0];
  const total = metadata ? metadata.total : 0;
  const data = result[0].data;

  return {
    orders: data,
    total,
    totalPages: Math.ceil(total / limit),
    page,
  };
};

export const getOrderDetails = async (id: string) => {
  const order = await Order.findById(id)
    .populate("product")
    .populate("seller", "-password")
    .populate("buyer", "-password")
    .populate({
      path: "chat",
      populate: {
        path: "messages.sender",
        select: "name email role",
      },
    });

  if (!order) throw new Error("Order not found");
  return order;
};

export const cancelOrder = async (id: string) => {
  const order = await Order.findById(id);
  if (!order) throw new Error("Order not found");

  if (order.status === "CANCELLED" || order.status === "COMPLETED") {
    throw new Error("Cannot cancel completed or already cancelled order");
  }

  order.status = "CANCELLED" as any;
  await order.save();

  await Product.findByIdAndUpdate(order.product, {
    transactionCompleted: false,
    winnerConfirmed: false,
  });

  return order;
};

export const adminSendMessage = async (
  orderId: string,
  adminId: string,
  content: string
) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (!order.chat) {
    throw new Error("Chat not initialized for this order");
  }

  const chat = await Chat.findById(order.chat);
  if (!chat) throw new Error("Chat not found");

  chat.messages.push({
    sender: new mongoose.Types.ObjectId(adminId),
    content,
    timestamp: new Date(),
    isAdmin: true,
  });

  await chat.save();
  return chat;
};

export const deleteChatMessage = async (orderId: string, messageId: string) => {
  const order = await Order.findById(orderId);
  if (!order || !order.chat) throw new Error("Order or Chat not found");

  const chat = await Chat.findById(order.chat);
  if (!chat) throw new Error("Chat not found");

  await Chat.updateOne(
    { _id: order.chat },
    { $pull: { messages: { _id: messageId } } }
  );

  return true;
};

export const getSystemConfig = async () => {
  let config = await SystemConfig.findOne();
  if (!config) {
    // Create default
    config = await SystemConfig.create({});
  }
  return config;
};

export const updateSystemConfig = async (data: {
  auctionExtensionWindow?: number;
  auctionExtensionTime?: number;
  autoBidDelay?: number;
  bidEmailThrottlingWindow?: number;
  bidEmailCooldown?: number;
}) => {
  let config = await SystemConfig.findOne();
  if (!config) {
    config = new SystemConfig();
  }

  if (data.auctionExtensionWindow !== undefined) {
    config.auctionExtensionWindow = data.auctionExtensionWindow;
  }
  if (data.auctionExtensionTime !== undefined) {
    config.auctionExtensionTime = data.auctionExtensionTime;
  }
  if (data.autoBidDelay !== undefined) {
    config.autoBidDelay = data.autoBidDelay;
  }
  if (data.bidEmailThrottlingWindow !== undefined) {
    config.bidEmailThrottlingWindow = data.bidEmailThrottlingWindow;
  }
  if (data.bidEmailCooldown !== undefined) {
    config.bidEmailCooldown = data.bidEmailCooldown;
  }

  await config.save();
  return config;
};

export const getProducts = async (options: {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  status: "active" | "ended";
  categories?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  const {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    status,
    categories,
    minPrice,
    maxPrice,
  } = options;

  const query: any = {};

  // Enhanced search: name, category, description (prioritized)
  if (search) {
    const searchRegex = new RegExp(search, "i");

    // Find categories matching the search term (including children and grandchildren)
    const matchingCategories = await Category.find({
      name: searchRegex,
    }).select("_id");

    let allCategoryIds = matchingCategories.map((c) => c._id);

    // If categories were found, include their children and grandchildren
    if (allCategoryIds.length > 0) {
      // Find children of matching categories
      const childCats = await Category.find({
        parent: { $in: allCategoryIds },
      }).select("_id");

      // Find grandchildren (children of children)
      const grandChildCats = await Category.find({
        parent: { $in: childCats.map((c) => c._id) },
      }).select("_id");

      allCategoryIds = [
        ...allCategoryIds,
        ...childCats.map((c) => c._id),
        ...grandChildCats.map((c) => c._id),
      ];
    }

    query.$or = [
      { name: searchRegex }, // Priority 1: Product name
      { category: { $in: allCategoryIds } }, // Priority 2: Category (including children)
      { description: searchRegex }, // Priority 3: Description
    ];
  }

  // Status filter
  if (status === "active") {
    query.endTime = { $gt: new Date() };
  } else if (status === "ended") {
    query.endTime = { $lte: new Date() };
  }

  // Category filter - includes child categories
  if (categories) {
    const categoryIds = categories
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (categoryIds.length > 0) {
      // Find ALL children/grandchildren for these categories
      const catObjectIds = categoryIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      // Find children of selected categories
      const childCats = await Category.find({
        parent: { $in: catObjectIds },
      }).select("_id");

      // Find grandchildren (children of children)
      const grandChildCats = await Category.find({
        parent: { $in: childCats.map((c) => c._id) },
      }).select("_id");

      const allCategoryIds = [
        ...catObjectIds,
        ...childCats.map((c) => c._id),
        ...grandChildCats.map((c) => c._id),
      ];

      query.category = { $in: allCategoryIds };
    }
  }

  // Price filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.currentPrice = {};
    if (minPrice !== undefined) query.currentPrice.$gte = minPrice;
    if (maxPrice !== undefined) query.currentPrice.$lte = maxPrice;
  }

  const skip = (page - 1) * limit;

  // Build sort object
  const sortField: string = sortBy || "createdAt";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const sortObject: any = { [sortField]: sortDirection };

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("seller", "name email reputationScore")
      .populate("category", "name")
      .populate("currentBidder", "name reputationScore")
      .sort(sortObject)
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
};

export const getSellers = async () => {
  const sellers = await User.find({ role: "seller" })
    .select("_id name email")
    .lean();

  return sellers;
};

export const createProduct = async (productData: any) => {
  const { sellerId, ...data } = productData;

  // Verify seller exists
  const seller = await User.findById(sellerId);
  if (!seller || seller.role !== "seller") {
    throw new Error("Invalid seller ID");
  }

  const product = new Product({
    ...data,
    seller: sellerId,
    currentPrice: data.startingPrice,
    bidCount: 0,
  });

  await product.save();
  return product;
};

export const getProductDetails = async (productId: string) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }

  const product = await Product.findById(productId)
    .populate("seller", "name email reputationScore")
    .populate("category", "name parentCategoryId")
    .populate("currentBidder", "name reputationScore")
    .populate({
      path: "questions",
      populate: [
        { path: "questioner", select: "name email reputationScore" },
        { path: "answerer", select: "name email" },
      ],
    });

  if (!product) {
    throw new Error("Product not found");
  }

  // Get bid history
  const bids = await Bid.find({ product: productId })
    .populate("bidder", "name reputationScore")
    .sort({ createdAt: -1 })
    .limit(50);

  // Check if product has ended
  const now = new Date();
  const isEnded = new Date(product.endTime).getTime() <= now.getTime();

  // Get order info if exists
  let order = null;
  if (isEnded && product.currentBidder) {
    order = await Order.findOne({ product: productId }).populate(
      "buyer",
      "name email reputationScore"
    );
  }

  return {
    product,
    bidHistory: bids,
    isEnded,
    order,
  };
};

export const updateProduct = async (
  productId: string,
  updateData: {
    name?: string;
    category?: string;
    mainImage?: string;
    subImages?: string[];
    description?: string;
    endTime?: string;
    startingPrice?: number;
    stepPrice?: number;
    buyNowPrice?: number;
    autoExtends?: boolean;
    allowUnratedBidders?: boolean;
  }
) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  // Check if auction has started
  const now = new Date();
  const hasStarted = new Date(product.startTime).getTime() <= now.getTime();

  // Validate updates based on auction state
  if (hasStarted && product.bidCount > 0) {
    // If auction has bids, only allow certain updates
    const allowedUpdates = [
      "description",
      "endTime",
      "autoExtends",
      "allowUnratedBidders",
    ];
    const attemptedUpdates = Object.keys(updateData);
    const invalidUpdates = attemptedUpdates.filter(
      (key) => !allowedUpdates.includes(key)
    );

    if (invalidUpdates.length > 0) {
      throw new Error(
        `Cannot update ${invalidUpdates.join(", ")} after auction has bids`
      );
    }
  }

  // Validate price changes
  if (updateData.startingPrice && product.bidCount > 0) {
    if (updateData.startingPrice > product.currentPrice) {
      throw new Error("Starting price cannot be higher than current price");
    }
  }

  if (updateData.buyNowPrice && product.currentPrice) {
    if (updateData.buyNowPrice <= product.currentPrice) {
      throw new Error("Buy now price must be higher than current price");
    }
  }

  // Validate endTime extension
  if (updateData.endTime) {
    const newEndTime = new Date(updateData.endTime);
    const currentEndTime = new Date(product.endTime);

    if (newEndTime <= currentEndTime) {
      throw new Error("New end time must be later than current end time");
    }

    // Reset isEndedEmailSent if extending
    product.isEndedEmailSent = false;
  }

  // Update description history if description changed
  if (
    updateData.description &&
    updateData.description !== product.description
  ) {
    product.descriptionHistory.push({
      content: product.description,
      updatedAt: new Date(),
    } as any);
  }

  // Apply updates
  Object.assign(product, updateData);

  await product.save();

  return product.populate([
    { path: "seller", select: "name email rating" },
    { path: "category", select: "name" },
    { path: "currentBidder", select: "name rating" },
  ]);
};

export const extendProductEndTime = async (
  productId: string,
  newEndTime: string
) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  const newEndTimeDate = new Date(newEndTime);
  const currentEndTime = new Date(product.endTime);

  if (newEndTimeDate <= currentEndTime) {
    throw new Error("New end time must be later than current end time");
  }

  if (newEndTimeDate <= new Date()) {
    throw new Error("New end time must be in the future");
  }

  product.endTime = newEndTimeDate;
  product.isEndedEmailSent = false;

  await product.save();

  return product.populate([
    { path: "seller", select: "name email rating" },
    { path: "category", select: "name" },
    { path: "currentBidder", select: "name rating" },
  ]);
};

export const deleteProduct = async (productId: string) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  try {
    // 1. Delete all bids for this product
    await Bid.deleteMany({ product: productId });

    // 2. Delete all auto-bids for this product
    await AutoBid.deleteMany({ product: productId });

    // 3. Remove from all watchlists
    const Watchlist = (await import("../models/watchlist.model")).Watchlist;
    await Watchlist.deleteMany({ product: productId });

    // 4. Cancel any associated order
    const Order = (await import("../models/order.model")).Order;
    const order = await Order.findOne({ product: productId });
    if (order && order.status !== "CANCELLED" && order.status !== "COMPLETED") {
      order.status = "CANCELLED" as any;
      await order.save();
    }

    // 5. Delete the product itself
    await Product.findByIdAndDelete(productId);

    return { message: "Product and all associated data deleted successfully" };
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("Failed to delete product. Please try again.");
  }
};

export const deleteProductQuestion = async (
  productId: string,
  questionId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    throw new Error("Invalid question ID");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  const questionIndex = product.questions.findIndex(
    (q) => q._id?.toString() === questionId
  );

  if (questionIndex === -1) {
    throw new Error("Question not found");
  }

  // Remove the question
  product.questions.splice(questionIndex, 1);
  await product.save();

  return { message: "Question deleted successfully" };
};

/**
 * Get all upgrade requests with pagination
 */
export const getAllUpgradeRequests = async (params: {
  page?: number;
  limit?: number;
  status?: "pending" | "approved" | "rejected";
  search?: string;
  sortBy?: "newest" | "oldest";
}) => {
  const { page = 1, limit = 10, status, search, sortBy = "newest" } = params;
  const skip = (page - 1) * limit;

  // If search is provided, use priority-based search logic
  if (search && search.trim()) {
    const searchTerm = search.trim();
    const searchRegex = new RegExp(searchTerm, "i");

    // Find all matching requests with different priorities (exclude expired)
    const filter: any = status ? { status } : { status: { $ne: "expired" } };

    // Get all requests that match the search
    const allRequests = await UpgradeRequest.find(filter)
      .populate("user", "name email avatar role contactEmail")
      .populate("reviewedBy", "name email");

    // Prioritize results: Title (priority 1), Username (priority 2), Reasons (priority 3)
    const prioritizedResults = allRequests
      .map((request) => {
        const requestObj = request.toObject();
        let priority = 4; // Default lowest priority

        // Priority 1: Title match
        if (requestObj.title && searchRegex.test(requestObj.title)) {
          priority = 1;
        }
        // Priority 2: Username match
        else if (
          requestObj.user &&
          searchRegex.test((requestObj.user as any).name)
        ) {
          priority = 2;
        }
        // Priority 3: Reasons match
        else if (requestObj.reasons && searchRegex.test(requestObj.reasons)) {
          priority = 3;
        }

        return { request, priority };
      })
      .filter((item) => item.priority < 4) // Only include matches
      .sort((a, b) => {
        // Sort by priority first
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // Then by creation time
        const timeA = new Date(a.request.createdAt).getTime();
        const timeB = new Date(b.request.createdAt).getTime();
        return sortBy === "newest" ? timeB - timeA : timeA - timeB;
      });

    const total = prioritizedResults.length;
    const paginatedResults = prioritizedResults.slice(skip, skip + limit);

    // Enrich with rating and rejected count
    const enrichedRequests = await Promise.all(
      paginatedResults.map(async ({ request }) => {
        const requestObj = request.toObject();

        if (requestObj.user && requestObj.user._id) {
          const [positiveRatings, negativeRatings] = await Promise.all([
            Rating.countDocuments({ receiver: requestObj.user._id, score: 1 }),
            Rating.countDocuments({ receiver: requestObj.user._id, score: -1 }),
          ]);

          const rejectedCount = await UpgradeRequest.countDocuments({
            user: requestObj.user._id,
            status: "rejected",
            _id: { $ne: request._id },
          });

          (requestObj.user as any).rating = {
            positive: positiveRatings,
            negative: negativeRatings,
          };

          (requestObj.user as any).rejectedRequestsCount = rejectedCount;
        }

        return requestObj;
      })
    );

    return {
      requests: enrichedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // No search - regular filtering with optional status and sort
  const filter: any = {};

  // Status filter
  if (status) {
    filter.status = status;
  } else {
    // Default mode: exclude expired
    filter.status = { $ne: "expired" };
  }

  // Default mode (no status filter) - pending first, then others
  let requests;
  if (!status) {
    // Get pending requests first, then other statuses (exclude expired)
    const sortOrder = sortBy === "newest" ? -1 : 1;

    const [pendingRequests, otherRequests] = await Promise.all([
      UpgradeRequest.find({ status: "pending" })
        .populate("user", "name email avatar role contactEmail")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: sortOrder }),
      UpgradeRequest.find({ status: { $nin: ["pending", "expired"] } })
        .populate("user", "name email avatar role contactEmail")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: sortOrder }),
    ]);

    // Combine: pending first, then others
    const allRequests = [...pendingRequests, ...otherRequests];
    const total = allRequests.length;
    requests = allRequests.slice(skip, skip + limit);

    // Enrich each request
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const requestObj = request.toObject();

        if (requestObj.user && requestObj.user._id) {
          const [positiveRatings, negativeRatings] = await Promise.all([
            Rating.countDocuments({ receiver: requestObj.user._id, score: 1 }),
            Rating.countDocuments({ receiver: requestObj.user._id, score: -1 }),
          ]);

          const rejectedCount = await UpgradeRequest.countDocuments({
            user: requestObj.user._id,
            status: "rejected",
            _id: { $ne: request._id },
          });

          (requestObj.user as any).rating = {
            positive: positiveRatings,
            negative: negativeRatings,
          };

          (requestObj.user as any).rejectedRequestsCount = rejectedCount;
        }

        return requestObj;
      })
    );

    return {
      requests: enrichedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Regular status filter with sort
  const sortOrder = sortBy === "newest" ? -1 : 1;

  const [requestsData, total] = await Promise.all([
    UpgradeRequest.find(filter)
      .populate("user", "name email avatar role contactEmail")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit),
    UpgradeRequest.countDocuments(filter),
  ]);

  // Enrich each request with rating and rejected requests count
  const enrichedRequests = await Promise.all(
    requestsData.map(async (request) => {
      const requestObj = request.toObject();

      if (requestObj.user && requestObj.user._id) {
        // Get user rating
        const [positiveRatings, negativeRatings] = await Promise.all([
          Rating.countDocuments({ receiver: requestObj.user._id, score: 1 }),
          Rating.countDocuments({ receiver: requestObj.user._id, score: -1 }),
        ]);

        // Get rejected requests count
        const rejectedCount = await UpgradeRequest.countDocuments({
          user: requestObj.user._id,
          status: "rejected",
          _id: { $ne: request._id }, // Exclude current request
        });

        // Cast to any to add custom properties
        (requestObj.user as any).rating = {
          positive: positiveRatings,
          negative: negativeRatings,
        };

        (requestObj.user as any).rejectedRequestsCount = rejectedCount;
      }

      return requestObj;
    })
  );

  return {
    requests: enrichedRequests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Approve upgrade request - create new seller account
 */
export const approveUpgradeRequest = async (
  requestId: string,
  adminId: string
) => {
  const request = await UpgradeRequest.findById(requestId).populate("user");
  if (!request) {
    throw new Error("Upgrade request not found");
  }

  if (request.status !== "pending") {
    throw new Error("Request is not pending");
  }

  const bidderUser = await User.findById(request.user).select("+password");
  if (!bidderUser) {
    throw new Error("Bidder user not found");
  }

  if (bidderUser.role !== "bidder") {
    throw new Error("User is not a bidder");
  }

  // Create new seller account
  const sellerEmail = bidderUser.email.includes("@")
    ? bidderUser.email.replace("@", "+seller@")
    : `${bidderUser.email}+seller@gmail.com`;

  const sellerUsername = `Seller-${bidderUser.name}`;

  // Create seller account - directly insert to avoid password re-hashing
  const sellerUserDoc = {
    name: sellerUsername,
    email: sellerEmail,
    password: bidderUser.password, // Already hashed
    address: bidderUser.address,
    role: "seller",
    avatar: bidderUser.avatar,
    dateOfBirth: bidderUser.dateOfBirth,
    contactEmail: bidderUser.contactEmail,
    status: bidderUser.status,
    isUpgradedAccount: true,
    positiveRatings: 0,
    negativeRatings: 0,
    reputationScore: 0,
    isDeleted: false,
  };

  // Use insertMany to bypass pre-save hooks
  const insertResult = await User.collection.insertMany([sellerUserDoc]);
  const sellerId = insertResult.insertedIds[0];

  if (!sellerId) {
    throw new Error("Failed to create seller account");
  }

  // Link the two accounts
  bidderUser.isUpgradedAccount = true;
  bidderUser.linkedAccountId = sellerId;
  await bidderUser.save();

  // Update seller with linkedAccountId
  await User.collection.updateOne(
    { _id: sellerId },
    { $set: { linkedAccountId: bidderUser._id } }
  );

  // Update request status
  request.status = "approved";
  request.reviewedBy = new mongoose.Types.ObjectId(adminId);
  await request.save();

  // Fetch the created seller for response
  const createdSellerUser = await User.findById(sellerId);

  return {
    request,
    bidderAccount: bidderUser,
    sellerAccount: createdSellerUser,
  };
};

/**
 * Reject upgrade request
 */
export const rejectUpgradeRequest = async (
  requestId: string,
  adminId: string,
  reason: string
) => {
  const request = await UpgradeRequest.findById(requestId);
  if (!request) {
    throw new Error("Upgrade request not found");
  }

  if (request.status !== "pending") {
    throw new Error("Request is not pending");
  }

  request.status = "rejected";
  request.reviewedBy = new mongoose.Types.ObjectId(adminId);
  request.rejectionReason = reason;
  request.rejectedAt = new Date();
  await request.save();

  return request;
};

// ==========================================
// BANNED USERS & UNBAN REQUEST MANAGEMENT
// ==========================================

/**
 * Get all banned users with pagination
 */
export const getBannedUsers = async (params: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const { page = 1, limit = 10, search } = params;
  const skip = (page - 1) * limit;

  const query: any = { status: "BLOCKED" };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select("name email avatar role status blockReason blockedAt createdAt")
      .sort({ blockedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  // Get unban request status for each user
  const userIds = users.map((u) => u._id);
  const unbanRequests = await UnbanRequest.find({
    user: { $in: userIds },
    status: "PENDING",
  }).select("user");

  const pendingRequestUserIds = new Set(
    unbanRequests.map((r) => r.user.toString())
  );

  const usersWithRequestStatus = users.map((user) => ({
    ...user,
    hasUnbanRequest: pendingRequestUserIds.has(user._id.toString()),
  }));

  return {
    users: usersWithRequestStatus,
    total,
    totalPages: Math.ceil(total / limit),
    page,
    limit,
  };
};

/**
 * Get unban request for a specific user
 */
export const getUnbanRequestByUser = async (userId: string) => {
  const request = await UnbanRequest.findOne({ user: userId })
    .populate("processedBy", "name email")
    .sort({ createdAt: -1 });

  return request;
};

/**
 * Approve unban request - unblock the user
 */
export const approveUnbanRequest = async (
  requestId: string,
  adminId: string
) => {
  const request = await UnbanRequest.findById(requestId);
  if (!request) {
    throw new Error("Unban request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  // Update request status
  request.status = "APPROVED";
  request.processedBy = new mongoose.Types.ObjectId(adminId);
  request.processedAt = new Date();
  await request.save();

  // Unblock the user
  await User.updateOne(
    { _id: request.user },
    {
      $set: { status: "ACTIVE" },
      $unset: { blockReason: 1, blockedAt: 1 },
    }
  );

  return request;
};

/**
 * Force delete user - bypasses all safeguards
 * Used when admin denies unban request
 * - Reassigns winner for products where user is leading/winner
 * - Deletes non-completed orders
 * - Deletes all user data
 */
export const forceDeleteUser = async (userId: string) => {
  const now = new Date();

  // 1. Delete AutoBid
  await AutoBid.deleteMany({ user: userId });

  // 2. Reassign winner for products where user is currentBidder
  // Find all products where this user is the current highest bidder
  const productsAsLeader = await Product.find({
    currentBidder: userId,
  });

  for (const product of productsAsLeader) {
    // Find the second highest bid (excluding this user's bids)
    const secondHighestBid = await Bid.findOne({
      product: product._id,
      bidder: { $ne: userId },
    })
      .sort({ price: -1 })
      .populate("bidder", "_id name");

    if (secondHighestBid && secondHighestBid.bidder) {
      // Reassign to second highest bidder
      product.currentBidder = (secondHighestBid.bidder as any)._id;
      product.currentPrice = secondHighestBid.price;
    } else {
      // No other bidders, reset to starting price
      (product as any).currentBidder = null;
      product.currentPrice = product.startingPrice;
    }

    // Recalculate bid count (excluding deleted user's bids)
    const remainingBidCount = await Bid.countDocuments({
      product: product._id,
      bidder: { $ne: userId },
    });
    product.bidCount = remainingBidCount;

    await product.save();
  }

  // 3. Delete non-completed orders (keep COMPLETED for history)
  await Order.deleteMany({
    $or: [{ buyer: userId }, { seller: userId }],
    status: { $nin: ["COMPLETED"] },
  });

  // 4. Delete bids placed by this user
  await Bid.deleteMany({ bidder: userId });

  // 5. If user is a seller, handle their products
  const user = await User.findById(userId);
  if (user?.role === "seller") {
    const sellerProducts = await Product.find({ seller: userId }).select("_id");
    const sellerProductIds = sellerProducts.map((p) => p._id);

    if (sellerProductIds.length > 0) {
      await Promise.all([
        Bid.deleteMany({ product: { $in: sellerProductIds } }),
        AutoBid.deleteMany({ product: { $in: sellerProductIds } }),
        Watchlist.deleteMany({ product: { $in: sellerProductIds } }),
        Product.deleteMany({ seller: userId }),
      ]);
    }
  }

  // 6. Delete user's other data
  await Promise.all([
    Watchlist.deleteMany({ user: userId }),
    UpgradeRequest.deleteMany({ user: userId }),
    UnbanRequest.deleteMany({ user: userId }),
    Rating.deleteMany({ rater: userId }),
    Chat.deleteMany({ $or: [{ buyer: userId }, { seller: userId }] }),
  ]);

  // 7. Add email to blacklist before deleting user
  if (user) {
    await BlacklistedEmail.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      {
        email: user.email.toLowerCase(),
        googleId: user.googleId || undefined,
        reason: user.blockReason || "Force deleted by admin",
        deletedAt: new Date(),
      },
      { upsert: true }
    );
  }

  // 8. Delete user
  await User.findByIdAndDelete(userId);

  return { message: "User force deleted successfully", userId };
};

/**
 * Deny unban request - force delete user account
 */
export const denyUnbanRequest = async (
  requestId: string,
  adminId: string,
  adminNote?: string
) => {
  const request = await UnbanRequest.findById(requestId).populate("user");
  if (!request) {
    throw new Error("Unban request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  const userId = (request.user as any)._id.toString();

  // Update request status first
  request.status = "DENIED";
  request.processedBy = new mongoose.Types.ObjectId(adminId);
  request.processedAt = new Date();
  if (adminNote) {
    request.adminNote = adminNote;
  }
  await request.save();

  // Force delete the user account
  await forceDeleteUser(userId);

  return request;
};

export const deleteOrder = async (orderId: string) => {
  // 1. Find the order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  // 2. Allow deletion only if COMPLETED or CANCELLED
  if (order.status !== "COMPLETED" && order.status !== "CANCELLED") {
    throw new Error(
      "Only COMPLETED or CANCELLED orders can be deleted. Please cancel the order first."
    );
  }

  // 3. Delete associated chat
  // Chat references order in `order` field
  await Chat.deleteOne({ order: orderId });

  // 4. Reset Product flags
  // So that the product can potentially be re-auctioned or just to keep data clean
  if (order.product) {
    await Product.findByIdAndUpdate(order.product, {
      transactionCompleted: false,
      winnerConfirmed: false,
    });
  }

  // 5. Delete the order
  await Order.findByIdAndDelete(orderId);
};

export const updateProfile = async (userId: string, data: UpdateProfileDto) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        name: data.name,
        contactEmail: data.contactEmail,
        updateAt: new Date(),
        address: data.address,
        dateOfBirth: data.dateOfBirth,
        avatar: data.avatar,
      },
    },
    { new: true, runValidators: true }
  ).select("-password -providerId -otp -otpExpires");

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

export const changePassword = async (
  userId: string,
  data: ChangePasswordDto
) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new Error("User not found");

  if ((user as any).provider === "google" || (user as any).providerId) {
    throw new Error("Cannot change password for Google account");
  }

  // Verify old password
  const isMatch = await bcrypt.compare(data.currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Incorrect current password");
  }

  user.password = data.newPassword;
  await user.save();

  return true;
};
