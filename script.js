// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Mobile menu
const mobileToggle = document.querySelector(".mobile-toggle");
const mobileMenu = document.querySelector(".mobile-menu");

if (mobileToggle && mobileMenu) {
  mobileToggle.addEventListener("click", () => {
    const isOpen = mobileToggle.getAttribute("aria-expanded") === "true";
    mobileToggle.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu.hidden = isOpen;
  });
}

// Filtering (two independent filter bars: personal + academic)
function setupFilterGroup(groupName) {
  const bar = document.querySelector(`[data-filter-group="${groupName}"]`);
  const grid = document.querySelector(`[data-project-group="${groupName}"]`);
  if (!bar || !grid) return;

  const chips = Array.from(bar.querySelectorAll("[data-filter]"));
  const tiles = Array.from(grid.querySelectorAll("[data-tags]"));

  function setActiveChip(activeValue) {
    chips.forEach((c) => c.classList.toggle("active", c.dataset.filter === activeValue));
  }

  function applyFilter(value) {
    const v = (value || "all").toLowerCase();

    tiles.forEach((tile) => {
      const tags = (tile.dataset.tags || "")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      const match = v === "all" ? true : tags.includes(v);
      tile.style.display = match ? "" : "none";
    });

    setActiveChip(v);
  }

  chips.forEach((chip) => chip.addEventListener("click", () => applyFilter(chip.dataset.filter)));

  applyFilter("all");
}

setupFilterGroup("personal");
setupFilterGroup("academic");

// ===== Lightbox for galleries =====
//
// Markup expectations on project pages:
// - A container with class ".gallery"
// - Each clickable item has class ".gallery-item" and contains <img>
// - The .gallery-item has data-full="path/to/full.jpg" (optional; if missing, uses the img src)
function setupLightbox() {
  const galleries = document.querySelectorAll(".gallery");
  if (!galleries.length) return;

  // Create lightbox once
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `
    <div class="lightbox-backdrop" data-lb-close="true"></div>
    <div class="lightbox-content" role="dialog" aria-modal="true" aria-label="Image viewer">
      <button class="lightbox-close" type="button" aria-label="Close (Esc)" data-lb-close="true">Close</button>
      <button class="lightbox-btn lightbox-prev" type="button" aria-label="Previous image (Left arrow)">‹</button>
      <img class="lightbox-img" alt="" />
      <button class="lightbox-btn lightbox-next" type="button" aria-label="Next image (Right arrow)">›</button>
      <div class="lightbox-counter" aria-live="polite"></div>
    </div>
  `;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector(".lightbox-img");
  const lbPrev = lightbox.querySelector(".lightbox-prev");
  const lbNext = lightbox.querySelector(".lightbox-next");
  const lbCounter = lightbox.querySelector(".lightbox-counter");

  let items = [];
  let index = 0;

  function getFullSrc(item) {
    return item.dataset.full || item.querySelector("img")?.getAttribute("src") || "";
  }

  function render() {
    const current = items[index];
    const src = getFullSrc(current);

    lbImg.src = src;
    lbImg.alt = current.querySelector("img")?.alt || `Image ${index + 1}`;

    lbCounter.textContent = `${index + 1} / ${items.length}`;
  }

  function openAt(newItems, startIndex) {
    items = newItems;
    index = startIndex;

    lightbox.classList.add("open");
    document.documentElement.style.overflow = "hidden"; // lock scroll
    render();
  }

  function close() {
    lightbox.classList.remove("open");
    document.documentElement.style.overflow = "";
    lbImg.src = "";
  }

  function prev() {
    index = (index - 1 + items.length) % items.length; // wrap-around
    render();
  }

  function next() {
    index = (index + 1) % items.length; // wrap-around
    render();
  }

  // Wire gallery click events
  galleries.forEach((gallery) => {
    const galleryItems = Array.from(gallery.querySelectorAll(".gallery-item"));

    galleryItems.forEach((item, i) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        openAt(galleryItems, i);
      });

      // Optional keyboard activation for accessibility (Enter/Space)
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openAt(galleryItems, i);
        }
      });
    });
  });

  // Controls
  lbPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    prev();
  });

  lbNext.addEventListener("click", (e) => {
    e.stopPropagation();
    next();
  });

  // Close on backdrop / close button
  lightbox.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.dataset && target.dataset.lbClose === "true") close();
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;

    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowRight") next();
  });
}

setupLightbox();