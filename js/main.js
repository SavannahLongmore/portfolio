import { projects, heroProjects } from "./projects-data.js";

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
    menu.classList.contains("open") ? closeMenu() : openMenu();
  });

  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target) && menu.classList.contains("open")) {
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

  const sortedProjects = [...projects].sort((a, b) => {
    if (a.spotlight && !b.spotlight) return -1;
    if (!a.spotlight && b.spotlight) return 1;
    return 0;
  });

  grid.innerHTML = sortedProjects
    .map((project) => {
      const cardClasses = ["projectCard"];
      if (project.spotlight) cardClasses.push("projectCard--spotlight");

      const badge = project.spotlight
        ? '<span class="featured-tag">Featured Project</span>'
        : project.featured
          ? '<span class="featured-tag">Featured</span>'
          : "";

      return `
      <a class="${cardClasses.join(" ")}" href="${project.href || "#"}">
        ${badge}
        <div class="projectCard__media">
          <img
            src="${project.image || "assets/img/savannah-portfolio.webp"}"
            alt="${project.title}"
            loading="lazy"
          />
        </div>
        <div class="projectCard__body">
          <h3 class="projectCard__title">${project.title}</h3>
          <p class="projectCard__meta">${project.blurb || project.description || ""}</p>
          <div class="projectCard__tags">
            ${(project.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
          <div class="projectCard__actions btn-row">
            <span class="btn btn--primary">View case study →</span>
          </div>
        </div>
      </a>
    `;
    })
    .join("");
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function initHeroCarousel() {
  const heroVisual = document.querySelector("[data-hero-carousel]");
  if (!heroVisual) return;

  const container = heroVisual.querySelector(".project-carousel");
  const carouselProjects = heroProjects.length > 0 ? heroProjects : projects.slice(0, 4);
  if (!container || carouselProjects.length === 0) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SLIDE_DURATION = 6000;
  const INFO_FADE_MS = 180;

  container.innerHTML = carouselProjects
    .map(
      (project, index) => `
      <a
        class="hero-slide${index === 0 ? " is-active" : ""}"
        href="${project.href}"
        id="slide-${index}"
        aria-hidden="${index === 0 ? "false" : "true"}"
        aria-label="${project.title}"
      >
        <div class="hero-slide__media">
          <img
            src="${project.heroImage || project.image}"
            alt="${project.title}"
            ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}
          />
        </div>
      </a>
    `
    )
    .join("");

  const slides = Array.from(container.querySelectorAll(".hero-slide"));
  let current = 0;
  let interval = null;
  let isPaused = prefersReducedMotion;
  let isHovered = false;
  let isInView = true;
  let isPageVisible = !document.hidden;
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  let didSwipe = false;
  let infoUpdateTimer = null;

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "hero-carousel__arrow prev";
  prevBtn.setAttribute("aria-label", "Previous project");
  prevBtn.innerHTML = "&#8249;";

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "hero-carousel__arrow next";
  nextBtn.setAttribute("aria-label", "Next project");
  nextBtn.innerHTML = "&#8250;";

  const footer = document.createElement("div");
  footer.className = "hero-carousel__footer";

  const progressWrap = document.createElement("div");
  progressWrap.className = "hero-carousel__progress";
  progressWrap.setAttribute("aria-hidden", "true");

  const progressBar = document.createElement("span");
  progressWrap.appendChild(progressBar);

  const footerInner = document.createElement("div");
  footerInner.className = "hero-carousel__footer-inner";

  const infoLink = document.createElement("a");
  infoLink.className = "hero-carousel__info";

  const nav = document.createElement("div");
  nav.className = "hero-carousel__nav";

  const pauseBtn = document.createElement("button");
  pauseBtn.type = "button";
  pauseBtn.className = "hero-carousel__pause";
  pauseBtn.setAttribute("aria-label", prefersReducedMotion ? "Slideshow paused" : "Pause slideshow");
  pauseBtn.textContent = prefersReducedMotion ? "Play" : "Pause";

  const dotsContainer = document.createElement("div");
  dotsContainer.className = "carousel-dots";
  dotsContainer.setAttribute("role", "tablist");
  dotsContainer.setAttribute("aria-label", "Carousel navigation");

  carouselProjects.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `carousel-dot${index === 0 ? " active" : ""}`;
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    dot.setAttribute("aria-controls", `slide-${index}`);
    dot.setAttribute("aria-selected", index === 0 ? "true" : "false");
    dot.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(index);
      restartAutoplay();
    });
    dotsContainer.appendChild(dot);
  });

  nav.append(dotsContainer, pauseBtn);
  footerInner.append(infoLink, nav);
  footer.append(progressWrap, footerInner);
  heroVisual.append(prevBtn, nextBtn, footer);

  function shouldAutoplay() {
    return !prefersReducedMotion && !isPaused && isInView && isPageVisible && !isHovered;
  }

  function setInfoContent(index) {
    const project = carouselProjects[index];
    infoLink.href = project.href;
    infoLink.replaceChildren();

    if (project.tags?.[0]) {
      const tag = document.createElement("span");
      tag.className = "hero-slide__tag";
      tag.textContent = project.tags[0];
      infoLink.appendChild(tag);
    }

    const title = document.createElement("span");
    title.className = "hero-slide__title";
    title.textContent = project.title;
    infoLink.appendChild(title);

    const cta = document.createElement("span");
    cta.className = "hero-slide__cta";
    cta.textContent = "View case study →";
    infoLink.appendChild(cta);
  }

  function renderInfo(index, animate = true) {
    if (infoUpdateTimer) {
      clearTimeout(infoUpdateTimer);
      infoUpdateTimer = null;
    }

    if (!animate || prefersReducedMotion) {
      infoLink.classList.remove("is-updating");
      setInfoContent(index);
      return;
    }

    infoLink.classList.add("is-updating");
    infoUpdateTimer = setTimeout(() => {
      setInfoContent(index);
      infoLink.classList.remove("is-updating");
      infoUpdateTimer = null;
    }, INFO_FADE_MS);
  }

  function updateDots() {
    dotsContainer.querySelectorAll(".carousel-dot").forEach((dot, index) => {
      const isActive = index === current;
      dot.classList.toggle("active", isActive);
      dot.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function pauseProgress() {
    if (progressBar.classList.contains("is-animating")) {
      progressBar.classList.add("is-paused");
    }
  }

  function resumeProgress() {
    progressBar.classList.remove("is-paused");
  }

  function resetProgress() {
    progressBar.classList.remove("is-animating", "is-paused");
    void progressBar.offsetWidth;
    if (shouldAutoplay()) {
      progressBar.classList.add("is-animating");
    }
  }

  function preloadNextSlide(index) {
    const nextIndex = (index + 1) % carouselProjects.length;
    const nextProject = carouselProjects[nextIndex];
    const preload = new Image();
    preload.src = nextProject.heroImage || nextProject.image;
  }

  function goTo(index) {
    if (index === current) return;

    slides[current].classList.remove("is-active");
    slides[current].setAttribute("aria-hidden", "true");

    slides[index].classList.add("is-active");
    slides[index].setAttribute("aria-hidden", "false");

    current = index;
    updateDots();
    renderInfo(index);
    preloadNextSlide(index);
    resetProgress();
  }

  function goNext() {
    goTo((current + 1) % slides.length);
  }

  function goPrev() {
    goTo((current - 1 + slides.length) % slides.length);
  }

  function stopAutoplay() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }

    if (isPaused) {
      progressBar.classList.remove("is-animating", "is-paused");
    } else {
      pauseProgress();
    }
  }

  function startAutoplay() {
    if (interval || !shouldAutoplay()) return;
    interval = setInterval(goNext, SLIDE_DURATION);
    if (progressBar.classList.contains("is-animating")) {
      resumeProgress();
    } else {
      resetProgress();
    }
  }

  function syncAutoplay() {
    if (shouldAutoplay()) {
      startAutoplay();
    } else {
      stopAutoplay();
    }
  }

  function restartAutoplay() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    resetProgress();
    syncAutoplay();
  }

  function setPaused(paused) {
    isPaused = paused;
    pauseBtn.textContent = paused ? "Play" : "Pause";
    pauseBtn.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
    syncAutoplay();
  }

  prevBtn.addEventListener("click", (e) => {
    e.preventDefault();
    goPrev();
    restartAutoplay();
  });

  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    goNext();
    restartAutoplay();
  });

  pauseBtn.addEventListener("click", () => {
    setPaused(!isPaused);
  });

  heroVisual.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
      restartAutoplay();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
      restartAutoplay();
    }
  });

  heroVisual.addEventListener("mouseenter", () => {
    isHovered = true;
    syncAutoplay();
  });

  heroVisual.addEventListener("mouseleave", () => {
    isHovered = false;
    syncAutoplay();
  });

  heroVisual.addEventListener("focusin", () => {
    isHovered = true;
    syncAutoplay();
  });

  heroVisual.addEventListener("focusout", (e) => {
    if (!heroVisual.contains(e.relatedTarget)) {
      isHovered = false;
      syncAutoplay();
    }
  });

  function handleStart(e) {
    if (e.target.closest(".hero-carousel__arrow, .hero-carousel__pause, .carousel-dot")) return;
    isDragging = true;
    startX = e.type.includes("mouse") ? e.pageX : e.touches[0].pageX;
    currentX = startX;
    syncAutoplay();
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
      didSwipe = true;
      diff > 0 ? goNext() : goPrev();
      restartAutoplay();
    } else {
      syncAutoplay();
    }
  }

  container.addEventListener("mousedown", handleStart);
  container.addEventListener("mousemove", handleMove);
  container.addEventListener("mouseup", handleEnd);
  container.addEventListener("mouseleave", handleEnd);
  container.addEventListener("touchstart", handleStart, { passive: true });
  container.addEventListener("touchmove", handleMove, { passive: true });
  container.addEventListener("touchend", handleEnd);

  container.addEventListener(
    "click",
    (e) => {
      if (didSwipe) {
        e.preventDefault();
        didSwipe = false;
      }
    },
    true
  );

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      isInView = entries[0]?.isIntersecting ?? true;
      syncAutoplay();
    },
    { threshold: 0.2 }
  );
  visibilityObserver.observe(heroVisual);

  document.addEventListener("visibilitychange", () => {
    isPageVisible = !document.hidden;
    syncAutoplay();
  });

  renderInfo(0, false);
  updateDots();
  preloadNextSlide(0);
  syncAutoplay();
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

  prevBtn?.addEventListener("click", () => goToDeviceSlide(currentDeviceSlide - 1));
  nextBtn?.addEventListener("click", () => goToDeviceSlide(currentDeviceSlide + 1));
  dots.forEach((dot, index) => dot.addEventListener("click", () => goToDeviceSlide(index)));

  updateDeviceCarousel();
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
    const gap = visibleCards === 1 ? 0 : 16;
    track.style.transform = `translateX(-${currentIndex * (cardWidth + gap)}px)`;

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentIndex);
    });

    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= getMaxIndex();
  }

  function goTo(index) {
    const maxIndex = getMaxIndex();
    if (index > maxIndex) currentIndex = 0;
    else if (index < 0) currentIndex = maxIndex;
    else currentIndex = index;
    updateCarousel();
  }

  prevBtn?.addEventListener("click", () => goTo(currentIndex - 1));
  nextBtn?.addEventListener("click", () => goTo(currentIndex + 1));
  dots.forEach((dot, dotIndex) => dot.addEventListener("click", () => goTo(dotIndex)));

  window.addEventListener("resize", () => {
    if (currentIndex > getMaxIndex()) currentIndex = getMaxIndex();
    updateCarousel();
  });

  updateCarousel();
}

