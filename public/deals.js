// public/deals.js
let deals = [];
let currentType = "all";
let currentSearch = "";
let currentSort = "default";
let nearbyOnly = false;

const cardsContainer = document.getElementById("cardsContainer");
const nearbyCountEl = document.getElementById("nearbyCount");
const emptyState = document.getElementById("emptyState");

const activeFiltersEl = document.getElementById("activeFilters");
const btnNearbyToggle = document.getElementById("btnNearbyToggle");

// Favorites
const FAVORITES_KEY = "offerly_favorites_v1";
let favorites = new Set();
// Redeem attribution (MVP)
const REDEEM_KEY = "offerly_redeem_v1";
let redeemStore = {};

function generateOneTimeCode(businessName) {
  const prefix = String(businessName || "OFR")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(3, "X");

  // 6 digits + short random to reduce collisions. (Still MVP: no backend.)
  const digits = Math.floor(100000 + Math.random() * 900000);
  const extra = Math.floor(10 + Math.random() * 90); // 2 digits
  return `${prefix}-${digits}-${extra}`;
}


function loadRedeemStore() {
  try {
    redeemStore = JSON.parse(localStorage.getItem(REDEEM_KEY) || "{}") || {};
  } catch {
    redeemStore = {};
  }
}

function saveRedeemStore() {
  try {
    localStorage.setItem(REDEEM_KEY, JSON.stringify(redeemStore));
  } catch {}
}

function getRedeemRec(key) {
  return redeemStore[key] || { copies: 0, usedCount: 0, lastReport: null, code: "" };
}

function setRedeemRec(key, rec) {
  redeemStore[key] = rec;
  saveRedeemStore();
}

function generateBusinessCode(deal) {
  const direct = deal?.couponCode || deal?.code || deal?.coupon || deal?.promoCode;
  if (direct) return String(direct).trim().toUpperCase();

  const discount = Number(deal?.discount ?? 0);
  const name = String(deal?.name || "DEAL").trim();
  const parts = name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);

  let token = (parts[0] || "DEAL").slice(0, 4).toUpperCase();
  if (token.length < 4 && parts[1]) token = (token + parts[1].slice(0, 4 - token.length)).toUpperCase();

  const suffix = Number.isFinite(discount) && discount > 0 ? String(Math.round(discount)) : "";
  return token + suffix;
}

function newReportId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}


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


function dealKey(deal) {
  // Prefer stable IDs if backend provides them
  return String(deal?.id ?? deal?._id ?? `${deal?.type ?? "deal"}::${deal?.name ?? ""}::${deal?.badge ?? ""}`.toLowerCase());
}

function findDealByKey(key) {
  const k = String(key);
  return deals.find((d) => dealKey(d) === k) || null;
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) favorites = new Set(arr.map(String));
  } catch {}
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  } catch {}
}

function isFavorite(key) {
  return favorites.has(String(key));
}

function toggleFavorite(key) {
  const k = String(key);
  if (favorites.has(k)) favorites.delete(k);
  else favorites.add(k);
  saveFavorites();
}

function prettyType(type) {
  const t = String(type || "").toLowerCase();
  if (t === "cafe") return "Café";
  if (t === "restaurant") return "Restaurant";
  if (t === "cinema") return "Cinema";
  if (t === "other") return "Other";
  if (t === "saved") return "Saved";
  return "Deal";
}

function setNearbyPressed() {
  if (!btnNearbyToggle) return;
  btnNearbyToggle.setAttribute("aria-pressed", nearbyOnly ? "true" : "false");
  btnNearbyToggle.classList.toggle("active", nearbyOnly);
  btnNearbyToggle.title = nearbyOnly ? "Showing nearby deals only" : "Show only nearby deals";
}

function setChipActive(type) {
  if (!typeChips) return;
  typeChips.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  const btn = typeChips.querySelector(`.chip[data-type="${type}"]`) || typeChips.querySelector('.chip[data-type="all"]');
  btn?.classList?.add("active");
}

