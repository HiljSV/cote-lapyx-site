// Підключення функціоналу "Чортоги Фрілансера"
import {
  addTouchAttr,
  addLoadedAttr,
  isMobile,
  FLS,
} from "@js/common/functions.js";

// =============================================================================
// Theme toggle (dark / light)
// =============================================================================
(function initTheme() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = stored ? stored === "dark" : prefersDark;

  applyTheme(isDark);

  btn.addEventListener("click", () => {
    const currentlyDark = document.documentElement.dataset.theme === "dark";
    applyTheme(!currentlyDark);
    localStorage.setItem("theme", !currentlyDark ? "dark" : "light");
  });

  function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    btn.textContent = dark ? "🌙" : "☀";
    btn.setAttribute("aria-pressed", String(dark));
  }
})();

// =============================================================================
// Mobile hamburger menu
// =============================================================================
(function initBurger() {
  const burger = document.getElementById("burger-btn");
  const nav = document.getElementById("main-nav");
  const header = document.getElementById("header");
  if (!burger || !nav) return;

  burger.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(isOpen));
    header.classList.toggle("is-menu-open", isOpen);
    burger.setAttribute(
      "aria-label",
      isOpen ? "Закрити меню" : "Відкрити меню",
    );
    // Lock body scroll when menu is open
    document.documentElement.toggleAttribute("data-fls-scrolllock", isOpen);
  });

  // Close on nav link click
  nav.querySelectorAll(".header__nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      header.classList.remove("is-menu-open");
      document.documentElement.removeAttribute("data-fls-scrolllock");
    });
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !header.contains(e.target)) {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      header.classList.remove("is-menu-open");
      document.documentElement.removeAttribute("data-fls-scrolllock");
    }
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      header.classList.remove("is-menu-open");
      document.documentElement.removeAttribute("data-fls-scrolllock");
      burger.focus();
    }
  });
})();

// =============================================================================
// Smooth scroll for anchor links
// =============================================================================
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href").slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.focus({ preventScroll: true });
    });
  });
})();

// =============================================================================
// Active nav link on scroll (IntersectionObserver)
// =============================================================================
(function initActiveNav() {
  const sections = document.querySelectorAll("section[id], div[id]");
  const navLinks = document.querySelectorAll(".header__nav-link[href]");
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            const href = link.getAttribute("href");
            const isMatch = href === `#${id}` || href === `index.html#${id}`;
            link.classList.toggle("is-active", isMatch);
          });
        }
      });
    },
    { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
  );

  sections.forEach((s) => observer.observe(s));
})();

// =============================================================================
// Language switcher (UI only — no actual i18n in prototype)
// =============================================================================
(function initLangSwitcher() {
  const btns = document.querySelectorAll(".header__lang-btn");
  const toggle = document.getElementById("lang-toggle");
  const currentLabel = document.querySelector(".header__lang-current");
  const wrapper = document.getElementById("lang-switcher");

  // Mobile dropdown toggle
  if (toggle && wrapper) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");

      // Update mobile toggle label
      if (currentLabel) {
        currentLabel.textContent = btn.dataset.lang.toUpperCase();
      }

      // Close dropdown
      if (wrapper && toggle) {
        wrapper.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  });
})();

// =============================================================================
// Filter bar — projects page
// =============================================================================
(function initProjectsFilter() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  let activeAuthor = "all";
  let activeTech = "all";
  let searchQuery = "";

  function applyFilters() {
    grid.querySelectorAll("li[data-author]").forEach((item) => {
      const authorMatch =
        activeAuthor === "all" || item.dataset.author === activeAuthor;
      const techMatch =
        activeTech === "all" || item.dataset.tech === activeTech;
      const title =
        item.querySelector(".project-card__title")?.textContent.toLowerCase() ??
        "";
      const desc =
        item
          .querySelector(".project-card__description")
          ?.textContent.toLowerCase() ?? "";
      const searchMatch =
        !searchQuery ||
        title.includes(searchQuery) ||
        desc.includes(searchQuery);
      item.hidden = !(authorMatch && techMatch && searchMatch);
    });
  }

  document.querySelectorAll("[data-filter-author]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-filter-author]")
        .forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeAuthor = btn.dataset.filterAuthor;
      applyFilters();
    });
  });

  document.querySelectorAll("[data-filter-tech]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-filter-tech]")
        .forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeTech = btn.dataset.filterTech;
      applyFilters();
    });
  });

  const searchInput = document.getElementById("projects-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      applyFilters();
    });
  }
})();

// =============================================================================
// Filter bar — blog page
// =============================================================================
(function initBlogFilter() {
  const grid = document.getElementById("blog-grid");
  if (!grid) return;

  let activeCat = "all";
  let searchQuery = "";

  function applyFilters() {
    grid.querySelectorAll("li[data-cat]").forEach((item) => {
      const catMatch = activeCat === "all" || item.dataset.cat === activeCat;
      const title =
        item.querySelector(".blog-card__title")?.textContent.toLowerCase() ??
        "";
      const excerpt =
        item.querySelector(".blog-card__excerpt")?.textContent.toLowerCase() ??
        "";
      const searchMatch =
        !searchQuery ||
        title.includes(searchQuery) ||
        excerpt.includes(searchQuery);
      item.hidden = !(catMatch && searchMatch);
    });
  }

  document.querySelectorAll("[data-filter-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-filter-cat]")
        .forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeCat = btn.dataset.filterCat;
      applyFilters();
    });
  });

  const searchInput = document.getElementById("blog-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      applyFilters();
    });
  }
})();

// =============================================================================
// Neon cursor trail (subtle, desktop only)
// =============================================================================
(function initCursorTrail() {
  if (isMobile()) return;

  const COLORS = ["#00e5ff", "#e040fb", "#39ff14"];
  let frame = null;

  document.addEventListener("mousemove", (e) => {
    if (frame) return; // throttle to rAF
    frame = requestAnimationFrame(() => {
      frame = null;
      const dot = document.createElement("span");
      dot.className = "cursor-trail";
      dot.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
        left: ${e.clientX - 3}px;
        top: ${e.clientY - 3}px;
        animation: cursor-trail-fade 0.6s ease forwards;
      `;
      document.body.appendChild(dot);
      dot.addEventListener("animationend", () => dot.remove());
    });
  });
})();