function setupPdfModal() {
  const pdfModal = document.getElementById("pdfModal");
  if (!pdfModal) return;

  const close = () => {
    pdfModal.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  document.querySelectorAll("[data-open-pdf]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pdfModal.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });
  });

  document.querySelectorAll("[data-close-pdf]").forEach((el) => el.addEventListener("click", close));
  pdfModal.addEventListener("click", (e) => {
    if (e.target === pdfModal) close();
  });
}

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
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });
}

function setupLiveDemo() {
  const iframe = document.getElementById("live-demo");
  const fallback = document.getElementById("demo-fallback");
  const loading = document.getElementById("demo-loading");
  if (!iframe) return;

  iframe.onload = () => {
    if (loading) loading.style.display = "none";
  };

  iframe.onerror = () => {
    if (loading) loading.style.display = "none";
    if (fallback) fallback.classList.remove("u-hidden");
  };

  setTimeout(() => {
    if (loading && loading.style.display !== "none") {
      loading.style.display = "none";
      if (fallback) fallback.classList.remove("u-hidden");
    }
  }, 8000);
}

function setFooterYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobileNav();
  renderProjectCards();
  setupSmoothScroll();
  initHeroCarousel();
  initDeviceCarousel();
  initThreeCardCarousel();
  setupPdfModal();
  setupBackButton();
  setupImageModal();
  setupLiveDemo();
  setFooterYear();
});
