// models/Deal.js
import mongoose from "mongoose";

const DealSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["cafe", "restaurant", "cinema", "other"],
      required: true,
    },
    discount: { type: Number, default: 0 },
    badge: { type: String, default: "" },
    description: { type: String, default: "" },
    validText: { type: String, default: "" },

    // Location
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },

    // Links/media
    mapsUrl: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Deal = mongoose.model("Deal", DealSchema);
