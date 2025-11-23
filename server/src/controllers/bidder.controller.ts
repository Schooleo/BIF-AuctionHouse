import { Request, Response } from "express";
import { bidderService } from "../services/bidder.service";
import { WatchlistMessages } from "../constants/messages";
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
  } catch (error : any) {
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

export const placeBid = async (req: Request, res: Response) => {
  // TODO: implement place bid logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewBidHistory = async (req: Request, res: Response) => {
  // TODO: implement view bid history logic
  res.status(501).json({ message: "Not implemented" });
};

export const askSellerQuestion = async (req: Request, res: Response) => {
  // TODO: implement ask seller question logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewProfile = async (req: Request, res: Response) => {
  // TODO: implement view profile logic
  res.status(501).json({ message: "Not implemented" });
};

export const editProfile = async (req: Request, res: Response) => {
  // TODO: implement edit profile logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewFavorites = async (req: Request, res: Response) => {
  // TODO: implement view favorites logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewParticipatingAuctions = async (
  req: Request,
  res: Response
) => {
  // TODO: implement view participating auctions logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewWonAuctions = async (req: Request, res: Response) => {
  // TODO: implement view won auctions logic
  res.status(501).json({ message: "Not implemented" });
};

export const rateSeller = async (req: Request, res: Response) => {
  // TODO: implement rate seller logic
  res.status(501).json({ message: "Not implemented" });
};

export const requestSellerUpgrade = async (req: Request, res: Response) => {
  // TODO: implement request seller upgrade logic
  res.status(501).json({ message: "Not implemented" });
};
