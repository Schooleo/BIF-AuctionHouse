import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage {
  _id?: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  timestamp: Date;
  isImage?: boolean; // If true, content is URL
}

export interface IChat extends Document {
  participants: Types.ObjectId[]; // Usually [Bidder, Seller]
  product: Types.ObjectId;
  order?: Types.ObjectId;

  messages: IMessage[];

  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isImage: { type: Boolean, default: false },
});

const chatSchema = new Schema<IChat>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

export const Chat = mongoose.model<IChat>("Chat", chatSchema);
