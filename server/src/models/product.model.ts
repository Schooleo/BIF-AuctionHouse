import mongoose, { Document, Schema, Types } from "mongoose";

// Định nghĩa interface cho QA (1.5)
export interface IQuestionAnswer extends Types.Subdocument {
  question: string;
  questioner: Types.ObjectId;
  askedAt: Date;
  answer?: string;
  answeredAt?: Date;
}

// Định nghĩa Schema cho QA
const QuestionAnswerSchema = new Schema<IQuestionAnswer>({
  question: { type: String, required: true },
  questioner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  askedAt: { type: Date, default: Date.now },
  answer: { type: String },
  answeredAt: { type: Date },
});

// Sub-document để update description (3.2)
export interface IDescriptionUpdate extends Types.Subdocument {
  content: string;
  updatedAt: Date;
}

const DescriptionUpdateSchema = new Schema<IDescriptionUpdate>({
  content: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

// Interface của product
export interface IProduct extends Document {
  name: string;
  category: Types.ObjectId;
  seller: Types.ObjectId;
  mainImage: string;
  subImages: string[]; // Tối thiểu 3 ảnh (3.1)
  description: string;
  descriptionHistory: IDescriptionUpdate[]; // Bổ sung mô tả (3.2)
  startTime: Date;
  endTime: Date;
  startingPrice: number;
  stepPrice: number; // Bước giá (3.1)
  buyNowPrice?: number; // Giá mua ngay (nếu có) (3/1)
  autoExtends: boolean; // Tự động gia hạn (3.1)

  // Dữ liệu đáu giá trực tiếp
  currentPrice: number;
  currentBidder?: Types.ObjectId;
  bidCount: number;

  // Embedded Q&A
  questions: IQuestionAnswer[];
}

// Schema cho product
const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mainImage: { type: String, required: true },
    subImages: {
      type: [String],
      required: true,
      validate: [(val: string[]) => val.length >= 3, "Phải có ít nhất 3 ảnh"],
    },
    description: { type: String, required: true },
    descriptionHistory: { type: [DescriptionUpdateSchema], default: [] },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, required: true },
    startingPrice: { type: Number, required: true },
    stepPrice: { type: Number, required: true },
    buyNowPrice: { type: Number },
    autoExtends: { type: Boolean, default: false },

    // Dữ liệu đáu giá trực tiếp cho truy vấn
    currentPrice: { type: Number }, // No longer required here, set in `pre` hook
    currentBidder: { type: Schema.Types.ObjectId, ref: "User" },
    bidCount: { type: Number, default: 0 },

    // Embedded Q&A
    questions: { type: [QuestionAnswerSchema], default: [] },
  },
  { timestamps: true }
);

// Khởi tạo currentPrice bằng startingPrice
productSchema.pre<IProduct>("validate", function (next) {
  if (this.isNew) {
    this.currentPrice = this.startingPrice;
  }
  next();
});

// Thêm Full-Text Search (1.4)
productSchema.index({ name: "text", description: "text" });
productSchema.index({ endTime: 1 });
productSchema.index({ currentPrice: -1 });

export const Product = mongoose.model<IProduct>("Product", productSchema);
