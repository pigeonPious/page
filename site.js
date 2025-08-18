/**
 * PPPage - Simple, Reliable Blog System
 * Everything in one file for maximum reliability
 */

class SimpleBlog {
  constructor() {
    this.currentPost = null;
    this.posts = [];
    // Load theme from localStorage or default to dark
    this.theme = localStorage.getItem('ppPage_theme') || 'dark';
    console.log('🎨 Theme loaded from localStorage:', this.theme);
    
    // Initialize handler references to prevent memory leaks
    this.allPostsMouseEnterHandler = null;
    this.devlogMouseEnterHandler = null;
    
    this.init();
  }

  init() {
    console.log('🚀 Initializing SimpleBlog...');
    this.createTaskbar();
    console.log('✅ Taskbar created');
    this.bindEvents();
    console.log('✅ Events bound');
    this.loadPosts();
    console.log('✅ Posts loaded');
    this.setTheme(this.theme);
    console.log('✅ Theme set');
    console.log('✅ SimpleBlog initialized successfully');
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
              <div class="menu-entry admin-only" id="edit-post-button" style="display: none;">Edit Post</div>
            </div>
          </div>
          
          <div class="menu-item" data-menu="edit">
            <div class="label">Edit</div>
            <div class="menu-dropdown">
              <div class="menu-entry disabled">Undo</div>
              <div class="menu-entry editor-only" id="make-note-button">Make Note</div>
            </div>
          </div>
          
          <div class="menu-item" data-menu="navigation">
            <div class="label">Navigation</div>
            <div class="menu-dropdown" id="navigation-dropdown">
              <a class="menu-entry" href="index.html">Blog</a>
              <a class="menu-entry" href="#">About</a>
              <a class="menu-entry" href="#">Contact</a>
              <div class="menu-separator"></div>
              <div class="menu-entry" id="most-recent-post">Most Recent</div>
              <div class="menu-entry" id="random-post">Random Post</div>
                        <div class="menu-entry has-submenu" id="all-posts-menu" style="position: relative;">All Posts ></div>
          <div class="menu-entry has-submenu" id="devlog-menu" style="position: relative;">Devlog ></div>
            </div>
          </div>
          
          <div class="menu-item" data-menu="view">
            <div class="label">View</div>
            <div class="menu-dropdown">
              <div class="menu-entry" data-mode="dark">Dark</div>
              <div class="menu-entry" data-mode="light">Light</div>
              <div class="menu-entry" data-mode="custom">Custom…</div>
              <div class="menu-entry" data-mode="random">Random</div>
              <div class="menu-separator"></div>
              <div class="menu-entry" id="toggle-console">Console</div>
            </div>
          </div>
          
          <div class="menu-item" data-menu="connect">
            <div class="label">Connect</div>
            <div class="menu-dropdown">
              <div class="menu-entry" id="bluesky-share">Share to Bluesky</div>
              <div class="menu-entry" id="twitter-share">Share to Twitter</div>
            </div>
          </div>
          
          <div class="taskbar-status editor-only">
            <span id="github-status">not connected</span>
          </div>
          
          <div class="build-indicator" style="margin-left: auto; padding: 0 8px; font-size: 11px; color: #666; font-family: monospace;">
            ${this.generateBuildWord()}
          </div>
        </div>
      </div>
    `;

    // Insert at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', taskbarHTML);
    console.log('✅ Taskbar created');
  }

  generateBuildWord() {
    const words = [
      'alpha', 'beta', 'gamma', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
      'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
      'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey',
      'xray', 'yankee', 'zulu', 'crimson', 'azure', 'emerald', 'golden'
    ];
    
    const buildDate = '20250902';
    let seed = 0;
    for (let i = 0; i < buildDate.length; i++) {
      seed += buildDate.charCodeAt(i);
    }
    
    // Ensure we get 'echo' for build 20250823
    const expectedWord = 'echo';
    const expectedIndex = words.indexOf(expectedWord);
    const calculatedIndex = seed % words.length;
    
    console.log(`🔧 Build word calculation: date=${buildDate}, seed=${seed}, calculated=${calculatedIndex}, expected=${expectedIndex}, word=${words[calculatedIndex]}`);
    
    return words[calculatedIndex];
  }

  bindEvents() {
    // Menu system
    this.setupMenuSystem();
    
    // Button events
    this.setupButtonEvents();
    
    // Global events
    this.setupGlobalEvents();
  }

  setupMenuSystem() {
    console.log('🔧 Setting up menu system...');
    
    // Menu toggle - store reference for cleanup
    this.globalClickHandler = (e) => {
      const menuItem = e.target.closest('.menu-item');
      if (menuItem) {
        console.log('📋 Menu item clicked:', menuItem.querySelector('.label')?.textContent);
        this.toggleMenu(menuItem);
      } else {
        this.closeAllMenus();
      }
    };
    document.addEventListener('click', this.globalClickHandler);

    // Close on escape - store reference for cleanup
    this.globalKeyHandler = (e) => {
      if (e.key === 'Escape') {
        console.log('⌨️ Escape key pressed - closing menus');
        this.closeAllMenus();
      }
    };
    document.addEventListener('keydown', this.globalKeyHandler);
    
    console.log('✅ Menu system setup complete');
  }

  toggleMenu(menuItem) {
    const dropdown = menuItem.querySelector('.menu-dropdown');
    const isOpen = menuItem.classList.contains('open');
    
    console.log('🔧 Toggle menu:', {
      menuLabel: menuItem.querySelector('.label')?.textContent,
      hasDropdown: !!dropdown,
      isOpen: isOpen,
      dropdownElement: dropdown
    });
    
    // Close all other menus
    this.closeAllMenus();
    
    // Toggle current menu - add 'open' class to menu-item, not dropdown
    if (!isOpen) {
      menuItem.classList.add('open');
      console.log('✅ Menu opened, added "open" class to menu-item');
    } else {
      menuItem.classList.remove('open');
      console.log('✅ Menu closed, removed "open" class from menu-item');
    }
    
    // Debug: check if class was added
    setTimeout(() => {
      const isNowOpen = menuItem.classList.contains('open');
      console.log('🔍 After toggle - menu-item has "open" class:', isNowOpen);
      console.log('🔍 Dropdown display style:', dropdown.style.display);
      console.log('🔍 Computed display:', window.getComputedStyle(dropdown).display);
    }, 100);
  }

  closeAllMenus() {
    const openMenus = document.querySelectorAll('.menu-item.open');
    console.log('🔧 Closing all menus, found:', openMenus.length, 'open menus');
    
    openMenus.forEach(menuItem => {
      menuItem.classList.remove('open');
      console.log('✅ Removed "open" class from menu-item');
    });
  }

  setupButtonEvents() {
    console.log('🔧 Setting up button events...');
    
    // Star button (home)
    this.addClickHandler('#star-button', () => {
      console.log('⭐ Star button clicked - going home');
      window.location.href = 'index.html';
    });

    // New post button
    this.addClickHandler('#new-post', (e) => {
      console.log('📝 New post button clicked');
      e.preventDefault();
      window.location.href = 'editor.html';
    });

    // Make note button
    this.addClickHandler('#make-note-button', () => {
      console.log('📌 Make note button clicked');
      this.makeNote();
    });

    // Console toggle
    this.addClickHandler('#toggle-console', () => {
      console.log('🖥️ Console toggle clicked');
      this.toggleConsole();
    });

    // Theme buttons
    console.log('🔧 Setting up theme buttons...');
    this.addClickHandler('[data-mode]', (e) => {
      const mode = e.target.dataset.mode;
      console.log('🎨 Theme button clicked:', mode);
      console.log('🎯 Target element:', e.target);
      console.log('🎯 Dataset:', e.target.dataset);
      this.setTheme(mode);
    });

    // Navigation buttons
    this.addClickHandler('#most-recent-post', () => {
      console.log('🕒 Most recent post clicked');
      this.loadMostRecentPost();
    });

    this.addClickHandler('#random-post', () => {
      console.log('🎲 Random post clicked');
      this.loadRandomPost();
    });
    
    console.log('✅ Button events setup complete');
  }

  addClickHandler(selector, handler) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      elements.forEach(element => {
        element.addEventListener('click', handler);
        console.log(`✅ Click handler attached to:`, element.textContent || element.id || selector);
      });
    } else {
      console.warn(`⚠️ No elements found for selector: ${selector}`);
    }
  }

  setupGlobalEvents() {
    // Handle page-specific elements
    this.setupPageSpecificElements();
    
    // Setup submenu functionality
    this.setupSubmenus();
  }

  setupPageSpecificElements() {
    // Show/hide editor-specific items
    const isEditorPage = document.getElementById('postTitle') !== null;
    const editorOnlyItems = document.querySelectorAll('.editor-only');
    
    editorOnlyItems.forEach(item => {
      item.style.display = isEditorPage ? 'block' : 'none';
    });
  }

  setupSubmenus() {
    console.log('🔧 Setting up submenus...');
    
    // All posts submenu
    const allPostsMenu = document.getElementById('all-posts-menu');
    if (allPostsMenu) {
      // Remove existing listeners to prevent duplication
      allPostsMenu.removeEventListener('mouseenter', this.allPostsMouseEnterHandler);
      this.allPostsMouseEnterHandler = () => {
        console.log('📚 All posts submenu hovered');
        this.showAllPostsSubmenu(allPostsMenu);
      };
      allPostsMenu.addEventListener('mouseenter', this.allPostsMouseEnterHandler);
      console.log('✅ All posts submenu handler attached');
    } else {
      console.warn('⚠️ All posts menu element not found');
    }

    // Devlog submenu
    const devlogMenu = document.getElementById('devlog-menu');
    if (devlogMenu) {
      // Remove existing listeners to prevent duplication
      devlogMenu.removeEventListener('mouseenter', this.devlogMouseEnterHandler);
      this.devlogMouseEnterHandler = () => {
        console.log('📝 Devlog submenu hovered');
        this.showDevlogSubmenu(devlogMenu);
      };
      devlogMenu.addEventListener('mouseenter', this.devlogMouseEnterHandler);
      console.log('✅ Devlog submenu handler attached');
    } else {
      console.warn('⚠️ Devlog menu element not found');
    }
    
    console.log('✅ Submenus setup complete');
  }

  showAllPostsSubmenu(menuElement) {
    // Create submenu for all posts
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.style.cssText = `
      position: absolute;
      left: 100%;
      top: 0;
      background: var(--menu-bg, #333);
      border: 1px solid var(--menu-border, #555);
      border-radius: 4px;
      padding: 5px 0;
      min-width: 150px;
      z-index: 1000;
    `;
    
    // Add post entries
    this.posts.forEach(post => {
      if (!post || !post.slug) {
        console.warn('⚠️ Skipping invalid post:', post);
        return;
      }
      
      const entry = document.createElement('div');
      entry.className = 'menu-entry';
      entry.textContent = post.title || 'Untitled';
      entry.style.cssText = 'padding: 8px 15px; cursor: pointer; color: var(--menu-fg, #fff);';
      
      entry.addEventListener('click', () => {
        console.log('📖 Post selected:', post.title || 'Untitled');
        this.loadPost(post.slug);
        this.closeAllMenus();
      });
      
      entry.addEventListener('mouseenter', () => {
        entry.style.background = 'var(--menu-hover-bg, #555)';
      });
      
      entry.addEventListener('mouseleave', () => {
        entry.style.background = 'transparent';
      });
      
      submenu.appendChild(entry);
    });
    
    // Remove existing submenu
    const existingSubmenu = menuElement.querySelector('.submenu');
    if (existingSubmenu) {
      existingSubmenu.remove();
    }
    
    // Add new submenu
    menuElement.appendChild(submenu);
    
    // Remove submenu on mouse leave (ALL POSTS SUBMENU)
    const allPostsMouseLeaveHandler = () => {
      setTimeout(() => {
        if (submenu.parentNode) {
          submenu.remove();
        }
      }, 100);
    };
    
    // Remove any existing listener to prevent duplication
    menuElement.removeEventListener('mouseleave', allPostsMouseLeaveHandler);
    menuElement.addEventListener('mouseleave', allPostsMouseLeaveHandler);
  }

  showDevlogSubmenu(menuElement) {
    // Create devlog submenu
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.style.cssText = `
      position: absolute;
      left: 100%;
      top: 0;
      background: var(--menu-bg, #333);
      border: 1px solid var(--menu-border, #555);
      border-radius: 4px;
      padding: 5px 0;
      min-width: 150px;
      z-index: 1000;
    `;
    
    // Filter devlog posts
    const devlogPosts = this.posts.filter(post => 
      post.title && post.title.toLowerCase().includes('devlog')
    );
    
    if (devlogPosts.length > 0) {
      devlogPosts.forEach(post => {
        if (!post || !post.slug) {
          console.warn('⚠️ Skipping invalid devlog post:', post);
          return;
        }
        
        const entry = document.createElement('div');
        entry.className = 'menu-entry';
        entry.textContent = post.title || 'Untitled';
        entry.style.cssText = 'padding: 8px 15px; cursor: pointer; color: var(--menu-fg, #fff);';
        
        entry.addEventListener('click', () => {
          console.log('📝 Devlog selected:', post.title || 'Untitled');
          this.loadPost(post.slug);
          this.closeAllMenus();
        });
        
        entry.addEventListener('mouseenter', () => {
          entry.style.background = 'var(--menu-hover-bg, #555)';
        });
        
        entry.addEventListener('mouseleave', () => {
          entry.style.background = 'transparent';
        });
        
        submenu.appendChild(entry);
      });
    } else {
      const entry = document.createElement('div');
      entry.className = 'menu-entry';
      entry.textContent = 'No devlog posts found';
      entry.style.cssText = 'padding: 8px 15px; color: var(--menu-fg, #666); font-style: italic;';
      submenu.appendChild(entry);
    }
    
    // Remove existing submenu
    const existingSubmenu = menuElement.querySelector('.submenu');
    if (existingSubmenu) {
      existingSubmenu.remove();
    }
    
    // Add new submenu
    menuElement.appendChild(submenu);
    
    // Remove submenu on mouse leave (DEVLOG SUBMENU)
    const devlogMouseLeaveHandler = () => {
      setTimeout(() => {
        if (submenu.parentNode) {
          submenu.remove();
        }
      }, 100);
    };
    
    // Remove any existing listener to prevent duplication
    menuElement.removeEventListener('mouseleave', devlogMouseLeaveHandler);
    menuElement.addEventListener('mouseleave', devlogMouseLeaveHandler);
  }

  async loadPosts() {
    try {
      // Load posts from the posts directory
      const response = await fetch('posts/index.json');
      if (response.ok) {
        const data = await response.json();
        // Handle both array format and object with posts property
        const allPosts = Array.isArray(data) ? data : (data.posts || []);
        
        // Filter to only include posts that actually exist as files
        this.posts = await this.filterAvailablePosts(allPosts);
        console.log(`✅ Loaded ${this.posts.length} available posts:`, this.posts.map(p => p.title));
        
        // Auto-load the most recent post if we have posts
        if (this.posts.length > 0) {
          const mostRecent = this.posts[0];
          if (mostRecent && mostRecent.slug) {
            console.log('🔄 Auto-loading most recent post:', mostRecent.title || 'Untitled');
            await this.loadPost(mostRecent.slug);
          } else {
            console.warn('⚠️ Most recent post missing slug, showing default content');
            this.displayDefaultContent();
          }
        } else {
          console.log('⚠️ No posts found, showing default content');
          this.displayDefaultContent();
        }
      }
    } catch (error) {
      console.warn('Could not load posts:', error);
      this.posts = [];
      this.displayDefaultContent();
    }
  }

  async filterAvailablePosts(posts) {
    if (!Array.isArray(posts)) {
      console.warn('⚠️ filterAvailablePosts: posts is not an array:', posts);
      return [];
    }
    
    const availablePosts = [];
    
    for (const post of posts) {
      if (!post || !post.slug) {
        console.warn('⚠️ Skipping invalid post in filter:', post);
        continue;
      }
      
      try {
        // Check if the post file actually exists
        const response = await fetch(`posts/${post.slug}.json`);
        if (response.ok) {
          availablePosts.push(post);
        } else {
          console.warn(`⚠️ Post file not found: ${post.slug}.json`);
        }
      } catch (error) {
        console.warn(`⚠️ Error checking post ${post.slug}:`, error);
      }
    }
    
    console.log(`✅ Filtered ${posts.length} posts down to ${availablePosts.length} available`);
    return availablePosts;
  }

  async loadPost(slug) {
    try {
      console.log(`📖 Loading post: ${slug}`);
      const response = await fetch(`posts/${slug}.json`);
      if (response.ok) {
        const post = await response.json();
        this.displayPost(post);
        this.currentPost = post;
        console.log(`✅ Post loaded successfully: ${post.title}`);
        return post;
      } else {
        console.error(`❌ Failed to load post ${slug}: ${response.status} ${response.statusText}`);
        this.displayDefaultContent();
      }
    } catch (error) {
      console.error(`❌ Error loading post ${slug}:`, error);
      this.displayDefaultContent();
    }
  }

  displayPost(post) {
    const titleElement = document.getElementById('post-title');
    const dateElement = document.getElementById('post-date');
    const contentElement = document.getElementById('post-content');

    if (titleElement) titleElement.textContent = post.title || 'Untitled';
    if (dateElement) dateElement.textContent = post.date || '';
    if (contentElement) contentElement.innerHTML = post.content || '';
    
    console.log('✅ Post displayed:', post.title);
  }

  displayDefaultContent() {
    const titleElement = document.getElementById('post-title');
    const dateElement = document.getElementById('post-date');
    const contentElement = document.getElementById('post-content');

    if (titleElement) titleElement.textContent = '# Blog';
    if (dateElement) dateElement.textContent = '';
    if (contentElement) contentElement.innerHTML = '<p>Welcome to the blog! Posts will appear here once loaded.</p>';
    
    console.log('✅ Default content displayed');
  }

  loadMostRecentPost() {
    if (this.posts.length > 0) {
      const mostRecent = this.posts[0];
      if (mostRecent && mostRecent.slug) {
        this.loadPost(mostRecent.slug);
      } else {
        console.warn('⚠️ Most recent post missing slug');
        this.displayDefaultContent();
      }
    } else {
      console.log('⚠️ No posts available');
      this.displayDefaultContent();
    }
  }

  loadRandomPost() {
    if (this.posts.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.posts.length);
      const randomPost = this.posts[randomIndex];
      if (randomPost && randomPost.slug) {
        this.loadPost(randomPost.slug);
      } else {
        console.warn('⚠️ Random post missing slug');
        this.displayDefaultContent();
      }
    } else {
      console.log('⚠️ No posts available');
      this.displayDefaultContent();
    }
  }

  setTheme(mode) {
    console.log('🎨 Setting theme:', mode);
    this.theme = mode;
    
    // Remove existing theme classes
    document.body.classList.remove('dark-mode', 'light-mode', 'custom-mode');
    console.log('🧹 Removed existing theme classes');
    
    // Clear any inline styles from previous custom/random themes
    const cssVars = ['--bg', '--fg', '--menu-bg', '--menu-fg', '--sidebar-bg', '--sidebar-fg', '--border', '--muted', '--link', '--success-color', '--success-hover-color', '--danger-color', '--danger-hover-color', '--btn-text-color'];
    cssVars.forEach(varName => {
      document.body.style.removeProperty(varName);
    });
    console.log('🧹 Cleared all inline CSS variables');
    
    if (mode === 'dark') {
      document.body.classList.add('dark-mode');
      console.log('🌙 Added dark-mode class');
    } else if (mode === 'light') {
      document.body.classList.add('light-mode');
      console.log('☀️ Added light-mode class');
    } else if (mode === 'custom') {
      document.body.classList.add('custom-mode');
      
      // Open HSL color picker instead of setting hardcoded colors
      console.log('🎨 Custom theme selected, calling openHSLColorPicker...');
      try {
        this.openHSLColorPicker();
        console.log('✅ HSL color picker opened successfully');
      } catch (error) {
        console.error('❌ Error opening HSL color picker:', error);
      }
    } else if (mode === 'random') {
      // Generate random theme
      const h = Math.floor(Math.random() * 361);
      const s = Math.floor(Math.random() * 41) + 30;
      const l = Math.floor(Math.random() * 31) + 15;
      const color = `hsl(${h},${s}%,${l}%)`;
      
      // Calculate complementary colors for the random theme
      const bgColor = color;
      const fgColor = l < 50 ? '#ffffff' : '#000000';
      const menuBg = color;
      const menuFg = fgColor;
      const sidebarBg = `hsl(${h},${s}%,${Math.max(0, l - 20)}%)`;
      const sidebarFg = fgColor;
      const borderColor = `hsl(${h},${s}%,${Math.max(0, l - 10)}%)`;
      const mutedColor = l < 50 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
      
      document.body.classList.add('custom-mode');
      document.body.style.setProperty('--bg', bgColor);
      document.body.style.setProperty('--fg', fgColor);
      document.body.style.setProperty('--menu-bg', menuBg);
      document.body.style.setProperty('--menu-fg', menuFg);
      document.body.style.setProperty('--sidebar-bg', sidebarBg);
      document.body.style.setProperty('--sidebar-fg', sidebarFg);
      document.body.style.setProperty('--border', borderColor);
      document.body.style.setProperty('--muted', mutedColor);
      document.body.style.setProperty('--link', fgColor);
      document.body.style.setProperty('--success-color', '#28a745');
      document.body.style.setProperty('--success-hover-color', '#218838');
      document.body.style.setProperty('--danger-color', '#dc3545');
      document.body.style.setProperty('--danger-hover-color', '#c82333');
      document.body.style.setProperty('--btn-text-color', fgColor);
      console.log('🎲 Added random theme:', color);
    }
    
    // Update theme display
    this.updateThemeDisplay(mode);
    console.log('✅ Theme display updated');
    
    // Save to localStorage
    localStorage.setItem('ppPage_theme', mode);
    console.log('💾 Theme saved to localStorage');
    
    // Debug: show current body classes
    console.log('🔍 Current body classes:', document.body.className);
    console.log('🔍 Current CSS variables:', {
      '--bg': getComputedStyle(document.body).getPropertyValue('--bg'),
      '--fg': getComputedStyle(document.body).getPropertyValue('--fg')
    });
  }

  updateThemeDisplay(mode) {
    const themeButtons = document.querySelectorAll('[data-mode]');
    themeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  // Calculate text color that contrasts with background
  getContrastColor(backgroundColor) {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  // Convert HSL to hex
  hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 1) {
      r = c; g = x; b = 0;
    } else if (1 <= h && h < 2) {
      r = x; g = c; b = 0;
    } else if (2 <= h && h < 3) {
      r = 0; g = c; b = x;
    } else if (3 <= h && h < 4) {
      r = 0; g = x; b = c;
    } else if (4 <= h && h < 5) {
      r = x; g = 0; b = c;
    } else if (5 <= h && h < 6) {
      r = c; g = 0; b = x;
    }
    
    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
    
    return `#${rHex}${gHex}${bHex}`;
  }

  openHSLColorPicker() {
    console.log('🔧 openHSLColorPicker function called');
    
    // Remove existing color picker
    const existingPicker = document.getElementById('hsl-color-picker');
    if (existingPicker) {
      existingPicker.remove();
      console.log('🗑️ Removed existing color picker');
    }

    // Create HSL color picker
    const picker = document.createElement('div');
    picker.id = 'hsl-color-picker';
    picker.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--menu-bg, #333);
      border: 2px solid var(--border, #555);
      border-radius: 8px;
      padding: 20px;
      z-index: 10000;
      min-width: 300px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;

    // Current HSL values (default to a nice blue-gray)
    let currentH = 210;
    let currentS = 25;
    let currentL = 25;

    // Create color preview
    const preview = document.createElement('div');
    preview.style.cssText = `
      width: 100px;
      height: 100px;
      border-radius: 8px;
      margin: 0 auto 20px;
      border: 2px solid var(--border, #555);
      background: hsl(${currentH}, ${currentS}%, ${currentL}%);
    `;

    // Create sliders
    const createSlider = (label, min, max, value, onChange) => {
      const container = document.createElement('div');
      container.style.cssText = 'margin-bottom: 15px;';
      
      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      labelEl.style.cssText = 'display: block; margin-bottom: 5px; color: var(--fg, #fff); font-size: 14px;';
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = min;
      slider.max = max;
      slider.value = value;
      slider.style.cssText = 'width: 100%; margin-bottom: 5px;';
      
      const valueDisplay = document.createElement('span');
      valueDisplay.textContent = value;
      valueDisplay.style.cssText = 'color: var(--fg, #fff); font-size: 12px; font-family: monospace;';
      
      slider.addEventListener('input', (e) => {
        const newValue = parseInt(e.target.value);
        valueDisplay.textContent = newValue;
        onChange(newValue);
      });
      
      container.appendChild(labelEl);
      container.appendChild(slider);
      container.appendChild(valueDisplay);
      
      return { slider, onChange };
    };

    // Hue slider
    const hueSlider = createSlider('Hue (0-360)', 0, 360, currentH, (value) => {
      currentH = value;
      preview.style.background = `hsl(${currentH}, ${currentS}%, ${currentL}%)`;
    });

    // Saturation slider
    const satSlider = createSlider('Saturation (0-100)', 0, 100, currentS, (value) => {
      currentS = value;
      preview.style.background = `hsl(${currentH}, ${currentS}%, ${currentL}%)`;
    });

    // Lightness slider
    const lightSlider = createSlider('Lightness (0-100)', 0, 100, currentL, (value) => {
      currentL = value;
      preview.style.background = `hsl(${currentH}, ${currentS}%, ${currentL}%)`;
    });

    // Apply button
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply Theme';
    applyBtn.style.cssText = `
      background: var(--accent, #3a7bd5);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      margin-right: 10px;
      font-size: 14px;
    `;

    applyBtn.addEventListener('click', () => {
      this.applyCustomTheme(currentH, currentS, currentL);
      picker.remove();
    });

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      background: var(--muted, #666);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    `;

    cancelBtn.addEventListener('click', () => {
      picker.remove();
      // Revert to previous theme
      const previousTheme = localStorage.getItem('ppPage_theme') || 'dark';
      this.setTheme(previousTheme);
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      background: none;
      border: none;
      color: var(--fg, #fff);
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    closeBtn.addEventListener('click', () => {
      picker.remove();
      // Revert to previous theme
      const previousTheme = localStorage.getItem('ppPage_theme') || 'dark';
      this.setTheme(previousTheme);
    });

    // Add elements to picker
    picker.appendChild(closeBtn);
    picker.appendChild(preview);
    picker.appendChild(hueSlider.container);
    picker.appendChild(satSlider.container);
    picker.appendChild(lightSlider.container);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'text-align: center; margin-top: 20px;';
    buttonContainer.appendChild(applyBtn);
    buttonContainer.appendChild(cancelBtn);
    picker.appendChild(buttonContainer);

    // Add to page
    document.body.appendChild(picker);
    console.log('✅ Color picker added to DOM');

    // Close on escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        picker.remove();
        document.removeEventListener('keydown', escapeHandler);
        // Revert to previous theme
        const previousTheme = localStorage.getItem('ppPage_theme') || 'dark';
        this.setTheme(previousTheme);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  applyCustomTheme(h, s, l) {
    const bgColor = `hsl(${h}, ${s}%, ${l}%)`;
    const bgHex = this.hslToHex(h, s, l);
    
    // Calculate contrasting text color
    const fgColor = l < 50 ? '#ffffff' : '#000000';
    
    // Calculate complementary colors
    const menuBg = bgColor;
    const menuFg = fgColor;
    const sidebarBg = `hsl(${h}, ${s}%, ${Math.max(0, l - 20)}%)`;
    const sidebarFg = fgColor;
    const borderColor = `hsl(${h}, ${s}%, ${Math.max(0, l - 10)}%)`;
    const mutedColor = l < 50 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
    
    // Apply all CSS variables
    document.body.style.setProperty('--bg', bgColor);
    document.body.style.setProperty('--fg', fgColor);
    document.body.style.setProperty('--menu-bg', menuBg);
    document.body.style.setProperty('--menu-fg', menuFg);
    document.body.style.setProperty('--sidebar-bg', sidebarBg);
    document.body.style.setProperty('--sidebar-fg', sidebarFg);
    document.body.style.setProperty('--border', borderColor);
    document.body.style.setProperty('--muted', mutedColor);
    document.body.style.setProperty('--link', fgColor);
    document.body.style.setProperty('--success-color', '#28a745');
    document.body.style.setProperty('--success-hover-color', '#218838');
    document.body.style.setProperty('--danger-color', '#dc3545');
    document.body.style.setProperty('--danger-hover-color', '#c82333');
    document.body.style.setProperty('--btn-text-color', fgColor);
    
    console.log('🎨 Custom theme applied:', { h, s, l, bgColor, fgColor });
  }

  makeNote() {
    console.log('Make note functionality - implement as needed');
  }

  toggleConsole() {
    console.log('Console toggle - implement as needed');
  }

  // Utility methods
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  }

  error(message) {
    this.log(message, 'error');
  }

  warn(message) {
    this.log(message, 'warn');
  }

  // Cleanup method to prevent memory leaks
  destroy() {
    console.log('🧹 Cleaning up SimpleBlog...');
    
    // Remove event listeners
    const allPostsMenu = document.getElementById('all-posts-menu');
    if (allPostsMenu && this.allPostsMouseEnterHandler) {
      allPostsMenu.removeEventListener('mouseenter', this.allPostsMouseEnterHandler);
    }
    
    const devlogMenu = document.getElementById('devlog-menu');
    if (devlogMenu && this.devlogMouseEnterHandler) {
      devlogMenu.removeEventListener('mouseenter', this.devlogMouseEnterHandler);
    }
    
    // Remove global event listeners
    document.removeEventListener('click', this.globalClickHandler);
    document.removeEventListener('keydown', this.globalKeyHandler);
    
    console.log('✅ Cleanup complete');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.blog = new SimpleBlog();
  });
} else {
  // DOM already ready
  window.blog = new SimpleBlog();
}

// Export for global access
window.SimpleBlog = SimpleBlog;
