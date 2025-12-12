// ===== STATE =====
let deals = [];
let currentType = "all";
let currentSearch = "";
let currentSort = "default";

// ===== DOM REFERENCES =====
const cardsContainer = document.getElementById("cardsContainer");
const nearbyCountEl = document.getElementById("nearbyCount");
const loadingEl = document.getElementById("loading");
const noResultsEl = document.getElementById("noResults");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");
const sortSelect = document.getElementById("sortSelect");

// ===== RENDERING =====
function createCard(deal) {
  const card = document.createElement("article");
  card.className = "card";

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
  cardsContainer.innerHTML = "";

  if (loadingEl) loadingEl.style.display = "none";

  let filtered = deals.filter((deal) => {
    const matchesType = currentType === "all" || deal.type === currentType;
    const combined = (deal.name + deal.description + deal.badge).toLowerCase();
    const matchesSearch = combined.includes(currentSearch);
    return matchesType && matchesSearch;
  });

  if (currentSort === "discount") {
    filtered = filtered.sort((a, b) => b.discount - a.discount);
  } else if (currentSort === "distance") {
    filtered = filtered.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  filtered.forEach((deal) => {
    cardsContainer.appendChild(createCard(deal));
  });

  nearbyCountEl.textContent = filtered.length;

  if (noResultsEl) {
    noResultsEl.style.display = filtered.length === 0 ? "block" : "none";
  }
}

// ===== DATA LOADING =====
async function loadDeals() {
  if (loadingEl) loadingEl.style.display = "block";

  try {
    const res = await fetch("/api/deals");
    if (!res.ok) throw new Error("Failed to fetch deals");
    deals = await res.json();
  } catch (err) {
    console.error(err);
    deals = [];
  } finally {
    renderDeals();
  }
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
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentType = btn.dataset.type;
    renderDeals();
  });
});

if (searchInput) {
  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value.trim().toLowerCase();
    renderDeals();
  });
}

if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    renderDeals();
  });
}

loadDeals();
