import { Order, OrderStatus } from "../models/order.model";
import { Chat } from "../models/chat.model";
import { Product } from "../models/product.model";
import { User } from "../models/user.model";
import { sendRatingReceivedEmail } from "../utils/email.util";

export const OrderService = {
  // Initialize order when a product is won
  async createOrder(productId: string, sellerId: string, buyerId: string) {
    let order = await Order.findOne({ product: productId, buyer: buyerId });

    if (!order) {
      // Create new order
      order = await Order.create({
        product: productId,
        seller: sellerId,
        buyer: buyerId,
        status: OrderStatus.PENDING_PAYMENT,
        step: 1,
      });

      // Create associated chat
      const chat = await Chat.create({
        participants: [sellerId, buyerId],
        product: productId,
        order: order._id,
      });

      order.chat = chat._id as any;
      await order.save();

      // Link order to product
      await Product.findByIdAndUpdate(productId, {
        $set: { transactionCompleted: false },
      }); // Ensure flag is synced
    }

    return order;
  },

  async getOrderById(orderId: string, userId: string) {
    const order = await Order.findById(orderId)
      .populate("product")
      .populate("seller", "name email")
      .populate("buyer", "name email")
      .populate("chat");

    if (!order) throw new Error("Order not found");

    if (
      order.seller._id.toString() !== userId &&
      order.buyer._id.toString() !== userId
    ) {
      throw new Error("Unauthorized to view this order");
    }

    return order;
  },

  async getOrderByProduct(productId: string, userId: string) {
    const order = await Order.findOne({ product: productId })
      .populate("product")
      .populate("seller", "name email")
      .populate("buyer", "name email");

    if (!order) return null;

    if (
      order.seller._id.toString() !== userId &&
      order.buyer._id.toString() !== userId
    ) {
      throw new Error("Unauthorized");
    }

    return order;
  },

  // Step 1: Buyer submits info
  async updateStep1(
    orderId: string,
    buyerId: string,
    data: { address: string; note?: string; paymentProof?: string }
  ) {
    const order = await Order.findOne({ _id: orderId, buyer: buyerId });
    if (!order) throw new Error("Order not found or unauthorized");

    if (order.step > 1) throw new Error("Step 1 is already completed");

    order.shippingAddress = data.address;
    if (data.note) order.buyerNote = data.note;
    if (data.paymentProof) order.paymentProof = data.paymentProof;

    if (data.paymentProof) {
      order.status = OrderStatus.PENDING_PAYMENT;
    }

    order.step = 2;
    await order.save();
    return await order.populate(["product", "seller", "buyer", "chat"]);
  },

  // Step 2: Seller confirms payment and ships
  async updateStep2(
    orderId: string,
    sellerId: string,
    data: { shippingProof?: string; note?: string; confirmPayment: boolean }
  ) {
    const order = await Order.findOne({ _id: orderId, seller: sellerId });
    if (!order) throw new Error("Order not found or unauthorized");

    if (order.step !== 2) throw new Error("Invalid step");

    if (data.confirmPayment) {
      order.status = OrderStatus.PAID_CONFIRMED;
    }

    if (data.shippingProof) {
      order.shippingProof = data.shippingProof;
      order.status = OrderStatus.SHIPPED;
      order.step = 3; // Move to next step
    }

    if (data.note) order.sellerNote = data.note;

    await order.save();
    return await order.populate(["product", "seller", "buyer", "chat"]);
  },

  // Step 3: Buyer confirms receipt
  async updateStep3(orderId: string, buyerId: string) {
    const order = await Order.findOne({ _id: orderId, buyer: buyerId });
    if (!order) throw new Error("Order not found or unauthorized");

    if (order.step !== 3) throw new Error("Invalid step");

    order.status = OrderStatus.RECEIVED;
    order.step = 4;
    await order.save();
    return await order.populate(["product", "seller", "buyer", "chat"]);
  },

  // Step 4: Ratings
  async submitRating(
    orderId: string,
    userId: string,
    score: 1 | -1,
    comment: string
  ) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    const isSeller = order.seller.toString() === userId;
    const isBuyer = order.buyer.toString() === userId;

    if (!isSeller && !isBuyer) throw new Error("Unauthorized");

    const ratingData = {
      score,
      comment,
      updatedAt: new Date(),
    };

    if (isSeller) {
      order.ratingBySeller = ratingData;
      // Update Buyer's reputation
      const updateField = score === 1 ? "positiveRatings" : "negativeRatings";
      await User.findByIdAndUpdate(order.buyer, { $inc: { [updateField]: 1 } });

      // SYNC WITH RATING COLLECTION
      const { Rating } = await import("../models/rating.model");
      await Rating.findOneAndUpdate(
        {
          product: order.product,
          rater: userId,
          ratee: order.buyer,
          type: "bidder",
        },
        {
          score,
          comment,
          type: "bidder",
        },
        { upsert: true, new: true }
      );
    } else {
      order.ratingByBuyer = ratingData;
      // Update Seller's reputation
      const updateField = score === 1 ? "positiveRatings" : "negativeRatings";
      await User.findByIdAndUpdate(order.seller, {
        $inc: { [updateField]: 1 },
      });
    }

    // Check if both rated to mark completely COMPLETED
    if (order.ratingBySeller && order.ratingByBuyer) {
      order.status = OrderStatus.COMPLETED;
      // Update Product flag
      await Product.findByIdAndUpdate(order.product, {
        transactionCompleted: true,
      });
    }

    await order.save();
    const populatedOrder = await order.populate([
      "product",
      "seller",
      "buyer",
      "chat",
    ]);

    const rater = isSeller ? populatedOrder.seller : populatedOrder.buyer;
    const recipient = isSeller ? populatedOrder.buyer : populatedOrder.seller;

    if (recipient && (recipient as any).email && rater) {
      sendRatingReceivedEmail(
        (recipient as any).email,
        (recipient as any).name,
        (populatedOrder.product as any).name,
        (populatedOrder.product as any)._id.toString(),
        (rater as any).name,
        score,
        comment
      ).catch(console.error);
    }

    return populatedOrder;
  },

  async cancelOrder(orderId: string, sellerId: string) {
    const order = await Order.findOne({ _id: orderId, seller: sellerId });
    if (!order) throw new Error("Order not found or unauthorized");

    order.status = OrderStatus.CANCELLED;

    // Check if not already rated
    if (!order.ratingBySeller) {
      order.ratingBySeller = {
        score: -1,
        comment: "Order cancelled by seller due to non-payment/issues.",
        updatedAt: new Date(),
      };
      await User.findByIdAndUpdate(order.buyer, {
        $inc: { negativeRatings: 1 },
      });
    }

    await order.save();
    return await order.populate(["product", "seller", "buyer", "chat"]);
  },
};
