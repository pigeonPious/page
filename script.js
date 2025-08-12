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
  // Find the View menu dropdown (the one with Light/Dark)
  const viewMenu = Array.from(document.querySelectorAll('.menu-item .menu-dropdown')).find(dropdown => {
    return Array.from(dropdown.children).some(child => child.textContent === 'Dark' || child.textContent === 'Light');
  });
  // Ensure Light and Dark entries have data-mode attributes
  if (viewMenu) {
    Array.from(viewMenu.children).forEach(child => {
      if (child.textContent === 'Dark') child.setAttribute('data-mode', 'dark');
      if (child.textContent === 'Light') child.setAttribute('data-mode', 'light');
    });
  }
  // Add custom color entry if not present
  let customEntry = viewMenu ? viewMenu.querySelector('.menu-entry[data-mode="custom"]') : null;
  if (!customEntry && viewMenu) {
    customEntry = document.createElement('div');
    customEntry.className = 'menu-entry';
    customEntry.setAttribute('data-mode', 'custom');
    customEntry.textContent = 'Custom…';
    viewMenu.appendChild(customEntry);
  }
  // Add custom color menu if not present
  let customMenu = document.getElementById('customColorMenu');
  if (!customMenu) {
    customMenu = document.createElement('div');
    customMenu.id = 'customColorMenu';
    customMenu.innerHTML = `
      <label>Background Color (HSL):</label>
      <div class="slider-group"><label>H</label><input type="range" min="0" max="360" value="210" id="hueSlider"><span id="hueVal">210</span></div>
      <div class="slider-group"><label>S</label><input type="range" min="0" max="100" value="10" id="satSlider"><span id="satVal">10</span></div>
      <div class="slider-group"><label>L</label><input type="range" min="0" max="100" value="15" id="lightSlider"><span id="lightVal">15</span></div>
      <span class="color-preview" id="colorPreview"></span>
      <button class="close-btn" type="button">Close</button>
    `;
    document.body.appendChild(customMenu);
  }
  const hueSlider = customMenu.querySelector('#hueSlider');
  const satSlider = customMenu.querySelector('#satSlider');
  const lightSlider = customMenu.querySelector('#lightSlider');
  const hueVal = customMenu.querySelector('#hueVal');
  const satVal = customMenu.querySelector('#satVal');
  const lightVal = customMenu.querySelector('#lightVal');
  const colorPreview = customMenu.querySelector('#colorPreview');
  const closeBtn = customMenu.querySelector('.close-btn');

  function hslString() {
    return `hsl(${hueSlider.value},${satSlider.value}%,${lightSlider.value}%)`;
  }
  function updateCustomColor() {
    hueVal.textContent = hueSlider.value;
    satVal.textContent = satSlider.value;
    lightVal.textContent = lightSlider.value;
    const hsl = hslString();
    colorPreview.style.background = hsl;
    setTheme('custom', hsl);
  }
  [hueSlider, satSlider, lightSlider].forEach(slider => {
    slider.oninput = updateCustomColor;
  });
  // Remove any previous click handlers to avoid duplicates
  document.querySelectorAll('.menu-entry[data-mode]').forEach(entry => {
    const newEntry = entry.cloneNode(true);
    entry.parentNode.replaceChild(newEntry, entry);
  });
  // Re-select after cloning
  document.querySelectorAll('.menu-entry[data-mode]').forEach(entry => {
    entry.onclick = (e) => {
      const mode = entry.getAttribute('data-mode');
      if (mode === 'custom') {
        // Position the custom menu below the clicked entry
        const rect = entry.getBoundingClientRect();
        customMenu.style.left = rect.left + 'px';
        customMenu.style.top = (rect.bottom + window.scrollY) + 'px';
        // Load last custom color or default
        let h = 210, s = 10, l = 15;
        const last = localStorage.getItem('customBg');
        if (last && last.startsWith('hsl')) {
          const m = last.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
          if (m) { h = +m[1]; s = +m[2]; l = +m[3]; }
        }
        hueSlider.value = h; satSlider.value = s; lightSlider.value = l;
        updateCustomColor();
        customMenu.style.display = 'block';
      } else {
        setTheme(mode);
        customMenu.style.display = 'none';
      }
    };
  });
  closeBtn.onclick = () => {
    customMenu.style.display = 'none';
  };
  // Hide custom menu if clicking outside
  document.addEventListener('mousedown', e => {
    if (customMenu.style.display === 'block' && !customMenu.contains(e.target) && !e.target.matches('.menu-entry[data-mode="custom"]')) {
      customMenu.style.display = 'none';
    }
  });
  // On load, set theme from localStorage
  const saved = localStorage.getItem('theme');
  if (saved === 'custom') {
    setTheme('custom', localStorage.getItem('customBg') || 'hsl(210,10%,15%)');
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
