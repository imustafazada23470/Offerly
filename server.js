// server.js
import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

import { Deal } from "./models/Deal.js";
import { Business } from "./models/Business.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== DB CONNECT =====
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ===== MIDDLEWARE =====
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// ===== API ROUTES =====

// GET /api/deals (optional: ?type=&q=&sort=discount|distance)
app.get("/api/deals", async (req, res) => {
  try {
    const { type, q, sort } = req.query;

    const filter = {};

    if (type && type !== "all") filter.type = type;

    if (q) {
      const query = String(q).trim();
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { badge: { $regex: query, $options: "i" } }
      ];
    }

    let query = Deal.find(filter);

    if (sort === "discount") query = query.sort({ discount: -1 });
    if (sort === "distance") query = query.sort({ distanceKm: 1 });

    const deals = await query.exec();
    res.json(deals);
  } catch (err) {
    console.error("Error loading deals:", err);
    res.status(500).json({ error: "Could not load deals" });
  }
});

// POST /api/businesses
app.post("/api/businesses", async (req, res) => {
  try {
    const { name, type, email, area, discount } = req.body;

    if (!name || !type || !email) {
      return res
        .status(400)
        .json({ error: "name, type and email are required fields" });
    }

    const created = await Business.create({
      name,
      type,
      email,
      area: area || "",
      discount: discount || ""
    });

    res.status(201).json({ success: true, business: created });
  } catch (err) {
    console.error("Error saving business:", err);
    res.status(500).json({ error: "Could not save business submission" });
  }
});

// (optional) GET /api/businesses
app.get("/api/businesses", async (req, res) => {
  try {
    const list = await Business.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Error loading businesses:", err);
    res.status(500).json({ error: "Could not load business submissions" });
  }
});

// ===== FALLBACK (NO app.get("*") in Express 5) =====
// If request is not API and not a real static file, return index.html
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Salesphere server running on http://localhost:${PORT}`);
});
