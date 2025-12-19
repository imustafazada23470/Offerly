// public/deals.js
let deals = [];
let currentType = "all";
let currentSearch = "";
let currentSort = "default";

const cardsContainer = document.getElementById("cardsContainer");
const nearbyCountEl = document.getElementById("nearbyCount");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const typeChips = document.getElementById("typeChips");

const btnSearch = document.getElementById("btnSearch");
const btnFilter = document.getElementById("btnFilter");
const btnSort = document.getElementById("btnSort");

const btnEnableLocation = document.getElementById("btnEnableLocation");
const locationStatus = document.getElementById("locationStatus");

const NEARBY_RADIUS_KM = 3;
let userLocation = null; // { lat, lng }

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("open");
  el.setAttribute("aria-hidden", "true");
}

document.addEventListener("click", (e) => {
  const closeId = e.target?.getAttribute?.("data-close");
  if (closeId) closeModal(closeId);

  const modal = e.target?.classList?.contains?.("modal");
  if (modal && e.target?.id) closeModal(e.target.id);
});

btnSearch?.addEventListener("click", () => openModal("modalSearch"));
btnFilter?.addEventListener("click", () => openModal("modalFilter"));
btnSort?.addEventListener("click", () => openModal("modalSort"));

searchInput?.addEventListener("input", () => {
  currentSearch = searchInput.value || "";
  render();
});

sortSelect?.addEventListener("change", () => {
  currentSort = sortSelect.value;
  render();
});

typeChips?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-type]");
  if (!btn) return;

  typeChips.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  currentType = btn.dataset.type || "all";
  render();
});

// ===== Distance (Haversine)
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

function computeDistances() {
  if (!userLocation) return;

  for (const d of deals) {
    const lat = Number(d.lat);
    const lng = Number(d.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      d.distanceKm = haversineKm(userLocation, { lat, lng });
    } else {
      d.distanceKm = null;
    }
  }
}

function updateLocationStatus(textOverride) {
  if (!locationStatus) return;

  if (!("geolocation" in navigator)) {
    locationStatus.textContent = "Geolocation not supported in this browser.";
    return;
  }

  if (textOverride) {
    locationStatus.textContent = textOverride;
    return;
  }

  if (userLocation) {
    locationStatus.textContent = `Location enabled • Nearby = within ${NEARBY_RADIUS_KM} km`;
  } else {
    locationStatus.textContent = "Location not enabled.";
  }
}

function loadSavedLocation() {
  try {
    const raw = localStorage.getItem("salesphere_user_location");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
      userLocation = { lat: parsed.lat, lng: parsed.lng };
    }
  } catch {}
}

function requestLocation() {
  if (!("geolocation" in navigator)) {
    locationStatus.textContent = "Geolocation not supported.";
    return;
  }

  locationStatus.textContent = "Getting your location…";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      const accM = Math.round(pos.coords.accuracy || 0);

      localStorage.setItem("salesphere_user_location", JSON.stringify(userLocation));

      computeDistances();
      render();

      locationStatus.textContent =
        `Location enabled • Accuracy ≈ ${accM} m • Nearby = within ${NEARBY_RADIUS_KM} km`;
    },
    (err) => {
      locationStatus.textContent =
        err?.code === 1
          ? "Location denied. Enable it in browser settings."
          : "Couldn’t get your location.";
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0, // force fresh GPS/Wi-Fi reading
    }
  );
}



btnEnableLocation?.addEventListener("click", requestLocation);

// ===== UI
function createCard(deal) {
  const safeName = escapeHtml(deal.name);
  const safeBadge = escapeHtml(deal.badge);
  const safeDesc = escapeHtml(deal.description);
  const safeValid = escapeHtml(deal.validText);

  const discount = Number(deal.discount ?? 0);

  const hasDistance = Number.isFinite(deal.distanceKm);
  const distanceText = hasDistance ? `${deal.distanceKm.toFixed(1)} km away` : "Distance unavailable";

  const img = deal.imageUrl
    ? `<img class="card-img" src="${escapeHtml(deal.imageUrl)}" alt="${safeName} logo">`
    : "";

  const mapsBtn = deal.mapsUrl
    ? `<a class="btn small" href="${escapeHtml(deal.mapsUrl)}" target="_blank" rel="noreferrer">Open map</a>`
    : "";

  const card = document.createElement("article");
  card.className = "card";

  card.innerHTML = `
    <div class="card-top">
      ${img}
      <div class="card-main">
        <div class="card-title-row">
          <h3 class="card-title">${safeName}</h3>
          <span class="pill">-${discount}%</span>
        </div>
        <div class="card-sub">${safeBadge}</div>
        <p class="card-desc">${safeDesc}</p>

        <div class="card-meta">
          <span>${hasDistance ? `<strong>${escapeHtml(distanceText)}</strong>` : escapeHtml(distanceText)}</span>
          <span>${safeValid}</span>
        </div>

        <div class="card-actions">
          ${mapsBtn}
        </div>
      </div>
    </div>
  `;
  return card;
}

function getNearbyCount(list) {
  if (!userLocation) return 0;
  return list.filter((d) => Number.isFinite(d.distanceKm) && d.distanceKm <= NEARBY_RADIUS_KM).length;
}

function render() {
  if (!cardsContainer || !nearbyCountEl) return;
  cardsContainer.innerHTML = "";

  let filtered = deals.filter((d) => {
    const matchesType = currentType === "all" || d.type === currentType;

    const content = ((d.name || "") + (d.description || "") + (d.badge || "")).toLowerCase();
    const q = currentSearch.trim().toLowerCase();
    const matchesSearch = !q || content.includes(q);

    return matchesType && matchesSearch;
  });

  if (currentSort === "discount") {
    filtered = filtered.slice().sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
  } else if (currentSort === "distance") {
    filtered = filtered.slice().sort((a, b) => {
      const ad = Number.isFinite(a.distanceKm) ? a.distanceKm : Infinity;
      const bd = Number.isFinite(b.distanceKm) ? b.distanceKm : Infinity;
      return ad - bd;
    });
  }

  nearbyCountEl.textContent = String(getNearbyCount(filtered));

  if (filtered.length === 0) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  filtered.forEach((d) => cardsContainer.appendChild(createCard(d)));
}

async function loadDeals() {
  try {
    const res = await fetch("/api/deals", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch deals");
    const data = await res.json();
    deals = Array.isArray(data) ? data : [];
  } catch {
    deals = [];
  } finally {
    computeDistances();
    render();
  }
}

// Boot
loadSavedLocation();
updateLocationStatus();
loadDeals();
