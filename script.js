// Dynamically load post content
async function loadPost(slug) {
  try {
    const response = await fetch(`posts/${slug}.json`);
    const post = await response.json();
    
    // Guard clauses - only update elements if they exist
    const postTitle = document.getElementById("post-title");
    const postDate = document.getElementById("post-date");
    const postContent = document.getElementById("post-content");
    
    if (postTitle) postTitle.textContent = post.title;
    if (postDate) postDate.textContent = post.date;
    if (postContent) postContent.innerHTML = post.content;
    
  } catch (error) {
    console.error('Error loading post:', error);
  }
}

function populateSidebar(posts) {
  const sidebar = document.getElementById("sidebar-posts");
  const dropdown = document.getElementById("post-list-dropdown");
  
  // Skip sidebar population if sidebar doesn't exist (clean main page layout)
  if (!sidebar) {
    console.log('Sidebar not found - using clean main page layout');
  }
  
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
    // Only populate sidebar if it exists
    if (sidebar) {
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
        });
      }
    }

    // Always populate dropdown menu for taskbar
    for (const month in yearMap[year]) {
      yearMap[year][month].forEach(post => {
        const drop = document.createElement("a");
        drop.className = "menu-entry";
        drop.href = "#";
        drop.textContent = post.title;
        drop.onclick = () => loadPost(post.slug);
        if (dropdown) dropdown.appendChild(drop);
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
  if (!tip) return; // Guard clause - exit if element doesn't exist
  
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
    document.body.style.setProperty('--menu-bg', customBg);
    // Extract lightness from HSL string
    let fg = '#232323';
    let l = 100;
    if (customBg.startsWith('hsl')) {
      const m = customBg.match(/hsl\(\d+,\s*\d+%?,\s*(\d+)%?\)/);
      if (m) l = parseInt(m[1]);
    } else {
      // fallback to luminance calculation for rgb/hex
      const rgb = customBg.startsWith('#') ? hexToRgb(customBg) : parseRgb(customBg);
      const luminance = rgb ? (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) : 255;
      l = (luminance / 255) * 100;
    }
    if (l < 60) fg = '#fff';
    else fg = '#232323';
    document.body.style.setProperty('--fg', fg);
    document.body.style.setProperty('--menu-fg', fg);
    localStorage.setItem('theme', 'custom');
    localStorage.setItem('customBg', customBg);
  } else if (mode === 'dark') {
    document.body.classList.remove('custom-mode');
    document.body.classList.add('dark-mode');
    document.body.style.removeProperty('--bg');
    document.body.style.removeProperty('--fg');
    document.body.style.removeProperty('--menu-bg');
    document.body.style.removeProperty('--menu-fg');
    localStorage.setItem('theme', 'dark');
    localStorage.removeItem('customBg');
  } else {
    document.body.classList.remove('dark-mode', 'custom-mode');
    document.body.style.removeProperty('--bg');
    document.body.style.removeProperty('--fg');
    document.body.style.removeProperty('--menu-bg');
    document.body.style.removeProperty('--menu-fg');
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
  // Add random color entry if not present
  let randomEntry = viewMenu ? viewMenu.querySelector('.menu-entry[data-mode="random"]') : null;
  if (!randomEntry && viewMenu) {
    randomEntry = document.createElement('div');
    randomEntry.className = 'menu-entry';
    randomEntry.setAttribute('data-mode', 'random');
    randomEntry.textContent = 'Random';
    viewMenu.appendChild(randomEntry);
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
      } else if (mode === 'random') {
        // Generate random HSL values
        const h = Math.floor(Math.random() * 361);
        const s = Math.floor(Math.random() * 41) + 30; // 30-70% for pleasant colors
        const l = Math.floor(Math.random() * 31) + 15; // 15-45% for darkish backgrounds
        const hsl = `hsl(${h},${s}%,${l}%)`;
        // Set sliders and preview if custom menu exists
        if (customMenu) {
          hueSlider.value = h;
          satSlider.value = s;
          lightSlider.value = l;
          hueVal.textContent = h;
          satVal.textContent = s;
          lightVal.textContent = l;
          colorPreview.style.background = hsl;
        }
        setTheme('custom', hsl);
        customMenu.style.display = 'none';
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
  // Track mouse position for popup anchoring
  document.addEventListener('mousemove', (e) => {
    window.lastMouseX = e.clientX;
    window.lastMouseY = e.clientY;
  });
  
  setupMenus();
  setupHoverNotes();
  setupViewMenu();
  
  // Add refresh posts functionality
  const refreshButton = document.getElementById('refresh-posts');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      console.log('Refreshing posts...');
      await loadPostsWithCategories();
    });
  }
  
  // Load posts with categories if we have the dropdown
  if (document.getElementById('post-list-dropdown')) {
    console.log('Found post-list-dropdown, loading posts with categories...');
    await loadPostsWithCategories();
  } else {
    console.log('No post-list-dropdown found, using fallback...');
    // Fallback for pages without the dropdown
    const timestamp = new Date().getTime();
    const response = await fetch(`posts/index.json?t=${timestamp}`);
    const posts = await response.json();
    populateSidebar(posts);
    if (posts.length > 0) loadPost(posts[0].slug);
  }
  
  // Setup image click-to-expand functionality
  setupImageModal();
});

