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

// ===== Seed deal (also used as fallback if DB is not available)
const BABA_BUDAN = {
  slug: "baba-budan",
  name: "Baba Budan",
  type: "cafe",
  discount: 10,
  badge: "Coffee shop",
  description: "Coffee and food shop",
  validText: "Limited time",
  mapsUrl: "https://maps.app.goo.gl/h3kSiZxWjRSp4cnR6",

  // OK for testing (Baku-ish). You can update later with exact lat/lng.
  lat: 40.372889,
  lng: 49.853181,


  // Put image here: public/img/baba-budan.jpg
  imageUrl: "/img/baba-budan.jpg",
};

let DB_OK = false;
let FALLBACK_DEALS = [BABA_BUDAN];

// ===== DB CONNECT (does NOT crash server if missing)
async function connectDb() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn("⚠️ MONGODB_URI is missing. Using in-memory fallback deals.");
    DB_OK = false;
    return;
  }

  try {
    await mongoose.connect(uri);
    DB_OK = true;
    console.log("✅ Connected to MongoDB");

    // seed once
    const exists = await Deal.findOne({ slug: BABA_BUDAN.slug }).lean();
    if (!exists) {
      await Deal.create(BABA_BUDAN);
      console.log("✅ Seeded deal: Baba Budan");
    } else {
      console.log("ℹ️ Deal already exists: Baba Budan");
    }
  } catch (err) {
    DB_OK = false;
    console.error("❌ MongoDB connection error:", err.message);
    console.warn("⚠️ Using in-memory fallback deals.");
  }
}

await connectDb();

// ===== MIDDLEWARE
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== API ROUTES

// GET /api/deals
app.get("/api/deals", async (req, res) => {
  try {
    const { type, q } = req.query;

    // If DB is not ready, return fallback
    if (!DB_OK) {
      let list = [...FALLBACK_DEALS];

      if (type && type !== "all") list = list.filter((d) => d.type === type);

      if (q) {
        const qq = String(q).trim().toLowerCase();
        list = list.filter((d) =>
          `${d.name} ${d.description} ${d.badge}`.toLowerCase().includes(qq)
        );
      }

      return res.json(list);
    }

    // DB mode
    const filter = {};
    if (type && type !== "all") filter.type = type;

    if (q) {
      const query = String(q).trim();
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { badge: { $regex: query, $options: "i" } },
      ];
    }

    const deals = await Deal.find(filter).sort({ createdAt: -1 }).exec();
    res.json(deals);
  } catch (err) {
    console.error("Error loading deals:", err);
    res.status(500).json({ error: "Could not load deals" });
  }
});

// POST /api/businesses
app.post("/api/businesses", async (req, res) => {
  try {
    if (!DB_OK) {
      return res.status(503).json({ error: "DB not connected yet." });
    }

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
      discount: discount || "",
    });

    res.status(201).json({ success: true, business: created });
  } catch (err) {
    console.error("Error saving business:", err);
    res.status(500).json({ error: "Could not save business submission" });
  }
});

// ===== FALLBACK
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== START SERVER
app.listen(PORT, () => {
  console.log(`✅ Salesphere server running on http://localhost:${PORT}`);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
