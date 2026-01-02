import mongoose, { Document, Schema } from "mongoose";

export interface IUnbanRequest extends Document {
  user: mongoose.Types.ObjectId;
  title: string; // 10-100 characters
  details: string; // 50-500 characters
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
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 100,
    },
    details: {
      type: String,
      required: true,
      trim: true,
      minlength: 50,
      maxlength: 500,
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
unbanRequestSchema.index({ user: 1 }, { unique: true }); // Only ONE request per user
unbanRequestSchema.index({ status: 1, createdAt: -1 });

export const UnbanRequest = mongoose.model<IUnbanRequest>("UnbanRequest", unbanRequestSchema);
