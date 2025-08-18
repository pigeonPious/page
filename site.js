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
    
    const buildDate = '20250906';
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
      // Don't close menus when clicking on theme buttons
      if (e.target.closest('[data-mode]')) {
        console.log('🎨 Theme button clicked, not closing menus');
        return;
      }
      
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

    // Editor-specific buttons
    this.addClickHandler('#export-btn', () => {
      console.log('📤 Export button clicked');
      this.exportPost();
    });

    this.addClickHandler('#images-btn', () => {
      console.log('🖼️ Images button clicked');
      this.showImagesModal();
    });

    this.addClickHandler('#publish-btn', () => {
      console.log('📢 Publish button clicked');
      this.showPublishModal();
    });

    this.addClickHandler('#flags-btn', () => {
      console.log('🏷️ Flags button clicked');
      this.showFlagsModal();
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
      console.log('🎯 Element text:', e.target.textContent);
      console.log('🎯 Element classes:', e.target.className);
      
      if (mode === 'custom') {
        console.log('🎨 Custom theme button clicked - calling setTheme...');
      }
      
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
    
    // Setup hover notes for the displayed post
    this.setupHoverNotes();
    
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
      console.log('🎨 this object:', this);
      console.log('🎨 this.openHSLColorPicker:', this.openHSLColorPicker);
      console.log('🎨 typeof this.openHSLColorPicker:', typeof this.openHSLColorPicker);
      
      try {
        this.openHSLColorPicker();
        console.log('✅ HSL color picker opened successfully');
      } catch (error) {
        console.error('❌ Error opening HSL color picker:', error);
        console.error('❌ Error stack:', error.stack);
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
    }

    // Find the View menu dropdown to position the HSL picker
    const viewMenu = document.querySelector('[data-menu="view"]');
    if (!viewMenu) {
      console.error('❌ View menu not found');
      return;
    }

    // Create HSL color picker in menu style 1
    const picker = document.createElement('div');
    picker.id = 'hsl-color-picker';
    picker.className = 'menu-dropdown';
    picker.style.cssText = `
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      background: var(--menu-bg);
      border: 1px solid var(--border);
      padding: 6px;
      min-width: 180px;
      z-index: 1000;
    `;

    // Current HSL values (default to current theme background)
    let currentH = 210;
    let currentS = 25;
    let currentL = 25;

    // Create color preview (compact)
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

    // Create sliders in menu style 1 (compact)
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
      
      return { slider, onChange, container };
    };

    // Hue slider
    const hueSlider = createSlider('Hue', 0, 360, currentH, (value) => {
      currentH = value;
      preview.style.background = `hsl(${currentH}, ${currentS}%, ${currentL}%)`;
      // Auto-apply theme as slider moves
      this.applyCustomTheme(currentH, currentS, currentL);
    });

    // Saturation slider
    const satSlider = createSlider('Saturation', 0, 100, currentS, (value) => {
      currentS = value;
      preview.style.background = `hsl(${currentH}, ${currentS}%, ${currentL}%)`;
      // Auto-apply theme as slider moves
      this.applyCustomTheme(currentH, currentS, currentL);
    });

    // Lightness slider
    const lightSlider = createSlider('Lightness', 0, 100, currentL, (value) => {
      currentL = value;
      preview.style.background = `hsl(${currentH}, ${currentS}%, ${currentL}%)`;
      // Auto-apply theme as slider moves
      this.applyCustomTheme(currentH, currentS, currentL);
    });

    // Add elements to picker
    picker.appendChild(preview);
    picker.appendChild(hueSlider.container);
    picker.appendChild(satSlider.container);
    picker.appendChild(lightSlider.container);

    // Add to View menu
    viewMenu.appendChild(picker);

    // Close when clicking outside
    const outsideClickHandler = (e) => {
      if (!picker.contains(e.target) && !viewMenu.contains(e.target)) {
        picker.remove();
        document.removeEventListener('click', outsideClickHandler);
      }
    };
    
    // Delay adding the click handler to avoid immediate closure
    setTimeout(() => {
      document.addEventListener('click', outsideClickHandler);
    }, 100);

    console.log('✅ HSL color picker opened in menu style 1');
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
    console.log('📝 Creating hover note...');
    
    // Get selected text from visual editor
    const visualEditor = document.getElementById('visualEditor');
    if (!visualEditor) {
      console.log('⚠️ Visual editor not found');
      return;
    }
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
      alert('Please select some text to create a hover note.');
      return;
    }
    
    const selectedText = selection.toString().trim();
    
    // Create menu style 1 input box
    const inputBox = document.createElement('div');
    inputBox.className = 'menu-style-1-input';
    inputBox.style.cssText = `
      position: absolute;
      top: ${selection.getRangeAt(0).getBoundingClientRect().bottom + 5}px;
      left: ${selection.getRangeAt(0).getBoundingClientRect().left}px;
      background: var(--menu-bg);
      border: 1px solid var(--border);
      padding: 4px 6px;
      z-index: 1000;
      min-width: 200px;
    `;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter hover note...';
    input.style.cssText = `
      background: transparent;
      border: none;
      color: var(--menu-fg);
      font-size: 12px;
      width: 100%;
      outline: none;
      font-family: inherit;
    `;
    
    inputBox.appendChild(input);
    document.body.appendChild(inputBox);
    input.focus();
    
    // Handle input events
    const handleInput = (e) => {
      if (e.key === 'Enter') {
        const noteText = input.value.trim();
        if (noteText) {
          this.createHoverNote(selectedText, noteText, selection);
        }
        this.removeInputBox(inputBox);
      } else if (e.key === 'Escape') {
        this.removeInputBox(inputBox);
      }
    };
    
    input.addEventListener('keydown', handleInput);
    
    // Close on outside click
    const outsideClick = (e) => {
      if (!inputBox.contains(e.target)) {
        this.removeInputBox(inputBox);
        document.removeEventListener('click', outsideClick);
      }
    };
    
    // Delay to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('click', outsideClick);
    }, 100);
  }

  createHoverNote(selectedText, noteText, selection) {
    // Create span with hover note data
    const span = document.createElement('span');
    span.className = 'note-link';
    span.setAttribute('data-note', noteText);
    span.textContent = selectedText;
    
    // Replace selected text with span
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(span);
    
    console.log('✅ Hover note created:', { text: selectedText, note: noteText });
  }

  removeInputBox(inputBox) {
    if (inputBox && inputBox.parentNode) {
      inputBox.parentNode.removeChild(inputBox);
    }
  }

  exportPost() {
    console.log('📤 Exporting post as JSON...');
    const postTitle = document.getElementById('postTitle')?.value || 'Untitled Post';
    const postContent = document.getElementById('visualEditor')?.innerHTML || '';
    
    if (postContent.trim()) {
      // Create post JSON structure
      const postData = {
        slug: postTitle.toLowerCase().replace(/[^a-z0-9]/gi, '-'),
        title: postTitle,
        date: new Date().toISOString().split('T')[0].replace(/-/g, '-'),
        keywords: 'general',
        content: postContent
      };
      
      // Create and download JSON file
      const jsonContent = JSON.stringify(postData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${postTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Post exported as JSON:', postData);
    } else {
      alert('Please add some content to export.');
    }
  }

  showImagesModal() {
    console.log('🖼️ Opening image magazine...');
    
    // Create image magazine if it doesn't exist
    let magazine = document.getElementById('imageMagazine');
    if (!magazine) {
      magazine = this.createImageMagazine();
    }
    
    // Show magazine
    magazine.classList.remove('hidden');
    
    // Load images from assets folder
    this.loadImagesToMagazine();
    
    console.log('✅ Image magazine opened');
  }

  createImageMagazine() {
    const magazine = document.createElement('div');
    magazine.id = 'imageMagazine';
    magazine.className = 'image-magazine';
    magazine.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      height: 500px;
      background: var(--menu-bg);
      border: 1px solid var(--border);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    
    // Header with import button
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--menu-bg);
    `;
    
    const importBtn = document.createElement('div');
    importBtn.textContent = 'Import';
    importBtn.style.cssText = `
      font-weight: bold;
      color: var(--menu-fg);
      cursor: pointer;
      font-size: 13px;
    `;
    importBtn.addEventListener('click', () => this.importImages());
    
    const closeBtn = document.createElement('div');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      color: var(--menu-fg);
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      padding: 0 4px;
    `;
    closeBtn.addEventListener('click', () => magazine.classList.add('hidden'));
    
    header.appendChild(importBtn);
    header.appendChild(closeBtn);
    
    // Content area
    const content = document.createElement('div');
    content.id = 'imageGallery';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      align-content: start;
    `;
    
    magazine.appendChild(header);
    magazine.appendChild(content);
    document.body.appendChild(magazine);
    
    return magazine;
  }

  loadImagesToMagazine() {
    const gallery = document.getElementById('imageGallery');
    if (!gallery) return;
    
    // Clear existing content
    gallery.innerHTML = '';
    
    // List of images from assets folder
    const images = [
      '1755369444055-piousPigeon_logo_pp.png',
      '1755383754213-piousPigeon_logo_pp-export.png',
      '1755383767144-piousPigeon_logo_pp.png',
      '1755383787427-pp-banner-export.png',
      'sample.gif'
    ];
    
    if (images.length === 0) {
      const noImages = document.createElement('div');
      noImages.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        color: var(--muted);
        padding: 40px 20px;
        font-size: 13px;
      `;
      noImages.innerHTML = `
        <p>No images found in assets folder</p>
        <p><small>Click Import to add images</small></p>
      `;
      gallery.appendChild(noImages);
      return;
    }
    
    // Create image items
    images.forEach(filename => {
      const item = document.createElement('div');
      item.className = 'image-item';
      item.style.cssText = `
        width: 100%;
        height: 100px;
        border: 1px solid var(--border);
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s;
        background: var(--bg);
        position: relative;
      `;
      
      const img = document.createElement('img');
      img.src = `assets/${filename}`;
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      `;
      
      const name = document.createElement('div');
      name.textContent = filename;
      name.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        font-size: 11px;
        padding: 2px 4px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      `;
      
      item.appendChild(img);
      item.appendChild(name);
      
      // Double click to insert image
      item.addEventListener('dblclick', () => this.insertImageToPost(filename));
      
      // Hover effects
      item.addEventListener('mouseenter', () => {
        item.style.transform = 'scale(1.05)';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.transform = 'scale(1)';
      });
      
      gallery.appendChild(item);
    });
  }

  insertImageToPost(filename) {
    console.log('🖼️ Inserting image:', filename);
    
    const visualEditor = document.getElementById('visualEditor');
    if (!visualEditor) {
      console.log('⚠️ Visual editor not found');
      return;
    }
    
    // Create image element
    const img = document.createElement('img');
    img.src = `assets/${filename}`;
    img.style.cssText = `
      max-width: 150px;
      height: auto;
      border: 1px solid var(--border);
      border-radius: 4px;
      margin: 8px 0;
      cursor: pointer;
    `;
    
    // Insert at cursor position or append
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.insertNode(img);
      range.collapse(false);
    } else {
      visualEditor.appendChild(img);
    }
    
    console.log('✅ Image inserted:', filename);
  }

  importImages() {
    console.log('📁 Importing images...');
    
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.style.display = 'none';
    
    input.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        console.log(`📁 Processing ${files.length} image(s)...`);
        
        // For now, just show what would be imported
        // In a real implementation, this would upload to GitHub
        files.forEach(file => {
          console.log(`📁 Would import: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
        });
        
        alert(`Would import ${files.length} image(s) to assets folder.\n\nIn a real implementation, this would upload to your GitHub repository.`);
      }
      
      // Cleanup
      document.body.removeChild(input);
    });
    
    document.body.appendChild(input);
    input.click();
  }

  showPublishModal() {
    console.log('📢 Publishing post to GitHub...');
    
    const postTitle = document.getElementById('postTitle')?.value || 'Untitled Post';
    const postContent = document.getElementById('visualEditor')?.innerHTML || '';
    
    if (!postTitle.trim() || !postContent.trim()) {
      alert('Please add a title and content to publish.');
      return;
    }
    
    // Create menu style 1 input for commit message
    const inputBox = document.createElement('div');
    inputBox.className = 'menu-style-1-input';
    inputBox.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--menu-bg);
      border: 1px solid var(--border);
      padding: 8px 12px;
      z-index: 1000;
      min-width: 300px;
    `;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Commit message (optional)...';
    input.style.cssText = `
      background: transparent;
      border: none;
      color: var(--menu-fg);
      font-size: 13px;
      width: 100%;
      outline: none;
      font-family: inherit;
    `;
    
    inputBox.appendChild(input);
    document.body.appendChild(inputBox);
    input.focus();
    
    // Handle input events
    const handleInput = (e) => {
      if (e.key === 'Enter') {
        const commitMessage = input.value.trim() || `Publish: ${postTitle}`;
        this.publishPostToGitHub(postTitle, postContent, commitMessage);
        this.removeInputBox(inputBox);
      } else if (e.key === 'Escape') {
        this.removeInputBox(inputBox);
      }
    };
    
    input.addEventListener('keydown', handleInput);
    
    // Close on outside click
    const outsideClick = (e) => {
      if (!inputBox.contains(e.target)) {
        this.removeInputBox(inputBox);
        document.removeEventListener('click', outsideClick);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', outsideClick);
    }, 100);
  }

  async publishPostToGitHub(title, content, commitMessage) {
    console.log('🚀 Publishing to GitHub:', { title, commitMessage });
    
    try {
      // Create post data
      const postData = {
        slug: title.toLowerCase().replace(/[^a-z0-9]/gi, '-'),
        title: title,
        date: new Date().toISOString().split('T')[0].replace(/-/g, '-'),
        keywords: 'general',
        content: content
      };
      
      // For now, show what would be published
      // In a real implementation, this would use GitHub API
      console.log('📝 Post data prepared:', postData);
      console.log('📤 Would publish to GitHub with commit:', commitMessage);
      
      alert(`Post ready to publish!\n\nTitle: ${title}\nSlug: ${postData.slug}\nCommit: ${commitMessage}\n\nIn a real implementation, this would publish to your GitHub repository in the posts/ folder.`);
      
    } catch (error) {
      console.error('❌ Error publishing post:', error);
      alert('Error preparing post for publication. Please try again.');
    }
  }

  showFlagsModal() {
    console.log('🏷️ Setting post flags/keywords...');
    
    // Create menu style 2 input (single line, no UI)
    const inputBox = document.createElement('div');
    inputBox.className = 'menu-style-2-input';
    inputBox.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--menu-bg);
      border: 1px solid var(--border);
      padding: 6px 10px;
      z-index: 1000;
      min-width: 350px;
    `;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'e.g. devlog:ProjectName, programming, design';
    input.style.cssText = `
      background: transparent;
      border: none;
      color: var(--menu-fg);
      font-size: 13px;
      width: 100%;
      outline: none;
      font-family: inherit;
    `;
    
    inputBox.appendChild(input);
    document.body.appendChild(inputBox);
    input.focus();
    
    // Handle input events
    const handleInput = (e) => {
      if (e.key === 'Enter') {
        const flags = input.value.trim();
        if (flags) {
          this.setPostFlags(flags);
        }
        this.removeInputBox(inputBox);
      } else if (e.key === 'Escape') {
        this.removeInputBox(inputBox);
      }
    };
    
    input.addEventListener('keydown', handleInput);
    
    // Close on outside click
    const outsideClick = (e) => {
      if (!inputBox.contains(e.target)) {
        this.removeInputBox(inputBox);
        document.removeEventListener('click', outsideClick);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', outsideClick);
    }, 100);
  }

  setPostFlags(flags) {
    console.log('🏷️ Setting post flags:', flags);
    
    // Store flags for the current post
    // In a real implementation, this would be saved with the post
    const postTitle = document.getElementById('postTitle')?.value || 'Untitled Post';
    
    // Parse flags for navigation menu
    const flagArray = flags.split(',').map(f => f.trim());
    const devlogFlags = flagArray.filter(f => f.startsWith('devlog:'));
    
    console.log('📋 Parsed flags:', { all: flagArray, devlog: devlogFlags });
    
    // Show confirmation
    alert(`Post flags set!\n\nTitle: ${postTitle}\nFlags: ${flags}\n\nDevlog flags: ${devlogFlags.length > 0 ? devlogFlags.join(', ') : 'None'}\n\nThese flags will be used for navigation and categorization.`);
    
    // In a real implementation, this would:
    // 1. Save flags to the post data
    // 2. Update navigation menus
    // 3. Handle devlog submenus (e.g., devlog:hablet → Hablet submenu)
  }

  toggleConsole() {
    console.log('Console toggle - implement as needed');
  }

  setupHoverNotes() {
    console.log('📝 Setting up hover notes...');
    
    // Find all note-link elements
    const noteLinks = document.querySelectorAll('.note-link');
    
    noteLinks.forEach(link => {
      // Remove existing listeners to prevent duplication
      link.removeEventListener('mouseenter', this.showHoverNote);
      link.removeEventListener('mouseleave', this.hideHoverNote);
      
      // Add hover event listeners
      link.addEventListener('mouseenter', (e) => this.showHoverNote(e));
      link.addEventListener('mouseleave', () => this.hideHoverNote());
    });
    
    console.log(`✅ Hover notes setup for ${noteLinks.length} elements`);
  }

  showHoverNote(event) {
    const link = event.target;
    const noteText = link.getAttribute('data-note');
    
    if (!noteText) return;
    
    // Create or update hover note tooltip
    let tooltip = document.getElementById('hoverNote');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'hoverNote';
      tooltip.style.cssText = `
        position: fixed;
        z-index: 1000;
        pointer-events: none;
        background: var(--menu-bg);
        border: 1px solid var(--border);
        padding: 6px 8px;
        min-width: 140px;
        max-width: 260px;
        font-size: 12px;
        color: var(--menu-fg);
        display: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      `;
      document.body.appendChild(tooltip);
    }
    
    // Position tooltip near mouse
    const rect = link.getBoundingClientRect();
    tooltip.style.left = (event.clientX + 10) + 'px';
    tooltip.style.top = (event.clientY - 30) + 'px';
    tooltip.textContent = noteText;
    tooltip.style.display = 'block';
  }

  hideHoverNote() {
    const tooltip = document.getElementById('hoverNote');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
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
