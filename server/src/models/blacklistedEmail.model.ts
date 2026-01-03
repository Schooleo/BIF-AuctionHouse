import mongoose, { Document, Schema } from "mongoose";

export interface IBlacklistedEmail extends Document {
  email: string;
  googleId?: string;
  reason?: string;
  deletedAt: Date;
}

const blacklistedEmailSchema = new Schema<IBlacklistedEmail>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    googleId: {
      type: String,
      sparse: true, // Allow multiple nulls
    },
    reason: {
      type: String,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient lookups
blacklistedEmailSchema.index({ googleId: 1 });

export const BlacklistedEmail = mongoose.model<IBlacklistedEmail>(
  "BlacklistedEmail",
  blacklistedEmailSchema
);
