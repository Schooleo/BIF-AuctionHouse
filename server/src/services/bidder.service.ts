import { Watchlist } from '../models/watchlist.model';
import { Product } from '../models/product.model';
import { WatchlistMessages } from '../constants/messages';
import { addToWatchlist } from '../controllers/bidder.controller';

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
    }
}