import { Watchlist } from '../models/watchlist.model';
import { Product } from '../models/product.model';
import { BidMessages, 
    WatchlistMessages,
    AuthMessages
 } from '../constants/messages';
import { User } from '../models/index.model';
import { Bid } from '../models/bid.model';

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
                product: productId
            });
            return watchlistItem;
        } catch (error : any) {
            if (error.code === 11000) {
                throw new Error(WatchlistMessages.ALREADY_EXISTS);
            }
            throw error;
        }
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
            minValidPrice: suggestedPrice
        }
    },

    async placeBid(bidderId: string, productId: string, price: number) {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error(BidMessages.PRODUCT_NOT_FOUND);
        }

        const bidder = await User.findById(bidderId);
        if (!bidder) {
            throw new Error(AuthMessages.USER_NOT_FOUND);
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
            price: price
        });
        

        product.currentPrice = price;
        product.currentBidder = bidderId as any;
        product.bidCount += 1;
        await product.save();

        return {
            bid: bid,
            product: {
                currentPrice: product.currentPrice,
                currentBidder: product.currentBidder,
                bidCount: product.bidCount
            }
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
            .populate('bidder', 'name')  // Lấy tên bidder
            .sort({ createdAt: -1 })    // Mới nhất trước
            .skip(skip)
            .limit(limit);

        const totalBids = await Bid.countDocuments({ product: productId });

        const totalPages = Math.ceil(totalBids / limit);

        const bidHistory = bids.map(bid => ({
            bidder: maskBidderName((bid.bidder as any).name),
            price: bid.price,
            time: bid.createdAt
        }));

        return {
            bidHistory: bidHistory,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalBids: totalBids,
                limit: limit
            }
        }
    }
}

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
    const totalMaskLength = firstNames.reduce((sum, part) => sum + part.length, 0);

    return "*".repeat(totalMaskLength + firstNames.length - 1) + " " + lastName;
}