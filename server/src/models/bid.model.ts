import mongoose, { Document, Schema, Types } from "mongoose"; // <-- Import Types

export interface IBid extends Document {
  product: Types.ObjectId;
  bidder: Types.ObjectId;
  price: number; // Giá thực tế được đặt
  
  // Dành cho Đấu giá Tự động (6.2)
  maxPrice?: number; // Giá tối đa mà bidder này sẵn sàng trả

  createdAt: Date;
}

const bidSchema = new Schema<IBid>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    bidder: { type: Schema.Types.ObjectId, ref: "User", required: true },
    price: { type: Number, required: true },
    maxPrice: { type: Number },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index để tăng tốc độ truy vấn lịch sử ra giá 
bidSchema.index({ product: 1, createdAt: -1 }); 

export const Bid = mongoose.model<IBid>("Bid", bidSchema);