// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Mobile menu (with scroll lock + backdrop + ESC close) =====
const mobileToggle = document.querySelector(".mobile-toggle");
const mobileMenu = document.querySelector(".mobile-menu");

let menuBackdrop = document.querySelector(".mobile-menu-backdrop");
if (!menuBackdrop) {
  menuBackdrop = document.createElement("div");
  menuBackdrop.className = "mobile-menu-backdrop";
  document.body.appendChild(menuBackdrop);
}

function openMenu() {
  if (!mobileToggle || !mobileMenu) return;
  mobileToggle.setAttribute("aria-expanded", "true");
  mobileMenu.hidden = false;
  menuBackdrop.classList.add("open");
  document.documentElement.classList.add("no-scroll");
}

function closeMenu() {
  if (!mobileToggle || !mobileMenu) return;
  mobileToggle.setAttribute("aria-expanded", "false");
  mobileMenu.hidden = true;
  menuBackdrop.classList.remove("open");
  document.documentElement.classList.remove("no-scroll");
}

if (mobileToggle && mobileMenu) {
  mobileToggle.addEventListener("click", () => {
    const isOpen = mobileToggle.getAttribute("aria-expanded") === "true";
    if (isOpen) closeMenu();
    else openMenu();
  });

  // Close when tapping outside (backdrop)
  menuBackdrop.addEventListener("click", closeMenu);

  // Close after clicking a menu link
  mobileMenu.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) closeMenu();
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const isOpen = mobileToggle.getAttribute("aria-expanded") === "true";
    if (isOpen) closeMenu();
  });
}

// ===== Multi-select filtering (OR logic) =====
// - Multiple chips can be active at once
// - Shows tiles that match ANY selected tag
// - Clicking "All" clears other selections and shows everything
function setupFilterGroup(groupName) {
  const bar = document.querySelector(`[data-filter-group="${groupName}"]`);
  const grid = document.querySelector(`[data-project-group="${groupName}"]`);
  if (!bar || !grid) return;

  const chips = Array.from(bar.querySelectorAll("[data-filter]"));
  const tiles = Array.from(grid.querySelectorAll("[data-tags]"));

  function chipValue(chip) {
    return (chip.dataset.filter || "").toLowerCase();
  }

  function getSelectedValues() {
    return chips
      .filter((c) => c.classList.contains("active"))
      .map(chipValue)
      .filter((v) => v && v !== "all");
  }

  function setAllActiveOnly() {
    chips.forEach((c) => c.classList.toggle("active", chipValue(c) === "all"));
  }

  function render() {
    const selected = getSelectedValues();

    tiles.forEach((tile) => {
      const tags = (tile.dataset.tags || "")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      const match = selected.length === 0 ? true : selected.some((t) => tags.includes(t));
      tile.style.display = match ? "" : "none";
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const v = chipValue(chip);

      if (v === "all") {
        setAllActiveOnly();
        render();
        return;
      }

      chip.classList.toggle("active");

      const anyNonAllActive = chips.some(
        (c) => chipValue(c) !== "all" && c.classList.contains("active")
      );
      if (anyNonAllActive) {
        chips.forEach((c) => {
          if (chipValue(c) === "all") c.classList.remove("active");
        });
      }

      const anyActive = chips.some(
        (c) => c.classList.contains("active") && chipValue(c) !== "all"
      );
      if (!anyActive) setAllActiveOnly();

      render();
    });
  });

  setAllActiveOnly();
  render();
}

setupFilterGroup("personal");
setupFilterGroup("academic");

// ===== Lightbox for galleries =====
function setupLightbox() {
  const galleries = document.querySelectorAll(".gallery");
  if (!galleries.length) return;

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
    document.documentElement.classList.add("no-scroll"); // lock scroll
    render();
  }

  function close() {
    lightbox.classList.remove("open");
    document.documentElement.classList.remove("no-scroll");
    lbImg.src = "";
  }

  function prev() {
    index = (index - 1 + items.length) % items.length;
    render();
  }

  function next() {
    index = (index + 1) % items.length;
    render();
  }

  galleries.forEach((gallery) => {
    const galleryItems = Array.from(gallery.querySelectorAll(".gallery-item"));

    galleryItems.forEach((item, i) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        openAt(galleryItems, i);
      });

      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openAt(galleryItems, i);
        }
      });
    });
  });

  lbPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    prev();
  });

  lbNext.addEventListener("click", (e) => {
    e.stopPropagation();
    next();
  });

  lightbox.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.dataset && target.dataset.lbClose === "true") close();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;

    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowRight") next();
  });
}

setupLightbox();