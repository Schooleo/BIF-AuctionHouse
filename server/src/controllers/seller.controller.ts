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
  try {
    const userId = (req.user as any)?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await SellerService.getSellerProfile(String(userId));
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error fetching seller profile:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
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

// Duplicate block removed

export const rateWinner = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.user as any)?._id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.params;
    const { score, comment } = req.body;

    const rating = await SellerService.rateWinner(
      String(sellerId),
      String(productId),
      score,
      comment
    );

    res.status(200).json({
      message: "Rating submitted successfully",
      rating,
    });
  } catch (error: any) {
    if (error.message === SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Winner must be confirmed before rating") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error rating winner:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const cancelTransaction = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.user as any)?._id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.params;

    const product = await SellerService.cancelTransaction(
      String(sellerId),
      String(productId)
    );

    res.status(200).json({
      message: "Transaction cancelled successfully",
      product,
    });
  } catch (error: any) {
    if (error.message === SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "No confirmed transaction to cancel") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error cancelling transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const transferWinner = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.user as any)?._id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.params;

    const product = await SellerService.transferWinner(
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
    console.error("Error transferring winner:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const completeTransaction = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.user as any)?._id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.params;

    const product = await SellerService.completeTransaction(
      String(sellerId),
      String(productId)
    );

    res.status(200).json({
      message: "Transaction completed successfully",
      product,
    });
  } catch (error: any) {
    if (error.message === SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED) {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message === "Cannot complete transaction without a confirmed winner"
    ) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error completing transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const archiveCancelledProduct = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.user as any)?._id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.params;

    await SellerService.archiveCancelledProduct(
      String(sellerId),
      String(productId)
    );

    res.status(200).json({
      message: "Product archived successfully",
    });
  } catch (error: any) {
    if (error.message === SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error archiving product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Kept for backward compatibility if needed, but updated response
export const rateWinnerOrCancelTransaction = async (
  req: Request,
  res: Response
) => {
  res.status(410).json({
    message: "Endpoint deprecated. Use /rate-winner or /cancel-transaction",
  });
};

export const updateSellerProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const seller = await SellerService.updateProfile(String(userId), req.body);
    res.status(200).json({ profile: seller });
  } catch (error: any) {
    console.error("Error updating seller profile:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const changeSellerPassword = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body;
    const result = await SellerService.changePassword(
      String(userId),
      currentPassword,
      newPassword
    );

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "Invalid current password") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error changing seller password:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const viewSellerBidHistory = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.user as any)?._id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.params;
    const {
      page = 1,
      limit = 10,
      includeRejected = "false",
    } = req.query as any;

    const result = await SellerService.getProductBidHistory(
      String(sellerId),
      String(productId),
      Number(page),
      Number(limit),
      includeRejected === "true"
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

// Update viewReceivedRatings in seller.controller.ts

export const viewReceivedRatings = async (req: Request, res: Response) => {
  try {
    const sellerId = (req.user as any)?._id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const score = parseInt(req.query.score as string); // 1 or -1 or undefined

    const { Rating } = await import("../models/rating.model");
    const skip = (page - 1) * limit;

    const query: any = { type: "seller", ratee: sellerId };
    if (!isNaN(score) && (score === 1 || score === -1)) {
      query.score = score;
    }

    const [ratings, total] = await Promise.all([
      Rating.find(query)
        .populate("rater", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Rating.countDocuments(query),
    ]);

    res.status(200).json({
      data: ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching seller ratings:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
