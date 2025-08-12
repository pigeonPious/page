// Dynamically load post content
async function loadPost(slug) {
  const response = await fetch(`posts/${slug}.json`);
  const post = await response.json();
  document.getElementById("post-title").textContent = post.title;
  document.getElementById("post-date").textContent = post.date;
  document.getElementById("post-content").innerHTML = post.content;
}

function populateSidebar(posts) {
  const sidebar = document.getElementById("sidebar-posts");
  const dropdown = document.getElementById("post-list-dropdown");
  const yearMap = {};

  posts.forEach((post, index) => {
    const [year, month] = post.date.split("-");
    if (!yearMap[year]) {
      yearMap[year] = {};
    }
    if (!yearMap[year][month]) {
      yearMap[year][month] = [];
    }
    yearMap[year][month].push(post);
  });

  for (const year in yearMap) {
    const y = document.createElement("li");
    y.innerHTML = `<details open><summary>${year}</summary><ul></ul></details>`;
    sidebar.appendChild(y);
    const yearUl = y.querySelector("ul");
    for (const month in yearMap[year]) {
      const m = document.createElement("li");
      m.innerHTML = `<details open><summary>${month}</summary><ul></ul></details>`;
      yearUl.appendChild(m);
      const monthUl = m.querySelector("ul");
      yearMap[year][month].forEach(post => {
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = post.title;
        a.onclick = () => loadPost(post.slug);
        const li = document.createElement("li");
        li.appendChild(a);
        monthUl.appendChild(li);

        const drop = document.createElement("a");
        drop.className = "menu-entry";
        drop.href = "#";
        drop.textContent = post.title;
        drop.onclick = () => loadPost(post.slug);
        dropdown.appendChild(drop);
      });
    }
  }
}

function setupMenus() {
  document.querySelectorAll('[data-menu]').forEach(label => {
    label.addEventListener('click', () => {
      const item = label.parentElement;
      const open = item.classList.contains('open');
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.menu-item'))
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('open'));
  });
}

function setupHoverNotes() {
  const tip = document.getElementById('hoverNote');
  function place(x, y) {
    const pad = 10;
    const rect = tip.getBoundingClientRect();
    tip.style.left = Math.min(window.innerWidth - rect.width - pad, x + 14) + 'px';
    tip.style.top  = Math.min(window.innerHeight - rect.height - pad, y + 18) + 'px';
  }
  document.addEventListener("mouseover", e => {
    if (e.target.classList.contains("note-link")) {
      tip.textContent = e.target.getAttribute("data-note") || "";
      tip.style.display = "block";
    }
  });
  document.addEventListener("mousemove", e => {
    if (tip.style.display === "block") place(e.clientX, e.clientY);
  });
  document.addEventListener("mouseout", () => {
    tip.style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupMenus();
  setupHoverNotes();
  const response = await fetch("posts/index.json");
  const posts = await response.json();
  populateSidebar(posts);
  if (posts.length > 0) loadPost(posts[0].slug);
});
