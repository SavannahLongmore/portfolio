import { projects } from "./projects-data.js";

function setupMobileNav() {
  const btn = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  if (!btn || !menu) return;

  function openMenu() {
    menu.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    btn.textContent = "X";
  }

  function closeMenu() {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "Menu";
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();

    const isOpen = menu.classList.contains("open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      closeMenu();
    });
  });

  document.addEventListener("click", (e) => {
    const clickedInsideMenu = menu.contains(e.target);
    const clickedButton = btn.contains(e.target);

    if (!clickedInsideMenu && !clickedButton && menu.classList.contains("open")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("open")) {
      closeMenu();
    }
  });
}

function renderProjectCards() {
  const grid = document.querySelector("[data-project-grid]");
  if (!grid) return;

  grid.innerHTML = projects
    .map((p) => `
      <a class="projectCard" href="${p.href || "#"}">
        ${p.featured ? '<span class="featured-tag">Featured</span>' : ""}
        <div class="projectCard__media">
          <img 
            src="${p.image || "assets/img/placeholder.jpg"}" 
            alt="${p.title}" 
            loading="lazy" 
          />
        </div>
        <div class="projectCard__body">
          <h3 class="projectCard__title">${p.title}</h3>
          <p class="projectCard__meta">${p.blurb || p.description || ""}</p>
          
          <div class="projectCard__tags">
            ${(p.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}
          </div>
          
          <div class="projectCard__actions btn-row">
            <span class="btn primary">View case study →</span>
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

function initHeroCarousel() {
  const container = document.querySelector(".project-carousel");
  if (!container) return;

  const items = container.querySelectorAll("img");
  if (items.length < 1) return;

  let current = 0;
  let interval = null;
  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  const dotsContainer = document.createElement("div");
  dotsContainer.className = "carousel-dots";
  dotsContainer.setAttribute("role", "tablist");
  dotsContainer.setAttribute("aria-label", "Carousel navigation");

  items.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    dot.setAttribute("aria-controls", `slide-${index}`);
    dot.addEventListener("click", () => goTo(index));
    dotsContainer.appendChild(dot);
  });

  const heroVisual = container.parentElement;
  heroVisual.appendChild(dotsContainer);
  heroVisual.style.position = "relative";

  items.forEach((img, i) => {
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.transition = "opacity 1.2s ease-in-out";
    img.style.opacity = i === 0 ? "1" : "0";
    img.style.zIndex = "1";
    img.id = `slide-${i}`;
  });

  function updateDots() {
    dotsContainer.querySelectorAll(".carousel-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === current);
      dot.setAttribute("aria-selected", i === current ? "true" : "false");
    });
  }

  function goTo(index) {
    items[current].style.opacity = "0";
    items[index].style.opacity = "1";
    current = index;
    updateDots();
  }

  function start() {
    interval = setInterval(() => {
      const next = (current + 1) % items.length;
      goTo(next);
    }, 6000);
  }

  function pause() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function resume() {
    if (!interval) start();
  }

  start();
  updateDots();

  container.addEventListener("mouseenter", pause);
  container.addEventListener("focusin", pause);
  container.addEventListener("mouseleave", resume);
  container.addEventListener("focusout", (e) => {
    if (!container.contains(e.relatedTarget)) resume();
  });

  function handleStart(e) {
    isDragging = true;
    startX = e.type.includes("mouse") ? e.pageX : e.touches[0].pageX;
    currentX = startX;
    pause();
  }

  function handleMove(e) {
    if (!isDragging) return;
    currentX = e.type.includes("mouse") ? e.pageX : e.touches[0].pageX;
  }

  function handleEnd() {
    if (!isDragging) return;
    isDragging = false;

    const diff = startX - currentX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        const next = (current + 1) % items.length;
        goTo(next);
      } else {
        const prev = (current - 1 + items.length) % items.length;
        goTo(prev);
      }
    }
    resume();
  }

  container.addEventListener("mousedown", handleStart);
  container.addEventListener("mousemove", handleMove);
  container.addEventListener("mouseup", handleEnd);
  container.addEventListener("mouseleave", handleEnd);

  container.addEventListener("touchstart", handleStart, { passive: true });
  container.addEventListener("touchmove", handleMove, { passive: true });
  container.addEventListener("touchend", handleEnd);
}

function initDeviceCarousel() {
  const deviceCarousel = document.querySelector("[data-device-carousel]");
  if (!deviceCarousel) return;

  const deviceTrack = deviceCarousel.querySelector(".device-carousel__track");
  const deviceSlides = Array.from(deviceCarousel.querySelectorAll(".device-slide"));
  const prevBtn = deviceCarousel.querySelector(".device-carousel__arrow.prev");
  const nextBtn = deviceCarousel.querySelector(".device-carousel__arrow.next");
  const dotsWrap = document.querySelector("[data-device-dots]");
  const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll("button")) : [];

  if (!deviceTrack || deviceSlides.length === 0) return;

  let currentDeviceSlide = 0;

  function updateDeviceCarousel() {
    deviceTrack.style.transform = `translateX(-${currentDeviceSlide * 100}%)`;

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentDeviceSlide);
      dot.setAttribute("aria-selected", index === currentDeviceSlide ? "true" : "false");
    });
  }

  function goToDeviceSlide(index) {
    if (index < 0) index = deviceSlides.length - 1;
    if (index >= deviceSlides.length) index = 0;
    currentDeviceSlide = index;
    updateDeviceCarousel();
  }

  prevBtn?.addEventListener("click", () => {
    goToDeviceSlide(currentDeviceSlide - 1);
  });

  nextBtn?.addEventListener("click", () => {
    goToDeviceSlide(currentDeviceSlide + 1);
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      goToDeviceSlide(index);
    });
  });

  updateDeviceCarousel();
}

// PDF Modal
function setupPdfModal() {
  const pdfModal = document.getElementById("pdfModal");
  if (!pdfModal) return;

  document.querySelectorAll("[data-open-pdf]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pdfModal.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });
  });

  document.querySelectorAll("[data-close-pdf]").forEach((el) => {
    el.addEventListener("click", () => {
      pdfModal.classList.remove("is-open");
      document.body.style.overflow = "";
    });
  });

  pdfModal.addEventListener("click", (e) => {
    if (e.target === pdfModal) {
      pdfModal.classList.remove("is-open");
      document.body.style.overflow = "";
    }
  });
}

// Figma Modal
function setupFigmaModal() {
  const figmaModal = document.getElementById("figmaModal");
  if (!figmaModal) return;

  document.querySelectorAll("[data-open-figma]").forEach((btn) => {
    btn.addEventListener("click", () => {
      figmaModal.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });
  });

  document.querySelectorAll("[data-close-figma]").forEach((el) => {
    el.addEventListener("click", () => {
      figmaModal.classList.remove("is-open");
      document.body.style.overflow = "";
    });
  });

  figmaModal.addEventListener("click", (e) => {
    if (e.target === figmaModal) {
      figmaModal.classList.remove("is-open");
      document.body.style.overflow = "";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded fired");

  setupMobileNav();
  renderProjectCards();
  setupResumeModal();
  setupSmoothScroll();
  initHeroCarousel();
  initDeviceCarousel();
  initThreeCardCarousel();
  setupPdfModal();
  setupFigmaModal();
    setupBackButton();
    setupImageModal();

  document.querySelectorAll(".flip-card").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
    });
  });
});
function setupBackButton() {
  const backBtn = document.querySelector("[data-back-button]");
  if (!backBtn) return;

  backBtn.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "../projects.html";
    }
  });
}
function initThreeCardCarousel() {
  const carousel = document.querySelector("[data-three-card-carousel]");
  if (!carousel) return;

  const track = carousel.querySelector(".three-card-carousel__track");
  const cards = Array.from(carousel.querySelectorAll(".interaction-card"));
  const prevBtn = carousel.querySelector(".three-card-carousel__arrow.prev");
  const nextBtn = carousel.querySelector(".three-card-carousel__arrow.next");
  const dotsWrap = document.querySelector("[data-three-card-dots]");
  const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll("button")) : [];

  if (!track || cards.length === 0) return;

  let currentIndex = 0;

  function getVisibleCards() {
    if (window.innerWidth <= 700) return 1;
    if (window.innerWidth <= 1000) return 2;
    return 3;
  }

  function getMaxIndex() {
    return Math.max(0, cards.length - getVisibleCards());
  }

  function updateCarousel() {
    const visibleCards = getVisibleCards();
    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap = visibleCards === 1 ? 0 : 16; // matches margin-right: 1rem
    const offset = currentIndex * (cardWidth + gap);

    track.style.transform = `translateX(-${offset}px)`;

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentIndex);
    });

    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= getMaxIndex();
  }

function goTo(index) {
  const maxIndex = getMaxIndex();

  if (index > maxIndex) {
    currentIndex = 0;
  } else if (index < 0) {
    currentIndex = maxIndex;
  } else {
    currentIndex = index;
  }

  updateCarousel();
}

prevBtn?.addEventListener("click", () => {
  goTo(currentIndex - 1);
});

nextBtn?.addEventListener("click", () => {
  goTo(currentIndex + 1);
});

dots.forEach((dot, dotIndex) => {
  dot.addEventListener("click", () => {
    goTo(dotIndex);
  });
});

window.addEventListener("resize", () => {
  const maxIndex = getMaxIndex();
  if (currentIndex > maxIndex) currentIndex = maxIndex;
  updateCarousel();
});

updateCarousel();}



function setupImageModal() {
  const modal = document.getElementById("imageModal");
  if (!modal) return;

  const openBtn = document.querySelector("[data-open-image-modal]");
  const closeEls = modal.querySelectorAll("[data-close-image-modal]");

  if (!openBtn) return;

  const open = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  openBtn.addEventListener("click", open);
  closeEls.forEach((el) => el.addEventListener("click", close));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      close();
    }
  });
}