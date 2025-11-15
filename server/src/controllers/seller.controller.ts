import { Request, Response } from "express";

// Thêm các kiểu dữ liệu cho Request và Response nếu có sử dụng trong src/types/seller.ts
// Thêm các biến constants cho messages nếu có sử dụng trong src/constants/messages.ts

export const createAuctionProduct = async (req: Request, res: Response) => {
  // TODO: implement create auction product logic
  res.status(501).json({ message: "Not implemented" });
};

export const appendProductDescription = async (req: Request, res: Response) => {
  // TODO: implement append product description logic
  res.status(501).json({ message: "Not implemented" });
};

export const rejectBidder = async (req: Request, res: Response) => {
  // TODO: implement reject bidder logic
  res.status(501).json({ message: "Not implemented" });
};

export const answerBidderQuestion = async (req: Request, res: Response) => {
  // TODO: implement answer bidder question logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewSellerProfile = async (req: Request, res: Response) => {
  // TODO: implement view seller profile logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewSellerProducts = async (req: Request, res: Response) => {
  // TODO: implement view seller products logic
  res.status(501).json({ message: "Not implemented" });
};

export const rateWinnerOrCancelTransaction = async (
  req: Request,
  res: Response
) => {
  // TODO: implement rate winner or cancel transaction logic
  res.status(501).json({ message: "Not implemented" });
};
