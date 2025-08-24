/**
 * PPPage - Simple, Reliable Blog System v3.0
 * Optimized and simplified while maintaining all functionality
 */

class SimpleBlog {
  constructor() {
    this.currentPost = null;
    this.posts = [];
    this.theme = localStorage.getItem('ppPage_theme') || 'dark';
    this.currentSiteMap = null;
    this.siteMapManuallyToggled = false;
    this.siteMapManuallyHidden = false;
    
    this.init();
  }

  init() {
    this.createTaskbar();
    this.bindEvents();
    this.loadPosts().then(() => {
      this.handleInitialLoad();
    });
    this.setTheme(this.theme, false);
    this.loadLogoFromConfig();
  }

  createTaskbar() {
    const taskbarHTML = `
      <div class="menu-bar" id="main-taskbar">
        <div class="menu-bar-inner">
          <div class="menu-star" id="star-button" title="Home">*</div>
          
          <div class="menu-item" data-menu="file">
            <div class="label">File</div>
            <div class="menu-dropdown">
              <a class="menu-entry" id="new-post" href="editor.html">New Post</a>
              <div class="menu-separator"></div>
              <div class="menu-entry editor-only admin-only" id="open-draft-btn">Open Draft</div>
              <div class="menu-entry editor-only" id="open-in-github">Open in GitHub</div>
              <div class="menu-entry editor-only admin-only" id="import-btn">Import</div>
              <div class="menu-separator"></div>
              <div class="menu-entry editor-only admin-only" id="save-draft-btn">Save Draft</div>
              <div class="menu-entry editor-only admin-only" id="export-btn">Export</div>
              <div class="menu-entry editor-only admin-only" id="publish-btn">Publish</div>
              <div class="menu-separator"></div>
              <div class="menu-entry" id="open-console-btn">Open Console</div>
            </div>
          </div>
          
          <div class="menu-item" data-menu="edit">
            <div class="label">Edit</div>
            <div class="menu-dropdown">
              <div class="menu-entry blog-only admin-only" id="edit-post-button">Edit Post</div>
              <div class="menu-separator"></div>
              <div class="menu-entry editor-only admin-only" id="delete-post-button">Delete Post</div>
              <div class="menu-separator"></div>
              <div class="menu-entry editor-only admin-only" id="images-btn">Images</div>
              <div class="menu-entry editor-only admin-only" id="keywords-btn">Flags</div>
            </div>
          </div>
          
          <div class="menu-item" data-menu="navigation">
            <div class="label">Navigation</div>
            <div class="menu-dropdown" id="navigation-dropdown">
              <div class="menu-entry" id="about-btn">About</div>
              <div class="menu-entry" id="contact-btn">Contact</div>
              <div class="menu-separator"></div>
              <div class="menu-entry has-submenu" id="all-posts-menu" style="position: relative;">All Posts ></div>
              <div class="menu-entry" id="most-recent-post">Most Recent</div>
              <div class="menu-entry" id="random-post">Random Post</div>
              <div class="menu-separator"></div>
              <div class="menu-entry" id="show-site-map">Site Map</div>
            </div>
          </div>
          
          <div class="menu-item" data-menu="projects">
            <div class="label">Projects</div>
            <div class="menu-dropdown" id="projects-dropdown"></div>
          </div>
          
          <div class="menu-item" data-menu="view">
            <div class="label">View</div>
            <div class="menu-dropdown">
              <div class="menu-entry" data-mode="dark">Dark</div>
              <div class="menu-entry" data-mode="light">Light</div>
              <div class="menu-entry" data-mode="custom">Custom…</div>
              <div class="menu-entry" data-mode="random">Random</div>
            </div>
          </div>
          
          <div class="menu-item" data-menu="connect">
            <div class="label">Share</div>
            <div class="menu-dropdown">
              <div class="menu-entry" id="bluesky-share">Share to Bluesky</div>
              <div class="menu-entry" id="twitter-share">Share to Twitter</div>
            </div>
          </div>
          
          <div class="pigeon-label" style="margin-left: auto; padding: 0 12px; font-size: 12px; color: var(--fg); font-family: monospace; cursor: default; user-select: none;">
            <span id="github-connect-underscore" style="color: #fff; cursor: pointer; margin-right: 2px;">_</span>PiousPigeon
            <span id="logout-btn" style="color: var(--muted); cursor: pointer; margin-left: 8px; display: none;">logout</span>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', taskbarHTML);
    this.bindTaskbarEvents();
  }

  bindTaskbarEvents() {
    // Basic navigation
    this.addClickHandler('#about-btn', () => this.loadPost('about'));
    this.addClickHandler('#contact-btn', () => this.loadPost('contact'));
    this.addClickHandler('#logout-btn', () => this.logout());
    this.addClickHandler('#star-button', () => this.toggleSiteMap());
    
    // File menu
    this.addClickHandler('#new-post', (e) => { e.preventDefault(); window.location.href = 'editor.html'; });
    this.addClickHandler('#open-draft-btn', () => this.showDraftsModal());
    this.addClickHandler('#import-btn', () => this.importPost());
    this.addClickHandler('#export-btn', () => this.exportPost());
    this.addClickHandler('#save-draft-btn', () => this.saveDraft());
    this.addClickHandler('#publish-btn', () => this.showPublishModal());
    this.addClickHandler('#open-console-btn', () => this.showConsole());
    
    // Edit menu
    this.addClickHandler('#edit-post-button', () => this.editCurrentPost());
    this.addClickHandler('#delete-post-button', () => this.showDeletePostConfirmation());
    this.addClickHandler('#images-btn', () => this.showImagesModal());
    this.addClickHandler('#keywords-btn', () => this.showFlagsModal());
    
    // Navigation menu
    this.addClickHandler('#most-recent-post', () => this.loadMostRecentPost());
    this.addClickHandler('#random-post', () => this.loadRandomPost());
    this.addClickHandler('#show-site-map', () => this.showSiteMap());
    
    // View menu (themes)
    this.addClickHandler('[data-mode]', (e) => {
      const mode = e.target.dataset.mode;
      this.setTheme(mode, mode === 'custom');
    });
    
    // Share menu
    this.addClickHandler('#bluesky-share', () => this.shareToBluesky());
    this.addClickHandler('#twitter-share', () => this.shareToTwitter());
    
    // GitHub connect
    this.addClickHandler('#github-connect-underscore', () => this.showGitHubLogin());
  }

  addClickHandler(selector, handler) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => element.addEventListener('click', handler));
  }

  bindEvents() {
    this.setupMenuSystem();
    this.setupSubmenus();
    this.setupPageSpecificElements();
  }

  setupMenuSystem() {
    document.addEventListener('click', (e) => {
      const menuItem = e.target.closest('.menu-item');
      if (menuItem) {
        this.toggleMenu(menuItem);
      } else {
        this.closeAllMenus();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAllMenus();
    });
  }

  toggleMenu(menuItem) {
    const isOpen = menuItem.classList.contains('open');
    this.closeAllMenus();
    if (!isOpen) menuItem.classList.add('open');
  }

  closeAllMenus() {
    document.querySelectorAll('.menu-item.open').forEach(menu => {
      menu.classList.remove('open');
    });
  }

  setupSubmenus() {
    const allPostsMenu = document.getElementById('all-posts-menu');
    if (allPostsMenu) {
      allPostsMenu.addEventListener('mouseenter', () => {
        setTimeout(() => this.showAllPostsSubmenu(allPostsMenu), 150);
      });
      
      allPostsMenu.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const existingSubmenu = allPostsMenu.querySelector('.submenu');
        if (existingSubmenu) {
          existingSubmenu.remove();
        } else {
          this.showAllPostsSubmenu(allPostsMenu);
        }
      });
    }
  }

  async loadPosts() {
    try {
      // Use GitHub repository scanning to discover posts
      const response = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts');
      if (response.ok) {
        const directoryContents = await response.json();
        const postFiles = directoryContents.filter(item => 
          item.type === 'file' && 
          item.name.endsWith('.json') && 
          item.name !== 'index.json'
        );
        
        const posts = [];
        for (const postFile of postFiles) {
          try {
            const postResponse = await fetch(postFile.download_url);
            if (postResponse.ok) {
              const postData = await postResponse.json();
              const commitDate = await this.getCommitDate(`posts/${postFile.name}`);
              
              posts.push({
                slug: postFile.name.replace('.json', ''),
                title: postData.title || 'Untitled',
                date: commitDate,
                keywords: postData.keywords || 'general',
                content: postData.content || ''
              });
            }
          } catch (error) {
            console.warn(`Could not parse post file: ${postFile.name}`, error);
          }
        }
        
        this.posts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        localStorage.setItem('posts', JSON.stringify(this.posts));
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      // Try to use cached posts
      const cachedPosts = localStorage.getItem('posts');
      if (cachedPosts) {
        try {
          this.posts = JSON.parse(cachedPosts);
        } catch (e) {
          console.warn('Could not parse cached posts');
        }
      }
    }
  }

  async getCommitDate(filePath) {
    try {
      const response = await fetch(`https://api.github.com/repos/pigeonPious/page/commits?path=${filePath}&per_page=1`);
      if (response.ok) {
        const commits = await response.json();
        if (commits && commits.length > 0) {
          return new Date(commits[0].commit.author.date).toISOString().split('T')[0];
        }
      }
    } catch (error) {
      console.warn(`Could not fetch commit date for ${filePath}:`, error);
    }
    return new Date().toISOString().split('T')[0];
  }

  handleInitialLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const postSlug = urlParams.get('post');
    if (postSlug) {
      this.loadPost(postSlug);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const hashSlug = window.location.hash.substring(1);
      if (hashSlug) {
        this.loadPost(hashSlug);
      } else {
        const storedCurrentPost = localStorage.getItem('current_post_slug');
        if (storedCurrentPost) {
          this.loadPost(storedCurrentPost);
        } else if (this.posts.length > 0) {
          this.loadPost(this.posts[0].slug);
        }
      }
    }
    
    if (!window.location.pathname.includes('editor.html')) {
      setTimeout(() => {
        if (!this.siteMapManuallyToggled && !this.siteMapManuallyHidden) {
          this.showSiteMap();
        }
      }, 500);
    }
    
    this.loadAndDisplayProjects();
  }

  async loadPost(slug) {
    try {
      const postUrl = `https://raw.githubusercontent.com/pigeonPious/page/main/posts/${slug}.json`;
      const response = await fetch(postUrl);
      
      if (response.ok) {
        const post = await response.json();
        this.displayPost(post);
        this.currentPost = post;
        localStorage.setItem('current_post_slug', slug);
        return post;
      } else {
        console.error(`Failed to load post ${slug}: Post not found`);
        this.displayDefaultContent();
      }
    } catch (error) {
      console.error(`Error loading post ${slug}:`, error);
      this.displayDefaultContent();
    }
  }

  displayPost(post) {
    if (post && post.slug) {
      const currentHash = window.location.hash;
      const newHash = `#${post.slug}`;
      
      if (currentHash !== newHash) {
        window.location.hash = newHash;
        window.history.replaceState({ postSlug: post.slug }, post.title, window.location.href);
      }
    }
    
    const titleElement = document.getElementById('post-title');
    const dateElement = document.getElementById('post-date');
    const contentElement = document.getElementById('post-content');

    if (titleElement) titleElement.textContent = post.title || 'Untitled';
    if (dateElement) dateElement.textContent = post.date || '';
    if (contentElement) {
      contentElement.innerHTML = post.content || '';
      this.setupImageClickHandlers(contentElement);
    }
    
    this.setupHoverNotes();
    this.addPostNavigation(post);
    this.siteMapManuallyToggled = false;
    this.siteMapManuallyHidden = false;
  }

  displayDefaultContent() {
    const titleElement = document.getElementById('post-title');
    const dateElement = document.getElementById('post-date');
    const contentElement = document.getElementById('post-content');

    if (titleElement) titleElement.textContent = '# Blog';
    if (dateElement) dateElement.textContent = '';
    if (contentElement) contentElement.innerHTML = '<p>Welcome to the blog! Posts will appear here once loaded.</p>';
  }

  setupImageClickHandlers(contentElement) {
    const images = contentElement.querySelectorAll('img');
    images.forEach((img, index) => {
      const newImg = img.cloneNode(true);
      img.parentNode.replaceChild(newImg, img);
      
      newImg.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showImagePreview(newImg.src, newImg.alt || 'Image');
      });
      
      newImg.style.cursor = 'pointer';
      newImg.title = 'Click to view full size';
      newImg.style.pointerEvents = 'auto';
      newImg.style.userSelect = 'none';
    });
  }

  showImagePreview(imageSrc, imageAlt) {
    const existingPreview = document.getElementById('image-preview-overlay');
    if (existingPreview) existingPreview.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'image-preview-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 50px;
      box-sizing: border-box;
    `;
    
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
      position: relative;
      cursor: default;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    `;
    
    const fullImage = document.createElement('img');
    fullImage.src = imageSrc;
    fullImage.alt = imageAlt;
    fullImage.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;
    
    const closeButton = document.createElement('div');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: -40px;
      right: -40px;
      width: 32px;
      height: 32px;
      background: var(--bg);
      color: var(--fg);
      border: 1px solid var(--border);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.2s ease;
    `;
    
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.remove();
    });
    
    overlay.addEventListener('click', () => overlay.remove());
    
    imageContainer.appendChild(fullImage);
    imageContainer.appendChild(closeButton);
    overlay.appendChild(imageContainer);
    document.body.appendChild(overlay);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') overlay.remove();
    });
  }

  addPostNavigation(currentPost) {
    if (!currentPost || !this.posts || this.posts.length === 0) return;
    if (currentPost.slug === 'about' || currentPost.slug === 'contact') return;
    
    const contentElement = document.getElementById('post-content');
    if (!contentElement) return;
    
    const currentIndex = this.posts.findIndex(post => post.slug === currentPost.slug);
    if (currentIndex === -1) return;
    
    const navContainer = document.createElement('div');
    navContainer.className = 'post-navigation';
    navContainer.style.cssText = `
      margin-top: 40px;
      padding-top: 20px;
      padding-left: 0;
      border-top: 1px solid var(--border);
      font-family: monospace;
      line-height: 1.4;
    `;
    
    if (currentIndex > 0) {
      const prevPost = this.posts[currentIndex - 1];
      const prevLink = document.createElement('div');
      prevLink.innerHTML = `<a href="#" class="nav-link prev-link" data-slug="${prevPost.slug}" style="font-size: 10px; opacity: 0.5;">_previous</a>`;
      prevLink.style.cssText = 'margin-bottom: 0px; line-height: 1;';
      prevLink.querySelector('.prev-link').addEventListener('click', (e) => {
        e.preventDefault();
        this.loadPost(prevPost.slug);
      });
      navContainer.appendChild(prevLink);
    }
    
    if (currentIndex < this.posts.length - 1) {
      const nextPost = this.posts[currentIndex + 1];
      const nextLink = document.createElement('div');
      nextLink.innerHTML = `<a href="#" class="nav-link next-link" data-slug="${nextPost.slug}" style="font-size: 10px; opacity: 0.5;">_next</a>`;
      nextLink.style.cssText = 'margin-bottom: 0px; line-height: 1;';
      nextLink.querySelector('.next-link').addEventListener('click', (e) => {
        e.preventDefault();
        this.loadPost(nextPost.slug);
      });
      navContainer.appendChild(nextLink);
    }
    
    contentElement.appendChild(navContainer);
  }

  loadMostRecentPost() {
    if (this.posts.length > 0) {
      const mostRecent = this.posts[0];
      if (mostRecent && mostRecent.slug) {
        window.location.href = `index.html#${mostRecent.slug}`;
      }
    }
  }

  loadRandomPost() {
    if (this.posts.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.posts.length);
      const randomPost = this.posts[randomIndex];
      if (randomPost && randomPost.slug) {
        window.location.href = `index.html#${randomPost.slug}`;
      }
    }
  }

  setTheme(mode, openHSL = false) {
    this.theme = mode;
    document.body.classList.remove('dark-mode', 'light-mode', 'custom-mode');
    
    const cssVars = ['--bg', '--fg', '--menu-bg', '--menu-fg', '--sidebar-bg', '--sidebar-fg', '--border', '--muted', '--link', '--accent'];
    cssVars.forEach(varName => {
      document.body.style.removeProperty(varName);
    });
    
    if (mode === 'dark') {
      document.body.classList.add('dark-mode');
    } else if (mode === 'light') {
      document.body.classList.add('light-mode');
    } else if (mode === 'custom') {
      document.body.classList.add('custom-mode');
      if (openHSL) this.openHSLColorPicker();
    } else if (mode === 'random') {
      const h = Math.floor(Math.random() * 361);
      const s = Math.floor(Math.random() * 41) + 30;
      const l = Math.floor(Math.random() * 31) + 15;
      this.applyCustomTheme(h, s, l);
      localStorage.setItem('ppPage_random_theme', JSON.stringify({ h, s, l }));
    }
    
    this.updateThemeDisplay(mode);
    localStorage.setItem('ppPage_theme', mode);
    
    if (mode === 'custom') {
      const savedHSL = localStorage.getItem('ppPage_custom_hsl');
      if (savedHSL) {
        try {
          const { h, s, l } = JSON.parse(savedHSL);
          this.applyCustomTheme(h, s, l);
        } catch (error) {
          console.warn('Could not parse saved custom theme HSL values:', error);
        }
      }
    }
  }

  updateThemeDisplay(mode) {
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  openHSLColorPicker() {
    const existingPicker = document.getElementById('hsl-color-picker');
    if (existingPicker) existingPicker.remove();

    const viewMenu = document.querySelector('[data-menu="view"]');
    if (!viewMenu) return;

    this.closeAllMenus();
    const viewMenuRect = viewMenu.getBoundingClientRect();

    const picker = document.createElement('div');
    picker.id = 'hsl-color-picker';
    picker.style.cssText = `
      position: fixed;
      top: ${viewMenuRect.bottom + 4}px;
      left: ${viewMenuRect.left}px;
      background: var(--menu-bg);
      border: 1px solid var(--border);
      padding: 6px;
      min-width: 180px;
      z-index: 10000;
      border-radius: 0;
    `;

    let currentH = 210, currentS = 25, currentL = 25;

    const preview = document.createElement('div');
    preview.style.cssText = `
      width: 30px;
      height: 15px;
      border: 1px solid var(--border);
      background: hsl(${currentH}, ${currentS}%, ${currentL}%);
      margin-bottom: 6px;
      display: inline-block;
      vertical-align: middle;
    `;

    const createSlider = (label, min, max, value, onChange) => {
      const container = document.createElement('div');
      container.style.cssText = 'margin-bottom: 6px;';
      
      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      labelEl.style.cssText = 'color: var(--menu-fg); font-size: 10px; margin-bottom: 2px;';
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = min;
      slider.max = max;
      slider.value = value;
      slider.style.cssText = 'width: 100%; height: 3px; margin: 0;';
      
      slider.addEventListener('input', (e) => {
        const newValue = parseInt(e.target.value);
        onChange(newValue);
      });
      
      container.appendChild(labelEl);
      container.appendChild(slider);
      return { container };
    };

    const hueSlider = createSlider('Hue', 0, 360, currentH, (value) => {
      currentH = value;
      preview.style.background = `hsl(${currentH}, ${currentS}%, ${currentL}%)`;
      this.applyCustomTheme(currentH, currentS, currentL);
    });

    const satSlider = createSlider('Saturation', 0, 100, currentS, (value) => {
      currentS = value;
      preview.style.background = `hsl(${currentH}, ${currentS}%, ${currentL}%)`;
      this.applyCustomTheme(currentH, currentS, currentL);
    });

    const lightSlider = createSlider('Lightness', 0, 100, currentL, (value) => {
      currentL = value;
      preview.style.background = `hsl(${currentH}, ${currentS}%, ${currentL}%)`;
      this.applyCustomTheme(currentH, currentS, currentL);
    });

    picker.appendChild(preview);
    picker.appendChild(hueSlider.container);
    picker.appendChild(satSlider.container);
    picker.appendChild(lightSlider.container);
    document.body.appendChild(picker);

    const outsideClickHandler = (e) => {
      if (!picker.contains(e.target) && !viewMenu.contains(e.target)) {
        picker.remove();
        document.removeEventListener('click', outsideClickHandler);
      }
    };
    
    document.addEventListener('click', outsideClickHandler);
  }

  applyCustomTheme(h, s, l) {
    const bgColor = `hsl(${h}, ${s}%, ${l}%)`;
    const fgColor = l < 50 ? '#ffffff' : '#000000';
    const menuBg = bgColor;
    const menuFg = fgColor;
    const sidebarBg = `hsl(${h}, ${s}%, ${Math.max(0, l - 20)}%)`;
    const sidebarFg = fgColor;
    const borderColor = `hsl(${h}, ${s}%, ${Math.max(0, l - 10)}%)`;
    const mutedColor = l < 50 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
    const accentColor = l < 50 ? '#ffffff' : `hsl(${h}, ${s}%, ${Math.min(100, l + 30)}%)`;
    
    document.body.style.setProperty('--bg', bgColor);
    document.body.style.setProperty('--fg', fgColor);
    document.body.style.setProperty('--menu-bg', menuBg);
    document.body.style.setProperty('--menu-fg', menuFg);
    document.body.style.setProperty('--sidebar-bg', sidebarBg);
    document.body.style.setProperty('--sidebar-fg', sidebarFg);
    document.body.style.setProperty('--border', borderColor);
    document.body.style.setProperty('--muted', mutedColor);
    document.body.style.setProperty('--link', fgColor);
    document.body.style.setProperty('--accent', accentColor);
    
    localStorage.setItem('ppPage_custom_hsl', JSON.stringify({ h, s, l }));
  }

  hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 1) { r = c; g = x; b = 0; }
    else if (1 <= h && h < 2) { r = x; g = c; b = 0; }
    else if (2 <= h && h < 3) { r = 0; g = c; b = x; }
    else if (3 <= h && h < 4) { r = 0; g = x; b = c; }
    else if (4 <= h && h < 5) { r = x; g = 0; b = c; }
    else if (5 <= h && h < 6) { r = c; g = 0; b = x; }
    
    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
    
    return `#${rHex}${gHex}${bHex}`;
  }

  setupPageSpecificElements() {
    const isEditorPage = document.getElementById('postTitle') !== null;
    const isBlogPage = !isEditorPage && window.location.pathname.includes('index.html');
    
    document.querySelectorAll('.editor-only').forEach(item => {
      item.style.display = isEditorPage ? 'block' : 'none';
    });
    
    document.querySelectorAll('.blog-only').forEach(item => {
      item.style.display = isBlogPage ? 'block' : 'none';
    });
    
    document.querySelectorAll('.admin-only').forEach(item => {
      item.style.display = 'none';
    });
    
    this.checkAuthentication().then(isAuthenticated => {
      this.isAuthenticated = isAuthenticated;
      document.querySelectorAll('.admin-only').forEach(item => {
        item.style.display = isAuthenticated ? 'block' : 'none';
      });
    });
    
    if (isEditorPage) {
      this.setupHoverNotePreview();
      this.loadEditData();
      this.setupTitleFieldListener();
    }
  }

  async checkAuthentication() {
    const oauthToken = localStorage.getItem('github_oauth_token');
    const patToken = localStorage.getItem('github_token');
    const tokenType = localStorage.getItem('github_token_type');
    
    if (oauthToken && tokenType === 'oauth') {
      return true;
    } else if (patToken) {
      try {
        const response = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `token ${patToken}` }
        });
        if (response.ok) {
          const userData = await response.json();
          return userData.login === 'pigeonPious';
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    }
    return false;
  }

  isAdmin() {
    const oauthToken = localStorage.getItem('github_oauth_token');
    const patToken = localStorage.getItem('github_token');
    const tokenType = localStorage.getItem('github_token_type');
    
    if (oauthToken && tokenType === 'oauth') return true;
    if (patToken) return true;
    return false;
  }

  getCurrentToken() {
    const oauthToken = localStorage.getItem('github_oauth_token');
    const patToken = localStorage.getItem('github_token');
    const tokenType = localStorage.getItem('github_token_type');
    
    if (oauthToken && tokenType === 'oauth') {
      return { token: oauthToken, type: 'OAuth' };
    } else if (patToken) {
      return { token: patToken, type: 'PAT' };
    }
    return null;
  }

  logout() {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_oauth_token');
    localStorage.removeItem('github_token_type');
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    const underscore = document.getElementById('github-connect-underscore');
    if (underscore) {
      underscore.textContent = '_';
      underscore.style.color = '#fff';
    }
  }

  clearAllCache() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keysToRemove.push(key);
    }
    
    keysToRemove.forEach(key => {
      const oldValue = localStorage.getItem(key);
      localStorage.removeItem(key);
      console.log(` Cleared: ${key} = ${oldValue}`);
    });
    
    sessionStorage.clear();
    this.posts = [];
    this.currentPost = null;
    
    setTimeout(() => window.location.reload(), 1000);
  }

  incrementBuildWord() {
    const currentCounter = parseInt(localStorage.getItem('buildCounter') || '1');
    const newCounter = currentCounter + 1;
    localStorage.setItem('buildCounter', newCounter.toString());
    
    const buildWordElement = document.getElementById('build-word');
    if (buildWordElement) {
      buildWordElement.textContent = `build-${newCounter}`;
    }
  }

  async validateGitHubToken() {
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        alert('No GitHub token found in localStorage');
        return;
      }
      
      const response = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('GitHub token valid:', userData);
      } else {
        console.log('GitHub token invalid:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error testing GitHub token:', error);
    }
  }

  // Continue with more methods...

  showAllPostsSubmenu(menuElement) {
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.style.cssText = `
      position: absolute;
      left: 100%;
      top: 0;
      background: var(--menu-bg, #333);
      border: 1px solid var(--menu-border, #555);
      padding: 1.25px 0;
      min-width: 200px;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      overflow-x: hidden;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      scrollbar-width: thin;
      scrollbar-color: var(--muted, #888) transparent;
    `;
    
    const existingSubmenu = menuElement.querySelector('.submenu');
    if (existingSubmenu) existingSubmenu.remove();
    
    menuElement.appendChild(submenu);
    
    if (this.posts.length === 0) {
      const noPostsEntry = document.createElement('div');
      noPostsEntry.className = 'menu-entry';
      noPostsEntry.textContent = 'No posts found';
      noPostsEntry.style.color = 'var(--muted)';
      noPostsEntry.style.fontStyle = 'italic';
      submenu.appendChild(noPostsEntry);
      return;
    }

    // Group posts by category
    const postsByCategory = {};
    this.posts.forEach(post => {
      const category = post.category || 'Uncategorized';
      if (!postsByCategory[category]) {
        postsByCategory[category] = [];
      }
      postsByCategory[category].push(post);
    });

    // Create category sections
    Object.keys(postsByCategory).forEach(category => {
      const categoryLabel = document.createElement('div');
      categoryLabel.className = 'category-label';
      categoryLabel.textContent = category;
      submenu.appendChild(categoryLabel);

      postsByCategory[category].forEach(post => {
        const postEntry = document.createElement('div');
        postEntry.className = 'menu-entry';
        postEntry.textContent = post.title;
        postEntry.addEventListener('click', () => {
          this.loadPost(post.id);
          this.closeAllMenus();
        });
        submenu.appendChild(postEntry);
      });
    });
  }

  showProjectsSubmenu(menuElement) {
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.style.cssText = `
      position: absolute;
      left: 100%;
      top: 0;
      background: var(--menu-bg, #333);
      border: 1px solid var(--menu-border, #555);
      padding: 1.25px 0;
      min-width: 200px;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      overflow-x: hidden;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      scrollbar-width: thin;
      scrollbar-color: var(--muted, #888) transparent;
    `;
    
    const existingSubmenu = menuElement.querySelector('.submenu');
    if (existingSubmenu) existingSubmenu.remove();
    
    menuElement.appendChild(submenu);

    // Load projects from projects.json
    fetch('projects.json')
      .then(response => response.json())
      .then(projects => {
        if (projects.length === 0) {
          const noProjectsEntry = document.createElement('div');
          noProjectsEntry.className = 'menu-entry';
          noProjectsEntry.textContent = 'No projects found';
          noProjectsEntry.style.color = 'var(--muted)';
          noProjectsEntry.style.fontStyle = 'italic';
          submenu.appendChild(noProjectsEntry);
          return;
        }

        projects.forEach(project => {
          const projectEntry = document.createElement('div');
          projectEntry.className = 'menu-entry';
          projectEntry.textContent = project.title;
          projectEntry.addEventListener('click', () => {
            window.open(project.url, '_blank');
            this.closeAllMenus();
          });
          submenu.appendChild(projectEntry);
        });
      })
      .catch(error => {
        console.error('Error loading projects:', error);
        const errorEntry = document.createElement('div');
        errorEntry.className = 'menu-entry';
        errorEntry.textContent = 'Error loading projects';
        errorEntry.style.color = 'var(--danger-color)';
        submenu.appendChild(errorEntry);
      });
  }

  showSocialsSubmenu(menuElement) {
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.style.cssText = `
      position: absolute;
      left: 100%;
      top: 0;
      background: var(--menu-bg, #333);
      border: 1px solid var(--menu-border, #555);
      padding: 1.25px 0;
      min-width: 200px;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      overflow-x: hidden;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      scrollbar-width: thin;
      scrollbar-color: var(--muted, #888) transparent;
    `;
    
    const existingSubmenu = menuElement.querySelector('.submenu');
    if (existingSubmenu) existingSubmenu.remove();
    
    menuElement.appendChild(submenu);

    const socials = [
      { name: 'GitHub', url: 'https://github.com' },
      { name: 'Twitter', url: 'https://twitter.com' },
      { name: 'LinkedIn', url: 'https://linkedin.com' },
      { name: 'Email', url: 'mailto:contact@example.com' }
    ];

    socials.forEach(social => {
      const socialEntry = document.createElement('div');
      socialEntry.className = 'menu-entry';
      socialEntry.textContent = social.name;
      socialEntry.addEventListener('click', () => {
        window.open(social.url, '_blank');
        this.closeAllMenus();
      });
      submenu.appendChild(socialEntry);
    });
  }

  showConsoleSubmenu(menuElement) {
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.style.cssText = `
      position: absolute;
      left: 100%;
      top: 0;
      background: var(--menu-bg, #333);
      border: 1px solid var(--menu-border, #555);
      padding: 1.25px 0;
      min-width: 200px;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      overflow-x: hidden;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      scrollbar-width: thin;
      scrollbar-color: var(--muted, #888) transparent;
    `;
    
    const existingSubmenu = menuElement.querySelector('.submenu');
    if (existingSubmenu) existingSubmenu.remove();
    
    menuElement.appendChild(submenu);

    const consoleCommands = [
      { name: 'help', description: 'Show available commands' },
      { name: 'clear', description: 'Clear console' },
      { name: 'theme', description: 'Change theme' },
      { name: 'posts', description: 'List all posts' },
      { name: 'about', description: 'Show site info' }
    ];

    consoleCommands.forEach(cmd => {
      const cmdEntry = document.createElement('div');
      cmdEntry.className = 'menu-entry';
      cmdEntry.textContent = `${cmd.name} - ${cmd.description}`;
      cmdEntry.addEventListener('click', () => {
        this.executeConsoleCommand(cmd.name);
        this.closeAllMenus();
      });
      submenu.appendChild(cmdEntry);
    });
  }

  showViewSubmenu(menuElement) {
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.style.cssText = `
      position: absolute;
      left: 100%;
      top: 0;
      background: var(--menu-bg, #333);
      border: 1px solid var(--menu-border, #555);
      padding: 1.25px 0;
      min-width: 200px;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      overflow-x: hidden;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      scrollbar-width: thin;
      scrollbar-color: var(--muted, #888) transparent;
    `;
    
    const existingSubmenu = menuElement.querySelector('.submenu');
    if (existingSubmenu) existingSubmenu.remove();
    
    menuElement.appendChild(submenu);

    const themes = [
      { name: 'Light Mode', value: 'light' },
      { name: 'Dark Mode', value: 'dark' },
      { name: 'Custom Colors', value: 'custom' }
    ];

    themes.forEach(theme => {
      const themeEntry = document.createElement('div');
      themeEntry.className = 'menu-entry';
      themeEntry.textContent = theme.name;
      if (this.theme === theme.value) {
        themeEntry.style.fontWeight = 'bold';
        themeEntry.style.color = 'var(--accent)';
      }
      themeEntry.addEventListener('click', () => {
        this.setTheme(theme.value);
        this.closeAllMenus();
      });
      submenu.appendChild(themeEntry);
    });
  }

  closeAllMenus() {
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('open');
    });
  }

  bindEvents() {
    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu-item')) {
        this.closeAllMenus();
      }
    });

    // Close menus on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllMenus();
      }
    });
  }

  async loadPosts() {
    try {
      const response = await fetch('posts/');
      const files = await response.text();
      const postFiles = files.match(/href="([^"]+\.json)"/g);
      
      if (postFiles) {
        this.posts = [];
        for (const fileMatch of postFiles) {
          const filename = fileMatch.match(/href="([^"]+)"/)[1];
          try {
            const postResponse = await fetch(`posts/${filename}`);
            const post = await postResponse.json();
            post.id = filename.replace('.json', '');
            this.posts.push(post);
          } catch (error) {
            console.error(`Error loading post ${filename}:`, error);
          }
        }
        
        // Sort posts by date (newest first)
        this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      this.posts = [];
    }
  }

  handleInitialLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    
    if (postId) {
      this.loadPost(postId);
    } else {
      this.showHomePage();
    }
  }

  showHomePage() {
    const mainContent = document.querySelector('.main-column');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <header class="post-header">
        <h1 class="post-title">Welcome to PPBlog</h1>
        <div class="post-date">A simple, reliable blog system</div>
      </header>
      <div class="post-content">
        <p>Welcome to PPBlog! This is a simplified, optimized blog system that maintains all the functionality of the original while being much cleaner and more maintainable.</p>
        <p>Use the navigation menu above to explore posts, projects, and more. The site map on the left shows all available posts.</p>
        <p>Features include:</p>
        <ul>
          <li>Simple, clean interface</li>
          <li>Theme switching (light/dark/custom)</li>
          <li>Image magazine with text wrapping</li>
          <li>Console with useful commands</li>
          <li>Responsive design</li>
        </ul>
      </div>
    `;
  }

  async loadPost(postId) {
    try {
      const response = await fetch(`posts/${postId}.json`);
      const post = await response.json();
      
      this.currentPost = post;
      this.displayPost(post);
      this.updateSiteMap();
      
      // Update URL without page reload
      const newUrl = `${window.location.pathname}?post=${postId}`;
      window.history.pushState({ postId }, post.title, newUrl);
      
    } catch (error) {
      console.error('Error loading post:', error);
      this.showError(`Error loading post: ${postId}`);
    }
  }

  displayPost(post) {
    const mainContent = document.querySelector('.main-column');
    if (!mainContent) return;

    const postDate = new Date(post.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    mainContent.innerHTML = `
      <header class="post-header">
        <h1 class="post-title">${post.title}</h1>
        <div class="post-date">${postDate}</div>
      </header>
      <div class="post-content">
        ${this.processPostContent(post.content)}
      </div>
      <nav class="post-navigation">
        <div class="nav-link" onclick="window.location.href='./'">← Back to Home</div>
      </nav>
    `;

    // Add click handlers for images
    this.addImageClickHandlers();
  }

  processPostContent(content) {
    // Convert markdown-like syntax to HTML
    let processedContent = content;
    
    // Process images with magazine-style wrapping
    processedContent = processedContent.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<div class="image-container"><img src="$2" alt="$1" title="$1"></div>'
    );
    
    // Process headings
    processedContent = processedContent.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    processedContent = processedContent.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    processedContent = processedContent.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Process bold and italic
    processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processedContent = processedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Process code blocks
    processedContent = processedContent.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    processedContent = processedContent.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Process links
    processedContent = processedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Process line breaks
    processedContent = processedContent.replace(/\n/g, '</p><p>');
    
    // Wrap in paragraphs
    processedContent = `<p>${processedContent}</p>`;
    
    return processedContent;
  }

  addImageClickHandlers() {
    const images = document.querySelectorAll('.post-content img');
    images.forEach(img => {
      img.addEventListener('click', () => {
        this.showImagePreview(img.src, img.alt);
      });
    });
  }

  showImagePreview(src, alt) {
    const overlay = document.createElement('div');
    overlay.id = 'image-preview-overlay';
    overlay.innerHTML = `<img src="${src}" alt="${alt}" style="max-width: 90%; max-height: 90%; object-fit: contain;">`;
    
    overlay.addEventListener('click', () => {
      overlay.remove();
    });
    
    document.body.appendChild(overlay);
  }

  updateSiteMap() {
    const siteMap = document.getElementById('site-map');
    if (!siteMap) return;

    siteMap.innerHTML = '<h3>Posts</h3>';
    
    this.posts.forEach(post => {
      const postEntry = document.createElement('div');
      postEntry.className = 'post-entry';
      postEntry.textContent = post.title;
      postEntry.addEventListener('click', () => {
        this.loadPost(post.id);
      });
      
      if (this.currentPost && this.currentPost.id === post.id) {
        postEntry.style.fontWeight = 'bold';
        postEntry.style.color = 'var(--accent)';
      }
      
      siteMap.appendChild(postEntry);
    });
  }

  setTheme(theme, save = true) {
    this.theme = theme;
    
    // Remove existing theme classes
    document.body.classList.remove('light-mode', 'dark-mode', 'custom-mode');
    
    if (theme === 'custom') {
      document.body.classList.add('custom-mode');
      this.showCustomColorPicker();
    } else {
      document.body.classList.add(`${theme}-mode`);
    }
    
    if (save) {
      localStorage.setItem('ppPage_theme', theme);
    }
  }

  showCustomColorPicker() {
    // Create custom color picker
    const picker = document.createElement('div');
    picker.id = 'hsl-color-picker';
    picker.innerHTML = `
      <div style="margin-bottom: 8px;">
        <label>Hue: <input type="range" min="0" max="360" value="200" id="hue-slider"></label>
        <span id="hue-value">200</span>
      </div>
      <div style="margin-bottom: 8px;">
        <label>Saturation: <input type="range" min="0" max="100" value="50" id="saturation-slider"></label>
        <span id="saturation-value">50%</span>
      </div>
      <div style="margin-bottom: 8px;">
        <label>Lightness: <input type="range" min="0" max="100" value="50" id="lightness-slider"></label>
        <span id="lightness-value">50%</span>
      </div>
      <div style="text-align: center;">
        <button onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    `;
    
    picker.style.position = 'fixed';
    picker.style.top = '50px';
    picker.style.right = '20px';
    picker.style.zIndex = '10000';
    
    document.body.appendChild(picker);
    
    // Add event listeners
    const hueSlider = picker.querySelector('#hue-slider');
    const saturationSlider = picker.querySelector('#saturation-slider');
    const lightnessSlider = picker.querySelector('#lightness-slider');
    
    const updateColors = () => {
      const h = hueSlider.value;
      const s = saturationSlider.value;
      const l = lightnessSlider.value;
      
      document.body.style.setProperty('--bg', `hsl(${h}, ${s}%, ${l}%)`);
      document.body.style.setProperty('--fg', `hsl(${h}, ${s}%, ${Math.max(0, Math.min(100, 100 - l)}%)`);
      
      picker.querySelector('#hue-value').textContent = h;
      picker.querySelector('#saturation-value').textContent = s + '%';
      picker.querySelector('#lightness-value').textContent = l + '%';
    };
    
    hueSlider.addEventListener('input', updateColors);
    saturationSlider.addEventListener('input', updateColors);
    lightnessSlider.addEventListener('input', updateColors);
    
    updateColors();
  }

  loadLogoFromConfig() {
    try {
      fetch('logo-config.json')
        .then(response => response.json())
        .then(config => {
          if (config.logo && config.logo.src) {
            const cornerLogo = document.getElementById('cornerGif');
            if (cornerLogo) {
              cornerLogo.style.backgroundImage = `url(${config.logo.src})`;
            }
          }
        })
        .catch(error => {
          console.log('No logo config found, using default');
        });
    } catch (error) {
      console.log('Error loading logo config:', error);
    }
  }

  executeConsoleCommand(command) {
    switch (command) {
      case 'help':
        this.log('Available commands: help, clear, theme, posts, about', 'info');
        break;
      case 'clear':
        this.clearConsole();
        break;
      case 'theme':
        this.log('Current theme: ' + this.theme, 'info');
        break;
      case 'posts':
        this.log(`Total posts: ${this.posts.length}`, 'info');
        this.posts.forEach(post => {
          this.log(`${post.title} (${post.date})`, 'info');
        });
        break;
      case 'about':
        this.log('PPBlog v3.0 - Simplified and Optimized', 'info');
        this.log('A clean, reliable blog system', 'info');
        break;
      default:
        this.log(`Unknown command: ${command}`, 'error');
        this.log('Type "help" for available commands', 'info');
    }
  }

  log(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create console output if it doesn't exist
    let consoleOutput = document.getElementById('console-output');
    if (!consoleOutput) {
      consoleOutput = this.createConsoleOutput();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `console-message ${type}`;
    
    const time = new Date().toLocaleTimeString();
    const typeLabel = type.toUpperCase();
    
    messageElement.innerHTML = `
      <span class="message-time">${time}</span>
      <span class="message-type">${typeLabel}</span>
      <span class="message-text">${message}</span>
    `;
    
    consoleOutput.querySelector('.console-messages').appendChild(messageElement);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  createConsoleOutput() {
    const consoleOutput = document.createElement('div');
    consoleOutput.id = 'console-output';
    consoleOutput.className = 'console-output';
    consoleOutput.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 400px;
      height: 300px;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--fg);
      font-family: inherit;
      font-size: 12px;
      z-index: 999;
      border-radius: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;
    
    consoleOutput.innerHTML = `
      <div class="console-header">
        <span class="console-title">Console</span>
        <div class="console-controls">
          <button class="console-btn minimize-btn">_</button>
          <button class="console-btn close-btn">×</button>
        </div>
      </div>
      <div class="console-messages"></div>
    `;
    
    // Add event listeners
    const minimizeBtn = consoleOutput.querySelector('.minimize-btn');
    const closeBtn = consoleOutput.querySelector('.close-btn');
    const header = consoleOutput.querySelector('.console-header');
    
    minimizeBtn.addEventListener('click', () => {
      consoleOutput.classList.toggle('minimized');
    });
    
    closeBtn.addEventListener('click', () => {
      consoleOutput.remove();
    });
    
    // Make draggable
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(consoleOutput.style.left) || 20;
      startTop = parseInt(consoleOutput.style.top) || 20;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      consoleOutput.style.left = (startLeft + deltaX) + 'px';
      consoleOutput.style.top = (startTop + deltaY) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    document.body.appendChild(consoleOutput);
    return consoleOutput;
  }

  clearConsole() {
    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput) {
      const messages = consoleOutput.querySelector('.console-messages');
      if (messages) {
        messages.innerHTML = '';
      }
    }
    this.log('Console cleared', 'info');
  }

  showError(message) {
    const mainContent = document.querySelector('.main-column');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <header class="post-header">
        <h1 class="post-title">Error</h1>
      </header>
      <div class="post-content">
        <p style="color: var(--danger-color);">${message}</p>
        <p><a href="./">Return to home</a></p>
      </div>
    `;
  }
}

// Initialize the blog when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.simpleBlog = new SimpleBlog();
});
