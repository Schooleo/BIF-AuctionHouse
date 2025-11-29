import { Request, Response } from "express";
import { SellerService } from "../services/seller.service";
import {
  createProductSchema,
  appendDescriptionSchema,
} from "../schemas/seller.schema";
import { SellerMessages } from "../constants/messages";

// Add types for Request and Response if used in src/types/seller.ts
// Add constants for messages if used in src/constants/messages.ts

export const createAuctionProduct = async (req: Request, res: Response) => {
  try {
    const validationResult = createProductSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message: SellerMessages.MISSING_REQUIRED_FIELDS,
        errors: validationResult.error.issues,
      });
    }

    const userId = (req.user as any)?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const product = await SellerService.createProduct(
      String(userId),
      validationResult.data
    );

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const appendProductDescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validationResult = appendDescriptionSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message: SellerMessages.DESCRIPTION_REQUIRED,
        errors: validationResult.error.issues,
      });
    }

    const userId = (req.user as any)?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const product = await SellerService.appendDescription(
      String(userId),
      String(id),
      validationResult.data.description
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
  // TODO: implement view seller profile logic
  res.status(501).json({ message: "Not implemented" });
};

export const viewSellerProducts = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const search = (req.query.search as string) || "";
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder =
      (req.query.sortOrder as string) === "asc" ? "asc" : "desc";
    const status = ((req.query.status as string) || "all") as
      | "all"
      | "ongoing"
      | "ended";

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
