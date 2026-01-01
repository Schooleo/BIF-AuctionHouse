import mongoose, { Document, Schema } from "mongoose";
import * as bcrypt from "bcrypt";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  googleId?: string;
  address: string;
  role: "bidder" | "seller" | "admin";
  avatar?: string;
  dateOfBirth?: Date;
  contactEmail?: string;
  status: "ACTIVE" | "BLOCKED";
  blockReason?: string;
  blockedAt?: Date;

  positiveRatings: number; // Yêu cầu 2.2
  negativeRatings: number; // Yêu cầu 2.2
  reputationScore: number;

  // Upgraded Account Management
  isUpgradedAccount: boolean; // True nếu account được upgrade từ bidder -> seller
  linkedAccountId?: mongoose.Types.ObjectId; // Link đến account còn lại (bidder <-> seller)

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // 'select: false' để không tự động trả về mật khẩu khi truy vấn
    password: { type: String, required: false, select: false },
    googleId: { type: String, unique: true, sparse: true },
    address: { type: String },
    role: {
      type: String,
      enum: ["bidder", "seller", "admin"],
      default: "bidder",
    },
    avatar: { type: String },
    dateOfBirth: { type: Date },
    contactEmail: { type: String },
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCKED"],
      default: "ACTIVE",
    },
    blockReason: { type: String },
    blockedAt: { type: Date },
    positiveRatings: { type: Number, default: 0 },
    negativeRatings: { type: Number, default: 0 },
    reputationScore: { type: Number, default: 0 },

    // Upgraded Account Management
    isUpgradedAccount: { type: Boolean, default: false },
    linkedAccountId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    // Đảm bảo các thuộc tính ảo được bao gồm khi xuất ra JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash mật khẩu trước khi lưu người dùng
userSchema.pre<IUser>("save", async function (next) {
  // Chỉ chạy khi mật khấu thay đổi
  if (!this.isModified("password")) return next();

  // Băm mật khẩu với cost factor là 10
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// So sánh mật khẩu candidate với mật khẩu đã hash
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Thuộc tính ảo để tính điểm đánh giá
// Thuộc tính ảo để tính điểm đánh giá
// Note: reputationScore converted to stored field for querying
// userSchema.virtual("reputationScore").get(function (this: IUser) {
//   const totalRatings = this.positiveRatings + this.negativeRatings;
//   if (totalRatings === 0) {
//     // Trường hợp chưa được đánh giá
//     return 1.0;
//   }
//   return this.positiveRatings / totalRatings;
// });

export const User = mongoose.model<IUser>("User", userSchema);
