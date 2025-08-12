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

function setTheme(mode, customBg) {
  if (mode === 'custom' && customBg) {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('custom-mode');
    document.body.style.setProperty('--bg', customBg);
    // Determine if color is light or dark for contrast
    const rgb = customBg.startsWith('#') ? hexToRgb(customBg) : parseRgb(customBg);
    const luminance = rgb ? (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) : 255;
    const fg = luminance > 186 ? '#232323' : '#eaeaea';
    document.body.style.setProperty('--fg', fg);
    localStorage.setItem('theme', 'custom');
    localStorage.setItem('customBg', customBg);
  } else if (mode === 'dark') {
    document.body.classList.remove('custom-mode');
    document.body.classList.add('dark-mode');
    document.body.style.removeProperty('--bg');
    document.body.style.removeProperty('--fg');
    localStorage.setItem('theme', 'dark');
    localStorage.removeItem('customBg');
  } else {
    document.body.classList.remove('dark-mode', 'custom-mode');
    document.body.style.removeProperty('--bg');
    document.body.style.removeProperty('--fg');
    localStorage.setItem('theme', 'light');
    localStorage.removeItem('customBg');
  }
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
}
function parseRgb(rgbStr) {
  const m = rgbStr.match(/rgb\s*\((\d+),\s*(\d+),\s*(\d+)\)/);
  return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : null;
}

function setupViewMenu() {
  // Add custom color entry if not present
  let customEntry = document.querySelector('.menu-entry[data-mode="custom"]');
  if (!customEntry) {
    customEntry = document.createElement('div');
    customEntry.className = 'menu-entry';
    customEntry.setAttribute('data-mode', 'custom');
    customEntry.textContent = 'Custom…';
    // Find the View menu dropdown
    const viewMenu = Array.from(document.querySelectorAll('.menu-item .menu-dropdown')).find(dropdown => {
      return Array.from(dropdown.children).some(child => child.textContent === 'Dark' || child.textContent === 'Light');
    });
    if (viewMenu) viewMenu.appendChild(customEntry);
  }
  // Add color input if not present
  let colorInput = document.getElementById('customColorInput');
  if (!colorInput) {
    colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.id = 'customColorInput';
    colorInput.style.display = 'none';
    document.body.appendChild(colorInput);
  }
  // Set up click handlers for all theme buttons
  document.querySelectorAll('.menu-entry[data-mode]').forEach(entry => {
    entry.onclick = (e) => {
      const mode = entry.getAttribute('data-mode');
      if (mode === 'custom') {
        colorInput.value = localStorage.getItem('customBg') || '#f7f7f7';
        colorInput.click();
      } else {
        setTheme(mode);
      }
    };
  });
  colorInput.oninput = () => {
    setTheme('custom', colorInput.value);
  };
  // On load, set theme from localStorage
  const saved = localStorage.getItem('theme');
  if (saved === 'custom') {
    setTheme('custom', localStorage.getItem('customBg') || '#f7f7f7');
  } else if (saved === 'dark' || saved === 'light') {
    setTheme(saved);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  setupMenus();
  setupHoverNotes();
  setupViewMenu();
  const response = await fetch("posts/index.json");
  const posts = await response.json();
  populateSidebar(posts);
  if (posts.length > 0) loadPost(posts[0].slug);
});
