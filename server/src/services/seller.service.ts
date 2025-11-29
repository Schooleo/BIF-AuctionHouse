import { Product } from "../models/product.model";
import { SellerMessages } from "../constants/messages";

export class SellerService {
  static async createProduct(userId: string, productData: any) {
    const product = new Product({
      ...productData,
      seller: userId,
    });

    await product.save();
    return product;
  }

  static async appendDescription(
    userId: string,
    productId: string,
    description: string
  ) {
    const product = await Product.findOne({
      _id: productId,
      seller: userId,
    });

    if (!product) {
      throw new Error(SellerMessages.PRODUCT_NOT_FOUND_OR_UNAUTHORIZED);
    }

    product.descriptionHistory.push({
      content: description,
      updatedAt: new Date(),
    } as any); // Cast to any to avoid Mongoose subdocument type issues

    await product.save();
    return product;
  }

  static async getSellerProducts(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      status?: "all" | "ongoing" | "ended";
    } = {}
  ) {
    const {
      page = 1,
      limit = 12,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      status = "all", // "all", "ongoing", "ended"
    } = options;

    const query: any = { seller: userId };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const now = new Date();
    if (status === "ongoing") {
      query.endTime = { $gt: now };
    } else if (status === "ended") {
      query.endTime = { $lte: now };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name")
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
