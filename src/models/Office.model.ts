import mongoose, { Schema, Document } from "mongoose";
import { OfficeCategory } from "../types";

interface ISubService {
  _id?: mongoose.Types.ObjectId;
  title: string;
  price: number;
  isActive: boolean;
}

interface IService {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  imageUrl?: string;
  basePrice: number;
  isActive: boolean;
  subServices: ISubService[];
  createdAt: Date;
  updatedAt: Date;
}

interface IContact {
  phone: string;
  whatsapp?: string;
}

interface ISocials {
  facebook?: string;
  x?: string;
  linkedin?: string;
  snapchat?: string;
}

interface IStats {
  profileViews: number;
  contactClicks: number;
  bookmarks: number;
}

interface ILocation {
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IOffice extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  city: string;
  category: OfficeCategory;
  rating: number;
  ratingCount: number;
  isFeatured: boolean;
  featuredPriority: number;
  avatarUrl?: string;
  coverUrl?: string;
  verified: boolean;
  summary?: string;
  licenseImageUrl?: string;
  address?: string;
  location?: ILocation;
  contact: IContact;
  socials?: ISocials;
  services: IService[];
  stats: IStats;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubServiceSchema = new Schema<ISubService>({
  title: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true },
});

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    basePrice: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    subServices: [SubServiceSchema],
  },
  {
    timestamps: true,
  }
);

const ContactSchema = new Schema<IContact>({
  phone: { type: String, required: true },
  whatsapp: { type: String },
});

const SocialsSchema = new Schema<ISocials>({
  facebook: { type: String },
  x: { type: String },
  linkedin: { type: String },
  snapchat: { type: String },
});

const StatsSchema = new Schema<IStats>({
  profileViews: { type: Number, default: 0 },
  contactClicks: { type: Number, default: 0 },
  bookmarks: { type: Number, default: 0 },
});

const LocationSchema = new Schema<ILocation>({
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function (v: number[]) {
        return (
          v.length === 2 &&
          v[0] >= -180 &&
          v[0] <= 180 &&
          v[1] >= -90 &&
          v[1] <= 90
        );
      },
      message: "Invalid coordinates. Must be [longitude, latitude]",
    },
  },
});

const OfficeSchema = new Schema<IOffice>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    city: { type: String, required: true },
    category: {
      type: String,
      enum: Object.values(OfficeCategory),
      required: true,
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false },
    featuredPriority: { type: Number, default: 0 },
    avatarUrl: { type: String },
    coverUrl: { type: String },
    verified: { type: Boolean, default: false },
    summary: { type: String },
    licenseImageUrl: { type: String },
    address: { type: String },
    location: LocationSchema,
    contact: { type: ContactSchema, required: true },
    socials: SocialsSchema,
    services: [ServiceSchema],
    stats: { type: StatsSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
OfficeSchema.index({ location: "2dsphere" });
OfficeSchema.index({ city: 1, category: 1, isActive: 1 });
OfficeSchema.index({ isFeatured: 1, featuredPriority: -1 });
OfficeSchema.index({ rating: -1, ratingCount: -1 });
OfficeSchema.index({ companyId: 1 });
OfficeSchema.index({
  city: 1,
  category: 1,
  isActive: 1,
  isFeatured: -1,
  rating: -1,
});

// Text search index
OfficeSchema.index(
  {
    name: "text",
    summary: "text",
    city: "text",
  },
  {
    weights: { name: 10, summary: 5, city: 3 },
    name: "office_text_search",
  }
);

export default mongoose.model<IOffice>("Office", OfficeSchema);
