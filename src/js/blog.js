function buildAuthorAvatar(member) {
  if (member && member.photo) {
    return `<img class="blog-card__author-avatar" src="${member.photo}" alt="${member.name}" width="26" height="26" />`;
  }
  const colorMap = { cyan: "#00e5ff", magenta: "#e040fb", green: "#39ff14" };
  const neon = member ? colorMap[member.color] || "#00e5ff" : "#00e5ff";
  const initial = member ? member.initial : "?";
  return `<div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,rgba(0,229,255,0.15),rgba(57,255,20,0.15));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${neon};border:1px solid rgba(57,255,20,0.3)" aria-hidden="true">${initial}</div>`;
}

function buildBlogCard(post, member) {
  const avatar = buildAuthorAvatar(member);
  const authorName = member ? member.name : post.author;
  return `<li data-cat="${post.category.toLowerCase()}">
    <article class="blog-card">
      <div class="blog-card__cover-placeholder" aria-hidden="true">${post.icon}</div>
      <div class="blog-card__body">
        <div class="blog-card__meta">
          <span class="blog-card__category">${post.category}</span>
          <span class="blog-card__read-time">${post.readTime}</span>
        </div>
        <h2 class="blog-card__title">${post.title}</h2>
        <p class="blog-card__excerpt">${post.excerpt}</p>
        <div class="blog-card__footer">
          <div class="blog-card__author">${avatar}${authorName}</div>
          <time class="blog-card__date" datetime="${post.date}">${post.dateLabel}</time>
        </div>
      </div>
    </article>
  </li>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("blog-list");
  const latestEl = document.getElementById("blog-latest");

  if (!listEl && !latestEl) return;

  const [posts, members] = await Promise.all([
    fetch("data/posts.json").then((r) => r.json()),
    fetch("data/members.json").then((r) => r.json()),
  ]);

  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (listEl) {
    listEl.innerHTML = sorted
      .map((post) => {
        const member = members.find((m) => m.id === post.author) || null;
        return buildBlogCard(post, member);
      })
      .join("");
  }

  if (latestEl) {
    latestEl.innerHTML = sorted
      .slice(0, 3)
      .map((post) => {
        const member = members.find((m) => m.id === post.author) || null;
        return buildBlogCard(post, member);
      })
      .join("");
  }
});
