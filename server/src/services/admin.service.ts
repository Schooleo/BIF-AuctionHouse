import { User } from "../models/user.model";
import { Product } from "../models/product.model";
import { Order } from "../models/order.model";
import { Bid } from "../models/bid.model";
import { AutoBid } from "../models/autoBid.model";
import { Chat } from "../models/chat.model";
import { Category } from "../models/category.model";
import { SystemConfig } from "../models/systemConfig.model";
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
  const { page, limit, search, sortBy, sortOrder, status, categories, minPrice, maxPrice } = options;

  const query: any = {};

  // Enhanced search: name, category, description (prioritized)
  if (search) {
    const searchRegex = new RegExp(search, "i");
    
    // Find categories matching the search term (including children and grandchildren)
    const matchingCategories = await Category.find({
      name: searchRegex
    }).select("_id");
    
    let allCategoryIds = matchingCategories.map(c => c._id);
    
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
      .map(id => id.trim())
      .filter(id => mongoose.Types.ObjectId.isValid(id));

    if (categoryIds.length > 0) {
      // Find ALL children/grandchildren for these categories
      const catObjectIds = categoryIds.map((id) => new mongoose.Types.ObjectId(id));

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
      .populate("seller", "name email rating")
      .populate("category", "name")
      .populate("currentBidder", "name rating")
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .lean(),
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
    .populate("seller", "name email rating")
    .populate("category", "name parentCategoryId")
    .populate("currentBidder", "name rating")
    .populate({
      path: "questions",
      populate: [
        { path: "questioner", select: "name email rating" },
        { path: "answerer", select: "name email" },
      ],
    })
    .lean();

  if (!product) {
    throw new Error("Product not found");
  }

  // Get bid history
  const bids = await Bid.find({ product: productId })
    .populate("bidder", "name rating")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Check if product has ended
  const now = new Date();
  const isEnded = new Date(product.endTime).getTime() <= now.getTime();

  // Get order info if exists
  let order = null;
  if (isEnded && product.currentBidder) {
    order = await Order.findOne({ product: productId })
      .populate("buyer", "name email rating")
      .lean();
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
  if (updateData.description && updateData.description !== product.description) {
    product.descriptionHistory.push({
      content: product.description,
      updatedAt: new Date(),
    });
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