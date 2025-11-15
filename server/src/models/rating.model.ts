import mongoose, { Document, Schema, Types, Query } from "mongoose";
import { User } from "./user.model"; // Import để cập nhật User

export interface IRating extends Document {
  product: Types.ObjectId;
  rater: Types.ObjectId; // Người viết đánh giá
  ratee: Types.ObjectId; // Người nhận đánh giá
  score: 1 | -1; // +1 hoặc -1
  comment: string;
}

const ratingSchema = new Schema<IRating>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rater: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ratee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, enum: [1, -1], required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

// Hàm hỗ trợ cập nhật điểm đánh giá người dùng
async function updateUserReputation(doc: IRating, incrementBy: 1 | -1) {
    try {
        const fieldToUpdate = doc.score === 1 ? "positiveRatings" : "negativeRatings";

        await User.findByIdAndUpdate(doc.ratee, {
            $inc: { [fieldToUpdate]: incrementBy },
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật điểm đánh giá người dùng:", error);
    }
}

// Hook 'post-save' để cập nhật điểm đánh giá
ratingSchema.post<IRating>("save", function () {
    updateUserReputation(this, 1);
});

// Hook để giảm điểm đánh giá nếu xóa đánh giá
ratingSchema.post<IRating>("findOneAndDelete", async function (doc: IRating | null) {
    if (doc) {
        updateUserReputation(doc, -1);
    }
});


export const Rating = mongoose.model<IRating>("Rating", ratingSchema);