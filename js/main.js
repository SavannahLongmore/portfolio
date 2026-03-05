import { projects } from "./projects-data.js";

function setupMobileNav() {
  const btn = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      menu.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

function renderProjectCards() {
  const grid = document.querySelector("[data-project-grid]");
  if (!grid) return;

grid.innerHTML = projects
  .map((p) => `
    <a class="projectCard" href="${p.href || '#'}">
      ${p.featured ? '<span class="featured-tag">Featured</span>' : ''}
      <div class="projectCard__media">
        <img 
          src="${p.image || 'assets/img/placeholder.jpg'}" 
          alt="${p.title}" 
          loading="lazy" 
        />
      </div>
      <div class="projectCard__body">
          <h3 class="projectCard__title">${p.title}</h3>
          <p class="projectCard__meta">${p.blurb || p.description || ''}</p>
          
          <div class="projectCard__tags">
            ${(p.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}
          </div>
          
          <div class="projectCard__actions btn-row">
            <span class="btn btn--primary">View case study →</span>
          </div>
        </div>
      </a>
    `)
    .join("");
}

function setupResumeModal() {
  const modal = document.getElementById("resumeModal");
  if (!modal) return;

  const openButtons = document.querySelectorAll("[data-open-resume]");
  const closeButtons = modal.querySelectorAll("[data-modal-close]");
  const panel = modal.querySelector(".modal__panel");

  if (!panel) return;

  let lastFocused = null;

  const open = () => {
    lastFocused = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    panel.setAttribute("tabindex", "-1");
    panel.focus();
  };

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  };

  openButtons.forEach((btn) => btn.addEventListener("click", open));
  closeButtons.forEach((btn) => btn.addEventListener("click", close));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      close();
    }
  });
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

// Gentle auto-fading carousel in hero
function initHeroCarousel() {
  console.log('Carousel function started');
  const items = document.querySelectorAll('.carousel-item');
  console.log('Carousel init – found', items.length, 'images');
  if (items.length === 0) return;

  let current = 0;
  items[current].classList.add('active');

  function next() {
    items[current].classList.remove('active');
    current = (current + 1) % items.length;
    items[current].classList.add('active');
  }

  setInterval(next, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log('DOMContentLoaded fired');
  setupMobileNav();
  renderProjectCards();
  setupResumeModal();
  setupSmoothScroll();
  initHeroCarousel();  // must be here
});

// PDF Modal
const pdfModal = document.getElementById("pdfModal");

document.querySelectorAll("[data-open-pdf]").forEach(btn => {
  btn.addEventListener("click", () => {
    pdfModal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  });
});

document.querySelectorAll("[data-close-pdf]").forEach(el => {
  el.addEventListener("click", () => {
    pdfModal.classList.remove("is-open");
    document.body.style.overflow = "";
  });
});