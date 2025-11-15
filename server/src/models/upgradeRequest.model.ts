import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUpgradeRequest extends Document {
  user: Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  
  // Ghi nhận admin (tùy)
  reviewedBy?: Types.ObjectId;
  rejectionReason?: string;
}

const upgradeRequestSchema = new Schema<IUpgradeRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Theo dõi Admin nào approve (tùy)
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    // Ghi lý do từ chối (tủy)
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// Mỗi người dùng unique chỉ có thể có 1 request pending
upgradeRequestSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

export const UpgradeRequest = mongoose.model<IUpgradeRequest>(
  "UpgradeRequest",
  upgradeRequestSchema
);