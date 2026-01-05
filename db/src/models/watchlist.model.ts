import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./user.model";
import { IProduct } from "./product.model";

export interface IWatchlist extends Document {
  user: IUser["_id"];
  product: IProduct["_id"];
}

const watchlistSchema = new Schema<IWatchlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);

// Ngăn người dùng thêm cùng một sản phẩm vào watchlist nhiều lần
watchlistSchema.index({ user: 1, product: 1 }, { unique: true });

export const Watchlist = mongoose.model<IWatchlist>(
  "Watchlist",
  watchlistSchema
);