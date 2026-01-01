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
    sortOrder = "desc"
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

  // Delete user's own related data
  await Promise.all([
    Watchlist.deleteMany({ user: userId }),
    AutoBid.deleteMany({ user: userId }),
    UpgradeRequest.deleteMany({ user: userId }),
  ]);

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
