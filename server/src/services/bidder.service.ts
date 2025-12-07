import { Watchlist } from "../models/watchlist.model";
import { Product } from "../models/product.model";
import { User, SystemConfig } from "../models/index.model";
import { Bid } from "../models/bid.model";
import { Rating } from "../models/rating.model";
import { UpgradeRequest } from "../models/upgradeRequest.model";
import {
  BidMessages,
  BidderMessages,
  WatchlistMessages,
  AuthMessages,
  ProductMessages,
} from "../constants/messages";
import {
  sendQuestionEmail,
  sendBidNotificationToSeller,
  sendBidConfirmationToBidder,
  sendOutbidNotificationToBidders,
} from "../utils/email.util";
import { checkInWatchlist } from "../controllers/bidder.controller";

export const bidderService = {
  async addToWatchlist(bidderId: string, productId: string) {
    // Kiểm tra xem product có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(WatchlistMessages.PRODUCT_NOT_FOUND);
    }

    try {
      const watchlistItem = await Watchlist.create({
        user: bidderId,
        product: productId,
      });
      return watchlistItem;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error(WatchlistMessages.ALREADY_EXISTS);
      }
      throw error;
    }
  },

  async removeFromWatchlist(bidderId: string, productId: string) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(WatchlistMessages.PRODUCT_NOT_FOUND);
    }

    const result = await Watchlist.findOneAndDelete({
      user: bidderId,
      product: productId,
    });

    if (!result) {
      throw new Error(WatchlistMessages.NOT_IN_WATCHLIST);
    }

    return { message: WatchlistMessages.REMOVE_SUCCESS };
  },

  async checkInWatchlist(bidderId: string, productId: string) {
    const exists = await Watchlist.exists({
      user: bidderId,
      product: productId,
    });
    return { inWatchlist: !!exists };
  },

  async getSuggestedPrice(bidderId: string, productId: string) {
    // Lấy thông tin sản phẩm
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(BidMessages.PRODUCT_NOT_FOUND);
    }

    const bidder = await User.findById(bidderId);
    if (!bidder) {
      throw new Error(AuthMessages.USER_NOT_FOUND);
    }

    // Kiểm tra reputation
    const totalRatings = bidder.positiveRatings + bidder.negativeRatings;

    if (totalRatings === 0) {
      // Bidder chưa được đánh giá
      if (!product.allowUnratedBidders) {
        throw new Error(BidMessages.UNRATED_NOT_ALLOWED);
      }
    } else {
      const reputation = bidder.positiveRatings / totalRatings;
      if (reputation < 0.8) {
        throw new Error(BidMessages.REPUTATION_TOO_LOW);
      }
    }

    // Tính giá đề xuất
    const suggestedPrice = product.currentPrice + product.stepPrice;

    return {
      suggestedPrice: suggestedPrice,
      currentPrice: product.currentPrice,
      stepPrice: product.stepPrice,
      minValidPrice: suggestedPrice,
    };
  },

  async placeBid(bidderId: string, productId: string, price: number) {
    const product = await Product.findById(productId).populate(
      "seller",
      "email name"
    );
    if (!product) {
      throw new Error(BidMessages.PRODUCT_NOT_FOUND);
    }

    const bidder = await User.findById(bidderId);
    if (!bidder) {
      throw new Error(AuthMessages.USER_NOT_FOUND);
    }

    if (
      product.rejectedBidders &&
      product.rejectedBidders.some((id: any) => id.toString() === bidderId)
    ) {
      throw new Error(BidMessages.BIDDER_REJECTED);
    }

    const totalRatings = bidder.positiveRatings + bidder.negativeRatings;
    if (totalRatings === 0) {
      if (!product.allowUnratedBidders) {
        throw new Error(BidMessages.UNRATED_NOT_ALLOWED);
      }
    } else {
      const reputation = bidder.positiveRatings / totalRatings;
      if (reputation < 0.8) {
        throw new Error(BidMessages.REPUTATION_TOO_LOW);
      }
    }

    const minValidPrice = product.currentPrice + product.stepPrice;
    if (price < minValidPrice) {
      throw new Error(BidMessages.BID_TOO_LOW);
    }

    const bid = await Bid.create({
      product: productId,
      bidder: bidderId,
      price: price,
    });

    product.currentPrice = price;
    product.currentBidder = bidderId as any;
    product.bidCount += 1;

    // --- AUTO EXTENSION LOGIC ---
    if (product.autoExtends) {
      const systemConfig = await SystemConfig.findOne();
      if (systemConfig) {
        const now = new Date();
        const endTime = new Date(product.endTime);
        const timeRemainingMinutes =
          (endTime.getTime() - now.getTime()) / 1000 / 60;

        if (timeRemainingMinutes <= systemConfig.auctionExtensionWindow) {
          // Thêm thời gian extension vào thời gian kết thúc
          const newEndTime = new Date(
            endTime.getTime() + systemConfig.auctionExtensionTime * 60 * 1000
          );
          product.endTime = newEndTime;
          console.log(
            `Auction ${product._id} extended by ${systemConfig.auctionExtensionTime} minutes. New end time: ${newEndTime}`
          );
        }
      }
    }
    // -----------------------------

    await product.save();

    try {
      // 1. Lấy danh sách bidders đã tham gia (loại trừ bidder hiện tại)
      const participatingBidderIds = await Bid.find({
        product: productId,
        bidder: { $ne: bidderId },
      }).distinct("bidder");

      const participatingBidders = await User.find({
        _id: { $in: participatingBidderIds },
      }).select("email name");

      // 2. Chuẩn bị dữ liệu email
      const seller = product.seller as any;
      const nextMinPrice = price + product.stepPrice;
      const maskedBidderName = maskBidderName(bidder.name);

      // 3. Gửi emails song song (không chờ, không block response)
      Promise.allSettled([
        // Email cho seller
        sendBidNotificationToSeller(
          seller.email,
          seller.name,
          product.name,
          productId,
          maskedBidderName,
          price,
          price // currentHighestPrice = price vừa bid
        ),

        // Email xác nhận cho bidder hiện tại
        sendBidConfirmationToBidder(
          bidder.email,
          bidder.name,
          product.name,
          productId,
          price,
          nextMinPrice,
          product.endTime
        ),

        // Email cho các bidder khác (nếu có)
        participatingBidders.length > 0
          ? sendOutbidNotificationToBidders(
              participatingBidders.map((b) => ({
                email: b.email,
                name: b.name,
              })),
              product.name,
              productId,
              price,
              nextMinPrice
            )
          : Promise.resolve(), // Không làm gì nếu không có bidder khác
      ]).catch((err) => {
        // Log error nhưng không throw (để không ảnh hưởng response)
        console.error("Error sending bid notification emails:", err);
      });
    } catch (emailError) {
      // Log lỗi nhưng không throw (email fail không nên fail toàn bộ bid)
      console.error("Failed to send bid notification emails:", emailError);
    }

    return {
      bid: bid,
      product: {
        currentPrice: product.currentPrice,
        currentBidder: {
          _id: bidder._id,
          name: bidder.name,
          rating:
            (bidder.positiveRatings /
              (bidder.positiveRatings + bidder.negativeRatings)) *
              5 || 0,
        },
        bidCount: product.bidCount,
      },
    };
  },

  async getBidHistory(productId: string, page: number = 1, limit: number = 20) {
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(BidMessages.PRODUCT_NOT_FOUND);
    }

    const skip = (page - 1) * limit;

    const bids = await Bid.find({ product: productId })
      .populate("bidder", "name") // Lấy tên bidder
      .sort({ createdAt: -1 }) // Mới nhất trước
      .skip(skip)
      .limit(limit);

    const totalBids = await Bid.countDocuments({ product: productId });

    const totalPages = Math.ceil(totalBids / limit);

    const bidHistory = bids.map((bid) => ({
      bidder: maskBidderName((bid.bidder as any).name),
      price: bid.price,
      time: bid.createdAt,
    }));

    return {
      bidHistory: bidHistory,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalBids: totalBids,
        limit: limit,
      },
    };
  },

  async getMyBids(
    bidderId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: "endTime" | "price" | "bidCount" = "endTime",
    sortOrder: "asc" | "desc" = "desc",
    status?: "active" | "awaiting" | "processing" | "all"
  ) {
    const now = new Date();

    // Lấy danh sách product IDs mà bidder đã bid
    const bids = await Bid.find({ bidder: bidderId }).distinct("product");

    const queries = {
      active: {
        _id: { $in: bids },
        endTime: { $gt: now },
      },
      awaiting: {
        _id: { $in: bids },
        currentBidder: bidderId,
        endTime: { $lt: now },
        winnerConfirmed: { $ne: true },
      },
      processing: {
        _id: { $in: bids },
        currentBidder: bidderId,
        winnerConfirmed: true,
        transactionCompleted: { $ne: true },
      },
    };

    const [activeTotal, awaitingTotal, processingTotal] = await Promise.all([
      Product.countDocuments(queries.active),
      Product.countDocuments(queries.awaiting),
      Product.countDocuments(queries.processing),
    ]);

    const populateFields = [
      { path: "seller", select: "name email" },
      { path: "category", select: "name" },
      { path: "currentBidder", select: "name email" },
    ];

    const enrichProduct = (product: any) => {
      const isCurrentBidder =
        product.currentBidder?._id?.toString() === bidderId;

      if (product.winnerConfirmed && !product.transactionCompleted) {
        return {
          ...product,
          isEnded: true,
          isWinning: true,
          bidStatus: "processing" as const,
          awaitingConfirmation: false,
          inProcessing: true,
        };
      } else if (
        product.endTime < now &&
        !product.winnerConfirmed &&
        isCurrentBidder
      ) {
        return {
          ...product,
          isEnded: true,
          isWinning: false,
          bidStatus: "awaiting" as const,
          awaitingConfirmation: true,
          inProcessing: false,
        };
      } else {
        return {
          ...product,
          isEnded: false,
          isWinning: isCurrentBidder,
          bidStatus: "active" as const,
          awaitingConfirmation: false,
          inProcessing: false,
        };
      }
    };

    let enrichedProducts: any[];
    let totalForFilter: number;

    if (sortBy === "endTime" && (!status || status === "all")) {
      let groupOrder: Array<"processing" | "awaiting" | "active">;

      if (sortOrder === "desc") {
        groupOrder = ["processing", "awaiting", "active"];
      } else {
        groupOrder = ["active", "awaiting", "processing"];
      }

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      interface FetchPlan {
        group: "active" | "awaiting" | "processing";
        skip: number;
        limit: number;
      }

      const totals: Record<string, number> = {
        processing: processingTotal,
        awaiting: awaitingTotal,
        active: activeTotal,
      };

      const fetchPlan: FetchPlan[] = [];
      let cumulativeTotal = 0;

      for (const group of groupOrder) {
        const groupTotal = totals[group] || 0;
        const groupStart = cumulativeTotal;
        const groupEnd = cumulativeTotal + groupTotal;

        if (startIndex < groupEnd && endIndex > groupStart) {
          const skip = Math.max(0, startIndex - groupStart);
          const alreadyFetched = fetchPlan.reduce((sum, p) => sum + p.limit, 0);
          const take = Math.min(
            limit - alreadyFetched,
            groupEnd - Math.max(startIndex, groupStart)
          );

          if (take > 0) {
            fetchPlan.push({ group, skip, limit: take });
          }
        }

        cumulativeTotal = groupEnd;
      }

      const getSortFieldForGroup = (group: string) => {
        if (group === "processing") {
          return { updatedAt: sortOrder === "asc" ? 1 : -1 };
        }
        return { endTime: sortOrder === "asc" ? 1 : -1 };
      };

      const results = await Promise.all(
        fetchPlan.map((plan) =>
          Product.find(queries[plan.group])
            .populate(populateFields)
            .sort(getSortFieldForGroup(plan.group))
            .skip(plan.skip)
            .limit(plan.limit)
            .lean()
        )
      );

      enrichedProducts = results.flatMap((products) =>
        products.map((p) => enrichProduct(p))
      );

      totalForFilter = activeTotal + awaitingTotal + processingTotal;
    } else {
      let queryFilter: any;
      let sortField: any = {};

      switch (sortBy) {
        case "price":
          sortField = { currentPrice: sortOrder === "asc" ? 1 : -1 };
          break;
        case "bidCount":
          sortField = { bidCount: sortOrder === "asc" ? 1 : -1 };
          break;
        case "endTime":
        default:
          sortField = { endTime: sortOrder === "asc" ? 1 : -1 };
          break;
      }

      if (!status || status === "all") {
        queryFilter = {
          _id: { $in: bids },
          $or: [
            { endTime: { $gt: now } },
            {
              currentBidder: bidderId,
              endTime: { $lt: now },
              winnerConfirmed: { $ne: true },
            },
            {
              currentBidder: bidderId,
              winnerConfirmed: true,
              transactionCompleted: { $ne: true },
            },
          ],
        };
        totalForFilter = activeTotal + awaitingTotal + processingTotal;
      } else {
        queryFilter = queries[status];
        totalForFilter =
          status === "active"
            ? activeTotal
            : status === "awaiting"
            ? awaitingTotal
            : processingTotal;
      }

      const skip = (page - 1) * limit;
      const products = await Product.find(queryFilter)
        .populate(populateFields)
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .lean();

      enrichedProducts = products.map(enrichProduct);
    }

    return {
      bids: enrichedProducts,
      pagination: {
        page,
        limit,
        total: totalForFilter,
        totalPages: Math.ceil(totalForFilter / limit),
      },
      statistics: {
        activeTotal,
        awaitingTotal,
        processingTotal,
      },
    };
  },

  async askQuestion(productId: string, bidderId: string, question: string) {
    const product = await Product.findById(productId).populate("seller");
    if (!product) {
      throw new Error(ProductMessages.PRODUCT_NOT_FOUND);
    }

    const bidder = await User.findById(bidderId);
    if (!bidder) {
      throw new Error(ProductMessages.BIDDER_NOT_FOUND);
    }

    // Thêm câu hỏi vào mảng questions
    product.questions.push({
      question,
      questioner: bidder._id,
      askedAt: new Date(),
    } as any);

    await product.save();

    // Lấy thông tin seller để gửi email
    const seller = product.seller as any;

    // Gửi email thông báo cho seller
    await sendQuestionEmail(
      seller.email,
      seller.name,
      product.name,
      productId,
      bidder.name,
      question
    );

    return {
      message: ProductMessages.QUESTION_SENT,
      question: product.questions[product.questions.length - 1],
    };
  },

  //Lấy thông tin cơ bản của bidder

  async getProfile(bidderId: string) {
    const bidder = await User.findById(bidderId);
    if (!bidder) {
      throw new Error(BidderMessages.USER_NOT_FOUND);
    }
    return bidder;
  },

  //Cập nhật thông tin cá nhân (name, address)

  async updateProfile(
    bidderId: string,
    updates: { name?: string; address?: string }
  ) {
    const bidder = await User.findByIdAndUpdate(
      bidderId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!bidder) {
      throw new Error(BidderMessages.USER_NOT_FOUND);
    }

    return bidder;
  },

  //Đổi mật khẩu
  async changePassword(
    bidderId: string,
    currentPassword: string,
    newPassword: string
  ) {
    // Lấy user với password field
    const bidder = await User.findById(bidderId).select("+password");
    if (!bidder) {
      throw new Error(BidderMessages.USER_NOT_FOUND);
    }

    // Xác thực mật khẩu hiện tại
    const isMatch = await bidder.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error(BidderMessages.INVALID_CURRENT_PASSWORD);
    }

    // Cập nhật mật khẩu mới (pre-save hook sẽ tự động hash)
    bidder.password = newPassword;
    await bidder.save();

    // Không trả về token - buộc logout
    return { message: BidderMessages.PASSWORD_CHANGED };
  },

  //Lấy danh sách đánh giá mà bidder nhận được (type='bidder')
  async getReceivedRatings(
    bidderId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      Rating.find({ type: "bidder", ratee: bidderId })
        .populate("rater", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Rating.countDocuments({ type: "bidder", ratee: bidderId }),
    ]);

    return {
      data: ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  //Đánh giá seller (chỉ khi bidder đã thắng ít nhất 1 auction của seller đó)
  async rateSeller(
    bidderId: string,
    sellerId: string,
    score: 1 | -1,
    comment: string
  ) {
    // Kiểm tra seller tồn tại và có role là seller
    const seller = await User.findById(sellerId);
    if (!seller) {
      throw new Error(BidderMessages.SELLER_NOT_FOUND);
    }
    if (seller.role !== "seller") {
      throw new Error(BidderMessages.NOT_SELLER);
    }

    // Kiểm tra bidder đã thắng ít nhất 1 auction của seller
    const wonAuction = await Product.findOne({
      seller: sellerId,
      currentBidder: bidderId,
      endTime: { $lt: new Date() },
    });

    if (!wonAuction) {
      throw new Error(BidderMessages.NO_WON_AUCTION);
    }

    // Tạo rating mới (unique index sẽ tự động ngăn duplicate)
    const rating = await Rating.create({
      type: "seller",
      rater: bidderId,
      ratee: sellerId,
      score,
      comment,
    });

    return rating;
  },

  //Cập nhật đánh giá seller (xóa điểm cũ, thêm điểm mới)
  async updateSellerRating(
    bidderId: string,
    sellerId: string,
    newScore: 1 | -1,
    newComment: string
  ) {
    // Tìm rating hiện tại
    const existingRating = await Rating.findOne({
      type: "seller",
      rater: bidderId,
      ratee: sellerId,
    });

    if (!existingRating) {
      throw new Error(BidderMessages.RATING_NOT_FOUND_UPDATE);
    }

    const oldScore = existingRating.score;

    // Nếu score thay đổi, cập nhật reputation của seller
    if (oldScore !== newScore) {
      const seller = await User.findById(sellerId);
      if (!seller) {
        throw new Error(BidderMessages.SELLER_NOT_FOUND);
      }

      // Giảm điểm cũ
      const oldField = oldScore === 1 ? "positiveRatings" : "negativeRatings";
      await User.findByIdAndUpdate(sellerId, {
        $inc: { [oldField]: -1 },
      });

      // Tăng điểm mới
      const newField = newScore === 1 ? "positiveRatings" : "negativeRatings";
      await User.findByIdAndUpdate(sellerId, {
        $inc: { [newField]: 1 },
      });
    }

    // Cập nhật rating
    existingRating.score = newScore;
    existingRating.comment = newComment;
    await existingRating.save();

    return existingRating;
  },

  //Xóa đánh giá seller (hook sẽ tự động giảm reputation)
  async deleteSellerRating(bidderId: string, sellerId: string) {
    const rating = await Rating.findOneAndDelete({
      type: "seller",
      rater: bidderId,
      ratee: sellerId,
    });

    if (!rating) {
      throw new Error(BidderMessages.RATING_NOT_FOUND_DELETE);
    }

    return { message: BidderMessages.RATING_DELETED };
  },

  //Lấy danh sách watchlist
  async getWatchlist(
    bidderId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: "createdAt" | "endTime" | "currentPrice" = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ) {
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    if (sortBy === "createdAt") {
      const [watchlistItems, total] = await Promise.all([
        Watchlist.find({ user: bidderId })
          .populate({
            path: "product",
            populate: {
              path: "seller",
              select: "name email",
            },
          })
          .populate({
            path: "product",
            populate: {
              path: "currentBidder",
              select: "name",
            },
          })
          .sort({ createdAt: sortDirection })
          .skip(skip)
          .limit(limit),
        Watchlist.countDocuments({ user: bidderId }),
      ]);

      return {
        watchlist: watchlistItems,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const [allWatchlistItems, total] = await Promise.all([
      Watchlist.find({ user: bidderId })
        .populate({
          path: "product",
          populate: {
            path: "seller",
            select: "name email",
          },
        })
        .populate({
          path: "product",
          populate: {
            path: "currentBidder",
            select: "name",
          },
        }),
      Watchlist.countDocuments({ user: bidderId }),
    ]);

    const sortedItems = allWatchlistItems.sort((a: any, b: any) => {
      const aValue =
        sortBy === "endTime" ? a.product?.endTime : a.product?.currentPrice;
      const bValue =
        sortBy === "endTime" ? b.product?.endTime : b.product?.currentPrice;

      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      const actualDirection =
        sortBy === "endTime" ? -sortDirection : sortDirection;
      return comparison * actualDirection;
    });

    const paginatedItems = sortedItems.slice(skip, skip + limit);

    return {
      watchlist: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  //Lấy danh sách auction đang tham gia (có bid và chưa kết thúc)
  async getParticipatingAuctions(
    bidderId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const now = new Date();

    // Lấy danh sách product IDs mà bidder đã bid
    const bids = await Bid.find({ bidder: bidderId }).distinct("product");

    // Lấy các product chưa kết thúc
    const [products, total] = await Promise.all([
      Product.find({
        _id: { $in: bids },
        endTime: { $gt: now },
      })
        .populate("seller", "name email")
        .populate("category", "name")
        .sort({ endTime: 1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({
        _id: { $in: bids },
        endTime: { $gt: now },
      }),
    ]);

    return {
      auctions: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  //Lấy danh sách auction đã thắng
  async getWonAuctions(bidderId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const now = new Date();

    const [products, total] = await Promise.all([
      Product.find({
        currentBidder: bidderId,
        endTime: { $lt: now },
        winnerConfirmed: { $eq: true },
      })
        .populate("seller", "name email")
        .populate("category", "name")
        .sort({ endTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments({
        currentBidder: bidderId,
        endTime: { $lt: now },
        winnerConfirmed: { $eq: true },
      }),
    ]);

    const sellerIds = products.map((p) => p.seller._id);
    const ratings = await Rating.find({
      rater: bidderId,
      ratee: { $in: sellerIds },
      type: "seller",
    }).lean();

    const ratingMap = new Map(ratings.map((r) => [r.ratee.toString(), r]));

    const enrichedProducts = products.map((p) => ({
      ...p,
      hasRated: ratingMap.has(p.seller._id.toString()),
      myRating: ratingMap.get(p.seller._id.toString())
        ? {
            _id: ratingMap.get(p.seller._id.toString())!._id,
            score: ratingMap.get(p.seller._id.toString())!.score,
            comment: ratingMap.get(p.seller._id.toString())!.comment,
          }
        : undefined,
    }));

    return {
      data: enrichedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  //Gửi yêu cầu nâng cấp lên Seller

  async requestSellerUpgrade(bidderId: string) {
    // Kiểm tra bidder tồn tại
    const bidder = await User.findById(bidderId);
    if (!bidder) {
      throw new Error(BidderMessages.USER_NOT_FOUND);
    }

    // Kiểm tra đã là seller hoặc không phải bidder
    if (bidder.role === "seller") {
      throw new Error(BidderMessages.ALREADY_SELLER);
    }

    if (bidder.role !== "bidder") {
      throw new Error(BidderMessages.USER_NOT_FOUND);
    }

    const now = new Date();

    // Kiểm tra có request pending còn hợp lệ không (chưa hết hạn)
    const pendingRequest = await UpgradeRequest.findOne({
      user: bidderId,
      status: "pending",
      expiresAt: { $gt: now },
    });

    if (pendingRequest) {
      throw new Error(BidderMessages.PENDING_REQUEST_EXISTS);
    }

    // Kiểm tra request bị reject gần nhất
    const lastRejectedRequest = await UpgradeRequest.findOne({
      user: bidderId,
      status: "rejected",
    }).sort({ rejectedAt: -1 });

    if (lastRejectedRequest && lastRejectedRequest.rejectedAt) {
      const daysSinceRejection = Math.floor(
        (now.getTime() - lastRejectedRequest.rejectedAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysSinceRejection < 7) {
        const daysRemaining = 7 - daysSinceRejection;
        throw new Error(
          BidderMessages.MUST_WAIT_DAYS.replace(
            "{days}",
            daysRemaining.toString()
          )
        );
      }
    }

    // Tạo request mới với expiresAt = +7 ngày
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upgradeRequest = await UpgradeRequest.create({
      user: bidderId,
      status: "pending",
      expiresAt,
    });

    return upgradeRequest;
  },

  /**
   * Lấy trạng thái yêu cầu nâng cấp của bidder
   */
  async getUpgradeRequestStatus(bidderId: string) {
    const now = new Date();

    // Lấy request gần nhất (pending chưa hết hạn hoặc approved/rejected)
    const request = await UpgradeRequest.findOne({
      user: bidderId,
      $or: [
        { status: { $in: ["approved", "rejected"] } },
        { status: "pending", expiresAt: { $gt: now } },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("reviewedBy", "name email");

    return request;
  },
};

// Hàm để mask tên bidder
function maskBidderName(fullName: string): string {
  const nameParts = fullName.trim().split(" ");

  if (nameParts.length === 1) {
    // Chỉ có 1 từ → mask một nửa
    const name = nameParts[0]!;
    const maskLength = Math.ceil(name.length / 2);
    return "*".repeat(maskLength) + name.slice(maskLength);
  }

  // Lấy tên cuối cùng (phần tử cuối mảng)
  const lastName = nameParts[nameParts.length - 1];

  // Mask phần họ và tên đệm (tất cả trừ tên cuối)
  const firstNames = nameParts.slice(0, -1);
  const totalMaskLength = firstNames.reduce(
    (sum, part) => sum + part.length,
    0
  );

  return "*".repeat(totalMaskLength + firstNames.length - 1) + " " + lastName;
}
