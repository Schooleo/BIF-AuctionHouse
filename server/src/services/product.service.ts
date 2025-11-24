// server/src/services/product.service.ts
import { Types } from "mongoose";
import { Product } from "../models/product.model";
import { Bid } from "../models/bid.model";
import type { SearchParams } from "../types/product";

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
      { $addFields: { bidCount: { $size: "$allBids" } } },
      { $sort: { bidCount: -1 } },
      { $limit: 5 },
      ...topBidPipeline,
    ]);

    // Highest Price: top 5 products by currentPrice
    const highestPrice = await Product.aggregate([
      { $sort: { currentPrice: -1 } },
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
      sort = "relevance",
      newMinutes = 60,
    } = params;

    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const skip = (safePage - 1) * safeLimit;

    // Filter
    const filter: any = {};
    if (category) {
      if (Types.ObjectId.isValid(category)) {
        filter.category = new Types.ObjectId(category);
      } else {
        filter.category = category;
      }
    }

    // Aggregation pipeline
    const pipeline: any[] = [];

    if (q.trim().length > 0) {
      pipeline.push({ $match: { $text: { $search: q }, ...filter } });
      pipeline.push({ $addFields: { score: { $meta: "textScore" } } });
    } else {
      pipeline.push({ $match: filter });
    }

    // Lookup top bid and count
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
      { $unwind: { path: "$topBid", preserveNullAndEmptyArrays: true } },
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
          highestBid: "$topBid.price",
          highestBidder: "$topBid.bidder",
          bidCount: {
            $ifNull: [{ $arrayElemAt: ["$bidCounts.count", 0] }, "$bidCount"],
          },
        },
      },
      {
        $addFields: {
          isNew: {
            $lt: [
              { $subtract: [new Date(), "$startTime"] },
              newMinutes * 60 * 1000,
            ],
          },
          timeRemainingMs: { $subtract: ["$endTime", new Date()] },
        },
      }
    );

    // Sorting
    const sortStage: any = {};
    if (q && sort === "relevance") {
      sortStage.score = -1;
    } else {
      switch (sort) {
        case "endDesc":
          sortStage.endTime = -1;
          break;
        case "endAsc":
          sortStage.endTime = 1;
          break;
        case "priceAsc":
          sortStage.currentPrice = 1;
          break;
        case "priceDesc":
          sortStage.currentPrice = -1;
          break;
        case "createdDesc":
          sortStage.startTime = -1;
          break;
        default:
          sortStage.startTime = -1;
      }
    }
    pipeline.push({ $sort: sortStage });

    // Pagination
    pipeline.push({ $skip: skip }, { $limit: safeLimit });

    // Projection
    pipeline.push({
      $project: {
        name: 1,
        mainImage: 1,
        subImages: 1,
        category: 1,
        startingPrice: 1,
        currentPrice: 1,
        buyNowPrice: 1,
        seller: 1,
        startTime: 1,
        endTime: 1,
        bidCount: 1,
        highestBid: 1,
        highestBidder: 1,
        isNew: 1,
        timeRemainingMs: 1,
        score: 1,
      },
    });

    const results = await Product.aggregate(pipeline).allowDiskUse(true).exec();

    // Total count
    const countFilter =
      q.trim().length > 0 ? { $text: { $search: q }, ...filter } : filter;
    const total = await Product.countDocuments(countFilter);

    return { page: safePage, limit: safeLimit, total, results };
  },

  /**
   * Get product detail with bid history, questions, and related products
   */
  getProductDetail: async function getProductDetail(
    productId: string,
    opts?: { bidHistoryPage?: number; bidHistoryLimit?: number }
  ) {
    if (!Types.ObjectId.isValid(productId))
      throw new Error("Invalid product id");
    const pid = new Types.ObjectId(productId);

    const product = await Product.findById(pid)
      .populate("seller", "username displayName rating")
      .lean();
    if (!product) return null;

    const now = Date.now();
    const timeRemainingMs = product.endTime
      ? new Date(product.endTime).getTime() - now
      : null;
    const isEndingSoon =
      timeRemainingMs !== null && timeRemainingMs <= 3 * 24 * 60 * 60 * 1000;

    const topBid = await Bid.findOne({ product: pid })
      .sort({ price: -1, createdAt: 1 })
      .populate("bidder", "username displayName rating")
      .lean();

    let highestBid = null;
    let bidCount = product.bidCount ?? 0;

    if (topBid) {
      highestBid = {
        amount: topBid.price,
        bidder: topBid.bidder,
        startTime: topBid.createdAt,
      };
      bidCount = await Bid.countDocuments({ product: pid });
    } else if (product.currentPrice != null) {
      highestBid = {
        amount: product.currentPrice,
        bidder: product.currentBidder ?? null,
        startTime: null,
      };
    }

    // Bid history
    const bidHistoryPage = Math.max(1, opts?.bidHistoryPage ?? 1);
    const bidHistoryLimit = Math.min(
      200,
      Math.max(1, opts?.bidHistoryLimit ?? 20)
    );
    const bidHistorySkip = (bidHistoryPage - 1) * bidHistoryLimit;
    const bidHistory = await Bid.find({ product: pid })
      .sort({ createdAt: -1 })
      .skip(bidHistorySkip)
      .limit(bidHistoryLimit)
      .populate("bidder", "username displayName rating")
      .lean();

    // Questions
    const questions = (product.questions || []).map((q: any) => ({
      _id: q._id,
      question: q.question,
      questioner: q.questioner,
      askedAt: q.askedAt,
      answer: q.answer,
      answeredAt: q.answeredAt,
    }));

    // Related products
    const related = product.category
      ? await Product.find({ category: product.category, _id: { $ne: pid } })
          .sort({ startTime: -1 })
          .limit(5)
          .select("name mainImage currentPrice startTime endTime")
          .lean()
      : [];

    const isNew =
      new Date().getTime() - new Date(product.startTime).getTime() <=
      60 * 60 * 1000;

    return {
      product,
      highestBid,
      bidCount,
      bidHistory,
      questions,
      related,
      timeRemainingMs,
      isEndingSoon,
      isNew,
    };
  },
};