function updateActiveFiltersBar() {
  if (!activeFiltersEl) return;

  const chips = [];

  const q = currentSearch.trim();
  if (q) chips.push({ label: `Search: "${q}"`, clear: () => { currentSearch = ""; if (searchInput) searchInput.value = ""; } });

  if (currentType && currentType !== "all") {
    const label = currentType === "saved" ? "Saved" : `Category: ${prettyType(currentType)}`;
    chips.push({ label, clear: () => { currentType = "all"; setChipActive("all"); } });
  }

  if (nearbyOnly) {
    chips.push({ label: `Nearby (≤ ${NEARBY_RADIUS_KM} km)`, clear: () => { nearbyOnly = false; setNearbyPressed(); } });
  }

  if (currentSort && currentSort !== "default") {
    const label = currentSort === "discount" ? "Sort: Highest discount" : "Sort: Closest";
    chips.push({ label, clear: () => { currentSort = "default"; if (sortSelect) sortSelect.value = "default"; } });
  }

  activeFiltersEl.innerHTML = "";
  if (!chips.length) {
    activeFiltersEl.hidden = true;
    return;
  }

  activeFiltersEl.hidden = false;

  const wrap = document.createElement("div");
  wrap.className = "active-filters-wrap";

  chips.forEach((c) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "af-chip";
    el.innerHTML = `<span>${escapeHtml(c.label)}</span><span class="af-x" aria-hidden="true">✕</span>`;
    el.addEventListener("click", () => {
      c.clear();
      render();
    });
    wrap.appendChild(el);
  });

  const clearAll = document.createElement("button");
  clearAll.type = "button";
  clearAll.className = "af-clear";
  clearAll.textContent = "Clear all";
  clearAll.addEventListener("click", () => {
    currentSearch = "";
    if (searchInput) searchInput.value = "";
    currentType = "all";
    setChipActive("all");
    nearbyOnly = false;
    setNearbyPressed();
    currentSort = "default";
    if (sortSelect) sortSelect.value = "default";
    render();
  });

  activeFiltersEl.appendChild(wrap);
  activeFiltersEl.appendChild(clearAll);
}

