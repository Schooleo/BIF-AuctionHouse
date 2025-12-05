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
  // TODO: implement reject bidder logic
  res.status(501).json({ message: "Not implemented" });
};

export const answerBidderQuestion = async (req: Request, res: Response) => {
  // TODO: implement answer bidder question logic
  res.status(501).json({ message: "Not implemented" });
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

export const rateWinnerOrCancelTransaction = async (
  req: Request,
  res: Response
) => {
  // TODO: implement rate winner or cancel transaction logic
  res.status(501).json({ message: "Not implemented" });
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
