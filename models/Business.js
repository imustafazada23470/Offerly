// models/Business.js
import mongoose from "mongoose";

const BusinessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    email: { type: String, required: true },
    area: { type: String, default: "" },
    discount: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Business = mongoose.model("Business", BusinessSchema);
