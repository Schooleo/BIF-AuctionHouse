import { Types } from "mongoose";
import { Product } from "../models/product.model";
import { Category } from "../models/category.model";
import { Bid } from "../models/bid.model";
import type { IProduct } from "../models/product.model";
import type {
  ProductDetails,
  UserSummary,
  BidHistoryEntry,
  QuestionAnswer,
  SearchParams,
  Category as ProductCategory,
} from "../types/product";

type RelatedProductDoc = IProduct & {
  _id: Types.ObjectId;
  seller: any;
  category: any;
};

const normalizeUser = (user: any): UserSummary => {
  // 1. Handle null/undefined
  if (!user) {
    return { _id: "", name: "Unknown User", rating: 0 };
  }

  // 2. Handle unpopulated ID
  if (user instanceof Types.ObjectId || typeof user === "string") {
    return { _id: user.toString(), name: "Unknown User", rating: 0 };
  }

  // 3. Resolve Name
  let name = "Unknown";
  if (user.name) name = user.name;
  else if (user.displayName) name = user.displayName;
  else if (user.username) name = user.username;
  else if (user.firstName)
    name = `${user.firstName} ${user.lastName || ""}`.trim();
  else if (user.email) name = user.email.split("@")[0];

  let calculatedRating = 0;

  if (typeof user.rating === "number") {
    calculatedRating = user.rating;
  } else {
    const pos = user.positiveRatings || 0;
    const neg = user.negativeRatings || 0;
    const total = pos + neg;

    if (total > 0) {
      calculatedRating = (pos / total) * 5;
    }
  }

  return {
    _id: user._id?.toString() ?? "",
    name: name,
    rating: calculatedRating,
  };
};

const normalizeCategory = (category: any): ProductCategory => {
  if (!category) {
    return { _id: "", name: "Unknown Category" };
  }

  if (category instanceof Types.ObjectId || typeof category === "string") {
    return { _id: category.toString(), name: "Unknown Category" };
  }

  return {
    _id: category._id?.toString() ?? "",
    name: category.name ?? "Unknown Category",
    parentCategoryId: category.parentCategoryId
      ? category.parentCategoryId.toString()
      : undefined,
  };
};

