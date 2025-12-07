import { Request, Response } from "express";
import { OrderService } from "../services/order.service";
import { ChatService } from "../services/chat.service";

export const OrderController = {
  createOrder: async (req: Request, res: Response) => {
    try {
      const { productId } = req.body;
      const userId = (req.user as any)._id.toString();

      // We need to fetch product to know who is seller/buyer,
      // but OrderService.createOrder takes IDs.
      // Ideally logic should be in service.
      // But let's fetch product here or let service handle it.
      // Let's assume frontend passes product ID, and service looks up product first?
      // Service `createOrder` takes `productId`, `sellerId`, `buyerId`.
      // Let's update Service logic or do lookup here.

      const { Product } = await import("../models/product.model");
      const product = await Product.findById(productId);
      if (!product) throw new Error("Product not found");

      // Verify user is involved
      const isSeller = product.seller.toString() === userId;
      const isWinner = product.currentBidder?.toString() === userId;

      if (!isSeller && !isWinner) throw new Error("Unauthorized");

      const sellerId = product.seller.toString();
      const bidderId = product.currentBidder;
      if (!bidderId) throw new Error("No winner for this product");
      const buyerId = bidderId.toString();

      const order = await OrderService.createOrder(
        productId,
        sellerId,
        buyerId
      );
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  getOrder: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Order ID required");
      const userId = (req.user as any)._id.toString();
      const order = await OrderService.getOrderById(id, userId);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  updateStep1: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Order ID required");
      const userId = (req.user as any)._id.toString();
      const order = await OrderService.updateStep1(id, userId, req.body);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  updateStep2: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Order ID required");
      const userId = (req.user as any)._id.toString();
      const order = await OrderService.updateStep2(id, userId, req.body);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  updateStep3: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Order ID required");
      const userId = (req.user as any)._id.toString();
      const order = await OrderService.updateStep3(id, userId);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  submitRating: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Order ID required");
      const userId = (req.user as any)._id.toString();
      const { score, comment } = req.body;
      const order = await OrderService.submitRating(id, userId, score, comment);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  // CHAT CONTROLLER METHODS
  getChat: async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // Order ID
      if (!id) throw new Error("Order ID required");
      const userId = (req.user as any)._id.toString();
      const chat = await ChatService.getChatByOrder(id, userId);
      res.json(chat);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  sendMessage: async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // Order ID
      if (!id) throw new Error("Order ID required");
      const userId = (req.user as any)._id.toString();
      const { content, isImage } = req.body;
      const message = await ChatService.sendMessage(
        id,
        userId,
        content,
        isImage
      );
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },
};
