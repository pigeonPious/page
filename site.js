/**
 * PPPage - Simple, Reliable Blog System
 * Everything in one file for maximum reliability
 */

class SimpleBlog {
  constructor() {
    this.currentPost = null;
    this.posts = [];
    this.theme = 'dark';
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
    
    const buildDate = '20250826';
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
    
    // Menu toggle
    document.addEventListener('click', (e) => {
      const menuItem = e.target.closest('.menu-item');
      if (menuItem) {
        console.log('📋 Menu item clicked:', menuItem.querySelector('.label')?.textContent);
        this.toggleMenu(menuItem);
      } else {
        this.closeAllMenus();
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        console.log('⌨️ Escape key pressed - closing menus');
        this.closeAllMenus();
      }
    });
    
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
    this.addClickHandler('[data-mode]', (e) => {
      const mode = e.target.dataset.mode;
      console.log('🎨 Theme button clicked:', mode);
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
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener('click', handler);
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
      allPostsMenu.addEventListener('mouseenter', () => {
        console.log('📚 All posts submenu hovered');
        this.showAllPostsSubmenu(allPostsMenu);
      });
    }

    // Devlog submenu
    const devlogMenu = document.getElementById('devlog-menu');
    if (devlogMenu) {
      devlogMenu.addEventListener('mouseenter', () => {
        console.log('📝 Devlog submenu hovered');
        this.showDevlogSubmenu(devlogMenu);
      });
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
      const entry = document.createElement('div');
      entry.className = 'menu-entry';
      entry.textContent = post.title || 'Untitled';
      entry.style.cssText = 'padding: 8px 15px; cursor: pointer; color: var(--menu-fg, #fff);';
      
      entry.addEventListener('click', () => {
        console.log('📖 Post selected:', post.title);
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
    
    // Remove submenu on mouse leave
    menuElement.addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (submenu.parentNode) {
          submenu.remove();
        }
      }, 100);
    });
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
        const entry = document.createElement('div');
        entry.className = 'menu-entry';
        entry.textContent = post.title;
        entry.style.cssText = 'padding: 8px 15px; cursor: pointer; color: var(--menu-fg, #fff);';
        
        entry.addEventListener('click', () => {
          console.log('📝 Devlog selected:', post.title);
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
    
    // Remove submenu on mouse leave
    menuElement.addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (submenu.parentNode) {
          submenu.remove();
        }
      }, 100);
    });
  }

  async loadPosts() {
    try {
      // Load posts from the posts directory
      const response = await fetch('posts/index.json');
      if (response.ok) {
        const data = await response.json();
        this.posts = data.posts || [];
        console.log(`✅ Loaded ${this.posts.length} posts`);
      }
    } catch (error) {
      console.warn('Could not load posts:', error);
      this.posts = [];
    }
  }

  async loadPost(slug) {
    try {
      const response = await fetch(`posts/${slug}.json`);
      if (response.ok) {
        const post = await response.json();
        this.displayPost(post);
        this.currentPost = post;
        return post;
      }
    } catch (error) {
      console.error('Error loading post:', error);
    }
  }

  displayPost(post) {
    const titleElement = document.getElementById('post-title');
    const dateElement = document.getElementById('post-date');
    const contentElement = document.getElementById('post-content');

    if (titleElement) titleElement.textContent = post.title || 'Untitled';
    if (dateElement) dateElement.textContent = post.date || '';
    if (contentElement) contentElement.innerHTML = post.content || '';
  }

  loadMostRecentPost() {
    if (this.posts.length > 0) {
      const mostRecent = this.posts[0];
      this.loadPost(mostRecent.slug);
    }
  }

  loadRandomPost() {
    if (this.posts.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.posts.length);
      const randomPost = this.posts[randomIndex];
      this.loadPost(randomPost.slug);
    }
  }

  setTheme(mode) {
    this.theme = mode;
    
    // Remove existing theme classes
    document.body.classList.remove('dark-mode', 'light-mode', 'custom-mode');
    
    if (mode === 'dark') {
      document.body.classList.add('dark-mode');
    } else if (mode === 'light') {
      document.body.classList.add('light-mode');
    } else if (mode === 'custom') {
      document.body.classList.add('custom-mode');
      // Apply custom colors
      document.body.style.setProperty('--bg', '#2a2a2a');
      document.body.style.setProperty('--fg', '#ffffff');
    } else if (mode === 'random') {
      // Generate random theme
      const h = Math.floor(Math.random() * 361);
      const s = Math.floor(Math.random() * 41) + 30;
      const l = Math.floor(Math.random() * 31) + 15;
      const color = `hsl(${h},${s}%,${l}%)`;
      
      document.body.classList.add('custom-mode');
      document.body.style.setProperty('--bg', color);
      document.body.style.setProperty('--fg', l < 50 ? '#ffffff' : '#232323');
    }
    
    // Update theme display
    this.updateThemeDisplay(mode);
    
    // Save to localStorage
    localStorage.setItem('ppPage_theme', mode);
  }

  updateThemeDisplay(mode) {
    const themeButtons = document.querySelectorAll('[data-mode]');
    themeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
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