// Image click-to-expand functionality for main site
function setupImageModal() {
  // Add click handlers to all images in post content
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG' && 
        e.target.closest('.post-content')) {
      e.preventDefault();
      showImageModal(e.target);
    }
  });
  
  // Handle escape key to close modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeImageModal();
    }
  });
}

function showImageModal(img) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="image-modal-overlay">
      <div class="image-modal-content">
        <div class="image-modal-header">
          <span class="image-modal-title">📷 ${img.alt || 'Image'}</span>
          <button class="image-modal-close">×</button>
        </div>
        <div class="image-modal-body">
          <img src="${img.src}" alt="${img.alt}" class="full-size-image">
        </div>
        <div class="image-modal-footer">
          Click outside or press ESC to close
        </div>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.appendChild(modal);
  
  // Show modal with animation
  requestAnimationFrame(() => {
    modal.style.display = 'block';
  });
  
  // Close handlers
  modal.querySelector('.image-modal-close').addEventListener('click', () => {
    closeImageModal();
  });
  
  modal.querySelector('.image-modal-overlay').addEventListener('click', (e) => {
    if (e.target.classList.contains('image-modal-overlay')) {
      closeImageModal();
    }
  });
}

function closeImageModal() {
  const modal = document.querySelector('.image-modal');
  if (modal) {
    modal.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const editorContent = document.getElementById('editorContent');
  if (!editorContent) return; // Guard clause - only run on editor page
  
  const updateEditorBackground = () => {
    const siteBackground = getComputedStyle(document.body).backgroundColor;
    editorContent.style.backgroundColor = siteBackground;
  };

  // Update background on theme change
  document.querySelectorAll('[data-mode]').forEach(modeButton => {
    modeButton.addEventListener('click', updateEditorBackground);
  });

  // Initial background update
  updateEditorBackground();
});

