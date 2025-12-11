// ===== STATE (no hardcoded data here) =====
let deals = [];
let currentType = "all";
let currentSearch = "";
let currentSort = "default";

// ===== DOM REFERENCES =====
const cardsContainer = document.getElementById("cardsContainer");
const nearbyCountEl = document.getElementById("nearbyCount");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");
const sortSelect = document.getElementById("sortSelect");

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

// ===== FETCH DATA FROM BACKEND =====
async function loadDeals() {
  try {
    const res = await fetch("/api/deals");
    if (!res.ok) throw new Error("Failed to fetch deals");
    const data = await res.json();
    deals = data;
  } catch (err) {
    console.error("Error loading deals:", err);
    // fallback: empty list (you could also paste your old hardcoded deals here if you want)
    deals = [];
  } finally {
    renderDeals();
  }
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

// ===== INIT =====
loadDeals();
