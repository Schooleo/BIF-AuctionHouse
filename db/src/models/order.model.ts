import mongoose, { Document, Schema, Types } from "mongoose";

export enum OrderStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PAID_CONFIRMED = "PAID_CONFIRMED",
  SHIPPED = "SHIPPED",
  RECEIVED = "RECEIVED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface IRatingEmbedded {
  score: 1 | -1;
  comment?: string;
  updatedAt: Date;
}

export interface IOrder extends Document {
  product: Types.ObjectId;
  seller: Types.ObjectId;
  buyer: Types.ObjectId;

  status: OrderStatus;
  step: number; // 1: Buyer Info, 2: Seller Ship, 3: Buyer Receive, 4: Done

  // Step 1: Buyer Info
  shippingAddress?: string;
  paymentProof?: string; // URL Image
  buyerNote?: string;

  // Step 2: Shipping
  shippingProof?: string; // URL Image or Tracking Code
  sellerNote?: string;

  // Step 3 & 4: Ratings
  ratingBySeller?: IRatingEmbedded;
  ratingByBuyer?: IRatingEmbedded;

  // Chat Link
  chat?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const RatingEmbeddedSchema = new Schema<IRatingEmbedded>({
  score: { type: Number, enum: [1, -1], required: true },
  comment: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

const orderSchema = new Schema<IOrder>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING_PAYMENT,
    },
    step: { type: Number, default: 1 },

    shippingAddress: { type: String },
    paymentProof: { type: String },
    buyerNote: { type: String },

    shippingProof: { type: String },
    sellerNote: { type: String },

    ratingBySeller: { type: RatingEmbeddedSchema },
    ratingByBuyer: { type: RatingEmbeddedSchema },

    chat: { type: Schema.Types.ObjectId, ref: "Chat" },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
