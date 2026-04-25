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
// Hero hex-grid line animation (canvas overlay)
// =============================================================================
(function initGlobalHexLines() {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  // z-index:2 puts canvas above .wrapper (z-index:1); pointer-events:none keeps clicks through
  canvas.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:2;";
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");

  // Tile size — matches the hex SVG geometry (104×180)
  const TX = 104;
  const TY = 180;
  const COLORS = ["#00e5ff", "#e040fb", "#39ff14"];
  const MAX_P = 14;

  let W = 0,
    H = 0,
    visEdges = [];
  let hexPath = null; // Path2D of the static grid, rebuilt on resize
  const particles = [];
  let rafId = null;
  let lastTime = null;

  function buildGrid() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (!W || !H) return;

    const nodeMap = new Map();
    const edges = [];
    const seenEdges = new Set();

    function node(x, y) {
      const k = `${Math.round(x)},${Math.round(y)}`;
      if (!nodeMap.has(k)) nodeMap.set(k, { x, y, adj: [] });
      return nodeMap.get(k);
    }

    function link(a, b) {
      if (!a.adj.includes(b)) {
        a.adj.push(b);
        b.adj.push(a);
      }
      const k =
        a.x < b.x || (a.x === b.x && a.y < b.y)
          ? `${a.x},${a.y}|${b.x},${b.y}`
          : `${b.x},${b.y}|${a.x},${a.y}`;
      if (!seenEdges.has(k)) {
        seenEdges.add(k);
        edges.push([a, b]);
      }
    }

    const cols = Math.ceil(W / TX) + 3;
    const rows = Math.ceil(H / TY) + 3;

    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const A = node(c * TX + TX / 2, r * TY);
        const B = node(c * TX, r * TY + TY / 6);
        const C = node(c * TX, r * TY + TY / 2);
        const D = node(c * TX + TX / 2, r * TY + (2 * TY) / 3);
        const RB = node((c + 1) * TX, r * TY + TY / 6);
        const RC = node((c + 1) * TX, r * TY + TY / 2);
        const NA = node(c * TX + TX / 2, (r + 1) * TY);

        link(A, B);
        link(A, RB);
        link(B, C);
        link(C, D);
        link(D, RC);
        link(D, NA);
      }
    }

    visEdges = edges.filter(
      ([a, b]) =>
        a.x > -TX &&
        a.x < W + TX &&
        a.y > -TY &&
        a.y < H + TY &&
        b.x > -TX &&
        b.x < W + TX &&
        b.y > -TY &&
        b.y < H + TY,
    );

    // Pre-build Path2D for the static hex grid (drawn every frame via single stroke call)
    hexPath = new Path2D();
    visEdges.forEach(([a, b]) => {
      hexPath.moveTo(a.x, a.y);
      hexPath.lineTo(b.x, b.y);
    });
  }

  function spawn() {
    if (!visEdges.length || particles.length >= MAX_P) return;
    const [a, b] = visEdges[Math.floor(Math.random() * visEdges.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const speed = 1 / (1800 + Math.random() * 2200);
    particles.push({ a, b, t: 0, speed, color, alpha: 0 });
  }

  // Parallax: grid shifts at 15% of scroll speed.
  // We mod by TY so the periodic pattern loops seamlessly — no jumps.
  const PARALLAX = 0.15;

  function frame(now) {
    if (!lastTime) lastTime = now;
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;

    ctx.clearRect(0, 0, W, H);

    // Scroll-based vertical offset. Modulo TY keeps it within one tile period
    // so the repeating hex pattern scrolls infinitely without a visible seam.
    const offsetY = (window.scrollY * PARALLAX) % TY;

    ctx.save();
    ctx.translate(0, -offsetY);

    // Static hex grid
    if (hexPath) {
      ctx.strokeStyle = "rgba(180,210,255,0.08)";
      ctx.lineWidth = 0.8;
      ctx.stroke(hexPath);
    }

    if (particles.length < MAX_P && Math.random() < 0.04) spawn();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += p.speed * dt;
      if (p.t >= 1) {
        particles.splice(i, 1);
        continue;
      }
      if (p.t < 0.01) continue;

      const f = 0.18;
      p.alpha = p.t < f ? p.t / f : p.t > 1 - f ? (1 - p.t) / f : 1;

      const { a, b, t, color, alpha } = p;
      const tailT = Math.max(0, t - 0.38);
      const hx = a.x + (b.x - a.x) * t;
      const hy = a.y + (b.y - a.y) * t;
      const tx2 = a.x + (b.x - a.x) * tailT;
      const ty2 = a.y + (b.y - a.y) * tailT;

      const grad = ctx.createLinearGradient(tx2, ty2, hx, hy);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, color);

      ctx.globalAlpha = alpha * 0.35;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(tx2, ty2);
      ctx.lineTo(hx, hy);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.55;
      ctx.shadowBlur = 4;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.75;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(hx, hy, 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.restore();

    rafId = requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else {
      if (!rafId) {
        lastTime = null;
        rafId = requestAnimationFrame(frame);
      }
    }
  });

  window.addEventListener("resize", buildGrid, { passive: true });

  buildGrid();

  // Pre-seed particles at random progress so screen isn't empty on load
  for (let i = 0; i < 6; i++) {
    if (visEdges.length) {
      const [a, b] = visEdges[Math.floor(Math.random() * visEdges.length)];
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      particles.push({
        a,
        b,
        t: 0.05 + Math.random() * 0.85,
        speed: 1 / (1800 + Math.random() * 2200),
        color,
        alpha: 1,
      });
    }
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
