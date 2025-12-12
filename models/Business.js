// models/Business.js
import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["cafe", "restaurant", "cinema", "other"],
    },
    area: { type: String, default: "" },
    email: { type: String, required: true, trim: true },
    discount: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Business =
  mongoose.models.Business || mongoose.model("Business", businessSchema);