function openDealModal(deal) {
  const modal = document.getElementById("modalDeal");
  if (!modal) return;

  const key = dealKey(deal);

  const titleEl = document.getElementById("dealModalTitle");
  const logoEl = document.getElementById("dealModalLogo");
  const typeEl = document.getElementById("dealModalType");
  const badgeEl = document.getElementById("dealModalBadge");
  const descEl = document.getElementById("dealModalDesc");
  const discountEl = document.getElementById("dealModalDiscount");
  const distEl = document.getElementById("dealModalDistance");
  const validEl = document.getElementById("dealModalValid");
  const termsEl = document.getElementById("dealModalTerms");
  const mapBtn = document.getElementById("dealModalMapBtn");
  const saveBtn = document.getElementById("dealModalSaveBtn");
  const codeEl = document.getElementById("dealModalCode");
  const copyBtn = document.getElementById("dealModalCopyBtn");
  const usedBtn = document.getElementById("dealModalUsedBtn");
  const usedStatusEl = document.getElementById("dealModalUsedStatus");
  const codeHintEl = document.getElementById("dealModalCodeHint");

  if (titleEl) titleEl.textContent = deal?.name || "Deal details";

  if (logoEl) {
    if (deal?.imageUrl) {
      logoEl.src = deal.imageUrl;
      logoEl.alt = (deal?.name || "Deal") + " logo";
      logoEl.hidden = false;
    } else {
      logoEl.hidden = true;
    }
  }

  if (typeEl) typeEl.textContent = prettyType(deal?.type);
  if (badgeEl) badgeEl.textContent = deal?.badge || "";
  if (descEl) descEl.textContent = deal?.description || "";

  const discount = Number(deal?.discount ?? 0);
  if (discountEl) discountEl.textContent = Number.isFinite(discount) ? `-${discount}%` : "—";

  const hasDistance = Number.isFinite(deal?.distanceKm);
  if (distEl) distEl.textContent = hasDistance ? `${deal.distanceKm.toFixed(1)} km away` : "Distance unavailable";

  const valid = deal?.validUntil ? String(deal.validUntil) : "";
  if (validEl) validEl.textContent = valid ? `Until ${valid}` : "Limited time";

  const terms = deal?.terms ? String(deal.terms) : "No extra terms provided.";
  if (termsEl) termsEl.textContent = terms;

  if (mapBtn) {
    if (deal?.mapsUrl) {
      mapBtn.href = deal.mapsUrl;
      mapBtn.classList.remove("disabled");
      mapBtn.removeAttribute("aria-disabled");
    } else {
      mapBtn.href = "#";
      mapBtn.classList.add("disabled");
      mapBtn.setAttribute("aria-disabled", "true");
    }
  }

  if (saveBtn) {
    const fav = isFavorite(key);
    saveBtn.textLeading = "0";
    saveBtn.textContent = fav ? "♥ Saved" : "♡ Save";
    saveBtn.onclick = () => {
      toggleFavorite(key);
      saveBtn.textContent = isFavorite(key) ? "♥ Saved" : "♡ Save";
      render(); // refresh cards + counts
    };
  }


// Use deal attribution (one-time code + self-report)
  const useBtn = document.getElementById("dealModalUseBtn");
  const useStatusEl = document.getElementById("dealModalUseStatus");

  const baseHint =
    "Tap “Use deal” to generate your one-time Offerly code. Show it at checkout so the business knows you came from Offerly.";

  const syncHint = () => {
    const r = getRedeemRec(key);
    const uses = Number(r.usedCount || 0);
    if (codeHintEl) {
      codeHintEl.textContent = baseHint + (uses ? ` Self-reported uses: ${uses}.` : "");
    }
  };

  // Reset UI each time modal opens
  if (codeEl) codeEl.textContent = "—";
  if (copyBtn) copyBtn.disabled = true;
  if (usedBtn) usedBtn.disabled = true;
  if (useStatusEl) useStatusEl.textContent = "";

  syncHint();

  const rec = getRedeemRec(key);

  if (usedStatusEl) {
    if (rec.lastReport?.id && rec.lastReport?.ts) {
      usedStatusEl.textContent = `Last report: ${rec.lastReport.id} • ${new Date(rec.lastReport.ts).toLocaleString()}`;
    } else {
      usedStatusEl.textContent = "";
    }
  }

  if (useBtn) {
    useBtn.onclick = () => {
      const updated = getRedeemRec(key);
      updated.code = generateOneTimeCode(deal?.name);
      setRedeemRec(key, updated);

      if (codeEl) codeEl.textContent = updated.code;
      if (copyBtn) copyBtn.disabled = false;
      if (usedBtn) usedBtn.disabled = false;

      if (useStatusEl) {
        useStatusEl.textContent = "Code generated ✓";
        setTimeout(() => (useStatusEl.textContent = ""), 1400);
      }

      syncHint();
    };
  }

  if (copyBtn) {
    copyBtn.onclick = async () => {
      const r = getRedeemRec(key);
      if (!r.code) return;
      const code = r.code;

      try {
        await navigator.clipboard.writeText(code);
      } catch {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch {}
        document.body.removeChild(ta);
      }

      const updated = getRedeemRec(key);
      updated.copies = Number(updated.copies || 0) + 1;
      setRedeemRec(key, updated);

      if (usedStatusEl) {
        usedStatusEl.textContent = "Copied ✓";
        setTimeout(() => {
          const rr = getRedeemRec(key);
          if (rr.lastReport?.id && rr.lastReport?.ts) {
            usedStatusEl.textContent = `Last report: ${rr.lastReport.id} • ${new Date(rr.lastReport.ts).toLocaleString()}`;
          } else {
            usedStatusEl.textContent = "";
          }
        }, 1300);
      }
    };
  }

  if (usedBtn) {
    usedBtn.onclick = () => {
      const updated = getRedeemRec(key);
      if (!updated.code) {
        if (useStatusEl) {
          useStatusEl.textContent = "Tap “Use deal” first";
          setTimeout(() => (useStatusEl.textContent = ""), 1500);
        }
        return;
      }

      updated.usedCount = Number(updated.usedCount || 0) + 1;
      updated.lastReport = { id: newReportId(), ts: Date.now(), code: updated.code };
      setRedeemRec(key, updated);

      if (usedStatusEl) {
        usedStatusEl.textContent = `Reported ✓ ID ${updated.lastReport.id}`;
        setTimeout(() => {
          usedStatusEl.textContent = `Last report: ${updated.lastReport.id} • ${new Date(updated.lastReport.ts).toLocaleString()}`;
        }, 1400);
      }

      syncHint();
    };
  }

  openModal("modalDeal");
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


cardsContainer?.addEventListener("click", (e) => {
  const favBtn = e.target.closest("[data-fav]");
  if (favBtn) {
    const key = favBtn.getAttribute("data-fav");
    toggleFavorite(key);
    render();
    return;
  }

  const detailsBtn = e.target.closest("[data-details]");
  if (detailsBtn) {
    const key = detailsBtn.getAttribute("data-details");
    const deal = findDealByKey(key);
    if (deal) openDealModal(deal);
    return;
  }

  // Ignore clicks on external links (like Open map)
  if (e.target.closest("a")) return;

  const card = e.target.closest(".card");
  if (!card) return;
  const key = card.dataset.key;
  const deal = findDealByKey(key);
  if (deal) openDealModal(deal);
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

btnNearbyToggle?.addEventListener("click", () => {
  if (!userLocation) {
    requestLocation();
    return;
  }
  nearbyOnly = !nearbyOnly;
  setNearbyPressed();
  render();
});

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
  const key = dealKey(deal);
  card.dataset.key = key;
  const fav = isFavorite(key);
  const favBtn = `<button class="fav-btn ${fav ? "on" : ""}" type="button" aria-label="${fav ? "Unsave deal" : "Save deal"}" data-fav="${escapeHtml(key)}">${fav ? "♥" : "♡"}</button>`;

  card.innerHTML = `
    <div class="card-top">
      ${img}
      <div class="card-main">
        <div class="card-title-row">
          <h3 class="card-title">${safeName}</h3>
          <div class="card-title-actions">
            <span class="pill">-${discount}%</span>
            ${favBtn}
          </div>
        </div>
        <div class="card-sub">${safeBadge}</div>
        <p class="card-desc">${safeDesc}</p>

        <div class="card-meta">
          <span>${hasDistance ? `<strong>${escapeHtml(distanceText)}</strong>` : escapeHtml(distanceText)}</span>
          <span>${safeValid}</span>
        </div>

        <div class="card-actions">
          <button class="btn small ghost" type="button" data-details="${escapeHtml(key)}">Details</button>
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
    const key = dealKey(d);
    const matchesType = currentType === "all"
      ? true
      : currentType === "saved"
        ? isFavorite(key)
        : d.type === currentType;

    const content = ((d.name || "") + (d.description || "") + (d.badge || "")).toLowerCase();
    const q = currentSearch.trim().toLowerCase();
    const matchesSearch = !q || content.includes(q);

    const matchesNearby = !nearbyOnly || (Number.isFinite(d.distanceKm) && d.distanceKm <= NEARBY_RADIUS_KM);

    return matchesType && matchesSearch && matchesNearby;
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
  updateActiveFiltersBar();

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
loadFavorites();
loadRedeemStore();
setNearbyPressed();
updateLocationStatus();
loadDeals();
