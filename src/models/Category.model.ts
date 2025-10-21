import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  id: string;
  name: {
    ar: string;
    en?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      ar: {
        type: String,
        required: true,
        trim: true,
      },
      en: {
        type: String,
        trim: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
CategorySchema.index({ isActive: 1 });

export default mongoose.model<ICategory>("Category", CategorySchema);