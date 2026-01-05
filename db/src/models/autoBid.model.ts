import mongoose, { Schema, Document } from "mongoose";

export interface IAutoBid extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  maxPrice: number;
  stepPrice?: number; // Optional: user defined step (must be valid multiplier)
  lastViewedBidCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const autoBidSchema = new Schema<IAutoBid>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    maxPrice: {
      type: Number,
      required: true,
    },
    stepPrice: {
      type: Number,
      default: 0,
    },
    lastViewedBidCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user has only one active auto-bid per product
autoBidSchema.index({ user: 1, product: 1 }, { unique: true });

export const AutoBid = mongoose.model<IAutoBid>("AutoBid", autoBidSchema);
