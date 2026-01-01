import mongoose, { Document, Schema } from "mongoose";

export interface IUnbanRequest extends Document {
  user: mongoose.Types.ObjectId;
  reason: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  adminNote?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const unbanRequestSchema = new Schema<IUnbanRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "DENIED"],
      default: "PENDING",
    },
    adminNote: {
      type: String,
      trim: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
unbanRequestSchema.index({ user: 1, status: 1 });
unbanRequestSchema.index({ status: 1, createdAt: -1 });

export const UnbanRequest = mongoose.model<IUnbanRequest>(
  "UnbanRequest",
  unbanRequestSchema
);
