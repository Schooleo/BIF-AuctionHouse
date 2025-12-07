import mongoose, { Document, Schema, Types } from 'mongoose';
import { User } from './user.model';

export interface IRating extends Document {
  type: 'seller' | 'bidder'; // seller = bidder đánh giá seller, bidder = seller đánh giá bidder
  rater: Types.ObjectId; // Người viết đánh giá
  ratee: Types.ObjectId; // Người nhận đánh giá
  score: 1 | -1; // +1 hoặc -1
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<IRating>(
  {
    type: {
      type: String,
      enum: ['seller', 'bidder'],
      required: true,
    },
    rater: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ratee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, enum: [1, -1], required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

// Index unique: 1 người chỉ đánh giá 1 người (theo type) 1 lần
ratingSchema.index({ type: 1, rater: 1, ratee: 1 }, { unique: true });

// Hàm hỗ trợ cập nhật điểm đánh giá người dùng
async function updateUserReputation(doc: IRating, incrementBy: 1 | -1) {
  try {
    const fieldToUpdate = doc.score === 1 ? 'positiveRatings' : 'negativeRatings';

    await User.findByIdAndUpdate(doc.ratee, {
      $inc: { [fieldToUpdate]: incrementBy },
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật điểm đánh giá người dùng:', error);
  }
}

// Hook sau khi save - chạy cho cả .save() và .create()
ratingSchema.post('save', async function (doc: IRating) {
  await updateUserReputation(doc, 1);
});

// Hook cho insertMany (khi dùng .create() với array)
ratingSchema.post('insertMany', async function (docs: IRating[]) {
  for (const doc of docs) {
    await updateUserReputation(doc, 1);
  }
});

// Hook để giảm điểm đánh giá khi XÓA
ratingSchema.post('findOneAndDelete', async function (doc: IRating | null) {
  if (doc) {
    await updateUserReputation(doc, -1);
  }
});

export const Rating = mongoose.model<IRating>('Rating', ratingSchema);
