import { Watchlist } from "../models/watchlist.model";
import { Product } from "../models/product.model";
import {
  User,
  SystemConfig,
  Bid,
  Rating,
  AutoBid,
} from "../models/index.model";
import { UpgradeRequest } from "../models/upgradeRequest.model";
import { UnbanRequest } from "../models/unbanRequest.model";
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
import { getIO } from "../socket";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Queue to serialize processing per product to avoid race conditions
const productQueues = new Map<string, Promise<void>>();

const enqueueProductTask = (productId: string, task: () => Promise<void>) => {
  const currentQueue = productQueues.get(productId) || Promise.resolve();

  const nextTask = currentQueue
    .then(task)
    .catch((err) => console.error(`Queue error for product ${productId}:`, err))
    .finally(() => {
      // Cleanup: If this was the last task, remove the queue entry
      if (productQueues.get(productId) === nextTask) {
        productQueues.delete(productId);
      }
    });

  productQueues.set(productId, nextTask);
};

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

    // Kiểm tra xem user có đang auto bid không
    const myAutoBid = await AutoBid.findOne({
      user: bidderId,
      product: productId,
    });

    return {
      suggestedPrice: suggestedPrice,
      currentPrice: product.currentPrice,
      stepPrice: product.stepPrice,
      minValidPrice: suggestedPrice,
      buyNowPrice: product.buyNowPrice,
      myAutoBidMaxPrice: myAutoBid?.maxPrice,
      myAutoBidStepPrice: myAutoBid?.stepPrice,
      myAutoBidLastViewedBidCount: myAutoBid?.lastViewedBidCount,
    };
  },

  async acknowledgeAutoBid(userId: string, productId: string) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const autoBid = await AutoBid.findOne({ user: userId, product: productId });
    if (!autoBid) {
      return false;
    }

    autoBid.lastViewedBidCount = product.bidCount;
    await autoBid.save();
    return true;
  },

  async createOrUpdateAutoBid(
    bidderId: string,
    productId: string,
    maxPrice: number,
    stepPrice: number = 0
  ) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(BidMessages.PRODUCT_NOT_FOUND);
    }

    const bidder = await User.findById(bidderId);
    if (!bidder) {
      throw new Error(AuthMessages.USER_NOT_FOUND);
    }

    // Validation (re-use logic)
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

    // Validate Max Price (must be at least current + step)
    const minValidPrice = product.currentPrice + (product.stepPrice || 0);
    // Only check if product is active
    if (new Date() < product.endTime && maxPrice < minValidPrice) {
      // If auction ended, we don't care, but for active:
      throw new Error(`Max price must be at least ${minValidPrice}`);
    }

    // Validate stepPrice (must be multiple of product.stepPrice)
    if (stepPrice > 0 && product.stepPrice > 0) {
      if (stepPrice % product.stepPrice !== 0) {
        throw new Error(
          `Step price must be a multiple of ${product.stepPrice}`
        );
      }
    }

    // Upsert AutoBid
    // Note: If maxPrice is less than current price + step, we still save it?
    // Maybe user wants to lower it? But it won't trigger anything.
    // We'll save it.

    await AutoBid.findOneAndUpdate(
      { user: bidderId, product: productId },
      {
        maxPrice,
        stepPrice: stepPrice || product.stepPrice, // Store actual preference
        user: bidderId,
        product: productId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Trigger processing (Serialized via Queue)
    enqueueProductTask(productId, () => this.processAutoBids(productId));

    return { message: "Auto bid set successfully" };
  },

  // Legacy support for manual placement (just sets auto bid)
  async placeBid(bidderId: string, productId: string, price: number) {
    // Use standard step price by default for manual bids
    return this.createOrUpdateAutoBid(bidderId, productId, price, 0);
  },

  async processAutoBids(productId: string) {
    let product = await Product.findById(productId).populate(
      "seller",
      "email name"
    );
    if (!product) return;

    if (new Date() > product.endTime && !product.autoExtends) return;

    // Increased limit to allow for granular bid wars
    const config = await SystemConfig.findOne();
    let delay = 1000;
    if (config) {
      delay = config.autoBidDelay === 0 ? 0 : config.autoBidDelay;
    }

    for (let i = 0; i < 100; i++) {
      // Refresh auto bids
      const autoBids = await AutoBid.find({ product: productId })
        .populate("user")
        .sort({ maxPrice: -1, createdAt: 1 });

      // Filter out banned users (race condition protection)
      const activeAutoBids = autoBids.filter(
        (ab: any) => ab.user && ab.user.status === "ACTIVE"
      );

      if (activeAutoBids.length === 0) {
        break;
      }

      // Add delay between auto bids
      if (i > 0 && delay > 0) await sleep(delay);

      const winnerAutoBid = activeAutoBids[0]!;
      const runnerUpAutoBid = activeAutoBids[1];

      const currentBidderId = product.currentBidder?.toString();
      const currentPrice = product.currentPrice;

      // Stop if Buy Now reached
      if (product.buyNowPrice && currentPrice >= product.buyNowPrice) {
        break;
      }

      // 2. Determine who needs to bid
      let nextBidder: any = null;
      let nextPrice = 0;

      const winnerIsCurrent =
        currentBidderId === winnerAutoBid.user._id.toString();

      if (winnerIsCurrent) {
        // Winner is holding the bid.
        // Check if RunnerUp pushes it.
        if (runnerUpAutoBid && runnerUpAutoBid.maxPrice > currentPrice) {
          // RunnerUp challenges incrementally
          nextBidder = runnerUpAutoBid.user;
          const minStep = runnerUpAutoBid.stepPrice || product.stepPrice;
          let target = currentPrice + minStep;

          // Cap at RunnerUp Max
          if (target > runnerUpAutoBid.maxPrice) {
            target = runnerUpAutoBid.maxPrice;
          }

          // Cap at Buy Now
          if (product.buyNowPrice && target > product.buyNowPrice) {
            target = product.buyNowPrice;
          }

          // Special Case: Priority logic (omitted debug strict detail for brevity)
          if (
            product.buyNowPrice &&
            target >= product.buyNowPrice &&
            winnerAutoBid.maxPrice >= product.buyNowPrice
          ) {
            const safeCap = product.buyNowPrice - (product.stepPrice || 0);
            if (target > safeCap) target = safeCap;
            if (target <= currentPrice) {
              console.log(
                `[AutoBid] Challenger constrained by BuyNow protection.`
              );
              break;
            }
          }

          nextPrice = target;
        } else {
          // Stable
          break;
        }
      } else {
        // Winner needs to bid
        nextBidder = winnerAutoBid.user;
        const minStep = winnerAutoBid.stepPrice || product.stepPrice;
        let target = currentPrice + minStep;

        // Cap at Max
        if (target > winnerAutoBid.maxPrice) {
          target = winnerAutoBid.maxPrice;
        }

        // Cap at Buy Now
        if (product.buyNowPrice && target > product.buyNowPrice) {
          target = product.buyNowPrice;
        }

        if (target <= currentPrice) {
          console.log(
            `[AutoBid] Winner cannot beat current price ${currentPrice} (Max ${winnerAutoBid.maxPrice}).`
          );
          break;
        }
        nextPrice = target;
      }

      // Execute Bid
      if (nextBidder && nextPrice > currentPrice) {
        await this._executeBid(product, nextBidder, nextPrice);
      } else {
        break;
      }
    }
  },

  async _executeBid(product: any, bidder: any, price: number) {
    const bid = await Bid.create({
      product: product._id,
      bidder: bidder._id,
      price: price,
    });

    product.currentPrice = price;
    product.currentBidder = bidder._id;
    product.bidCount += 1;

    // --- LOGIC MUA NGAY ---
    if (product.buyNowPrice && price >= product.buyNowPrice) {
      product.endTime = new Date();
      product.winnerConfirmed = false;
      product.transactionCompleted = false;
    }
    // ---------------------

    // --- LOGIC TỰ ĐỘNG GIA HẠN ---
    // Chỉ gia hạn nếu KHÔNG PHẢI Mua Ngay
    if (
      product.autoExtends &&
      (!product.buyNowPrice || price < product.buyNowPrice)
    ) {
      const systemConfig = await SystemConfig.findOne();
      if (systemConfig) {
        const now = new Date();
        const endTime = new Date(product.endTime);
        const timeRemainingMinutes =
          (endTime.getTime() - now.getTime()) / 1000 / 60;

        if (timeRemainingMinutes <= systemConfig.auctionExtensionWindow) {
          const newEndTime = new Date(
            endTime.getTime() + systemConfig.auctionExtensionTime * 60 * 1000
          );
          product.endTime = newEndTime;
        }
      }
    }
    // -----------------------------

    await product.save();

    // Phát sự kiện Socket
    try {
      const io = getIO();
      io.to(`product_${product._id}`).emit("new_bid", {
        currentPrice: price,
        bidCount: product.bidCount,
        currentBidder: maskBidderName(bidder.name),
        currentBidderRating: bidder.rating,
        endTime: product.endTime,
        time: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err.message !== "Socket.io not initialized!") {
        console.error("Socket emit error", err);
      }
    }

    // Logic gửi Email (Bất đồng bộ)
    this._sendBidEmails(product, bidder, price);

    return { bid, product };
  },

  async _sendBidEmails(product: any, bidder: any, price: number) {
    try {
      const participatingBidderIds = await Bid.find({
        product: product._id,
        bidder: { $ne: bidder._id },
      }).distinct("bidder");

      const participatingBidders = await User.find({
        _id: { $in: participatingBidderIds },
      }).select("email name");

      const seller = product.seller as any;
      const nextMinPrice = price + product.stepPrice;
      const maskedBidderName = maskBidderName(bidder.name);

      Promise.allSettled([
        sendBidNotificationToSeller(
          seller.email,
          seller.name,
          product.name,
          product._id,
          maskedBidderName,
          price,
          price
        ),
        sendBidConfirmationToBidder(
          bidder.email,
          bidder.name,
          product.name,
          product._id,
          price,
          nextMinPrice,
          product.endTime
        ),
        participatingBidders.length > 0
          ? sendOutbidNotificationToBidders(
              participatingBidders.map((b) => ({
                email: b.email,
                name: b.name,
              })),
              product.name,
              product._id,
              price,
              nextMinPrice
            )
          : Promise.resolve(),
      ]).catch((err) => {
        console.error("Error sending bid notification emails:", err);
      });
    } catch (emailError) {
      console.error("Failed to send bid notification emails:", emailError);
    }
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
      const queryFilter = {
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

      const skip = (page - 1) * limit;
      const sortDirection = sortOrder === "asc" ? 1 : -1;

      const [products, total] = await Promise.all([
        Product.find(queryFilter)
          .populate(populateFields)
          .sort({ endTime: sortDirection })
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(queryFilter),
      ]);

      enrichedProducts = products.map((p) => enrichProduct(p));
      totalForFilter = total;
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
    updates: {
      name?: string;
      address?: string;
      dateOfBirth?: Date;
      contactEmail?: string;
      avatar?: string;
    }
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
        .populate("seller", "name email role")
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

  // Gửi yêu cầu nâng cấp lên Seller
  async requestSellerUpgrade(bidderId: string, title: string, reasons: string) {
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

    // Kiểm tra request gần nhất (KHÔNG BAO GỒM expired) để enforce giới hạn 1 tuần
    const lastRequest = await UpgradeRequest.findOne({
      user: bidderId,
      status: { $ne: "expired" }, // Bỏ qua expired requests
    }).sort({ createdAt: -1 });

    if (lastRequest) {
      const daysSinceLastRequest = Math.floor(
        (now.getTime() - lastRequest.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastRequest < 7) {
        const daysRemaining = 7 - daysSinceLastRequest;
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
      title,
      reasons,
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

/**
 * Submit unban request
 */
export const submitUnbanRequest = async (
  userId: string,
  title: string,
  details: string
) => {
  // Check if user is actually banned
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.status !== "BLOCKED") {
    throw new Error("Only banned users can submit unban requests");
  }

  // Check if user already has an unban request (only ONE allowed)
  const existingRequest = await UnbanRequest.findOne({ user: userId });
  if (existingRequest) {
    throw new Error("You have already submitted an unban request");
  }

  // Create unban request
  const unbanRequest = await UnbanRequest.create({
    user: userId,
    title,
    details,
    status: "PENDING",
  });

  return unbanRequest;
};

/**
 * Get unban request status for user
 */
export const getUnbanRequestStatus = async (userId: string) => {
  const request = await UnbanRequest.findOne({ user: userId })
    .populate("processedBy", "name email")
    .sort({ createdAt: -1 });

  return request;
};
