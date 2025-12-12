// models/Deal.js
import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["cafe", "restaurant", "cinema", "other"],
    },
    badge: { type: String, default: "" },
    description: { type: String, default: "" },
    discount: { type: Number, min: 0, max: 100, required: true },
    distanceKm: { type: Number, min: 0, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, min: 0, default: 0 },
    validText: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

// Optional text index if you ever want Mongo search
dealSchema.index({ name: "text", description: "text", badge: "text" });

export const Deal = mongoose.models.Deal || mongoose.model("Deal", dealSchema);
