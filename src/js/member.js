import membersData from "../data/members.json";
import postsData from "../data/posts.json";

const SOCIAL_ICONS = {
  github: {
    label: "GitHub",
    btnClass: "btn--cyan",
    svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`,
  },
  linkedin: {
    label: "LinkedIn",
    btnClass: "btn--magenta",
    svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  },
  telegram: {
    label: "Telegram",
    btnClass: "btn--green",
    svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.835l-2.94-.916c-.638-.203-.65-.638.135-.943l11.49-4.43c.533-.194 1.001.13.949.675z"/></svg>`,
  },
};

function buildInitialsPlaceholder(member) {
  const colorMap = { cyan: "#00e5ff", magenta: "#e040fb", green: "#39ff14" };
  const neon = colorMap[member.color] || "#00e5ff";
  return `<div class="member-hero__photo-placeholder" style="width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,rgba(0,229,255,0.15),rgba(57,255,20,0.15));display:flex;align-items:center;justify-content:center;font-size:clamp(32px,5vw,64px);font-weight:700;color:${neon};border:2px solid rgba(57,255,20,0.3)" aria-label="${member.name}">${member.initial}</div>`;
}

function renderPhoto(member) {
  const wrap = document.getElementById("member-photo-wrap");
  if (!wrap) return;
  if (member.photo) {
    wrap.innerHTML = `<img class="member-hero__photo" src="${member.photo}" alt="${member.name} — ${member.role}" width="180" height="180" />`;
  } else {
    wrap.innerHTML = buildInitialsPlaceholder(member);
  }
}

function renderBadges(member) {
  const el = document.getElementById("member-badges");
  if (!el) return;
  el.innerHTML = member.badges
    .map(
      (b) =>
        `<li><span class="neon-badge neon-badge--${b.color}">${b.label}</span></li>`,
    )
    .join("");
}

function renderSocials(member) {
  const el = document.getElementById("member-socials");
  if (!el) return;
  const links = Object.entries(member.socials)
    .filter(([, url]) => url && url !== "#")
    .map(([key, url]) => {
      const icon = SOCIAL_ICONS[key];
      if (!icon) return "";
      return `<a href="${url}" class="btn ${icon.btnClass}" target="_blank" rel="noopener" aria-label="${icon.label}">${icon.svg} ${icon.label}</a>`;
    })
    .join("");
  el.innerHTML = links;
}

function renderSkills(member) {
  const el = document.getElementById("member-skills");
  if (!el) return;
  const colorMap = {
    cyan: "",
    magenta: "skill-bar__fill--magenta",
    green: "skill-bar__fill--green",
  };
  el.innerHTML = Object.entries(member.skills)
    .map(([groupName, bars]) => {
      const barsHtml = bars
        .map(
          (s) => `<div class="skill-bar">
            <div class="skill-bar__label"><span>${s.label}</span><span>${s.pct}%</span></div>
            <div class="skill-bar__track"><div class="skill-bar__fill ${colorMap[s.color] || ""}" style="width:${s.pct}%"></div></div>
          </div>`,
        )
        .join("");
      return `<div class="member-skills__group">
        <h3 class="member-skills__group-title">${groupName}</h3>
        <div class="member-skills__bars">${barsHtml}</div>
      </div>`;
    })
    .join("");
}

function renderProjects(member) {
  const el = document.getElementById("member-projects");
  if (!el) return;
  el.innerHTML = member.projects
    .map((p) => {
      const tagsHtml = p.tags
        .map(
          (t) =>
            `<li><span class="neon-badge neon-badge--${t.color}">${t.label}</span></li>`,
        )
        .join("");
      const githubLink = p.links.github
        ? `<a href="${p.links.github}" class="btn btn--ghost btn--sm" target="_blank" rel="noopener">GitHub</a>`
        : "";
      const demoLink = p.links.demo
        ? `<a href="${p.links.demo}" class="btn btn--${p.color} btn--sm" target="_blank" rel="noopener">Demo</a>`
        : "";
      return `<li>
        <article class="project-card project-card--${p.color}">
          <div class="project-card__cover-placeholder" aria-hidden="true">&lt;/&gt;</div>
          <div class="project-card__body">
            <h3 class="project-card__title">${p.title}</h3>
            <p class="project-card__description">${p.description}</p>
            <ul class="project-card__tags" aria-label="Технології" role="list">${tagsHtml}</ul>
          </div>
          <div class="project-card__footer">
            <div class="project-card__links">${githubLink}${demoLink}</div>
          </div>
        </article>
      </li>`;
    })
    .join("");
}

function renderPosts(memberPosts) {
  const el = document.getElementById("member-posts");
  if (!el) return;
  if (!memberPosts.length) {
    el.innerHTML = '<p class="member-posts__empty">Поки немає статей.</p>';
    return;
  }
  el.innerHTML = memberPosts
    .map(
      (p) => `<a href="${p.url}" class="member-posts__item">
        <time class="member-posts__date" datetime="${p.date}">${p.dateLabel}</time>
        <span class="member-posts__title">${p.title}</span>
        <span class="member-posts__arrow" aria-hidden="true">→</span>
      </a>`,
    )
    .join("");
}

function renderCta(member) {
  const sub = document.querySelector(".cta__subheading");
  if (!sub) return;
  if (member.id === "serhii") {
    sub.textContent =
      "Відкритий до нових проектів та фрілансу. Пишіть — обговоримо!";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const memberId = params.get("id") || "valeriia";

  const members = membersData;
  const posts = postsData;

  const member = members.find((m) => m.id === memberId);
  if (!member) {
    window.location.href = "team.html";
    return;
  }

  document.title = `${member.name} — cote-lapyx`;

  const nameEl = document.getElementById("member-name");
  const roleEl = document.getElementById("member-role");
  const bioEl = document.getElementById("member-bio");
  if (nameEl) nameEl.textContent = member.name;
  if (roleEl) roleEl.textContent = member.role;
  if (bioEl) bioEl.textContent = member.bio;

  renderPhoto(member);
  renderBadges(member);
  renderSocials(member);
  renderSkills(member);
  renderProjects(member);

  const memberPosts = posts
    .filter((p) => p.author === member.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  renderPosts(memberPosts);

  renderCta(member);
});
