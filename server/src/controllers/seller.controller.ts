import { Request, Response } from "express";
import { SellerService } from "../services/seller.service";
// Schemas are used in routes/seller.routes.ts via validate middleware
import { SellerMessages } from "../constants/messages";

// Add types for Request and Response if used in src/types/seller.ts
// Add constants for messages if used in src/constants/messages.ts

export const createAuctionProduct = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const product = await SellerService.createProduct(String(userId), req.body);

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const appendProductDescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const userId = (req.user as any)?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const product = await SellerService.appendDescription(
      String(userId),
      String(id),
      req.body.description
    );

    res.status(200).json(product);
  } catch (error: any) {
    if (error.message === SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error appending description:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectBidder = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.user as any)?._id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId, bidderId } = req.params;

    const product = await SellerService.rejectBidder(
      String(sellerId),
      String(productId),
      String(bidderId)
    );

    res.status(200).json({
      message: SellerMessages.BIDDER_REJECTED,
      product,
    });
  } catch (error: any) {
    if (
      error.message === SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED ||
      error.message === SellerMessages.BIDDER_NOT_FOUND
    ) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === SellerMessages.BIDDER_ALREADY_REJECTED) {
      return res.status(409).json({ message: error.message });
    }
    console.error("Error rejecting bidder:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const answerBidderQuestion = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.user as any)?._id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId, questionId } = req.params;
    const { answer } = req.body;

    const { question, updated } = await SellerService.answerQuestion(
      String(sellerId),
      String(productId),
      String(questionId),
      answer
    );

    res.status(updated ? 200 : 201).json({
      message: updated
        ? SellerMessages.ANSWER_UPDATED
        : SellerMessages.ANSWER_SUBMITTED,
      question,
    });
  } catch (error: any) {
    if (
      error.message === SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED ||
      error.message === SellerMessages.QUESTION_NOT_FOUND
    ) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === SellerMessages.ANSWER_REQUIRED) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error answering bidder question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const confirmWinner = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.user as any)?._id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.params;

    const product = await SellerService.confirmWinner(
      String(sellerId),
      String(productId)
    );

    res.status(200).json({
      message: SellerMessages.WINNER_CONFIRMED,
      product,
    });
  } catch (error: any) {
    if (error.message === SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED) {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message === SellerMessages.AUCTION_NOT_ENDED ||
      error.message === SellerMessages.NO_ELIGIBLE_BIDDER
    ) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === SellerMessages.WINNER_ALREADY_CONFIRMED) {
      return res.status(409).json({ message: error.message });
    }
    console.error("Error confirming winner:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const viewSellerProfile = async (req: Request, res: Response) => {
  // TODO: implement view seller profile logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewSellerProducts = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Query params are validated and coerced by middleware
    const { page, limit, search, sortBy, sortOrder, status } = req.query as any;

    const result = await SellerService.getSellerProducts(String(userId), {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      status,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching seller products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rateWinnerOrCancelTransaction = async (
  req: Request,
  res: Response
) => {
  // TODO: implement rate winner or cancel transaction logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewSellerBidHistory = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.user as any)?._id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query as any;

    const result = await SellerService.getProductBidHistory(
      String(sellerId),
      String(productId),
      Number(page),
      Number(limit)
    );

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error fetching seller bid history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
