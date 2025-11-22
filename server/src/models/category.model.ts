import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  parent: ICategory["_id"] | null; // Có thể là null cho category cấp 1
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    // Reference cho category 2 cấp
    // "Điện thoại di động" -> parent: (ObjectId của "Điện tử")
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>("Category", categorySchema);
