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

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== MONGODB CONNECTION =====
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/salesphere";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// ===== MIDDLEWARE =====
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));
// ===== API ROUTES =====

// GET /api/deals  (supports optional: ?type=&q=&sort=discount|distance)
app.get("/api/deals", async (req, res) => {
  try {
    const { type, q, sort } = req.query;
    const filter = {};

    if (type && type !== "all") {
      filter.type = type;
    }

    if (q) {
      // If text index exists, this will work; otherwise ignore in UI
      filter.$text = { $search: q };
    }

    let query = Deal.find(filter);

    if (sort === "discount") query = query.sort({ discount: -1 });
    else if (sort === "distance") query = query.sort({ distanceKm: 1 });

    const deals = await query.exec();
    res.json(deals);
  } catch (err) {
    console.error("Error loading deals:", err);
    res.status(500).json({ error: "Could not load deals" });
  }
});

// POST /api/deals  (admin / future use)
app.post("/api/deals", async (req, res) => {
  try {
    const body = req.body;

    if (!body.name || !body.type || typeof body.discount === "undefined") {
      return res
        .status(400)
        .json({ error: "name, type and discount are required" });
    }

    const newDeal = await Deal.create({
      name: body.name,
      type: body.type,
      badge: body.badge,
      description: body.description,
      discount: body.discount,
      distanceKm: body.distanceKm,
      rating: body.rating,
      ratingCount: body.ratingCount,
      validText: body.validText,
      image: body.image,
    });

    res.status(201).json(newDeal);
  } catch (err) {
    console.error("Error creating deal:", err);
    res.status(500).json({ error: "Could not create deal" });
  }
});

// POST /api/businesses  – from business form
app.post("/api/businesses", async (req, res) => {
  try {
    const body = req.body;

    if (!body.name || !body.type || !body.email) {
      return res
        .status(400)
        .json({ error: "name, type and email are required fields" });
    }

    const newBiz = await Business.create({
      name: body.name,
      type: body.type,
      area: body.area,
      email: body.email,
      discount: body.discount,
    });

    console.log("New business submission:", newBiz);
    res.status(201).json({ success: true, message: "Submission received." });
  } catch (err) {
    console.error("Error saving business:", err);
    res.status(500).json({ error: "Could not save business submission" });
  }
});

// GET /api/businesses – optional dev inspection
app.get("/api/businesses", async (req, res) => {
  try {
    const list = await Business.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Error loading businesses:", err);
    res.status(500).json({ error: "Could not load business submissions" });
  }
});

// ===== FALLBACK: serve index.html for unknown routes =====
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Salesphere server running on http://localhost:${PORT}`);
});
