// server.js
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static frontend from /public
app.use(express.static(path.join(__dirname, "public")));

// ----- In-memory data (for demo) -----
let deals = [
  {
    id: 1,
    name: "CoffeeGo",
    type: "cafe",
    badge: "Coffee • Snacks",
    description: "20% off all drinks for students after 5 PM.",
    discount: 20,
    distanceKm: 0.4,
    rating: 4.7,
    ratingCount: 126,
    validText: "Today • 17:00-22:00",
    image:
      "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 2,
    name: "Sunset Diner",
    type: "restaurant",
    badge: "Burgers • Grill",
    description: "Buy 1 get 1 free on all burgers.",
    discount: 50,
    distanceKm: 1.2,
    rating: 4.5,
    ratingCount: 89,
    validText: "This week only",
    image:
      "https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 3,
    name: "Nova Cinema",
    type: "cinema",
    badge: "Cinema",
    description: "Student tickets for 6 AZN on weekdays.",
    discount: 30,
    distanceKm: 2.1,
    rating: 4.3,
    ratingCount: 241,
    validText: "Weekdays • until 18:00",
    image:
      "https://images.pexels.com/photos/7991520/pexels-photo-7991520.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 4,
    name: "Green Bowl",
    type: "restaurant",
    badge: "Healthy • Salad",
    description: "15% off on bowls when you order 2 or more.",
    discount: 15,
    distanceKm: 0.7,
    rating: 4.8,
    ratingCount: 63,
    validText: "Everyday • 12:00-21:00",
    image:
      "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 5,
    name: "Pixel Arcade",
    type: "other",
    badge: "Arcade • VR",
    description: "3 games for the price of 2.",
    discount: 33,
    distanceKm: 1.9,
    rating: 4.2,
    ratingCount: 54,
    validText: "Weekends only",
    image:
      "https://images.pexels.com/photos/1857152/pexels-photo-1857152.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 6,
    name: "Midnight Café",
    type: "cafe",
    badge: "Late night coffee",
    description: "Free dessert with any drink after 21:00.",
    discount: 25,
    distanceKm: 0.3,
    rating: 4.6,
    ratingCount: 102,
    validText: "Fri-Sun • 21:00-01:00",
    image:
      "https://images.pexels.com/photos/4352247/pexels-photo-4352247.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

let businessSubmissions = [];

// ----- API ROUTES -----

// GET /api/deals  → return all deals (later you can add query filters)
app.get("/api/deals", (req, res) => {
  res.json(deals);
});

// POST /api/deals  → (optional) add a new deal from some admin UI later
app.post("/api/deals", (req, res) => {
  const body = req.body;
  if (!body.name || !body.type) {
    return res.status(400).json({ error: "name and type are required" });
  }

  const newDeal = {
    id: deals.length ? deals[deals.length - 1].id + 1 : 1,
    name: body.name,
    type: body.type, // cafe / restaurant / cinema / other
    badge: body.badge || "",
    description: body.description || "",
    discount: Number(body.discount) || 0,
    distanceKm: Number(body.distanceKm) || 0,
    rating: Number(body.rating) || 0,
    ratingCount: Number(body.ratingCount) || 0,
    validText: body.validText || "",
    image: body.image || "",
  };

  deals.push(newDeal);
  res.status(201).json(newDeal);
});

// POST /api/businesses  → handle "Join as a partner" form
app.post("/api/businesses", (req, res) => {
  const body = req.body;

  if (!body.name || !body.type || !body.email) {
    return res
      .status(400)
      .json({ error: "name, type and email are required fields" });
  }

  const newBusiness = {
    id: businessSubmissions.length
      ? businessSubmissions[businessSubmissions.length - 1].id + 1
      : 1,
    name: body.name,
    type: body.type,
    area: body.area || "",
    email: body.email,
    discount: body.discount || "",
    createdAt: new Date().toISOString(),
  };

  businessSubmissions.push(newBusiness);

  console.log("New business submission:", newBusiness);

  res.status(201).json({ success: true, message: "Submission received." });
});

// (optional) GET /api/businesses – for you to inspect in development
app.get("/api/businesses", (req, res) => {
  res.json(businessSubmissions);
});

// ----- START SERVER -----
app.listen(PORT, () => {
  console.log(`Salesphere server running on http://localhost:${PORT}`);
});
