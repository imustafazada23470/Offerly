// ===== DATA =====
const deals = [
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

// ===== DOM REFERENCES =====
const cardsContainer = document.getElementById("cardsContainer");
const nearbyCountEl = document.getElementById("nearbyCount");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");
const sortSelect = document.getElementById("sortSelect");

// State
let currentType = "all";
let currentSearch = "";
let currentSort = "default";

// ===== RENDERING =====
function createCard(deal) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.type = deal.type;
  card.dataset.discount = String(deal.discount);
  card.dataset.distance = String(deal.distanceKm);

  card.innerHTML = `
    <div class="card-top">
      <img class="card-img" src="${deal.image}" alt="${deal.name}" />
      <div class="card-main">
        <div class="card-header-row">
          <h3 class="card-title">${deal.name}</h3>
          <span class="badge">${deal.badge}</span>
        </div>
        <p class="card-desc">${deal.description}</p>
        <div class="card-meta-row">
          <div class="meta-left">
            <div class="meta-row"><strong>${deal.distanceKm.toFixed(
              1
            )} km</strong> away</div>
            <div class="meta-row">${deal.validText}</div>
          </div>
          <div class="discount-pill">-${deal.discount}%</div>
        </div>
      </div>
    </div>
    <div class="card-footer">
      <div class="rating">★ ${deal.rating.toFixed(1)} · ${
    deal.ratingCount
  } reviews</div>
      <button class="card-cta-btn">View deal</button>
    </div>
  `;

  return card;
}

function renderDeals() {
  if (!cardsContainer || !nearbyCountEl) return;

  cardsContainer.innerHTML = "";

  let filtered = deals.filter((deal) => {
    const matchesType = currentType === "all" || deal.type === currentType;
    const content = (deal.name + deal.description + deal.badge).toLowerCase();
    const matchesSearch = !currentSearch || content.includes(currentSearch);
    return matchesType && matchesSearch;
  });

  if (currentSort === "discount") {
    filtered = filtered.slice().sort((a, b) => b.discount - a.discount);
  } else if (currentSort === "distance") {
    filtered = filtered.slice().sort((a, b) => a.distanceKm - b.distanceKm);
  }

  filtered.forEach((deal) => {
    const card = createCard(deal);
    cardsContainer.appendChild(card);
  });

  nearbyCountEl.textContent = String(filtered.length);
}

// ===== EVENT HANDLERS =====

// Category filters
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentType = btn.dataset.type || "all";
    renderDeals();
  });
});

// Search
if (searchInput) {
  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value.trim().toLowerCase();
    renderDeals();
  });
}

// Sort
if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    renderDeals();
  });
}

// Initial render on homepage
renderDeals();
