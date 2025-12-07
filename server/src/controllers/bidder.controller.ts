import { Request, Response } from 'express';
import { bidderService } from '../services/bidder.service';
import { WatchlistMessages } from '../constants/messages';
import { Bid } from '../models/bid.model';
import { BidMessages } from '../constants/messages';
import { ProductMessages } from '../constants/messages';
// Thêm các kiểu dữ liệu cho Request và Response nếu có sử dụng trong src/types/bidder.ts
// Thêm các biến constants cho messages nếu có sử dụng trong src/constants/messages.ts

export const addToWatchlist = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const userId = req.user!.id;

    // Gọi service để xử lý logic
    const watchlistItem = await bidderService.addToWatchlist(userId, productId);

    // Trả về success message
    res.status(200).json({
      message: WatchlistMessages.ADDED_SUCCESS,
      data: watchlistItem,
    });
  } catch (error: any) {
    if (error.message === WatchlistMessages.ALREADY_EXISTS) {
      return res.status(400).json({ message: error.message });
    }

    if (error.message === WatchlistMessages.PRODUCT_NOT_FOUND) {
      return res.status(404).json({ message: error.message });
    }

    // Xử lý lỗi chung
    res.status(500).json({ message: error.message });
  }
};

export const removeFromWatchlist = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.id;

    const result = await bidderService.removeFromWatchlist(userId, productId!);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === WatchlistMessages.NOT_IN_WATCHLIST) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === WatchlistMessages.PRODUCT_NOT_FOUND) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const checkInWatchlist = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.id;

    const result = await bidderService.checkInWatchlist(userId, productId!);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSuggestedPrice = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.id;

    const result = await bidderService.getSuggestedPrice(userId, productId!);

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === BidMessages.PRODUCT_NOT_FOUND) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === BidMessages.UNRATED_NOT_ALLOWED || error.message === BidMessages.REPUTATION_TOO_LOW) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const placeBid = async (req: Request, res: Response) => {
  try {
    const { productId, price } = req.body;
    const userId = req.user!.id;

    const result = await bidderService.placeBid(userId, productId, price);

    res.status(201).json({
      message: BidMessages.BID_PLACED,
      data: result,
    });
  } catch (error: any) {
    if (error.message === BidMessages.PRODUCT_NOT_FOUND) {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message === BidMessages.UNRATED_NOT_ALLOWED ||
      error.message === BidMessages.REPUTATION_TOO_LOW ||
      error.message === BidMessages.BIDDER_REJECTED
    ) {
      return res.status(403).json({ message: error.message });
    }
    if (error.message === BidMessages.BID_TOO_LOW) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const viewBidHistory = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await bidderService.getBidHistory(productId!, page, limit);

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === BidMessages.PRODUCT_NOT_FOUND) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const viewMyBids = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as 'endTime' | 'price' | 'bidCount') || 'endTime';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const status = req.query.status as 'active' | 'awaiting' | 'processing' | undefined;

    const result = await bidderService.getMyBids(bidderId, page, limit, sortBy, sortOrder, status);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const askSellerQuestion = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { question } = req.body;
    const bidderId = req.user?.id;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ message: ProductMessages.QUESTION_REQUIRED });
    }

    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await bidderService.askQuestion(productId, bidderId, question.trim());

    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: ProductMessages.PRODUCT_NOT_FOUND });
    }
    if (error.message === 'Bidder not found') {
      return res.status(404).json({ message: 'Bidder not found' });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const viewProfile = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const profile = await bidderService.getProfile(bidderId);
    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const editProfile = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, address } = req.body;
    const profile = await bidderService.updateProfile(bidderId, {
      name,
      address,
    });
    res.json({ profile });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const viewWatchlist = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as 'createdAt' | 'endTime' | 'currentPrice') || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const result = await bidderService.getWatchlist(bidderId, page, limit, sortBy, sortOrder);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const viewParticipatingAuctions = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await bidderService.getParticipatingAuctions(bidderId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const viewWonAuctions = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await bidderService.getWonAuctions(bidderId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const rateSeller = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    const { sellerId } = req.params;
    const { score, comment } = req.body;

    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!sellerId) {
      return res.status(400).json({ message: 'Seller ID is required' });
    }

    const rating = await bidderService.rateSeller(bidderId, sellerId, score, comment);
    res.status(201).json({ rating });
  } catch (error: any) {
    if (error.message.includes('không tìm thấy') || error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('chỉ có thể') || error.message.includes('duplicate')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;
    const result = await bidderService.changePassword(bidderId, currentPassword, newPassword);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const viewReceivedRatings = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await bidderService.getReceivedRatings(bidderId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRating = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    const { sellerId } = req.params;
    const { score, comment } = req.body;

    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!sellerId) {
      return res.status(400).json({ message: 'Seller ID is required' });
    }

    const rating = await bidderService.updateSellerRating(bidderId, sellerId, score, comment);
    res.json({ rating });
  } catch (error: any) {
    if (error.message.includes('không tìm thấy') || error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

export const deleteRating = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    const { sellerId } = req.params;

    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!sellerId) {
      return res.status(400).json({ message: 'Seller ID is required' });
    }

    const result = await bidderService.deleteSellerRating(bidderId, sellerId);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('không tìm thấy') || error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const requestSellerUpgrade = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const request = await bidderService.requestSellerUpgrade(bidderId);
    res.status(201).json({ request });
  } catch (error: any) {
    if (error.message.includes('đã là seller')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('đang chờ xử lý')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('đợi') && error.message.includes('ngày')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getUpgradeRequestStatus = async (req: Request, res: Response) => {
  try {
    const bidderId = req.user?.id;
    if (!bidderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const request = await bidderService.getUpgradeRequestStatus(bidderId);
    res.json({ request });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
