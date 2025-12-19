import { User } from "../models/user.model";
import { Product } from "../models/product.model";
import { Order } from "../models/order.model";
import { Bid } from "../models/bid.model";
import { AutoBid } from "../models/autoBid.model";
import { Rating } from "../models/rating.model";
import mongoose from "mongoose";

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

export const getAllUsers = async ({
  page = 1,
  limit = 10,
  search = "",
  role,
  status,
}: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}) => {
  const query: any = {
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  }; // Default: filter out soft-deleted users (handle legacy docs)

  // Search by name or email
  if (search) {
    query.$and = [
      {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      },
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

  const [users, totalDocs] = await Promise.all([
    User.find(query)
      .select("-password") // Exclude sensitive data
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }), // Newest first
    User.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalDocs / limit);

  return {
    users, // reputationScore is a virtual, so it's included if toJSON: { virtuals: true } is set in schema
    totalDocs,
    totalPages,
    currentPage: page,
  };
};

export const toggleUserStatus = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Toggle Logic
  user.status = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
  await user.save();

  return user.status;
};

export const softDeleteUser = async (userId: string, reason: string) => {
  if (!reason) {
    throw new Error("Delete reason is mandatory");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.isDeleted) {
    throw new Error("User is already deleted");
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.deleteReason = reason;

  await user.save();

  return { message: "User soft deleted successfully", userId };
};

export const getUserDetail = async (userId: string) => {
  const user = await User.findById(userId).select("-password -googleId"); // Exclude secrets using standard select
  if (!user) {
    throw new Error("User not found");
  }

  // Parallel Fetching
  const [bids, ratings, products, ratingStats] = await Promise.all([
    // 1. Bid History (Last 10)
    Bid.find({ bidder: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate(
        "product",
        "name endTime currentPrice winnerConfirmed currentBidder"
      ) // Populate minimal fields
      .lean(),

    // 2. Ratings Received (Last 5)
    Rating.find({ ratee: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("rater", "name avatar")
      .lean(),

    // 3. Selling Info (If Seller) - Active products
    user.role === "seller"
      ? Product.find({ seller: userId, endTime: { $gt: new Date() } })
          .select("name currentPrice mainImage endTime bidCount")
          .limit(10)
          .lean()
      : Promise.resolve([]),

    // 4. Rating Stats (To calculate percentage if needed beyond user model)
    // We can rely on user model fields (positiveRatings, negativeRatings) but finding recent ones helps
    Rating.aggregate([
      { $match: { ratee: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Process Bids to determine status
  const bidHistory = bids.map((bid: any) => {
    const product = bid.product;
    let status = "Ongoing";

    if (product) {
      const now = new Date();
      const isEnded = new Date(product.endTime) < now;

      if (isEnded) {
        // Winning logic: Product ended, and this bid matched currentPrice (simplified) OR user is currentBidder
        // Note: Optimally we check if bid._id matches product.winningBid but lacking that ref,
        // we check if user is currentBidder AND this bid price == currentPrice.
        const isWinner =
          product.currentBidder?.toString() === userId &&
          bid.price === product.currentPrice;
        status = isWinner ? "Won" : "Lost";
      } else {
        // If ongoing, check if outbid
        if (bid.price < product.currentPrice) {
          status = "Outbid";
        } else {
          status = "Leading";
        }
      }
    } else {
      status = "Unknown (Product Deleted)";
    }

    return {
      _id: bid._id,
      productName: product?.name || "Unknown Product",
      amount: bid.price,
      date: bid.createdAt,
      status,
    };
  });

  return {
    profile: {
      ...user.toObject(),
      // Manual calculation or usage of virtuals if toObject doesn't catch it perfectly
      reputationParam: {
        positive: user.positiveRatings || 0,
        negative: user.negativeRatings || 0,
        score: user.reputationScore,
      },
    },
    bidHistory,
    ratings,
    sellingHistory: products,
    stats: ratingStats[0] || { avgScore: 0, count: 0 },
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