// Social sharing functionality
const blueskyShareBtn = document.getElementById('bluesky-share');
if (blueskyShareBtn) {
  blueskyShareBtn.onclick = function() {
    let text = '';
    // If user has selected text, use that
    if (window.getSelection && window.getSelection().toString().trim()) {
      text = window.getSelection().toString().trim();
    } else {
      // Otherwise use the current post content (strip HTML)
      const postContent = document.getElementById('post-content');
      if (postContent) {
        text = postContent.innerText.trim();
      }
    }
    // Limit to 300 chars for Bluesky post
    if (text.length > 300) text = text.slice(0, 297) + '...';
    // Open Bluesky draft in new tab
    const url = `https://bsky.app/compose?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };
}

const twitterShareBtn = document.getElementById('twitter-share');
if (twitterShareBtn) {
  twitterShareBtn.onclick = function() {
    let text = '';
    // If user has selected text, use that
    if (window.getSelection && window.getSelection().toString().trim()) {
      text = window.getSelection().toString().trim();
    } else {
      // Otherwise use the current post content (strip HTML)
      const postContent = document.getElementById('post-content');
      if (postContent) {
        text = postContent.innerText.trim();
      }
    }
    // Limit to 280 chars for Twitter
    if (text.length > 280) text = text.slice(0, 277) + '...';
    // Open Twitter draft in new tab
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };
}

const fileMenuEntry = document.querySelector('[data-menu="File"] .menu-entry');
if (fileMenuEntry) {
  fileMenuEntry.addEventListener('click', (event) => {
    if (event.target.textContent === 'New') {
      const editorContent = document.getElementById('editorContent');
      if (editorContent) {
        const siteBackground = getComputedStyle(document.body).backgroundColor;
        editorContent.style.backgroundColor = siteBackground;
      }
    }
  });
}

// Enhanced Editor Functionality
class EditorManager {
  constructor() {
    this.categories = [];
    this.currentDraft = null;
    this.init();
  }

  async init() {
    console.log('🏗️ EditorManager initializing...');
    await this.loadCategories();
    this.populateCategorySelect();
    this.setupEditorEventListeners();
    this.checkForEditingDraft();
    this.checkAuthStatus();
    console.log('✅ EditorManager initialization complete');
  }

  async loadCategories() {
    try {
      const response = await fetch('data/categories.json');
      this.categories = await response.json();
    } catch (error) {
      console.error('Error loading categories:', error);
      this.categories = ['general'];
    }
  }

  populateCategorySelect() {
    const select = document.getElementById('categorySelect');
    if (!select) return;

    select.innerHTML = this.categories.map(cat => 
      `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`
    ).join('');
  }

  checkForEditingDraft() {
    const draftData = sessionStorage.getItem('editingDraft');
    if (draftData) {
      const draft = JSON.parse(draftData);
      this.currentDraft = draft;
      
      // Populate editor with draft data
      const content = document.getElementById('editorContent');
      const categorySelect = document.getElementById('categorySelect');
      
      if (content) content.value = draft.content;
      if (categorySelect) categorySelect.value = draft.category;
      
      // Clear session storage
      sessionStorage.removeItem('editingDraft');
    }
  }

  async checkAuthStatus() {
    const statusElement = document.getElementById('auth-status');
    const logoutBtn = document.getElementById('logout-btn');
    if (!statusElement) return;

    try {
      // Check authentication via auth-check endpoint
      const response = await fetch('/.netlify/functions/auth-check', {
        credentials: 'include' // Include cookies for authentication
      });
      const data = await response.json();
      
      if (data.authenticated) {
        statusElement.textContent = '✅ Logged In';
        statusElement.style.color = '#51cf66';
        statusElement.title = `You are authenticated as ${data.user.username} and can use all editor functions`;
        statusElement.style.cursor = 'default';
        statusElement.onclick = null;
        
        // Show logout button
        if (logoutBtn) {
          logoutBtn.style.display = 'block';
          logoutBtn.onclick = () => this.handleLogout();
        }
      } else {
        statusElement.textContent = '🔒 Login Required';
        statusElement.style.color = '#ff6b6b';
        statusElement.title = 'Click to sign in with GitHub';
        statusElement.style.cursor = 'pointer';
        statusElement.onclick = () => {
          window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        };
        
        // Hide logout button
        if (logoutBtn) {
          logoutBtn.style.display = 'none';
        }
      }
    } catch (error) {
      statusElement.textContent = '⚠️ Connection Error';
      statusElement.style.color = '#ffd43b';
      statusElement.title = 'Cannot connect to server';
      
      // Hide logout button on error
      if (logoutBtn) {
        logoutBtn.style.display = 'none';
      }
    }
  }

  setupEditorEventListeners() {
    console.log('🔧 Setting up editor event listeners...');
    
    // Make Note functionality
    const makeNoteBtn = document.getElementById('makeNote');
    if (makeNoteBtn) {
      console.log('✅ Found makeNote button, attaching listener');
      makeNoteBtn.addEventListener('click', () => this.handleMakeNote());
    } else {
      console.log('❌ makeNote button not found');
    }

    // Post functionality
    const postBtn = document.getElementById('postToGitHub');
    if (postBtn) {
      console.log('✅ Found postToGitHub button, attaching listener');
      postBtn.addEventListener('click', () => {
        console.log('🖱️ Post button clicked!');
        this.handlePost();
      });
    } else {
      console.log('❌ postToGitHub button not found');
    }

    // Save Draft functionality
    const saveDraftBtn = document.getElementById('saveDraft');
    if (saveDraftBtn) {
      console.log('✅ Found saveDraft button, attaching listener');
      saveDraftBtn.addEventListener('click', () => this.handleSaveDraft());
    } else {
      console.log('❌ saveDraft button not found');
    }

    // New Category functionality
    const newCategoryBtn = document.getElementById('new-category');
    if (newCategoryBtn) {
      newCategoryBtn.addEventListener('click', () => this.handleNewCategory());
    }

    // Modal event listeners
    this.setupModalListeners();
  }

  handleMakeNote() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (!selectedText) {
      this.showMessage('Error', 'Please select some text first to add a note.');
      return;
    }

    document.getElementById('selectedText').textContent = selectedText;
    document.getElementById('noteModal').style.display = 'block';
  }

  async handlePost() {
    console.log('🚀 handlePost() called!');
    console.log('🔍 Button elements:', {
      postBtn: document.getElementById('postToGitHub'),
      content: document.getElementById('editorContent'),
      category: document.getElementById('categorySelect')
    });
    
    const content = document.getElementById('editorContent').value.trim();
    const category = document.getElementById('categorySelect').value;
    
    console.log('📝 Content:', content);
    console.log('📂 Category:', category);
    
    if (!content) {
      console.log('❌ No content provided');
      this.showMessage('Error', 'Please enter some content before posting.');
      return;
    }

    // Generate post data
    const title = this.extractTitle(content) || 'Untitled Post';
    const slug = this.generateSlug(title);

    const postData = {
      title: title,
      content: this.processContent(content),
      category: category,
      slug: slug
    };

    console.log('📤 Sending post data:', postData);

    try {
      const response = await fetch('/.netlify/functions/save-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(postData)
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        this.showMessage('Success', 'Post published successfully!');
        // Clear editor
        document.getElementById('editorContent').value = '';
      } else if (response.status === 401) {
        this.showMessage('Authentication Required', 'Please sign in with GitHub to publish posts. Click the "🔒 Login Required" status to sign in.');
      } else {
        const error = await response.json();
        this.showMessage('Error', error.error || 'Failed to publish post.');
      }
      
    } catch (error) {
      console.error('Error publishing post:', error);
      this.showMessage('Network Error', 'Failed to connect to the server. Please check your internet connection and try again.');
    }
  }

  async handleSaveDraft() {
    const content = document.getElementById('editorContent').value.trim();
    const category = document.getElementById('categorySelect').value;
    
    if (!content) {
      this.showMessage('Error', 'Please enter some content before saving.');
      return;
    }

    const title = this.extractTitle(content) || 'Untitled Draft';
    
    const draftData = {
      id: this.currentDraft ? this.currentDraft.id : null,
      title: title,
      content: content,
      category: category
    };

    try {
      const response = await fetch('/.netlify/functions/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(draftData)
      });

      if (response.ok) {
        const result = await response.json();
        this.showMessage('Success', 'Draft saved successfully!');
        this.currentDraft = result.draft;
      } else if (response.status === 401) {
        this.showMessage('Authentication Required', 'Please sign in with GitHub to save drafts. Click the "🔒 Login Required" status to sign in.');
      } else {
        const error = await response.json();
        this.showMessage('Error', error.error || 'Failed to save draft.');
      }
      
    } catch (error) {
      console.error('Error saving draft:', error);
      this.showMessage('Network Error', 'Failed to connect to the server. Please check your internet connection and try again.');
    }
  }

  handleNewCategory() {
    document.getElementById('categoryModal').style.display = 'block';
  }

  setupModalListeners() {
    // Note Modal
    const noteModal = document.getElementById('noteModal');
    const addNoteBtn = document.getElementById('addNote');
    const cancelNoteBtn = document.getElementById('cancelNote');
    
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        const noteText = document.getElementById('noteText').value.trim();
        if (noteText) {
          this.addNoteToSelection(noteText);
          noteModal.style.display = 'none';
          document.getElementById('noteText').value = '';
        }
      });
    }

    if (cancelNoteBtn) {
      cancelNoteBtn.addEventListener('click', () => {
        noteModal.style.display = 'none';
        document.getElementById('noteText').value = '';
      });
    }

    // Category Modal
    const categoryModal = document.getElementById('categoryModal');
    const addCategoryBtn = document.getElementById('addCategory');
    const cancelCategoryBtn = document.getElementById('cancelCategory');
    
    if (addCategoryBtn) {
      addCategoryBtn.addEventListener('click', () => {
        const categoryName = document.getElementById('categoryName').value.trim().toLowerCase();
        if (categoryName && !this.categories.includes(categoryName)) {
          this.addNewCategory(categoryName);
          categoryModal.style.display = 'none';
          document.getElementById('categoryName').value = '';
        }
      });
    }

    if (cancelCategoryBtn) {
      cancelCategoryBtn.addEventListener('click', () => {
        categoryModal.style.display = 'none';
        document.getElementById('categoryName').value = '';
      });
    }

    // Message Modal
    const messageModal = document.getElementById('messageModal');
    const closeMessageBtn = document.getElementById('closeMessage');
    
    if (closeMessageBtn) {
      closeMessageBtn.addEventListener('click', () => {
        messageModal.style.display = 'none';
      });
    }

    // Close modals when clicking outside
    [noteModal, categoryModal, messageModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.style.display = 'none';
          }
        });
      }
    });
  }

  addNoteToSelection(noteText) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      // Create note element
      const noteElement = document.createElement('span');
      noteElement.className = 'note-link';
      noteElement.setAttribute('data-note', noteText);
      noteElement.textContent = selectedText;
      
      // Replace selection with note element
      range.deleteContents();
      range.insertNode(noteElement);
      
      // Clear selection
      selection.removeAllRanges();
    }
  }

  async addNewCategory(categoryName) {
    this.categories.push(categoryName);
    
    try {
      // Save to GitHub repository categories file
      const response = await fetch('/.netlify/functions/save-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ category: categoryName })
      });

      if (response.ok) {
        this.populateCategorySelect();
        this.showMessage('Success', `Category "${categoryName}" added successfully!`);
      } else if (response.status === 401) {
        // Remove from local array since save failed
        this.categories = this.categories.filter(cat => cat !== categoryName);
        this.showMessage('Authentication Required', 'Please sign in with GitHub to add categories. Click the "🔒 Login Required" status to sign in.');
      } else {
        throw new Error('Failed to save category');
      }
      
    } catch (error) {
      console.error('Error adding category:', error);
      // Remove from local array since save failed
      this.categories = this.categories.filter(cat => cat !== categoryName);
      this.showMessage('Network Error', 'Failed to save category to server. Please check your internet connection and try again.');
    }
  }

  showMessage(title, text) {
    console.log('📢 Showing message:', title, text);
    
    // Use Box Style 1 for validation messages
    if (this.isValidationMessage(text)) {
      this.showBoxMessage(text);
      return;
    }
    
    const messageModal = document.getElementById('messageModal');
    const messageTitle = document.getElementById('messageTitle');
    const messageText = document.getElementById('messageText');
    
    if (!messageModal || !messageTitle || !messageText) {
      console.error('❌ Modal elements not found');
      // Fallback to alert if modal elements are missing
      alert(title + ': ' + text);
      return;
    }
    
    messageTitle.textContent = title;
    messageText.textContent = text;
    
    // Ensure modal is properly displayed and centered
    messageModal.style.display = 'block';
    messageModal.style.position = 'fixed';
    messageModal.style.zIndex = '9999';
    messageModal.style.left = '50%';
    messageModal.style.top = '50%';
    messageModal.style.transform = 'translate(-50%, -50%)';
    messageModal.style.width = 'auto';
    messageModal.style.height = 'auto';
    messageModal.style.backgroundColor = 'rgba(0,0,0,0.5)'; // Background overlay
    
    // Ensure the modal content is properly styled
    const modalContent = messageModal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.margin = '0';
      modalContent.style.position = 'relative';
      modalContent.style.transform = 'none';
    }
    
    console.log('✅ Modal should be visible and centered now');
  }

  isValidationMessage(message) {
    // Determine if this is a simple validation message that should use Box Style 1
    const validationKeywords = [
      'Please enter some content',
      'Please select some text',
      'Please fill in',
      'Please enter',
      'Please write'
    ];
    return validationKeywords.some(keyword => message.includes(keyword));
  }

  showBoxMessage(message) {
    // First try to find an existing message box, or create one if needed
    let box = document.getElementById('messageBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'messageBox';
      box.className = 'box-style-1 message-box hidden';
      box.innerHTML = '<span class="message-text">Message will appear here</span>';
      document.body.appendChild(box);
    }
    
    const textSpan = box.querySelector('.message-text');
    textSpan.textContent = message;
    
    // Get mouse position, or use center if no mouse data
    let x = window.lastMouseX || (window.innerWidth / 2 - 150);
    let y = window.lastMouseY || (window.innerHeight / 3);
    
    // Offset the popup slightly below and to the right of the mouse
    x += 10;
    y += 10;
    
    // Ensure popup stays within viewport boundaries
    const boxWidth = 300; // Approximate width
    const boxHeight = 50; // Approximate height
    
    if (x + boxWidth > window.innerWidth) {
      x = window.innerWidth - boxWidth - 10;
    }
    if (y + boxHeight > window.innerHeight) {
      y = window.innerHeight - boxHeight - 10;
    }
    if (x < 10) x = 10;
    if (y < 10) y = 10;
    
    box.style.left = x + 'px';
    box.style.top = y + 'px';
    box.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      box.classList.add('hidden');
    }, 3000);
  }

  extractTitle(content) {
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    return firstLine.length > 0 && firstLine.length < 100 ? firstLine : null;
  }

  generateSlug(title) {
    return title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  formatDateForPost(dateStr) {
    const date = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${date.getFullYear()}-${months[date.getMonth()]}-${date.getDate()}`;
  }

  processContent(content) {
    // Convert line breaks to HTML and preserve note links
    return content.replace(/\n/g, '<br>');
  }

  async handleLogout() {
    try {
      const response = await fetch('/.netlify/functions/logout', {
        method: 'POST',
        credentials: 'include' // Include cookies for authentication
      });
      
      if (response.ok) {
        // Redirect to home page after logout
        window.location.href = '/index.html';
      } else {
        this.showMessage('Error', 'Failed to logout. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      this.showMessage('Error', 'Network error during logout. Please try again.');
    }
  }
}

// Enhanced Post Management with Categories
async function loadPostsWithCategories() {
  console.log('Starting loadPostsWithCategories...');
  try {
    // Add cache busting to ensure we get the latest posts
    const timestamp = new Date().getTime();
    const url = `posts/index.json?t=${timestamp}`;
    console.log('Fetching posts from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const posts = await response.json();
    console.log('Loaded posts:', posts); // Debug logging
    
    if (!posts || posts.length === 0) {
      console.warn('No posts found in index.json');
      return;
    }
    
    // Group posts by category
    const categorizedPosts = {};
    posts.forEach(post => {
      const category = post.category || 'general';
      if (!categorizedPosts[category]) {
        categorizedPosts[category] = [];
      }
      categorizedPosts[category].push(post);
    });
    
    console.log('Categorized posts:', categorizedPosts); // Debug logging
    
    populateCategorizedSidebar(categorizedPosts);
    populateCategorizedDropdown(categorizedPosts);
    
    // Load the first post if available AND if we're on a page that displays posts
    if (posts.length > 0 && document.getElementById('post-content')) {
      console.log('Loading first post:', posts[0].slug);
      loadPost(posts[0].slug);
    }
    
  } catch (error) {
    console.error('Error loading posts:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

function populateCategorizedSidebar(categorizedPosts) {
  const sidebar = document.getElementById("sidebar-posts");
  
  // Skip sidebar population if sidebar doesn't exist (clean main page layout)
  if (!sidebar) {
    console.log('Sidebar not found - using clean main page layout');
    return;
  }
  if (!sidebar) return;
  
  sidebar.innerHTML = '';
  
  for (const category in categorizedPosts) {
    const categoryEl = document.createElement("li");
    categoryEl.innerHTML = `<details open><summary>${category.charAt(0).toUpperCase() + category.slice(1)}</summary><ul></ul></details>`;
    sidebar.appendChild(categoryEl);
    
    const categoryUl = categoryEl.querySelector("ul");
    const posts = categorizedPosts[category];
    
    // Group by year/month within category
    const yearMap = {};
    posts.forEach(post => {
      const [year, month] = post.date.split("-");
      if (!yearMap[year]) yearMap[year] = {};
      if (!yearMap[year][month]) yearMap[year][month] = [];
      yearMap[year][month].push(post);
    });
    
    for (const year in yearMap) {
      const yearEl = document.createElement("li");
      yearEl.innerHTML = `<details><summary>${year}</summary><ul></ul></details>`;
      categoryUl.appendChild(yearEl);
      
      const yearUl = yearEl.querySelector("ul");
      for (const month in yearMap[year]) {
        const monthEl = document.createElement("li");
        monthEl.innerHTML = `<details><summary>${month}</summary><ul></ul></details>`;
        yearUl.appendChild(monthEl);
        
        const monthUl = monthEl.querySelector("ul");
        yearMap[year][month].forEach(post => {
          const postLink = document.createElement("a");
          postLink.href = "#";
          postLink.textContent = post.title;
          postLink.onclick = () => loadPost(post.slug);
          
          const li = document.createElement("li");
          li.appendChild(postLink);
          monthUl.appendChild(li);
        });
      }
    }
  }
}

function populateCategorizedDropdown(categorizedPosts) {
  const dropdown = document.getElementById("post-list-dropdown");
  if (!dropdown) return;
  
  // Clear only the post entries, preserve the refresh button
  const refreshButton = dropdown.querySelector('#refresh-posts');
  dropdown.innerHTML = '';
  
  // Re-add the refresh button first
  if (refreshButton) {
    dropdown.appendChild(refreshButton);
  } else {
    // Create refresh button if it doesn't exist
    const newRefreshButton = document.createElement("div");
    newRefreshButton.className = "menu-entry";
    newRefreshButton.id = "refresh-posts";
    newRefreshButton.textContent = "Refresh Posts";
    newRefreshButton.addEventListener('click', async () => {
      console.log('Refreshing posts...');
      await loadPostsWithCategories();
    });
    dropdown.appendChild(newRefreshButton);
  }
  
  for (const category in categorizedPosts) {
    // Add category header
    const categoryHeader = document.createElement("div");
    categoryHeader.className = "menu-entry category-header";
    categoryHeader.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categoryHeader.style.fontWeight = "bold";
    categoryHeader.style.backgroundColor = "var(--border)";
    dropdown.appendChild(categoryHeader);
    
    // Add posts in category
    categorizedPosts[category].forEach(post => {
      const postEntry = document.createElement("a");
      postEntry.className = "menu-entry";
      postEntry.href = "#";
      postEntry.textContent = post.title;
      postEntry.style.paddingLeft = "20px";
      postEntry.onclick = () => loadPost(post.slug);
      dropdown.appendChild(postEntry);
    });
  }
}

// Initialize editor manager on editor page
let editorManager;
document.addEventListener('DOMContentLoaded', () => {
  // Initialize editor manager if we're on the editor page
  if (document.getElementById('editorContent')) {
    editorManager = new EditorManager();
  }
  
  // Load categorized posts if we have the dropdown
  if (document.getElementById('post-list-dropdown')) {
    loadPostsWithCategories();
  }
});
