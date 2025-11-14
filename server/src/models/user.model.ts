import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  address: string;
  role: "bidder" | "seller" | "admin"; 

  positiveRatings: number; // Yêu cầu 2.2 
  negativeRatings: number; // Yêu cầu 2.2

  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  // Thuộc tính ảo
  reputationScore: number;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // 'select: false' để không tự động trả về mật khẩu khi truy vấn
    password: { type: String, required: true, select: false }, 
    address: { type: String },
    role: { type: String, enum: ["bidder", "seller", "admin"], default: "bidder" },
    positiveRatings: { type: Number, default: 0 },
    negativeRatings: { type: Number, default: 0 },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { 
    timestamps: true,
    // Đảm bảo các thuộc tính ảo được bao gồm khi xuất ra JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash mật khẩu trước khi lưu người dùng mới
userSchema.pre<IUser>("save", async function (next) {
  // Chỉ chạy khi mật khấu thay đổi
  if (!this.isModified("password")) return next();

  // Băm mật khẩu với cost factor là 10
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // Xóa các trường token reset mật khẩu nếu mật khẩu được thay đổi
  delete this.resetPasswordToken;
  delete this.resetPasswordExpires;
  next();
});

// So sánh mật khẩu candidate với mật khẩu đã hash
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method token reset mật khẩu
userSchema.methods.generatePasswordResetToken = function (): string {
  // 1. Tạo raw token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 2. Hash token và lưu vào cơ sở dữ liệu
  this.resetPasswordToken = crypto
   .createHash("sha256")
   .update(resetToken)
   .digest("hex");

  // 3. Đặt timeout (10p)
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

  // 4. Return raw token
  return resetToken;
};

// Thuộc tính ảo để tính điểm đánh giá
userSchema.virtual("reputationScore").get(function (this: IUser) {
  const totalRatings = this.positiveRatings + this.negativeRatings;
  if (totalRatings === 0) {
    // Trường hợp chưa được đánh giá
    return 1.0; 
  }
  return this.positiveRatings / totalRatings;
});

export const User = mongoose.model<IUser>("User", userSchema);
