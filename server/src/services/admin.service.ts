import { User } from "../models/user.model";
import { Product } from "../models/product.model";
import { Order } from "../models/order.model";
import { Bid } from "../models/bid.model";
import { AutoBid } from "../models/autoBid.model";
import { Rating } from "../models/rating.model";
import { Chat } from "../models/chat.model";
import { SystemConfig } from "../models/systemConfig.model";
import { Watchlist } from "../models/watchlist.model";
import { UpgradeRequest } from "../models/upgradeRequest.model";
import mongoose from "mongoose";
import * as bcrypt from "bcrypt";

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
  await user.save();

  return { status: user.status, blockReason: user.blockReason };
};

export const unblockUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.status === "ACTIVE") {
    throw new Error("User is already active");
  }

  user.status = "ACTIVE";
  user.blockReason = undefined;
  await user.save();

  return { status: user.status };
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

  // Delete user's own related data (common for both bidder and seller)
  await Promise.all([
    // User's watchlist
    Watchlist.deleteMany({ user: userId }),
    // User's auto bids
    AutoBid.deleteMany({ user: userId }),
    // User's upgrade requests
    UpgradeRequest.deleteMany({ user: userId }),
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
    { $unwind: "$productInfo" },
    {
      $lookup: {
        from: "users",
        localField: "seller",
        foreignField: "_id",
        as: "sellerInfo",
      },
    },
    { $unwind: "$sellerInfo" },
    {
      $lookup: {
        from: "users",
        localField: "buyer",
        foreignField: "_id",
        as: "buyerInfo",
      },
    },
    { $unwind: "$buyerInfo" },
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
  content: string,
  adminId: string
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

  await config.save();
  return config;
};

// --- Upgrade Request Management ---

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

    // Find all matching requests with different priorities
    const filter: any = status ? { status } : {};

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
  }

  // Default mode (no status filter) - pending first, then others
  let requests;
  if (!status) {
    // Get pending requests first, then other statuses
    const sortOrder = sortBy === "newest" ? -1 : 1;

    const [pendingRequests, otherRequests] = await Promise.all([
      UpgradeRequest.find({ status: "pending" })
        .populate("user", "name email avatar role contactEmail")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: sortOrder }),
      UpgradeRequest.find({ status: { $ne: "pending" } })
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
