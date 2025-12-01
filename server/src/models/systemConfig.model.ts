import mongoose, { Document, Schema } from "mongoose";

export interface ISystemConfig extends Document {
  auctionExtensionWindow: number; // Số phút trước khi kết thúc để kích hoạt extension
  auctionExtensionTime: number; // Số phút để mở rộng
}

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    auctionExtensionWindow: { type: Number, default: 5 },
    auctionExtensionTime: { type: Number, default: 10 },
  },
  { timestamps: true }
);

// Đảm bảo chỉ có một document config tồn tại
export const SystemConfig = mongoose.model<ISystemConfig>(
  "SystemConfig",
  systemConfigSchema
);