export const ProductService = {
  listHomeData: async function listHomeData() {
    const now = new Date();

    // Helper pipeline to lookup top bid and bidder info
    const topBidPipeline: any[] = [
      {
        $lookup: {
          from: "bids",
          let: { pid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$product", "$$pid"] } } },
            { $sort: { price: -1, createdAt: 1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "users",
                localField: "bidder",
                foreignField: "_id",
                as: "bidderInfo",
              },
            },
            {
              $unwind: {
                path: "$bidderInfo",
                preserveNullAndEmptyArrays: true,
              },
            },
            { $project: { price: 1, bidder: "$bidderInfo", createdAt: 1 } },
          ],
          as: "topBid",
        },
      },
      { $unwind: { path: "$topBid", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          highestBid: "$topBid.price",
          highestBidder: "$topBid.bidder",
        },
      },
      {
        $project: {
          name: 1,
          mainImage: 1,
          currentPrice: 1,
          buyNowPrice: 1,
          bidCount: 1,
          startTime: 1,
          endTime: 1,
          highestBid: 1,
          highestBidder: 1,
        },
      },
    ];

    // Ending Soon: top 5 products by endTime
    const endingSoon = await Product.aggregate([
      { $match: { endTime: { $gt: now } } },
      { $sort: { endTime: 1 } },
      { $limit: 5 },
      ...topBidPipeline,
    ]);

    // Most Bids: top 5 products by number of bids
    const mostBids = await Product.aggregate([
      {
        $lookup: {
          from: "bids",
          localField: "_id",
          foreignField: "product",
          as: "allBids",
        },
      },
      {
        $addFields: {
          bidCount: { $size: "$allBids" },
          isExpired: { $lte: ["$endTime", now] },
        },
      },
      { $sort: { isExpired: 1, bidCount: -1 } },
      { $limit: 5 },
      ...topBidPipeline,
    ]);

    // Highest Price: top 5 products by currentPrice
    const highestPrice = await Product.aggregate([
      { $addFields: { isExpired: { $lte: ["$endTime", now] } } },
      { $sort: { isExpired: 1, currentPrice: -1 } },
      { $limit: 5 },
      ...topBidPipeline,
    ]);

    return { endingSoon, mostBids, highestPrice };
  },

  /**
   * Search products with full-text search, filters, sorting, and pagination
   */
  searchProducts: async function searchProducts(params: SearchParams) {
    const {
      q = "",
      category = "",
      page = 1,
      limit = 12,
      sort = "default",
      newMinutes = 60,
      min_price,
      max_price,
    } = params;

    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const skip = (safePage - 1) * safeLimit;
    const now = new Date();

    const filter: any = {};
    if (category) {
      const categoryIds = category
        .split(",")
        .map((id) => id.trim())
        .filter((id) => Types.ObjectId.isValid(id));

      if (categoryIds.length > 0) {
        // Find ALL children/grandchildren for these categories
        const catObjectIds = categoryIds.map((id) => new Types.ObjectId(id));

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

        filter.category = { $in: allCategoryIds };
      }
    }

    if (
      (min_price !== undefined && !isNaN(min_price)) ||
      (max_price !== undefined && !isNaN(max_price))
    ) {
      filter.currentPrice = {};
      if (min_price !== undefined && !isNaN(min_price))
        filter.currentPrice.$gte = min_price;
      if (max_price !== undefined && !isNaN(max_price))
        filter.currentPrice.$lte = max_price;
    }

    console.log("Search params received:", { min_price, max_price });
    console.log("Constructed MongoDB Filter:", JSON.stringify(filter, null, 2));

    const pipeline: any[] = [];
    if (q.trim().length > 0) {
      pipeline.push({ $match: { $text: { $search: q }, ...filter } });
      pipeline.push({ $addFields: { score: { $meta: "textScore" } } });
    } else {
      pipeline.push({ $match: filter });
    }

    pipeline.push(
      {
        $lookup: {
          from: "bids",
          let: { pid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$product", "$$pid"] } } },
            { $sort: { price: -1, createdAt: 1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "users",
                localField: "bidder",
                foreignField: "_id",
                as: "bidderInfo",
              },
            },
            {
              $unwind: {
                path: "$bidderInfo",
                preserveNullAndEmptyArrays: true,
              },
            },
            { $project: { price: 1, bidder: "$bidderInfo", createdAt: 1 } },
          ],
          as: "topBid",
        },
      },
      {
        $addFields: {
          highestBid: { $arrayElemAt: ["$topBid.price", 0] },
          highestBidder: { $arrayElemAt: ["$topBid.bidder", 0] },
        },
      },
      {
        $lookup: {
          from: "bids",
          let: { pid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$product", "$$pid"] } } },
            { $count: "count" },
          ],
          as: "bidCounts",
        },
      },
      {
        $addFields: {
          bidCount: {
            $ifNull: [{ $arrayElemAt: ["$bidCounts.count", 0] }, "$bidCount"],
          },
        },
      }
    );

    pipeline.push({
      $addFields: {
        isNew: {
          $lt: [{ $subtract: [now, "$startTime"] }, newMinutes * 60 * 1000],
        },
        timeRemainingMs: {
          $ifNull: [{ $subtract: ["$endTime", now] }, 0],
        },
        // Active (false) before Expired (true)
        isExpired: { $lte: ["$endTime", now] },
      },
    });

    // 4. Sorting Stage
    // Primary Sort: Active items first
    const sortStage: any = { isExpired: 1 };

    if (q.trim().length > 0 && sort === "rating") {
      sortStage.score = -1;
    } else {
      switch (sort) {
        case "endingSoon":
          sortStage.timeRemainingMs = 1;
          break;
        case "mostBidOn":
          sortStage.bidCount = -1;
          break;
        case "highestPriced":
          sortStage.currentPrice = -1;
          break;
        case "default":
        default:
          sortStage.startTime = -1;
          break;
      }
    }

    if (!sortStage.startTime) {
      sortStage.startTime = -1;
    }

    pipeline.push({ $sort: sortStage });

    // 5. Pagination and Final Return
    pipeline.push({ $skip: skip }, { $limit: safeLimit });

    const results = await Product.aggregate(pipeline).allowDiskUse(true).exec();

    // Total count (remains the same)
    const countFilter =
      q.trim().length > 0 ? { $text: { $search: q }, ...filter } : filter;
    const total = await Product.countDocuments(countFilter);

    return {
      data: results,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems: total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  },

  /**
   * Get product detail with bid history, questions, and related products
   */
  getProductDetail: async function getProductDetail(
    productId: string,
    opts?: { bidHistoryPage?: number; bidHistoryLimit?: number }
  ): Promise<ProductDetails | null> {
    if (!Types.ObjectId.isValid(productId))
      throw new Error("Invalid product id");
    const pid = new Types.ObjectId(productId);

    // Common fields to populate for users (Includes 'name' for seed data)
    const userFields =
      "name username displayName positiveRatings negativeRatings rating email";

    // 1. Fetch product with seller, currentBidder, questions populated
    const productDoc = await Product.findById(pid)
      .populate("seller", userFields)
      .populate("currentBidder", userFields)
      .populate("category", "name parentCategoryId")
      .populate({
        path: "questions",
        populate: [
          { path: "questioner", select: userFields },
          { path: "answerer", select: userFields },
        ],
      })
      .lean<
        IProduct & {
          _id: Types.ObjectId;
          seller: any;
          currentBidder?: any;
          questions: any[];
        }
      >();

    if (!productDoc) return null;

    // 2. Normalize seller & currentBidder
    const seller = normalizeUser(productDoc.seller);
    const category = normalizeCategory(productDoc.category);

    const currentBidder = productDoc.currentBidder
      ? normalizeUser(productDoc.currentBidder)
      : null;

    const rejectedBidderIds = Array.isArray(productDoc.rejectedBidders)
      ? productDoc.rejectedBidders.map((id: any) => id.toString())
      : [];

    // 3. Fetch top bid
    const topBidDoc = await Bid.findOne({
      product: pid,
      $or: [{ rejected: { $exists: false } }, { rejected: false }],
    })
      .sort({ price: -1, createdAt: 1 })
      .populate("bidder", userFields)
      .lean();

    const highestBid = topBidDoc
      ? {
          amount: topBidDoc.price,
          bidder: normalizeUser(topBidDoc.bidder),
          startTime: topBidDoc.createdAt.toISOString(),
        }
      : currentBidder
      ? {
          amount: productDoc.currentPrice,
          bidder: currentBidder,
          startTime: null,
        }
      : null;

    // 4. Bid count
    const bidCount = await Bid.countDocuments({ product: pid });

    // 5. Normalize bid history
    const bidHistoryPage = Math.max(1, opts?.bidHistoryPage ?? 1);
    const bidHistoryLimit = Math.min(
      200,
      Math.max(1, opts?.bidHistoryLimit ?? 20)
    );
    const bidHistorySkip = (bidHistoryPage - 1) * bidHistoryLimit;

    const bidHistoryDocs = await Bid.find({ product: pid })
      .sort({ createdAt: -1 })
      .skip(bidHistorySkip)
      .limit(bidHistoryLimit)
      .populate("bidder", userFields)
      .lean();

    const bidHistory: BidHistoryEntry[] = bidHistoryDocs.map((b) => ({
      _id: b._id.toString(),
      bidder: normalizeUser(b.bidder),
      price: b.price,
      createdAt: b.createdAt.toISOString(),
    }));

    // 6. Normalize questions
    const questions: QuestionAnswer[] = (productDoc.questions || []).map(
      (q) => ({
        _id: q._id.toString(),
        question: q.question,
        questioner: normalizeUser(q.questioner),
        askedAt: q.askedAt.toISOString(),
        answer: q.answer ?? "",
        answeredAt: q.answeredAt?.toISOString() ?? "",
        answerer: normalizeUser(q.answerer),
      })
    );

    // 7. Related products
    const relatedDocs = await Product.find({
      category: productDoc.category,
      _id: { $ne: pid },
    })
      .sort({ startTime: -1 })
      .limit(5)
      .populate("seller", userFields)
      .populate("category", "name")
      .select("-questions -bidders -descriptionHistory")
      .lean<RelatedProductDoc[]>();

    const related = relatedDocs.map((p: RelatedProductDoc) => ({
      // Explicitly map all fields to ensure 'Product' interface compliance
      _id: p._id.toString(),
      name: p.name,
      description: p.description,
      mainImage: p.mainImage,
      subImages: p.subImages,
      startingPrice: p.startingPrice,
      currentPrice: p.currentPrice,
      stepPrice: p.stepPrice,

      // Conditionally add buyNowPrice if it exists (Fixes exactOptionalPropertyTypes)
      ...(p.buyNowPrice !== undefined && { buyNowPrice: p.buyNowPrice }),

      // Safely handle category population
      category: p.category
        ? "name" in p.category
          ? { _id: p.category._id.toString(), name: p.category.name as string }
          : { _id: p.category.toString(), name: "Unknown" }
        : { _id: "", name: "Unknown" },

      seller: normalizeUser(p.seller),
      bidCount: p.bidCount ?? 0,

      startTime: p.startTime.toISOString(),
      endTime: p.endTime.toISOString(),

      // Set Mandatory complex fields to null/empty (since we didn't fetch them)
      highestBid: null,
      highestBidder: null,
    }));

    // 8. Time-related flags
    const now = Date.now();
    const timeRemainingMs = productDoc.endTime
      ? new Date(productDoc.endTime).getTime() - now
      : 0;
    const isEndingSoon = timeRemainingMs <= 3 * 24 * 60 * 60 * 1000;
    const isNew =
      now - new Date(productDoc.startTime).getTime() <= 60 * 60 * 1000;

    // 9. Return normalized ProductDetails
    return {
      product: {
        _id: productDoc._id.toString(),
        name: productDoc.name,
        description: productDoc.description,
        descriptionHistory: productDoc.descriptionHistory?.map((h) => ({
          content: h.content,
          updatedAt: h.updatedAt.toISOString(),
        })),
        mainImage: productDoc.mainImage,
        subImages: productDoc.subImages,
        startingPrice: productDoc.startingPrice,
        currentPrice: productDoc.currentPrice,
        stepPrice: productDoc.stepPrice,

        // Conditional Spread for optional scalar
        ...(productDoc.buyNowPrice !== undefined && {
          buyNowPrice: productDoc.buyNowPrice,
        }),

        autoExtends: productDoc.autoExtends,
        allowUnratedBidders: productDoc.allowUnratedBidders,

        category,
        seller: seller,
        bidCount: bidCount, // Use the real count from Step 4

        startTime: new Date(productDoc.startTime).toISOString(),
        endTime: new Date(productDoc.endTime).toISOString(),

        rejectedBidders: rejectedBidderIds,
        winnerConfirmed: Boolean(productDoc.winnerConfirmed),
        currentBidder,

        highestBid: highestBid,
        highestBidder: highestBid?.bidder ?? null,
        questions: questions,

        // OMIT optional arrays (bidders) to satisfy exactOptionalPropertyTypes
      },
      highestBid: highestBid,
      bidCount,
      bidHistory,
      questions,
      related: related,
      timeRemainingMs,
      isEndingSoon,
      isNew,
    };
  },
};
