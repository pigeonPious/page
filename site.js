/**
 * PPPage - Simple, Reliable Blog System
 * Everything in one file for maximum reliability
 */

class SimpleBlog {
  constructor() {
    console.log('🚀 SimpleBlog constructor called');
    this.currentPost = null;
    this.posts = [];
    // Load theme from localStorage or default to dark
    this.theme = localStorage.getItem('ppPage_theme') || 'dark';
    console.log('🎨 Theme loaded from localStorage:', this.theme);
    
    // Initialize handler references to prevent memory leaks
    this.allPostsMouseEnterHandler = null;
    this.projectsMouseEnterHandler = null;
    
    console.log('🔍 About to call init()...');
    this.init();
    console.log('🔍 init() called');
  }

  init() {
    console.log('🚀 Initializing SimpleBlog...');
    this.createTaskbar();
    console.log('✅ Taskbar created');
    this.bindEvents();
    console.log('✅ Events bound');
    // Load posts first, then handle URL parameters
    this.loadPosts().then(() => {
      console.log('✅ Posts loaded, now processing URL parameters');
      
      // Check for post parameter in URL (from editor navigation)
      const urlParams = new URLSearchParams(window.location.search);
      const postSlug = urlParams.get('post');
      if (postSlug) {
        console.log(`🔗 Loading post from URL parameter: ${postSlug}`);
        this.loadPost(postSlug);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Check for post hash in URL (direct linking)
      const hashSlug = window.location.hash.substring(1); // Remove # from hash
      if (hashSlug) {
        console.log(`🔗 Loading post from URL hash: ${hashSlug}`);
        this.loadPost(hashSlug);
      }
    }).catch(error => {
      console.error('❌ Error loading posts:', error);
    });
    
    // Handle browser back/forward navigation
    window.addEventListener('popstate', (event) => {
      console.log('🔙 Browser navigation detected:', event.state);
      if (event.state && event.state.postSlug) {
        this.loadPost(event.state.postSlug);
      } else if (window.location.hash) {
        const hashSlug = window.location.hash.substring(1);
        this.loadPost(hashSlug);
      } else {
        // No specific post in URL, show most recent
        this.loadMostRecentPost();
      }
    });
    
    this.setTheme(this.theme, false); // Don't open HSL picker on page load
    console.log('✅ Theme set');
    
    // Initialize font size
    this.initializeFontSize();
    console.log('✅ Font size initialized');
    
    // If custom theme, check for saved HSL values and apply them
    if (this.theme === 'custom') {
      const savedHSL = localStorage.getItem('ppPage_custom_hsl');
      if (savedHSL) {
        try {
          const { h, s, l } = JSON.parse(savedHSL);
          this.applyCustomTheme(h, s, l);
          console.log('🎨 Applied saved custom theme HSL values on page load:', { h, s, l });
        } catch (error) {
          console.warn('⚠️ Could not parse saved custom theme HSL values on page load:', error);
        }
      }
    }
    
    // Load saved post flags
    this.loadSavedFlags();
    
    // Setup text selection monitoring
    this.setupSelectionMonitoring();
    
    // Check authentication status
    this.checkAndUpdateAuthStatus();
    
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
              <div class="menu-entry blog-only admin-only" id="edit-post-button">Edit Post</div>
              <div class="menu-separator"></div>

              <div class="menu-entry blog-only" id="font-size-button">Font Size</div>
              <div class="menu-separator admin-only"></div>
              <div class="menu-entry admin-only" id="quick-edit-button">Quick Edit</div>
              <div class="menu-entry admin-only" id="category-manager-button">Category Manager</div>
              <div class="menu-entry admin-only" id="draft-manager-button">Draft Manager</div>
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
              <div class="menu-entry has-submenu" id="projects-menu" style="position: relative;">Projects ></div>
              <div class="menu-entry has-submenu" id="all-posts-menu" style="position: relative;">All Posts ></div>
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
            <div class="label">Share</div>
            <div class="menu-dropdown">
              <div class="menu-entry" id="bluesky-share">Share to Bluesky</div>
              <div class="menu-entry" id="twitter-share">Share to Twitter</div>
            </div>
          </div>
          
          <div class="menu-item" data-menu="debug">
            <div class="label">Debug</div>
            <div class="menu-dropdown">
              <div class="menu-entry" id="test-cache-clear">Test Cache Clear</div>
              <div class="menu-entry" id="test-build-increment">Test Build Increment</div>
              <div class="menu-entry" id="show-localstorage">Show localStorage</div>
            </div>
          </div>
          
          <div class="taskbar-status editor-only">
            <span id="github-status">not connected</span>
          </div>
          

          

        <div class="cache-clear-btn" id="cache-clear-btn" style="margin-left: 8px; padding: 0 8px; font-size: 11px; color: #dc3545; font-family: monospace; cursor: pointer; user-select: none; border: 1px solid #dc3545; border-radius: 3px;" title="Clear all cache and reload">
          🧹
        </div>
        
        <div class="pigeon-label" style="margin-left: auto; padding: 0 12px; font-size: 12px; color: var(--fg); font-family: monospace; cursor: default; user-select: none;" data-note="Welcome to my Blog!">
          <span id="github-connect-underscore" style="color: #fff; cursor: pointer; margin-right: 2px;">_</span>PiousPigeon
        </div>
        </div>
      </div>
    `;

    // Insert at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', taskbarHTML);
    console.log('✅ Taskbar created');
  }
  
  

  clearBuildCache() {
    console.log('🧹 MAXIMUM TROUBLESHOOTING: clearBuildCache called!');
    console.log('🧹 localStorage before clearing:', Object.keys(localStorage));
    
    // Clear stored build word
    const oldBuildWord = localStorage.getItem('currentBuildWord');
    localStorage.removeItem('currentBuildWord');
    console.log('🧹 Cleared currentBuildWord:', oldBuildWord);
    
    // Clear any other cached data that should be refreshed on new builds
    const oldPosts = localStorage.getItem('posts');
    localStorage.removeItem('posts');
    console.log('🧹 Cleared posts:', oldPosts);
    
    const oldCurrentPost = localStorage.getItem('currentPost');
    localStorage.removeItem('currentPost');
    console.log('🧹 Cleared currentPost:', oldCurrentPost);
    
    // Clear any other build-related cache items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('temp') || key.includes('build'))) {
        keysToRemove.push(key);
      }
    }
    
    console.log('🧹 Found keys to remove:', keysToRemove);
    
    keysToRemove.forEach(key => {
      const oldValue = localStorage.getItem(key);
      localStorage.removeItem(key);
      console.log(`🧹 Cleared cache item: ${key} = ${oldValue}`);
    });
    
    console.log('🧹 localStorage after clearing:', Object.keys(localStorage));
    console.log('✅ Build cache cleared - MAXIMUM TROUBLESHOOTING COMPLETE');
  }

  // Enhanced cache clearer for new builds
  clearAllCache() {
    console.log('🧹 Clearing all cache for new build...');
    
    // Clear all localStorage items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keysToRemove.push(key);
      }
    }
    
    console.log('🧹 Clearing localStorage keys:', keysToRemove);
    
    keysToRemove.forEach(key => {
      const oldValue = localStorage.getItem(key);
      localStorage.removeItem(key);
      console.log(`🧹 Cleared: ${key} = ${oldValue}`);
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('🧹 Cleared sessionStorage');
    
    // Clear any cached data in memory
    this.posts = [];
    this.currentPost = null;
    
    // Force reload to ensure fresh state
    console.log('🧹 Cache cleared, reloading page...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
    console.log('✅ All cache cleared and page will reload');
  }
  
  // Function to increment build word (called automatically on new builds)
  incrementBuildWord() {
    console.log('🔧 Incrementing build word for new build...');
    
    // Get current build counter
    const currentCounter = parseInt(localStorage.getItem('buildCounter') || '1');
    const newCounter = currentCounter + 1;
    
    // Update build counter
    localStorage.setItem('buildCounter', newCounter.toString());
    
    // Update build word display
    const buildWordElement = document.getElementById('build-word');
    if (buildWordElement) {
      buildWordElement.textContent = `build-${newCounter}`;
    }
    
    console.log(`🔧 Build word incremented from ${currentCounter} to ${newCounter}`);
    console.log('✅ Build word updated successfully');
  }

  async validateGitHubToken() {
    try {
      const githubConfig = localStorage.getItem('githubConfig');
      if (!githubConfig) {
        alert('No GitHub config found in localStorage');
        return;
      }
      
      const config = JSON.parse(githubConfig);
      const token = config.token;
      
      if (!token) {
        alert('No GitHub token found in config');
        return;
      }
      
      console.log('🔐 Testing GitHub token...');
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        alert(`GitHub token is valid! Logged in as: ${userData.login}`);
        console.log('✅ GitHub token valid:', userData);
      } else {
        alert(`GitHub token is invalid! Status: ${response.status}`);
        console.log('❌ GitHub token invalid:', response.status, response.statusText);
      }
    } catch (error) {
      alert(`Error testing GitHub token: ${error.message}`);
      console.error('❌ Error testing GitHub token:', error);
    }
  }



  setupCSSVariables() {
    console.log('🎨 Setting up CSS variables...');
    
    // Set CSS custom properties for consistent theming
    const root = document.documentElement;
    
    // Accent color for highlights and borders
    root.style.setProperty('--accent-color', '#4a9eff');
    
    // Danger color for close buttons and warnings
    root.style.setProperty('--danger-color', '#dc3545');
    
    // Success color for positive actions
    root.style.setProperty('--success-color', '#28a745');
    
    // Warning color for cautions
    root.style.setProperty('--warning-color', '#ffc107');
    
    // Menu colors for consistent styling
    root.style.setProperty('--menu-bg', '#2d2d2d');
    root.style.setProperty('--menu-fg', '#ffffff');
    root.style.setProperty('--menu-border', '#555555');
    root.style.setProperty('--menu-hover-bg', '#4a4a4a');
    root.style.setProperty('--muted', '#888888');
    root.style.setProperty('--border', '#555555');
    
    console.log('✅ CSS variables setup complete');
  }

  setupBuildWordAutoRefresh() {
    // Build word is now static and only changes on actual builds
    // No auto-refresh needed
    console.log('🔧 Build word is static - no auto-refresh needed');
  }

  bindEvents() {
    console.log('🔧 bindEvents() called');
    
    // Setup CSS variables
    this.setupCSSVariables();
    
    // Menu system
    console.log('🔍 Setting up menu system...');
    this.setupMenuSystem();
    
    // Button events
    console.log('🔍 Setting up button events...');
    this.setupButtonEvents();
    
    // Global events
    console.log('🔍 Setting up global events...');
    this.setupGlobalEvents();
    
    console.log('✅ bindEvents() completed');
  }

  setupMenuSystem() {
    console.log('🔧 Setting up menu system...');
    
    // Initialize text selection preservation
    this.initializeTextSelectionPreservation();
    
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
    
    // Prevent text selection loss on taskbar elements
    this.preventSelectionLoss();
    
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
    
    // Close all submenus and sub-submenus
    const allSubmenus = document.querySelectorAll('.submenu, .sub-submenu');
    console.log('🔧 Closing all submenus, found:', allSubmenus.length, 'submenus');
    
    allSubmenus.forEach(submenu => {
      submenu.remove();
      console.log('✅ Removed submenu:', submenu.className);
    });
    
    // Reset menu state
    this.resetMenuState();
  }

  resetMenuState() {
    console.log('🔄 Resetting menu state - all submenus cleared');
    // This ensures that when menus are reopened, they start fresh
    // No cached submenus or stale event listeners
  }

  preventSelectionLoss() {
    // Use CSS to prevent text selection loss on taskbar elements
    const taskbarElements = document.querySelectorAll('.taskbar, .menu-item, .menu-dropdown, .submenu');
    
    taskbarElements.forEach(element => {
      // Set CSS properties to prevent selection clearing
      element.style.userSelect = 'none';
      element.style.webkitUserSelect = 'none';
      element.style.mozUserSelect = 'none';
      element.style.msUserSelect = 'none';
      
      // Add a class for styling
      element.classList.add('preserve-selection');
    });
    
    // Also handle dynamically created submenus
    this.setupSubmenuSelectionPreservation();
    
    // Add global CSS to prevent selection clearing on taskbar interactions
    const style = document.createElement('style');
    style.textContent = `
      .preserve-selection {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      
      .preserve-selection * {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      
      /* Allow text selection on clickable menu items */
      .preserve-selection .menu-entry,
      .preserve-selection [data-mode] {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        cursor: pointer;
      }
      
      /* Prevent selection loss on all taskbar-related elements */
      .taskbar,
      .menu-item,
      .menu-dropdown,
      .submenu,
      .menu-entry {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      
      /* But allow text selection on actual clickable content */
      .menu-entry,
      [data-mode] {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        cursor: pointer;
      }
      
      /* Editor-specific preservation */
      .editor-container,
      .post-content,
      .note-input,
      .flags-input,
      .image-magazine {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
      }
    `;
    document.head.appendChild(style);
  }

  setupSubmenuSelectionPreservation() {
    // Monitor for dynamically created submenus and apply selection preservation
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if it's a submenu or menu-related element
            if (node.classList && (
              node.classList.contains('submenu') ||
              node.classList.contains('menu-dropdown') ||
              node.classList.contains('menu-entry')
            )) {
              node.style.userSelect = 'none';
              node.style.webkitUserSelect = 'none';
              node.style.mozUserSelect = 'none';
              node.style.msUserSelect = 'none';
              node.classList.add('preserve-selection');
              console.log('📝 Applied selection preservation to new submenu element');
            }
            
            // Also check child elements
            const submenuElements = node.querySelectorAll('.submenu, .menu-dropdown, .menu-entry');
            submenuElements.forEach(element => {
              element.style.userSelect = 'none';
              element.style.webkitUserSelect = 'none';
              element.style.mozUserSelect = 'none';
              element.style.msUserSelect = 'none';
              element.classList.add('preserve-selection');
            });
          }
        });
      });
    });
    
    // Observe the entire document for new submenus
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('📝 Submenu selection preservation observer setup complete');
  }

  preserveEditorSelection() {
    // Add specific CSS to prevent selection loss in editor
    const editorStyle = document.createElement('style');
    editorStyle.id = 'editor-selection-preservation';
    editorStyle.textContent = `
      /* Prevent selection loss in editor areas */
      #postTitle,
      #postContent,
      .post-content,
      .editor-container {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
      }
      
      /* Ensure note creation doesn't clear selection */
      .note-input,
      .flags-input,
      .image-magazine {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      
      /* But allow text selection in the actual input fields */
      .note-input input,
      .flags-input input {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
      }
      
      /* Protect text selection on social sharing buttons */
      #bluesky-share,
      #twitter-share {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      
      /* Protect text selection on all taskbar buttons */
      .taskbar button,
      .taskbar .menu-entry,
      .taskbar [id$="-btn"] {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
    `;
    
    // Remove existing style if it exists
    const existingStyle = document.getElementById('editor-selection-preservation');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(editorStyle);
    console.log('📝 Editor selection preservation CSS applied');
  }

  initializeTextSelectionPreservation() {
    // Store the current text selection
    this.currentSelection = null;
    
    // Monitor text selection changes
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        this.currentSelection = {
          text: selection.toString(),
          range: selection.getRangeAt(0).cloneRange()
        };
        console.log('📝 Text selection captured:', this.currentSelection.text);
      }
    });
    
    // Add click handlers to preserve selection on taskbar interactions
    this.addSelectionPreservationHandlers();
  }

  addSelectionPreservationHandlers() {
    // Add handlers to all taskbar-related elements
    const selectors = [
      '#bluesky-share',
      '#twitter-share',
      '.taskbar button',
      '.menu-entry',
      '[id$="-btn"]',
      '.menu-item',
      '.submenu'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // Preserve selection before click
        element.addEventListener('mousedown', (e) => {
          if (this.currentSelection && this.currentSelection.text) {
            console.log('📝 Preserving selection before click:', this.currentSelection.text);
            // Store the selection temporarily
            this.tempSelection = { ...this.currentSelection };
          }
        });
        
        // Restore selection after click
        element.addEventListener('click', (e) => {
          if (this.tempSelection && this.tempSelection.range) {
            setTimeout(() => {
              try {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(this.tempSelection.range);
                console.log('📝 Selection restored after click:', this.tempSelection.text);
              } catch (error) {
                console.warn('⚠️ Could not restore selection:', error);
              }
            }, 10);
          }
        });
      });
    });
    
    console.log('📝 Selection preservation handlers added');
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
      // Ensure text selection is preserved before creating note
      this.preserveEditorSelection();
      this.captureSelectionAndMakeNote();
    });
    
    // Edit post button
    this.addClickHandler('#edit-post-button', () => {
      console.log('✏️ Edit post button clicked');
      this.editCurrentPost();
    });

    // Editor-specific buttons
    this.addClickHandler('#import-btn', () => {
      console.log('📥 Import button clicked');
      this.importPost();
    });

    this.addClickHandler('#export-btn', () => {
      console.log('📤 Export button clicked');
      this.exportPost();
    });

    this.addClickHandler('#save-draft-btn', () => {
      console.log('💾 Save draft button clicked');
      this.saveDraft();
    });

    this.addClickHandler('#images-btn', () => {
      console.log('🖼️ Images button clicked');
      console.log('🔍 About to call showImagesModal...');
      this.showImagesModal();
      console.log('🔍 showImagesModal called');
    });

    this.addClickHandler('#publish-btn', () => {
      console.log('📢 Publish button clicked');
      this.showPublishModal();
    });

    this.addClickHandler('#keywords-btn', () => {
      console.log('🏷️ Flags button clicked');
      this.showFlagsModal();
    });

    // Console toggle
    this.addClickHandler('#toggle-console', () => {
      console.log('🖥️ Console toggle clicked');
      this.toggleConsole();
    });

    // GitHub connect button (old - will be removed from menu)
    this.addClickHandler('#github-connect', () => {
      console.log('🔐 GitHub connect button clicked');
      this.showGitHubLogin();
    });
    
    // GitHub connect underscore
    this.addClickHandler('#github-connect-underscore', () => {
      console.log('🔐 GitHub connect underscore clicked');
      this.showGitHubLogin();
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
      
      this.setTheme(mode, mode === 'custom'); // Open HSL picker only for custom theme
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

    // Build indicator - no click handler needed, only changes on actual builds
    // this.addClickHandler('#build-indicator', () => {
    //   console.log('🔧 Build indicator clicked - incrementing build');
    //   this.incrementBuildWord();
    // });
    

    
    // Debug button handlers
    this.addClickHandler('#test-cache-clear', () => {
      console.log('🧹 Test cache clear button clicked');
      this.clearBuildCache();
      alert('Cache cleared! Check console for details.');
    });
    
    this.addClickHandler('#test-build-increment', () => {
      console.log('🔧 Test build increment button clicked');
      this.incrementBuildWord();
      alert('Build incremented! Check console for details.');
    });
    

    
    // Add cache clear button handler
    this.addClickHandler('#cache-clear-btn', () => {
      console.log('🧹 Cache clear button clicked');
      if (confirm('Clear all cache and reload? This will reset all stored data.')) {
        this.clearAllCache();
      }
    });
    
    this.addClickHandler('#show-localstorage', () => {
      console.log('📋 Show localStorage button clicked');
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        storage[key] = localStorage.getItem(key);
      }
      console.log('📋 localStorage contents:', storage);
      alert('localStorage contents logged to console!');
    });
    
    this.addClickHandler('#test-github-token', () => {
      console.log('🔐 Test GitHub token button clicked');
      this.validateGitHubToken();
    });
    
    // Social sharing buttons
    this.addClickHandler('#bluesky-share', () => {
      console.log('🔵 Bluesky share button clicked');
      this.shareToBluesky();
    });
    
    this.addClickHandler('#twitter-share', () => {
      console.log('🐦 Twitter share button clicked');
      this.shareToTwitter();
    });
    
    // Edit menu buttons

    
    this.addClickHandler('#font-size-button', () => {
      console.log('🔤 Font size button clicked');
      this.showFontSizeWindow();
    });
    
    this.addClickHandler('#quick-edit-button', () => {
      console.log('✏️ Quick edit button clicked');
      this.quickEdit();
    });
    
    this.addClickHandler('#category-manager-button', () => {
      console.log('🗂️ Category manager button clicked');
      this.showCategoryManager();
    });
    
    this.addClickHandler('#draft-manager-button', () => {
      console.log('📝 Draft manager button clicked');
      this.showDraftManager();
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
    
    // Setup build word auto-refresh (every minute)
    this.setupBuildWordAutoRefresh();
  }

  setupPageSpecificElements() {
    // Show/hide editor-specific items
    const isEditorPage = document.getElementById('postTitle') !== null;
    const isBlogPage = !isEditorPage && window.location.pathname.includes('index.html');
    
    const editorOnlyItems = document.querySelectorAll('.editor-only');
    const blogOnlyItems = document.querySelectorAll('.blog-only');
    const adminOnlyItems = document.querySelectorAll('.admin-only');
    
    editorOnlyItems.forEach(item => {
      item.style.display = isEditorPage ? 'block' : 'none';
    });
    
    blogOnlyItems.forEach(item => {
      item.style.display = isBlogPage ? 'block' : 'none';
    });
    
    // Show admin items only if authenticated
    adminOnlyItems.forEach(item => {
      item.style.display = 'none'; // Hidden by default
    });
    
    // Check authentication status for admin items
    this.checkAuthentication().then(isAuthenticated => {
      this.isAuthenticated = isAuthenticated;
      adminOnlyItems.forEach(item => {
        item.style.display = isAuthenticated ? 'block' : 'none';
      });
    });
    
    // Setup hover note preview if we're on the editor page
    if (isEditorPage) {
      this.setupHoverNotePreview();
      // Apply editor-specific selection preservation
      this.preserveEditorSelection();
      
      // Check for edit data and populate form
      this.loadEditData();
    }
  }

  setupSubmenus() {
    console.log('🔧 Setting up submenus...');
    
    // Global menu manager - ensures only one menu open at each level
    this.closeOtherLevel1Menus = (currentMenu) => {
      const allLevel1Menus = ['all-posts-menu', 'projects-menu'];
      allLevel1Menus.forEach(menuId => {
        if (menuId !== currentMenu) {
          const menu = document.getElementById(menuId);
          if (menu) {
            const existingSubmenu = menu.querySelector('.submenu');
            if (existingSubmenu) {
              existingSubmenu.remove();
            }
          }
        }
      });
    };
    
    // All posts submenu
    const allPostsMenu = document.getElementById('all-posts-menu');
    if (allPostsMenu) {
      // Remove existing listeners to prevent duplication
      allPostsMenu.removeEventListener('mouseenter', this.allPostsMouseEnterHandler);
      allPostsMenu.removeEventListener('mouseleave', this.allPostsMouseLeaveHandler);
      
      let openTimeout = null;
      
      this.allPostsMouseEnterHandler = () => {
        console.log('📚 All posts submenu hovered');
        if (openTimeout) {
          clearTimeout(openTimeout);
        }
        openTimeout = setTimeout(() => {
          // Close other level 1 menus first
          this.closeOtherLevel1Menus('all-posts-menu');
          
          // Only create submenu if it doesn't already exist
          const existingSubmenu = allPostsMenu.querySelector('.submenu');
          if (!existingSubmenu) {
            console.log('📚 Creating new All Posts submenu');
            this.showAllPostsSubmenu(allPostsMenu);
          } else {
            console.log('📚 All Posts submenu already exists, not recreating');
          }
        }, 150); // Small delay to prevent accidental opening
      };
      
      this.allPostsMouseLeaveHandler = () => {
        if (openTimeout) {
          clearTimeout(openTimeout);
          openTimeout = null;
        }
      };
      
      allPostsMenu.addEventListener('mouseenter', this.allPostsMouseEnterHandler);
      allPostsMenu.addEventListener('mouseleave', this.allPostsMouseLeaveHandler);
      console.log('✅ All posts submenu handler attached');
    } else {
      console.warn('⚠️ All posts menu element not found');
    }

    // Projects submenu - hover shows categories, click opens floating window
    const projectsMenu = document.getElementById('projects-menu');
    if (projectsMenu) {
      // Remove existing listeners to prevent duplication
      projectsMenu.removeEventListener('mouseenter', this.projectsMouseEnterHandler);
      projectsMenu.removeEventListener('mouseleave', this.projectsMouseLeaveHandler);
      
      let openTimeout = null;
      
      this.projectsMouseEnterHandler = () => {
        console.log('📝 Projects submenu hovered');
        if (openTimeout) {
          clearTimeout(openTimeout);
        }
        openTimeout = setTimeout(() => {
          // Close other level 1 menus first
          this.closeOtherLevel1Menus('projects-menu');
          
          // Only create submenu if it doesn't already exist
          const existingSubmenu = projectsMenu.querySelector('.submenu');
          if (!existingSubmenu) {
            console.log('📝 Creating new Projects submenu');
            this.updateProjectsSubmenu(this.posts || []);
          } else {
            console.log('📝 Projects submenu already exists, not recreating');
          }
        }, 150); // Small delay to prevent accidental opening
      };
      
      this.projectsMouseLeaveHandler = () => {
        if (openTimeout) {
          clearTimeout(openTimeout);
          openTimeout = null;
        }
      };
      
      projectsMenu.addEventListener('mouseenter', this.projectsMouseEnterHandler);
      projectsMenu.addEventListener('mouseleave', this.projectsMouseLeaveHandler);
      console.log('✅ Projects submenu hover handler attached');
    } else {
      console.warn('⚠️ Projects menu element not found');
    }
    
    console.log('✅ Submenus setup complete with menu hierarchy management');
  }

  async showAllPostsSubmenu(menuElement) {
    // Create submenu for all posts
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.style.cssText = `
      position: absolute;
      left: 100%;
      top: 0;
      background: var(--menu-bg, #333);
      border: 1px solid var(--menu-border, #555);
      padding: 5px 0;
      min-width: 150px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-radius: 4px;
    `;
    
    // Add invisible buffer zone around submenu for easier navigation
    const bufferZone = document.createElement('div');
    bufferZone.style.cssText = `
      position: absolute;
      left: -10px;
      top: -10px;
      right: -10px;
      bottom: -10px;
      z-index: 999;
      pointer-events: none;
    `;
    submenu.appendChild(bufferZone);
    
    // Show loading indicator
    const loadingEntry = document.createElement('div');
    loadingEntry.className = 'menu-entry';
    loadingEntry.textContent = 'Loading posts...';
    loadingEntry.style.cssText = 'padding: 8px 15px; color: var(--muted, #888); font-style: italic;';
    submenu.appendChild(loadingEntry);
    
    // Remove existing submenu
    const existingSubmenu = menuElement.querySelector('.submenu');
    if (existingSubmenu) {
      existingSubmenu.remove();
    }
    
    // Add new submenu
    menuElement.appendChild(submenu);
    
    try {
      // Load posts from index (much faster than scanning directory)
      let allPosts = [];
      
      const timestamp = Date.now();
      const indexUrl = `posts/index.json?t=${timestamp}`;
      console.log('🔍 All Posts submenu: Loading posts from index:', indexUrl);
      
      const response = await fetch(indexUrl);
      if (response.ok) {
        const indexData = await response.json();
        console.log('🔍 All Posts submenu: Index data loaded:', indexData);
        
                          // Handle both array and object formats
                  if (Array.isArray(indexData)) {
                    allPosts = indexData;
                  } else if (indexData.posts && Array.isArray(indexData.posts)) {
                    allPosts = indexData.posts;
                  }
                  
                  console.log('✅ All Posts submenu: Posts loaded from index:', allPosts.length);
                  
                  // Update local posts array to keep in sync
                  this.posts = allPosts;
                } else {
                  console.warn('⚠️ All Posts submenu: Could not load index file:', response.status);
                  // Fallback: use cached posts
                  allPosts = this.posts;
                }
      
      // Clear loading indicator
      submenu.innerHTML = '';
      
      // Add post entries
      if (allPosts.length > 0) {
        console.log('🔍 MAXIMUM TROUBLESHOOTING: Creating post entries for', allPosts.length, 'posts');
        console.log('🔍 Posts data:', allPosts);
        
        allPosts.forEach((post, index) => {
          console.log(`🔍 Processing post ${index}:`, post);
          
          if (!post || !post.slug) {
            console.warn('⚠️ Skipping invalid post:', post);
            return;
          }
          
          console.log(`🔍 Creating entry for post: ${post.title} (${post.slug})`);
          
          const entry = document.createElement('div');
          entry.className = 'menu-entry';
          entry.textContent = post.title || 'Untitled';
          entry.style.cssText = `
            padding: 8px 15px; 
            cursor: pointer; 
            color: var(--menu-fg, #fff);
            transition: background-color 0.15s ease;
            border-radius: 3px;
            margin: 1px 2px;
          `;
          
          // Add unique ID for debugging
          entry.id = `post-entry-${post.slug}`;
          console.log(`🔍 Created entry element:`, entry);
          
          entry.title = `Click to load: ${post.title} (${post.slug})`;
          
          entry.addEventListener('click', (e) => {
            console.log('🔍 MAXIMUM TROUBLESHOOTING: CLICK EVENT FIRED!');
            console.log('🔍 Event details:', e);
            console.log('🔍 Target element:', e.target);
            console.log('🔍 Post data:', post);
            
            e.preventDefault();
            e.stopPropagation();
            console.log('📖 Post selected:', post.title || 'Untitled', 'slug:', post.slug);
            
            // Check if we're in the editor
            console.log('🔍 Current pathname:', window.location.pathname);
            console.log('🔍 Current href:', window.location.href);
            if (window.location.pathname.includes('editor.html') || window.location.href.includes('editor.html')) {
              console.log('📝 In editor - redirecting to main blog with post:', post.slug);
              // Redirect to main blog with the selected post
              window.location.href = `index.html?post=${post.slug}`;
            } else {
              console.log('🏠 On main blog - loading post normally:', post.slug);
              // We're on the main blog, load post normally
              console.log('🔍 About to call loadPost with slug:', post.slug);
              console.log('🔍 this object:', this);
              console.log('🔍 this.loadPost function:', this.loadPost);
              console.log('🔍 typeof this.loadPost:', typeof this.loadPost);
              
              // Close menus first
              console.log('🔍 Closing all menus...');
              this.closeAllMenus();
              console.log('🔍 Menus closed');
              
              // Then load the post
              try {
                console.log('🔍 Calling loadPost...');
                const loadPromise = this.loadPost(post.slug);
                console.log('🔍 loadPost returned promise:', loadPromise);
                
                if (loadPromise && typeof loadPromise.then === 'function') {
                  loadPromise.then(() => {
                    console.log('✅ Post loaded successfully:', post.slug);
                  }).catch(error => {
                    console.error('❌ Error loading post:', error);
                  });
                } else {
                  console.error('❌ loadPost did not return a promise:', loadPromise);
                }
              } catch (error) {
                console.error('❌ Error calling loadPost:', error);
                console.error('❌ Error stack:', error.stack);
              }
            }
          });
          
          entry.addEventListener('mouseenter', () => {
            console.log(`🔍 Mouse enter on post entry: ${post.title}`);
            entry.style.background = 'var(--menu-hover-bg, #555)';
            entry.style.transform = 'translateX(2px)';
          });
          
          entry.addEventListener('mouseleave', () => {
            console.log(`🔍 Mouse leave on post entry: ${post.title}`);
            entry.style.background = 'transparent';
            entry.style.transform = 'translateX(0)';
          });
          
          console.log(`🔍 Appending entry to submenu:`, entry);
          submenu.appendChild(entry);
          console.log(`🔍 Entry appended successfully`);
        });
        
        console.log('🔍 MAXIMUM TROUBLESHOOTING: All post entries created and added to submenu');
        console.log('🔍 Final submenu children count:', submenu.children.length);
      } else {
        const noPostsEntry = document.createElement('div');
        noPostsEntry.className = 'menu-entry';
        noPostsEntry.textContent = 'No posts found';
        noPostsEntry.style.cssText = 'padding: 8px 15px; color: var(--muted, #888); font-style: italic;';
        submenu.appendChild(noPostsEntry);
      }
      
    } catch (error) {
      console.error('❌ Error loading posts for submenu:', error);
      // Show error message
      submenu.innerHTML = '';
      const errorEntry = document.createElement('div');
      errorEntry.className = 'menu-entry';
      errorEntry.textContent = 'Error loading posts';
      errorEntry.style.cssText = 'padding: 8px 15px; color: var(--danger-color, #dc3545); font-style: italic;';
      submenu.appendChild(errorEntry);
    }
    
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

  async scanLocalPostsDirectory(allPosts) {
    try {
      console.log('🔍 All Posts submenu: Scanning local posts directory...');
      
      // Try to get a list of local posts by checking common post files
      // Since we can't directly list directory contents in the browser,
      // we'll try to load posts we know about and also check for any index.json
      
      // First try to load local index.json if it exists
      try {
        const localIndexResponse = await fetch('posts/index.json');
        if (localIndexResponse.ok) {
          const localIndexData = await localIndexResponse.json();
          const localPosts = Array.isArray(localIndexData) ? localIndexData : (localIndexData.posts || []);
          console.log('🔍 All Posts submenu: Found local index.json with posts:', localPosts.length);
          
          // Add these posts to our list
          for (const post of localPosts) {
            if (post && post.slug && !allPosts.find(p => p.slug === post.slug)) {
              allPosts.push(post);
            }
          }
        }
      } catch (localIndexError) {
        console.log('🔍 All Posts submenu: No local index.json found');
      }
      
      // Try to load some common post files directly
      const commonSlugs = ['welcome', 'first-post', 'test-post', 'hello-world'];
      for (const slug of commonSlugs) {
        try {
          const postResponse = await fetch(`posts/${slug}.json`);
          if (postResponse.ok) {
            const postData = await postResponse.json();
            if (!allPosts.find(p => p.slug === slug)) {
              const post = {
                slug: slug,
                title: postData.title || slug,
                date: postData.date || 'Unknown date',
                keywords: postData.keywords || 'general'
              };
              allPosts.push(post);
              console.log('✅ All Posts submenu: Loaded local post:', post);
            }
          }
        } catch (postError) {
          // Post file doesn't exist, continue
        }
      }
      
      console.log('🔍 All Posts submenu: Local directory scan complete, total posts:', allPosts.length);
      
    } catch (error) {
      console.error('❌ All Posts submenu: Error scanning local directory:', error);
    }
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
          // Check if we're in the editor
          console.log('🔍 Current pathname:', window.location.pathname);
          console.log('🔍 Current href:', window.location.href);
          if (window.location.pathname.includes('editor.html') || window.location.href.includes('editor.html')) {
            console.log('📝 In editor - redirecting to main blog with post:', post.slug);
            // Redirect to main blog with the selected post
            window.location.href = `index.html?post=${post.slug}`;
          } else {
            console.log('🏠 On main blog - loading post normally:', post.slug);
            // We're on the main blog, load post normally
            this.loadPost(post.slug);
            this.closeAllMenus();
          }
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
    console.log('🔍 loadPosts: Loading posts from index...');
    
    try {
      // Load posts from the index file (much faster than scanning directory)
      const timestamp = Date.now();
      const indexUrl = `posts/index.json?t=${timestamp}`;
      console.log('🔍 loadPosts: Loading posts index from:', indexUrl);
      
      const response = await fetch(indexUrl);
      if (response.ok) {
        const indexData = await response.json();
        console.log('🔍 loadPosts: Index data loaded:', indexData);
        
        // Handle both array and object formats
        if (Array.isArray(indexData)) {
          this.posts = indexData;
        } else if (indexData.posts && Array.isArray(indexData.posts)) {
          this.posts = indexData.posts;
        } else {
          console.warn('⚠️ loadPosts: Unexpected index format:', indexData);
          this.posts = [];
        }
        
        console.log('📚 loadPosts: Posts loaded from index:', this.posts.length);
        
        if (this.posts.length > 0) {
          // Sort by date and display the most recent
          this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
          const mostRecent = this.posts[0];
          console.log('📚 loadPosts: Displaying most recent post:', mostRecent);
          await this.loadPost(mostRecent.slug);
          
          // Don't create submenus on page load - only create them on hover
          console.log('🧭 loadPosts: Posts loaded, submenus will be created on hover');
        } else {
          console.log('⚠️ loadPosts: No posts found in index');
          this.displayDefaultContent();
        }
      } else {
        console.warn('⚠️ loadPosts: Could not load index file:', response.status);
        this.posts = [];
        this.displayDefaultContent();
      }
    } catch (error) {
      console.error('❌ loadPosts: Error loading index:', error);
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
        // Try GitHub API first, then local fallback
        let postExists = false;
        
        try {
          const githubResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${post.slug}.json`);
          if (githubResponse.ok) {
            postExists = true;
          }
        } catch (githubError) {
          // Try local fallback
          try {
            const localResponse = await fetch(`posts/${post.slug}.json`);
            if (localResponse.ok) {
              postExists = true;
            }
          } catch (localError) {
            // Both failed
          }
        }
        
        if (postExists) {
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
    console.log(`🔍 MAXIMUM TROUBLESHOOTING: loadPost called with slug: ${slug}`);
    console.log(`🔍 this object in loadPost:`, this);
    console.log(`🔍 this.displayPost function:`, this.displayPost);
    console.log(`🔍 this.displayDefaultContent function:`, this.displayDefaultContent);
    
    try {
      console.log(`📖 Loading post: ${slug}`);
      
      // Try GitHub API first, then local fallback
      let post = null;
      
      try {
        // Try GitHub API first (public access, no authentication required)
        const timestamp = Date.now();
        const githubUrl = `https://api.github.com/repos/pigeonPious/page/contents/posts/${slug}.json?t=${timestamp}`;
        console.log('🔍 loadPost: Fetching from GitHub API (public):', githubUrl);
        
        const githubResponse = await fetch(githubUrl);
        console.log('🔍 loadPost: GitHub API response status:', githubResponse.status, githubResponse.statusText);
        
        if (githubResponse.ok) {
          const githubData = await githubResponse.json();
          console.log('🔍 loadPost: GitHub API response data:', githubData);
          
          const content = atob(githubData.content); // Decode base64 content
          console.log('🔍 loadPost: Decoded content:', content);
          
          post = JSON.parse(content);
          console.log('✅ Post loaded from GitHub API:', post.title);
        } else if (githubResponse.status === 403) {
          console.log('⚠️ loadPost: GitHub API 403 Forbidden - this might be a rate limit issue, trying local...');
        } else if (githubResponse.status === 404) {
          console.log('⚠️ loadPost: Post not found on GitHub (404), trying local...');
        } else {
          console.log('⚠️ loadPost: GitHub API failed with status:', githubResponse.status);
        }
      } catch (githubError) {
        console.log('⚠️ GitHub API failed, trying local...');
        console.log('🔍 GitHub error details:', githubError);
      }
      
      // Try local posts if GitHub failed or returned error
      if (!post) {
        try {
          console.log('🔍 loadPost: Trying local post file...');
          const localResponse = await fetch(`posts/${slug}.json`);
          if (localResponse.ok) {
            post = await localResponse.json();
            console.log('✅ Post loaded from local:', post.title);
          } else {
            console.log('⚠️ loadPost: Local post file not found:', localResponse.status);
          }
        } catch (localError) {
          console.warn('❌ Local post loading failed:', localError);
        }
      }
      
      if (post) {
        this.displayPost(post);
        this.currentPost = post;
        console.log(`✅ Post loaded successfully: ${post.title}`);
        return post;
      } else {
        console.error(`❌ Failed to load post ${slug}: Post not found`);
        this.displayDefaultContent();
      }
    } catch (error) {
      console.error(`❌ Error loading post ${slug}:`, error);
      this.displayDefaultContent();
    }
  }

  displayPost(post) {
    console.log('🔍 MAXIMUM TROUBLESHOOTING: displayPost called with:', post);
    
    // Update URL to reflect current post (for direct linking and sharing)
    if (post && post.slug) {
      const newUrl = `${window.location.origin}${window.location.pathname}#${post.slug}`;
      window.history.pushState({ postSlug: post.slug }, post.title, newUrl);
      console.log('🔗 Updated URL to:', newUrl);
    }
    
    const titleElement = document.getElementById('post-title');
    const dateElement = document.getElementById('post-date');
    const contentElement = document.getElementById('post-content');

    console.log('🔍 DOM elements found:', { 
      titleElement: !!titleElement, 
      dateElement: !!dateElement, 
      contentElement: !!contentElement 
    });

    if (titleElement) {
      titleElement.textContent = post.title || 'Untitled';
      console.log('🔍 Set title to:', post.title || 'Untitled');
    } else {
      console.error('❌ titleElement not found!');
    }
    
    if (dateElement) {
      dateElement.textContent = post.date || '';
      console.log('🔍 Set date to:', post.date || '');
    } else {
      console.error('❌ dateElement not found!');
    }
    
    if (contentElement) {
      contentElement.innerHTML = post.content || '';
      
      // Add flashing cursor at the end of the post, ensuring it's after text content
      const cursor = document.createElement('span');
      cursor.className = 'flashing-cursor';
      cursor.textContent = '_';
      cursor.style.cssText = `
        color: var(--fg);
        font-family: monospace;
        margin-left: 2px;
        animation: blink 1s infinite;
        display: inline;
      `;
      
      // Find the last text node or element and append cursor inline
      const lastChild = contentElement.lastElementChild || contentElement;
      if (lastChild && lastChild.tagName && (lastChild.tagName === 'P' || lastChild.tagName === 'DIV' || lastChild.tagName === 'SPAN')) {
        // If last element is a block element, append cursor inside it
        lastChild.appendChild(cursor);
      } else {
        // If no suitable element, create a span to wrap the cursor
        const wrapper = document.createElement('span');
        wrapper.appendChild(cursor);
        contentElement.appendChild(wrapper);
      }
      
      // Add CSS animation if it doesn't exist
      if (!document.getElementById('cursor-animation')) {
        const style = document.createElement('style');
        style.id = 'cursor-animation';
        style.textContent = `
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
      
      console.log('🔍 Set content to:', post.content ? post.content.substring(0, 100) + '...' : '');
    } else {
      console.error('❌ contentElement not found!');
    }
    
    // Setup hover notes for the displayed post
    console.log('🔍 Setting up hover notes...');
    this.setupHoverNotes();
    
    console.log('✅ Post displayed successfully:', post.title);
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

  setTheme(mode, openHSL = false) {
    console.log('🎨 Setting theme:', mode, 'openHSL:', openHSL);
    this.theme = mode;
    
    // Remove existing theme classes
    document.body.classList.remove('dark-mode', 'light-mode', 'custom-mode');
    console.log('🧹 Removed existing theme classes');
    
    // Clear any inline styles from previous custom/random themes
    const cssVars = ['--bg', '--fg', '--menu-bg', '--menu-fg', '--sidebar-bg', '--sidebar-fg', '--border', '--muted', '--link', '--accent', '--success-color', '--success-hover-color', '--danger-color', '--danger-hover-color', '--btn-text-color'];
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
      
      // Only open HSL color picker if explicitly requested (not on page load)
      if (openHSL) {
        console.log('🎨 Custom theme selected by user, opening HSL color picker...');
        try {
          this.openHSLColorPicker();
          console.log('✅ HSL color picker opened successfully');
        } catch (error) {
          console.error('❌ Error opening HSL color picker:', error);
          console.error('❌ Error stack:', error.stack);
        }
      } else {
        console.log('🎨 Custom theme restored from localStorage, not opening HSL picker');
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
      const accentColor = l < 50 ? '#ffffff' : `hsl(${h},${s}%,${Math.min(100, l + 30)}%)`;
      
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
      document.body.style.setProperty('--accent', accentColor);
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
    
    // If custom theme, also save HSL values
    if (mode === 'custom') {
      // Check if we have saved HSL values
      const savedHSL = localStorage.getItem('ppPage_custom_hsl');
      if (savedHSL) {
        try {
          const { h, s, l } = JSON.parse(savedHSL);
          this.applyCustomTheme(h, s, l);
          console.log('🎨 Applied saved custom theme HSL values:', { h, s, l });
        } catch (error) {
          console.warn('⚠️ Could not parse saved custom theme HSL values:', error);
        }
      }
    }
    
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

    // Find the View menu to position the HSL picker relative to it
    const viewMenu = document.querySelector('[data-menu="view"]');
    if (!viewMenu) {
      console.error('❌ View menu not found');
      return;
    }

    // Close the View menu properly before opening the HSL picker
    this.closeAllMenus();
    
    // Get the position of the View menu for proper positioning
    const viewMenuRect = viewMenu.getBoundingClientRect();

    // Create HSL color picker as a separate overlay (not inside the View menu)
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

    // Add to document body (not inside the View menu)
    document.body.appendChild(picker);

    // Close when clicking outside (but not when clicking on sliders)
    const outsideClickHandler = (e) => {
      // Don't close if clicking on the picker itself or its contents
      if (picker.contains(e.target)) {
        return;
      }
      
      // Don't close if clicking on the View menu (to allow normal menu interaction)
      if (viewMenu.contains(e.target)) {
        return;
      }
      
      // Close if clicking anywhere else
      picker.remove();
      document.removeEventListener('click', outsideClickHandler);
      console.log('🔧 HSL color picker closed by outside click');
    };
    
    // Add the click handler immediately
    document.addEventListener('click', outsideClickHandler);

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
    const accentColor = l < 50 ? '#ffffff' : `hsl(${h}, ${s}%, ${Math.min(100, l + 30)}%)`;
    
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
    document.body.style.setProperty('--accent', accentColor);
    document.body.style.setProperty('--success-color', '#28a745');
    document.body.style.setProperty('--success-hover-color', '#218838');
    document.body.style.setProperty('--danger-color', '#dc3545');
    document.body.style.setProperty('--danger-hover-color', '#c82333');
    document.body.style.setProperty('--btn-text-color', fgColor);
    
    // Save custom theme HSL values to localStorage
    localStorage.setItem('ppPage_custom_hsl', JSON.stringify({ h, s, l }));
    console.log('💾 Custom theme HSL values saved to localStorage:', { h, s, l });
    
    console.log('🎨 Custom theme applied:', { h, s, l, bgColor, fgColor });
  }

  captureSelectionAndMakeNote() {
    console.log('📝 Using monitored selection to create hover note...');
    
    // Check if we have a recent valid selection
    if (!this.lastValidSelection) {
      alert('Please select some text first, then click Make Note.');
      return;
    }
    
    // Check if selection is recent (within last 30 seconds)
    const selectionAge = Date.now() - this.lastValidSelection.timestamp;
    if (selectionAge > 30000) {
      alert('Text selection is too old. Please select text again, then click Make Note.');
      return;
    }
    
    console.log('✅ Using monitored selection:', this.lastValidSelection.text);
    
    // Use the monitored selection data
    this.capturedNoteData = {
      selectedText: this.lastValidSelection.text,
      range: this.lastValidSelection.range.cloneRange(),
      timestamp: this.lastValidSelection.timestamp
    };
    
    // Now open the note input
    this.openNoteInput();
  }

  openNoteInput() {
    if (!this.capturedNoteData) {
      console.log('⚠️ No captured selection data');
      return;
    }
    
    const { selectedText, range } = this.capturedNoteData;
    
    // Create menu style 1 input box
    const inputBox = document.createElement('div');
    inputBox.className = 'menu-style-1-input';
    inputBox.style.cssText = `
      position: absolute;
      top: ${range.getBoundingClientRect().bottom + 5}px;
      left: ${range.getBoundingClientRect().left}px;
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
          this.createHoverNote(selectedText, noteText, range);
        }
        this.removeInputBox(inputBox);
        // Clear captured data
        this.capturedNoteData = null;
      } else if (e.key === 'Escape') {
        this.removeInputBox(inputBox);
        // Clear captured data
        this.capturedNoteData = null;
      }
    };
    
    input.addEventListener('keydown', handleInput);
    
    // Close on outside click
    const outsideClick = (e) => {
      if (!inputBox.contains(e.target)) {
        this.removeInputBox(inputBox);
        document.removeEventListener('click', outsideClick);
        // Clear captured data
        this.capturedNoteData = null;
      }
    };
    
    // Delay to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('click', outsideClick);
    }, 100);
  }

  makeNote() {
    // Legacy method - now calls the new workflow
    this.captureSelectionAndMakeNote();
  }

  createHoverNote(selectedText, noteText, range) {
    // Create span with hover note data
    const span = document.createElement('span');
    span.className = 'note-link';
    span.setAttribute('data-note', noteText);
    span.textContent = selectedText;
    
    // Replace selected text with span using the preserved range
    range.deleteContents();
    range.insertNode(span);
    
    console.log('✅ Hover note created:', { text: selectedText, note: noteText });
    
    // Setup hover preview for the new note
    this.setupHoverNotePreview();
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
    
    // Get the button position for initial placement
    const imagesBtn = document.getElementById('images-btn');
    let initialX = '50%';
    let initialY = '50%';
    
    if (imagesBtn) {
      const btnRect = imagesBtn.getBoundingClientRect();
      initialX = (btnRect.left + btnRect.width / 2) + 'px';
      initialY = (btnRect.top + btnRect.height / 2) + 'px';
      console.log('🔍 Button position:', { left: btnRect.left, top: btnRect.top });
    }
    
    // Use the existing image magazine from HTML
    const magazine = document.getElementById('imageMagazine');
    console.log('🔍 Existing magazine found:', !!magazine);
    
    if (!magazine) {
      console.log('⚠️ No existing magazine found - this should not happen');
      return;
    }
    
    // Show magazine explicitly
    console.log('🔍 Setting display to block...');
    magazine.style.display = 'block';
    magazine.classList.remove('hidden');
    console.log('🔍 Magazine display style:', magazine.style.display);
    console.log('🔍 Magazine classes:', magazine.className);
    
    // Position the magazine
    magazine.style.visibility = 'visible';
    magazine.style.opacity = '1';
    magazine.style.position = 'fixed';
    magazine.style.top = initialY;
    magazine.style.left = initialX;
    magazine.style.transform = 'translate(-50%, -50%)';
    magazine.style.zIndex = '10000';
    magazine.style.width = '100px'; // Reduced width by 75%
    magazine.style.height = '500px'; // Keep height
    magazine.style.minWidth = '100px'; // Force min width
    magazine.style.minHeight = '500px'; // Force min height
    
    console.log('🔍 Magazine positioned at:', { x: initialX, y: initialY });
    console.log('🔍 Magazine inline styles applied');
    console.log('🔍 Magazine computed position:', magazine.getBoundingClientRect());
    
    // Setup the existing buttons
    this.setupImageMagazineButtons();
    
    // Setup drag functionality for the magazine
    this.setupMagazineDrag();
    
    // Load images from assets folder
    console.log('🔍 Loading images...');
    this.loadImagesToMagazine();
    
    console.log('✅ Image magazine opened');
  }

  setupImageMagazineButtons() {
    console.log('🔧 Setting up existing image magazine buttons...');
    
    // Get the existing buttons from HTML
    const importBtn = document.getElementById('import-image-btn');
    const closeBtn = document.getElementById('close-magazine-btn');
    
    console.log('🔍 Found import button:', !!importBtn);
    console.log('🔍 Found close button:', !!closeBtn);
    
    if (!importBtn || !closeBtn) {
      console.log('⚠️ Buttons not found - cannot setup functionality');
      return;
    }
    
    // Remove any existing event listeners
    importBtn.replaceWith(importBtn.cloneNode(true));
    closeBtn.replaceWith(closeBtn.cloneNode(true));
    
    // Get fresh references after cloning
    const newImportBtn = document.getElementById('import-image-btn');
    const newCloseBtn = document.getElementById('close-magazine-btn');
    
    // Setup import button
    newImportBtn.addEventListener('click', (e) => {
      console.log('📁 Import button CLICKED!');
      e.stopPropagation();
      e.preventDefault();
      this.importImages();
    });
    
    // Setup close button
    newCloseBtn.addEventListener('click', (e) => {
      console.log('🔴 Close button CLICKED!');
      e.stopPropagation();
      e.preventDefault();
      
      const magazine = document.getElementById('imageMagazine');
      if (magazine) {
        magazine.style.display = 'none';
        magazine.classList.add('hidden');
        console.log('✅ Magazine closed via close button');
      }
    });
    
    // Button style 1: Clean text-only buttons (no frame, no background)
    newImportBtn.style.cssText = `
      background: transparent;
      color: #fff;
      border: none;
      font-weight: bold;
      font-size: 12px;
      padding: 4px 8px;
      cursor: pointer;
      transition: color 0.2s;
      outline: none;
    `;
    
    newCloseBtn.style.cssText = `
      background: transparent;
      color: #fff;
      border: none;
      font-weight: bold;
      font-size: 16px;
      padding: 4px 8px;
      cursor: pointer;
      transition: color 0.2s;
      outline: none;
      min-width: 20px;
      text-align: center;
    `;
    
    // Add hover effects (color change only)
    newImportBtn.addEventListener('mouseenter', () => { newImportBtn.style.color = '#ccc'; });
    newImportBtn.addEventListener('mouseleave', () => { newImportBtn.style.color = '#fff'; });
    newCloseBtn.addEventListener('mouseenter', () => { newCloseBtn.style.color = '#ccc'; });
    newCloseBtn.addEventListener('mouseleave', () => { newCloseBtn.style.color = '#fff'; });
    
    console.log('✅ Image magazine buttons setup complete');
    console.log('🔍 Buttons now have normal styling and hover effects');
  }

  setupMagazineDrag() {
    console.log('🔧 Setting up magazine drag functionality...');
    
    const magazine = document.getElementById('imageMagazine');
    const header = magazine.querySelector('.image-magazine-header');
    
    if (!header) {
      console.log('⚠️ Magazine header not found for drag setup');
      return;
    }
    
    // Add triple spacer line at the top as visual drag handle
    const dragHandle = document.createElement('div');
    dragHandle.style.cssText = `
      height: 12px;
      background: repeating-linear-gradient(
        to bottom,
        #444 0px,
        #444 2px,
        transparent 2px,
        transparent 4px
      );
      margin-bottom: 8px;
      cursor: move;
      user-select: none;
    `;
    
    // Insert drag handle at the top of the header
    header.insertBefore(dragHandle, header.firstChild);
    
    // Make header draggable with improved event handling
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    // Prevent text selection during drag
    const preventSelection = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    header.addEventListener('mousedown', (e) => {
      console.log('🖱️ Mouse down on header - starting drag');
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // Get current position using getBoundingClientRect for accurate positioning
      const rect = magazine.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      
      header.style.cursor = 'grabbing';
      
      // Prevent text selection and other default behaviors
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent text selection during drag
      document.addEventListener('selectstart', preventSelection);
      document.addEventListener('dragstart', preventSelection);
      
      return false;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      // Prevent text selection during drag
      e.preventDefault();
      e.stopPropagation();
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Update magazine position
      const newLeft = startLeft + deltaX;
      const newTop = startTop + deltaY;
      
      magazine.style.left = newLeft + 'px';
      magazine.style.top = newTop + 'px';
      magazine.style.transform = 'none'; // Remove center transform when dragging
      
      console.log('🖱️ Dragging magazine to:', { x: newLeft, y: newTop });
    });
    
    document.addEventListener('mouseup', (e) => {
      if (isDragging) {
        console.log('🖱️ Mouse up - stopping drag');
        isDragging = false;
        header.style.cursor = 'move';
        
        // Remove text selection prevention
        document.removeEventListener('selectstart', preventSelection);
        document.removeEventListener('dragstart', preventSelection);
      }
    });
    
    // Set initial cursor style and prevent text selection
    header.style.cursor = 'move';
    header.style.userSelect = 'none';
    header.style.webkitUserSelect = 'none';
    header.style.mozUserSelect = 'none';
    header.style.msUserSelect = 'none';
    
    console.log('✅ Magazine drag functionality setup complete');
    console.log('🔍 Click and drag the header (including double lines) to move the magazine');
  }

  createImageMagazine() {
    const magazine = document.createElement('div');
    magazine.id = 'imageMagazine';
    magazine.className = 'image-magazine-only';
    magazine.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      height: 500px;
      background: var(--bg);
      border: 1px solid var(--border);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
    `;
    
    // Header with import button
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg);
      color: var(--fg);
      cursor: move;
      user-select: none;
    `;
    
    // Make header draggable
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = magazine.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      header.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      magazine.style.left = (startLeft + deltaX) + 'px';
      magazine.style.top = (startTop + deltaY) + 'px';
      magazine.style.transform = 'none'; // Remove center transform when dragging
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        header.style.cursor = 'move';
      }
    });
    
    const importBtn = document.createElement('button');
    importBtn.textContent = '📁 Import';
    importBtn.type = 'button';
    importBtn.style.cssText = `
      font-weight: bold;
      color: #fff;
      cursor: pointer;
      font-size: 12px;
      padding: 4px 8px;
      background: #555;
      border-radius: 3px;
      transition: background 0.2s;
      z-index: 10001;
      position: relative;
      border: 1px solid #666;
      outline: none;
      font-family: inherit;
    `;
    
    // Multiple event listeners for maximum compatibility
    importBtn.addEventListener('click', (e) => {
      console.log('📁 Import button CLICKED via click event!');
      e.stopPropagation();
      e.preventDefault();
      this.importImages();
    });
    
    importBtn.addEventListener('mousedown', (e) => {
      console.log('📁 Import button CLICKED via mousedown event!');
      e.stopPropagation();
      e.preventDefault();
      this.importImages();
    });
    
    importBtn.addEventListener('mouseup', (e) => {
      console.log('📁 Import button CLICKED via mouseup event!');
      e.stopPropagation();
      e.preventDefault();
      this.importImages();
    });
    
    importBtn.addEventListener('mouseenter', () => { 
      console.log('📁 Import button hover enter');
      importBtn.style.background = '#666'; 
    });
    importBtn.addEventListener('mouseleave', () => { 
      console.log('📁 Import button hover leave');
      importBtn.style.background = '#555'; 
    });
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.type = 'button';
    closeBtn.style.cssText = `
      color: #fff;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      padding: 4px 8px;
      background: #555;
      border-radius: 3px;
      transition: background 0.2s;
      z-index: 10001;
      position: relative;
      border: 1px solid #666;
      min-width: 20px;
      text-align: center;
      outline: none;
      font-family: inherit;
    `;
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = '#666'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = '#555'; });
    // Multiple event listeners for maximum compatibility
    closeBtn.addEventListener('click', (e) => {
      console.log('🔴 Close button CLICKED via click event!');
      e.stopPropagation(); // Prevent event bubbling
      e.preventDefault(); // Prevent any default button behavior
      
      // Force close the magazine
      const magazineToClose = document.getElementById('imageMagazine');
      if (magazineToClose) {
        magazineToClose.style.display = 'none';
        magazineToClose.classList.add('hidden');
        console.log('✅ Magazine closed via close button');
      } else {
        console.log('⚠️ Magazine not found for closing');
      }
    });
    
    closeBtn.addEventListener('mousedown', (e) => {
      console.log('🔴 Close button CLICKED via mousedown event!');
      e.stopPropagation();
      e.preventDefault();
      
      const magazineToClose = document.getElementById('imageMagazine');
      if (magazineToClose) {
        magazineToClose.style.display = 'none';
        magazineToClose.classList.add('hidden');
        console.log('✅ Magazine closed via close button (mousedown)');
      }
    });
    
    closeBtn.addEventListener('mouseup', (e) => {
      console.log('🔴 Close button CLICKED via mouseup event!');
      e.stopPropagation();
      e.preventDefault();
      
      const magazineToClose = document.getElementById('imageMagazine');
      if (magazineToClose) {
        magazineToClose.style.display = 'none';
        magazineToClose.classList.add('hidden');
        console.log('✅ Magazine closed via close button (mouseup)');
      }
    });
    
    header.appendChild(importBtn);
    header.appendChild(closeBtn);
    
    // Emergency button test
    console.log('🔍 Import button created:', importBtn);
    console.log('🔍 Close button created:', closeBtn);
    console.log('🔍 Import button text:', importBtn.textContent);
    console.log('🔍 Close button text:', closeBtn.textContent);
    console.log('🔍 Import button type:', importBtn.type);
    console.log('🔍 Close button type:', closeBtn.type);
    console.log('🔍 Import button tagName:', importBtn.tagName);
    console.log('🔍 Close button tagName:', closeBtn.tagName);
    
    // Test button properties
    console.log('🔍 Import button disabled:', importBtn.disabled);
    console.log('🔍 Close button disabled:', closeBtn.disabled);
    console.log('🔍 Import button style.display:', importBtn.style.display);
    console.log('🔍 Close button style.display:', closeBtn.style.display);
    console.log('🔍 Import button style.visibility:', importBtn.style.visibility);
    console.log('🔍 Close button style.visibility:', importBtn.style.visibility);
    console.log('🔍 Import button style.pointerEvents:', closeBtn.style.pointerEvents);
    
    // Emergency test - add onclick attributes as backup
    importBtn.setAttribute('onclick', 'alert("Import button clicked via onclick attribute!"); console.log("Import via onclick");');
    closeBtn.setAttribute('onclick', 'alert("Close button clicked via onclick attribute!"); console.log("Close via onclick");');
    
    console.log('🔍 Emergency onclick attributes added to buttons');
    
    // Emergency visual test - make buttons very obvious
    importBtn.style.border = '3px solid red';
    importBtn.style.background = 'yellow';
    importBtn.style.color = 'black';
    importBtn.style.fontSize = '16px';
    importBtn.style.fontWeight = 'bold';
    
    closeBtn.style.border = '3px solid blue';
    closeBtn.style.background = 'cyan';
    closeBtn.style.color = 'black';
    closeBtn.style.fontSize = '16px';
    closeBtn.style.fontWeight = 'bold';
    
    console.log('🔍 Emergency visual styling applied - buttons should be VERY obvious now!');
    
    // Content area
    const content = document.createElement('div');
    content.id = 'imageGallery';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
      align-content: start;
    `;
    
    magazine.appendChild(header);
    magazine.appendChild(content);
    
    console.log('🔍 About to append magazine to document.body...');
    console.log('🔍 document.body exists:', !!document.body);
    console.log('🔍 document.body children count:', document.body.children.length);
    
    document.body.appendChild(magazine);
    
    console.log('🔍 Magazine added to DOM:', magazine);
    console.log('🔍 Magazine parent:', magazine.parentNode);
    console.log('🔍 Magazine parent is body:', magazine.parentNode === document.body);
    console.log('🔍 Magazine computed styles:', window.getComputedStyle(magazine));
    console.log('🔍 Magazine offsetParent:', magazine.offsetParent);
    console.log('🔍 Magazine offsetWidth/Height:', magazine.offsetWidth, magazine.offsetHeight);
    
    // Start hidden
    magazine.style.display = 'none';
    magazine.classList.add('hidden');
    
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
        color: #888;
        padding: 20px 10px;
        font-size: 12px;
      `;
      noImages.innerHTML = `
        <p>No images found</p>
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
        width: 84px;
        height: 84px;
        border: 1px solid #444;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s;
        background: #2a2a2a;
        position: relative;
        margin: 0 auto;
      `;
      
      const img = document.createElement('img');
      img.src = `assets/${filename}`;
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      `;
      
      item.appendChild(img);
      
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
    
    // Create magazine-style image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    imageContainer.style.cssText = `
      float: left;
      margin-right: 16px;
      margin-bottom: 12px;
      max-width: 200px;
      clear: both;
    `;
    
    // Create image element
    const img = document.createElement('img');
    img.src = `assets/${filename}`;
    img.style.cssText = `
      width: 100%;
      height: auto;
      border: 1px solid var(--border);
      border-radius: 0;
      margin: 0;
      padding: 0;
      cursor: pointer;
      display: block;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    `;
    
    // Add hover effects
    img.addEventListener('mouseenter', () => {
      img.style.transform = 'scale(1.02)';
      img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    img.addEventListener('mouseleave', () => {
      img.style.transform = 'scale(1)';
      img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });
    
    // Add image to container
    imageContainer.appendChild(img);
    
    // Insert the image first
    let inserted = false;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Check if selection is within the post content area
      if (visualEditor.contains(range.commonAncestorContainer) || 
          visualEditor === range.commonAncestorContainer) {
        range.insertNode(imageContainer);
        range.collapse(false);
        inserted = true;
        console.log('✅ Image inserted at cursor position');
      }
    }
    
    if (!inserted) {
      // No selection, insert at the end of the post content
      visualEditor.appendChild(imageContainer);
      console.log('✅ Image inserted at end of post');
    }
    
    // Add positioning overlay functionality
    this.addImagePositioningOverlay(imageContainer);
    
    console.log('✅ Image inserted:', filename);
  }

  addImagePositioningOverlay(imageContainer) {
    // Create positioning overlay
    const overlay = document.createElement('div');
    overlay.className = 'image-position-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 1000;
      pointer-events: none;
    `;
    
    overlay.innerHTML = `
      <button class="pos-btn pos-left" style="
        background: var(--accent);
        color: var(--btn-text-color);
        border: none;
        border-radius: 0;
        padding: 6px 10px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
        pointer-events: auto;
      ">&lt;</button>
      <button class="pos-btn pos-center" style="
        background: var(--accent);
        color: var(--btn-text-color);
        border: none;
        border-radius: 0;
        padding: 6px 10px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
        pointer-events: auto;
      ">|</button>
      <button class="pos-btn pos-right" style="
        background: var(--accent);
        color: var(--btn-text-color);
        border: none;
        border-radius: 0;
        padding: 6px 10px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
        pointer-events: auto;
      ">&gt;</button>
    `;
    
    // Add overlay to image container
    imageContainer.style.position = 'relative';
    imageContainer.appendChild(overlay);
    
    // Show overlay on mouseenter
    imageContainer.addEventListener('mouseenter', () => {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';
    });
    
    // Hide overlay on mouseleave
    imageContainer.addEventListener('mouseleave', () => {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    });
    
    // Add click handlers for positioning
    const leftBtn = overlay.querySelector('.pos-left');
    const centerBtn = overlay.querySelector('.pos-center');
    const rightBtn = overlay.querySelector('.pos-right');
    
    // Left positioning (float left)
    leftBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageContainer.style.cssText = `
        position: relative;
        float: left;
        margin-right: 16px;
        margin-bottom: 12px;
        max-width: 200px;
        clear: both;
      `;
      console.log('✅ Image positioned left');
    });
    
    // Center positioning (centered, no float)
    centerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageContainer.style.cssText = `
        position: relative;
        float: none;
        margin: 0 auto 16px auto;
        max-width: 200px;
        clear: both;
        text-align: center;
      `;
      console.log('✅ Image positioned center');
    });
    
    // Right positioning (float right)
    rightBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageContainer.style.cssText = `
        position: relative;
        float: right;
        margin-left: 16px;
        margin-bottom: 12px;
        max-width: 200px;
        clear: both;
      `;
      console.log('✅ Image positioned right');
    });
  }

  showImagePositioningControls(imageContainer) {
    console.log('🔧 showImagePositioningControls called with:', imageContainer);
    
    // Create positioning controls window
    const controlsWindow = document.createElement('div');
    controlsWindow.className = 'image-positioning-controls';
    controlsWindow.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 0;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10001;
      font-family: inherit;
      min-width: 200px;
      text-align: center;
    `;
    
    controlsWindow.innerHTML = `
      <div style="margin-bottom: 16px; font-weight: bold; color: var(--fg);">Image Position</div>
      <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 16px;">
        <button id="pos-left" style="
          padding: 8px 12px;
          background: var(--accent);
          color: var(--btn-text-color);
          border: none;
          border-radius: 0;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          transition: background 0.2s;
        ">Left</button>
        <button id="pos-center" style="
          padding: 8px 12px;
          background: var(--accent);
          color: var(--btn-text-color);
          border: none;
          border-radius: 0;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          transition: background 0.2s;
        ">Center</button>
        <button id="pos-right" style="
          padding: 8px 12px;
          background: var(--accent);
          color: var(--btn-text-color);
          border: none;
          border-radius: 0;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          transition: background 0.2s;
        ">Right</button>
      </div>
      <div style="font-size: 11px; color: var(--muted); margin-bottom: 12px;">
        Choose how the image flows with text
      </div>
      <button id="pos-close" style="
        padding: 6px 12px;
        background: var(--muted);
        color: var(--btn-text-color);
        border: none;
        border-radius: 0;
        cursor: pointer;
        font-family: inherit;
        font-size: 11px;
        transition: background 0.2s;
      ">Close</button>
    `;
    
    // Add to document
    document.body.appendChild(controlsWindow);
    console.log('🔧 Controls window added to document');
    
    // Position controls near the image
    const imageRect = imageContainer.getBoundingClientRect();
    controlsWindow.style.left = (imageRect.left + imageRect.width / 2) + 'px';
    controlsWindow.style.top = (imageRect.top - 100) + 'px';
    controlsWindow.style.transform = 'translateX(-50%)';
    
    // Add event listeners
    const leftBtn = controlsWindow.querySelector('#pos-left');
    const centerBtn = controlsWindow.querySelector('#pos-center');
    const rightBtn = controlsWindow.querySelector('#pos-right');
    const closeBtn = controlsWindow.querySelector('#pos-close');
    
    // Left positioning (default - float left)
    leftBtn.addEventListener('click', () => {
      imageContainer.style.cssText = `
        float: left;
        margin-right: 16px;
        margin-bottom: 12px;
        max-width: 200px;
        clear: both;
      `;
      controlsWindow.remove();
      console.log('✅ Image positioned left');
    });
    
    // Center positioning (centered, no float)
    centerBtn.addEventListener('click', () => {
      imageContainer.style.cssText = `
        float: none;
        margin: 0 auto 16px auto;
        max-width: 200px;
        clear: both;
        text-align: center;
      `;
      controlsWindow.remove();
      console.log('✅ Image positioned center');
    });
    
    // Right positioning (float right)
    rightBtn.addEventListener('click', () => {
      imageContainer.style.cssText = `
        float: right;
        margin-left: 16px;
        margin-bottom: 12px;
        max-width: 200px;
        clear: both;
      `;
      controlsWindow.remove();
      console.log('✅ Image positioned right');
    });
    
    // Close button
    closeBtn.addEventListener('click', () => {
      controlsWindow.remove();
      console.log('✅ Image positioning controls closed');
    });
    
    // Close when clicking outside
    const outsideClickHandler = (e) => {
      if (!controlsWindow.contains(e.target) && !imageContainer.contains(e.target)) {
        controlsWindow.remove();
        document.removeEventListener('click', outsideClickHandler);
      }
    };
    
    // Delay adding the outside click handler to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('click', outsideClickHandler);
    }, 100);
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      if (controlsWindow.parentNode) {
        controlsWindow.remove();
        document.removeEventListener('click', outsideClickHandler);
      }
    }, 10000);
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
        // Check if this is an edit to provide better default commit message
        const editData = localStorage.getItem('editPostData');
        let defaultMessage = `Publish: ${postTitle}`;
        
        if (editData) {
          try {
            const editPost = JSON.parse(editData);
            defaultMessage = `Update post: ${postTitle}`;
          } catch (error) {
            console.warn('⚠️ Could not parse edit data for commit message:', error);
          }
        }
        
        const commitMessage = input.value.trim() || defaultMessage;
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
      // Get GitHub token first
      const githubToken = localStorage.getItem('github_token');
      if (!githubToken) {
        console.log('🔐 No GitHub token found, redirecting to login');
        this.showGitHubLogin();
        return;
      }
      
      // Check if user is authenticated
      const isAuthenticated = await this.checkAuthentication();
      if (!isAuthenticated) {
        console.log('🔐 User not authenticated, redirecting to login');
        this.showGitHubLogin();
        return;
      }
      
      // Create post data
      const postData = {
        slug: title.toLowerCase().replace(/[^a-z0-9]/gi, '-'),
        title: title,
        date: new Date().toISOString().split('T')[0].replace(/-/g, '-'),
        keywords: this.currentPostFlags || 'general',
        content: content
      };
      
      console.log('📝 Post data prepared:', postData);
      
      // Check if this is an edit (check for existing post data)
      const editData = localStorage.getItem('editPostData');
      let isEdit = false;
      let originalSlug = '';
      let currentSha = null;
      
      if (editData) {
        try {
          const editPost = JSON.parse(editData);
          originalSlug = editPost.slug;
          isEdit = true;
          console.log('✏️ This is an edit of existing post:', originalSlug);
          
          // For edits, we need to get the current SHA of the post file
          try {
            const postResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${originalSlug}.json`, {
              headers: {
                'Authorization': `token ${githubToken}`,
              }
            });
            
            if (postResponse.ok) {
              const postData = await postResponse.json();
              currentSha = postData.sha;
              console.log('✅ Got current SHA for edit:', currentSha);
            } else {
              console.warn('⚠️ Could not get current SHA for edit:', postResponse.status);
            }
          } catch (error) {
            console.warn('⚠️ Error getting current SHA for edit:', error);
          }
        } catch (error) {
          console.warn('⚠️ Could not parse edit data:', error);
        }
      }
      
      // Check for duplicate posts (if not editing the same post)
      if (!isEdit || postData.slug !== originalSlug) {
        const duplicatePost = await this.checkForDuplicatePost(postData.slug);
        if (duplicatePost) {
          console.log('⚠️ Duplicate post detected:', duplicatePost);
          const shouldOverwrite = await this.showOverwriteConfirmation(postData.title, duplicatePost.title);
          if (!shouldOverwrite) {
            console.log('❌ User cancelled overwrite');
            return;
          }
          console.log('✅ User confirmed overwrite');
          // Use the SHA from the duplicate post if we're overwriting
          currentSha = duplicatePost.sha;
        }
      }
      
      // Token already retrieved at function start
      
      // Handle slug changes during edits
      if (isEdit && originalSlug !== postData.slug) {
        console.log('🔄 Slug changed during edit, deleting old file first');
        
        // Delete the old file
        if (currentSha) {
          const deleteResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${originalSlug}.json`, {
            method: 'DELETE',
            headers: {
              'Authorization': `token ${githubToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Delete old post file (slug changed): ${originalSlug}`,
              sha: currentSha,
              branch: 'main'
            })
          });
          
          if (deleteResponse.ok) {
            console.log('✅ Old post file deleted successfully');
          } else {
            console.warn('⚠️ Failed to delete old post file:', deleteResponse.status);
          }
        }
        
        // Reset SHA since we're creating a new file
        currentSha = null;
      }
      
      // Create post file content
      const postContent = JSON.stringify(postData, null, 2);
      
      // Publish directly to GitHub using GitHub API
      const requestBody = {
        message: commitMessage,
        content: btoa(postContent), // Base64 encode content
        branch: 'main'
      };
      
      // Include SHA if we have it (for edits or overwrites)
      if (currentSha) {
        requestBody.sha = currentSha;
        console.log('🔧 Including SHA for update:', currentSha);
      } else {
        console.log('🔧 No SHA available - creating new file');
      }
      
      console.log('📤 Publishing with request body:', requestBody);
      
      const response = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${postData.slug}.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        console.log('✅ Post published successfully to GitHub');
        
        // Update posts index
        const indexUpdated = await this.updatePostsIndex(postData);
        
        if (indexUpdated) {
          // Clear edit data after successful publish
          if (isEdit) {
            localStorage.removeItem('editPostData');
            console.log('🧹 Edit data cleared after successful publish');
          }
          
          // Refresh the posts list
          await this.loadPosts();
          
          this.showMenuStyle1Message(`🎉 Post published successfully!\n\nTitle: ${title}\nSlug: ${postData.slug}\n\nYour post is now live on GitHub!`, 'success');
          
          // Redirect to the published post after a short delay
          setTimeout(() => {
            window.location.href = `index.html?post=${postData.slug}`;
          }, 3000);
        } else {
          this.showMenuStyle1Message('⚠️ Post published but index update failed. Navigation may not show the new post.', 'warning');
        }
      } else {
        const error = await response.json();
        console.error('❌ Failed to publish post:', error);
        
        // Provide more specific error messages for common issues
        let errorMessage = error.message || 'Unknown error';
        if (error.message && error.message.includes('sha')) {
          errorMessage = 'SHA missing or invalid. This usually happens when editing a post. Please try refreshing and editing again.';
        } else if (error.message && error.message.includes('already exists')) {
          errorMessage = 'A file with this name already exists. Please choose a different title or overwrite the existing post.';
        }
        
        this.showMenuStyle1Message(`❌ Failed to publish post: ${errorMessage}`, 'error');
      }
      
    } catch (error) {
      console.error('❌ Error publishing post:', error);
      this.showMenuStyle1Message('Error publishing post. Please check your connection and try again.', 'error');
    }
  }

  async updatePostsIndex(postData) {
    try {
      const githubConfig = localStorage.getItem('githubConfig');
      if (!githubConfig) {
        console.warn('⚠️ updatePostsIndex: No GitHub config found');
        return false;
      }
      
      const config = JSON.parse(githubConfig);
      const token = config.token;
      
      if (!token) {
        console.warn('⚠️ updatePostsIndex: No GitHub token found');
        return false;
      }
      
      // Check if this is an edit
      const editData = localStorage.getItem('editPostData');
      let isEdit = false;
      let originalSlug = '';
      
      if (editData) {
        try {
          const editPost = JSON.parse(editData);
          originalSlug = editPost.slug;
          isEdit = true;
        } catch (error) {
          console.warn('⚠️ Could not parse edit data:', error);
        }
      }
      
      // Get current index
      const indexResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts/index.json', {
        headers: {
          'Authorization': `token ${token}`,
        }
      });
      
      if (indexResponse.ok) {
        const indexData = await indexResponse.json();
        const currentIndex = JSON.parse(atob(indexData.content));
        
        if (isEdit && originalSlug !== postData.slug) {
          // Handle slug change during edit - remove old entry and add new one
          const filteredIndex = currentIndex.filter(post => post.slug !== originalSlug);
          filteredIndex.unshift({
            slug: postData.slug,
            title: postData.title,
            date: postData.date,
            keywords: postData.keywords
          });
          
          // Update index file
          await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/index.json`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Update post (slug changed): ${postData.title}`,
              content: btoa(JSON.stringify(filteredIndex, null, 2)),
              sha: indexData.sha,
              branch: 'main'
            })
          });
          
          console.log('✅ Posts index updated (slug changed)');
          this.posts = filteredIndex;
        } else if (isEdit) {
          // Handle regular edit - update existing entry
          const existingIndex = currentIndex.findIndex(post => post.slug === postData.slug);
          if (existingIndex !== -1) {
            currentIndex[existingIndex] = {
              slug: postData.slug,
              title: postData.title,
              date: postData.date,
              keywords: postData.keywords
            };
          } else {
            // Fallback: add new entry if not found
            currentIndex.unshift({
              slug: postData.slug,
              title: postData.title,
              date: postData.date,
              keywords: postData.keywords
            });
          }
          
          // Update index file
          await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/index.json`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Update post: ${postData.title}`,
              content: btoa(JSON.stringify(currentIndex, null, 2)),
              sha: indexData.sha,
              branch: 'main'
            })
          });
          
          console.log('✅ Posts index updated (edit)');
          this.posts = currentIndex;
        } else {
          // Handle new post - add new entry
          currentIndex.unshift({
            slug: postData.slug,
            title: postData.title,
            date: postData.date,
            keywords: postData.keywords
          });
          
          // Update index file
          await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/index.json`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Add post: ${postData.title}`,
              content: btoa(JSON.stringify(currentIndex, null, 2)),
              sha: indexData.sha,
              branch: 'main'
            })
          });
          
          console.log('✅ Posts index updated (new post)');
          this.posts = currentIndex;
        }
        
        return true;
      }
    } catch (error) {
      console.error('❌ Error updating posts index:', error);
    }
  }

  async checkAuthentication() {
    try {
      const githubConfig = localStorage.getItem('githubConfig');
      if (!githubConfig) {
        return false;
      }
      
      const config = JSON.parse(githubConfig);
      const token = config.token;
      
      if (!token) {
        return false;
      }
      
      // Verify token by making a test API call
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Check if user is the admin (pigeonPious)
        return userData.login === 'pigeonPious';
      }
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
    }
    return false;
  }

  async deletePost(slug) {
    try {
      const githubConfig = localStorage.getItem('githubConfig');
      if (!githubConfig) {
        console.warn('⚠️ deletePost: No GitHub config found');
        return false;
      }
      
      const config = JSON.parse(githubConfig);
      const token = config.token;
      
      if (!token) {
        console.warn('⚠️ deletePost: No GitHub token found');
        return false;
      }
      
      // First, get the current SHA of the post file
      const postResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${slug}.json`, {
        headers: {
          'Authorization': `token ${token}`,
        }
      });
      
      if (!postResponse.ok) {
        console.error('❌ deletePost: Post file not found:', postResponse.status);
        return false;
      }
      
      const postData = await postResponse.json();
      
      // Delete the post file
      const deleteResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${slug}.json`, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Delete post: ${slug}`,
          sha: postData.sha,
          branch: 'main'
        })
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Post file deleted successfully');
        
        // Now update the index to remove the deleted post
        const indexUpdated = await this.removePostFromIndex(slug);
        if (indexUpdated) {
          console.log('✅ Post removed from index successfully');
        } else {
          console.warn('⚠️ Failed to remove post from index');
        }
        
        return true;
      } else {
        console.error('❌ deletePost: Failed to delete post file:', deleteResponse.status);
        return false;
      }
    } catch (error) {
      console.error('❌ deletePost: Error deleting post:', error);
      return false;
    }
  }

  async removePostFromIndex(slug) {
    try {
      const githubConfig = localStorage.getItem('githubConfig');
      if (!githubConfig) {
        console.warn('⚠️ removePostFromIndex: No GitHub config found');
        return false;
      }
      
      const config = JSON.parse(githubConfig);
      const token = config.token;
      
      if (!token) {
        console.warn('⚠️ removePostFromIndex: No GitHub token found');
        return false;
      }
      
      // Get current index
      const indexResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts/index.json', {
        headers: {
          'Authorization': `token ${token}`,
        }
      });
      
      if (indexResponse.ok) {
        const indexData = await indexResponse.json();
        let currentIndex = [];
        
        try {
          currentIndex = JSON.parse(atob(indexData.content));
          if (!Array.isArray(currentIndex)) {
            currentIndex = [];
          }
        } catch (parseError) {
          console.warn('⚠️ removePostFromIndex: Could not parse existing index');
          return false;
        }
        
        // Remove the post with the specified slug
        const filteredIndex = currentIndex.filter(post => post.slug !== slug);
        
        // Update index file
        const updateResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/index.json`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Update posts index - Remove post: ${slug}`,
            content: btoa(JSON.stringify(filteredIndex, null, 2)),
            sha: indexData.sha,
            branch: 'main'
          })
        });
        
        if (updateResponse.ok) {
          console.log('✅ Post removed from index successfully');
          return true;
        } else {
          console.error('❌ removePostFromIndex: Failed to update index file:', updateResponse.status);
          return false;
        }
      } else {
        console.warn('⚠️ removePostFromIndex: Could not fetch current index');
        return false;
      }
    } catch (error) {
      console.error('❌ removePostFromIndex: Error removing post from index:', error);
      return false;
    }
  }

  shareToBluesky() {
    console.log('🔵 shareToBluesky: Starting Bluesky share...');
    
    try {
      // Get current post information
      const currentPost = this.currentPost;
      if (!currentPost || !currentPost.slug) {
        console.warn('⚠️ shareToBluesky: No current post found');
        this.showMenuStyle1Message('No post to share. Please navigate to a post first.', 'error');
        return;
      }
      
      // Get current URL with post hash
      const currentUrl = `${window.location.origin}${window.location.pathname}#${currentPost.slug}`;
      
      // Check for highlighted text - use preserved selection if available
      let shareText = '';
      let highlightedText = '';
      
      // First try to get from preserved selection
      if (this.currentSelection && this.currentSelection.text) {
        highlightedText = this.currentSelection.text.trim();
        console.log('🔵 shareToBluesky: Using preserved selection:', highlightedText);
      } else {
        // Fallback to current selection
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          highlightedText = selection.toString().trim();
          console.log('🔵 shareToBluesky: Using current selection:', highlightedText);
        }
      }
      
      if (highlightedText) {
        // Use highlighted text + post link
        shareText = `${highlightedText}\n\n${currentUrl}`;
        console.log('🔵 shareToBluesky: Using highlighted text + link');
      } else {
        // Use post title + link
        shareText = `${currentPost.title || 'Check out this post'}\n\n${currentUrl}`;
        console.log('🔵 shareToBluesky: Using post title + link');
      }
      
      // Create Bluesky share URL
      const blueskyUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`;
      
      console.log('🔵 shareToBluesky: Opening Bluesky compose:', blueskyUrl);
      console.log('🔵 shareToBluesky: Share text:', shareText);
      
      // Open in new tab
      window.open(blueskyUrl, '_blank');
      
      // Restore the selection after sharing
      if (this.currentSelection && this.currentSelection.range) {
        setTimeout(() => {
          try {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.currentSelection.range);
            console.log('🔵 shareToBluesky: Selection restored after sharing');
          } catch (error) {
            console.warn('⚠️ shareToBluesky: Could not restore selection:', error);
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('❌ shareToBluesky: Error sharing to Bluesky:', error);
      this.showMenuStyle1Message('Error sharing to Bluesky. Please try again.', 'error');
    }
  }

  shareToTwitter() {
    console.log('🐦 shareToTwitter: Starting Twitter share...');
    
    try {
      // Get current post information
      const currentPost = this.currentPost;
      if (!currentPost || !currentPost.slug) {
        console.warn('⚠️ shareToTwitter: No current post found');
        this.showMenuStyle1Message('No post to share. Please navigate to a post first.', 'error');
        return;
      }
      
      // Get current URL with post hash
      const currentUrl = `${window.location.origin}${window.location.pathname}#${currentPost.slug}`;
      
      // Check for highlighted text - use preserved selection if available
      let shareText = '';
      let highlightedText = '';
      
      // First try to get from preserved selection
      if (this.currentSelection && this.currentSelection.text) {
        highlightedText = this.currentSelection.text.trim();
        console.log('🐦 shareToTwitter: Using preserved selection:', highlightedText);
      } else {
        // Fallback to current selection
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          highlightedText = selection.toString().trim();
          console.log('🐦 shareToTwitter: Using current selection:', highlightedText);
        }
      }
      
      if (highlightedText) {
        // Use highlighted text + post link
        shareText = `${highlightedText}\n\n${currentUrl}`;
        console.log('🐦 shareToTwitter: Using highlighted text + link');
      } else {
        // Use post title + link
        // Twitter has character limits, so keep it concise
        const title = currentPost.title || 'Check out this post';
        shareText = `${title}\n\n${currentUrl}`;
        console.log('🐦 shareToTwitter: Using post title + link');
      }
      
      // Create Twitter share URL
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      
      console.log('🐦 shareToTwitter: Opening Twitter compose:', twitterUrl);
      console.log('🐦 shareToTwitter: Share text:', shareText);
      
      // Open in new tab
      window.open(twitterUrl, '_blank');
      
      // Restore the selection after sharing
      if (this.currentSelection && this.currentSelection.range) {
        setTimeout(() => {
          try {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.currentSelection.range);
            console.log('🐦 shareToTwitter: Selection restored after sharing');
          } catch (error) {
            console.warn('⚠️ shareToTwitter: Could not restore selection:', error);
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('❌ shareToTwitter: Error sharing to Twitter:', error);
      this.showMenuStyle1Message('Error sharing to Twitter. Please try again.', 'error');
    }
  }

  showGitHubLogin() {
    console.log('🔐 Showing GitHub token input...');
    
    // Create login modal in menu style 1
    const modal = document.createElement('div');
    modal.id = 'githubLoginModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: var(--menu-bg);
      border: 1px solid var(--border);
      padding: 20px;
      max-width: 400px;
      text-align: center;
    `;
    
    content.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: var(--menu-fg);">GitHub Personal Access Token</h3>
      <p style="color: var(--menu-fg); margin-bottom: 20px;">Enter your GitHub personal access token to publish posts.</p>
      <input type="password" id="githubTokenInput" placeholder="ghp_xxxxxxxxxxxx" style="
        width: 100%;
        padding: 8px;
        margin-bottom: 15px;
        border: 1px solid var(--border);
        background: var(--bg);
        color: var(--fg);
        font-family: monospace;
      ">
      <div style="margin-bottom: 15px;">
        <a href="https://github.com/settings/tokens" target="_blank" style="color: var(--link); font-size: 12px;">
          Create token at github.com/settings/tokens (needs repo scope)
        </a>
      </div>
      <button id="githubLoginBtn" style="
        background: #24292e;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        margin-right: 10px;
      ">Authenticate</button>
      <button id="closeLoginModal" style="
        background: transparent;
        color: var(--menu-fg);
        border: 1px solid var(--border);
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      ">Cancel</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Focus on input
    const tokenInput = document.getElementById('githubTokenInput');
    tokenInput.focus();
    
    // Add event listeners
    document.getElementById('githubLoginBtn').addEventListener('click', () => {
      this.authenticateWithToken();
    });
    
    document.getElementById('closeLoginModal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Handle Enter key
    tokenInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.authenticateWithToken();
      }
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  async authenticateWithToken() {
    const tokenInput = document.getElementById('githubTokenInput');
    const token = tokenInput.value.trim();
    
    if (!token) {
      alert('Please enter a GitHub token.');
      return;
    }
    
    try {
      // Test the token
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // Check if user is the admin
        if (userData.login === 'pigeonPious') {
          // Store token
          localStorage.setItem('github_token', token);
          console.log('✅ GitHub authentication successful');
          
          // Update UI
          this.updateAuthStatus(true);
          
          // Close modal
          const modal = document.getElementById('githubLoginModal');
          if (modal) {
            document.body.removeChild(modal);
          }
          
          alert('✅ GitHub authentication successful! You can now publish posts.');
        } else {
          alert('❌ Access denied. Only pigeonPious can authenticate as admin.');
        }
      } else {
        alert('❌ Invalid GitHub token. Please check your token and try again.');
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      alert('❌ Authentication failed. Please check your connection and try again.');
    }
  }

  // OAuth method removed - using direct token authentication instead

  loadSavedFlags() {
    const savedFlags = localStorage.getItem('current_post_flags');
    if (savedFlags) {
      this.currentPostFlags = savedFlags;
      console.log('🏷️ Loaded saved flags:', savedFlags);
    }
  }

  setupSelectionMonitoring() {
    console.log('📝 Setting up text selection monitoring...');
    
    // Store the last valid selection
    this.lastValidSelection = null;
    
    // Monitor selection changes
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString().trim();
        
        // Only store if there's actual selected text
        if (selectedText && range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
          this.lastValidSelection = {
            text: selectedText,
            range: range.cloneRange(),
            timestamp: Date.now()
          };
          console.log('📝 Selection captured:', selectedText);
        }
      }
    });
    
    console.log('✅ Text selection monitoring active');
  }

  setupHoverNotePreview() {
    console.log('👁️ Setting up hover note preview in editor...');
    
    // Find all note-link elements in the editor
    const noteLinks = document.querySelectorAll('.note-link');
    
    noteLinks.forEach(link => {
      // Remove existing listeners to prevent duplication
      link.removeEventListener('mouseenter', this.showHoverNotePreview);
      link.removeEventListener('mouseleave', this.hideHoverNotePreview);
      
      // Add hover event listeners
      link.addEventListener('mouseenter', (e) => this.showHoverNotePreview(e));
      link.addEventListener('mouseleave', () => this.hideHoverNotePreview());
    });
    
    console.log(`✅ Hover note preview setup for ${noteLinks.length} elements`);
  }

  async checkAndUpdateAuthStatus() {
    try {
      const isAuthenticated = await this.checkAuthentication();
      this.updateAuthStatus(isAuthenticated);
      
      // Check if we're returning from OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth') === 'success') {
        console.log('🔐 OAuth callback successful');
        this.updateAuthStatus(true);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      this.updateAuthStatus(false);
    }
  }

  updateAuthStatus(isAuthenticated) {
    const githubStatus = document.getElementById('github-status');
    if (githubStatus) {
      if (isAuthenticated) {
        githubStatus.textContent = 'connected';
        githubStatus.style.color = '#28a745';
      } else {
        githubStatus.textContent = 'not connected';
        githubStatus.style.color = '#dc3545';
      }
    }
    
    // Update underscore color based on GitHub connection status
    const githubUnderscore = document.getElementById('github-connect-underscore');
    if (githubUnderscore) {
      if (isAuthenticated) {
        githubUnderscore.style.color = '#28a745'; // Green when connected
      } else {
        githubUnderscore.style.color = '#fff'; // White when not connected
      }
    }
    
    // Update publish button availability
    const publishBtn = document.getElementById('publish-btn');
    if (publishBtn) {
      publishBtn.style.opacity = isAuthenticated ? '1' : '0.5';
      publishBtn.title = isAuthenticated ? 'Publish post to GitHub' : 'GitHub authentication required';
    }
  }

  showFlagsModal() {
    console.log('🏷️ Setting post flags/keywords...');
    
    // Get the flags button position for anchoring
    const flagsBtn = document.getElementById('keywords-btn');
    if (!flagsBtn) {
      console.log('⚠️ Flags button not found');
      return;
    }
    
    const btnRect = flagsBtn.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate position - anchor to button, adjust if near window edges
    let left = btnRect.left;
    let top = btnRect.bottom + 5;
    
    // Adjust horizontal position if too close to right edge
    if (left + 350 > windowWidth - 20) {
      left = windowWidth - 370; // 350px width + 20px margin
    }
    
    // Adjust if too close to left edge
    if (left < 20) {
      left = 20;
    }
    
    // Adjust vertical position if too close to bottom edge
    if (top + 50 > windowHeight - 20) {
      top = btnRect.top - 55; // Show above button instead
    }
    
    // Create menu style 1 input (as requested for all future popups)
    const inputBox = document.createElement('div');
    inputBox.className = 'menu-style-1-input';
    inputBox.style.cssText = `
      position: fixed;
      top: ${top}px;
      left: ${left}px;
      background: var(--menu-bg);
      border: 1px solid var(--border);
      padding: 8px 12px;
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
    
    // Set current flags if they exist
    const existingFlags = localStorage.getItem('current_post_flags') || '';
    if (existingFlags) {
      input.value = existingFlags;
      console.log('🏷️ Loaded existing flags:', existingFlags);
    }
    
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
    const postTitle = document.getElementById('postTitle')?.value || 'Untitled Post';
    
    // Parse flags for navigation menu
    const flagArray = flags.split(',').map(f => f.trim());
    const devlogFlags = flagArray.filter(f => f.startsWith('devlog:'));
    
    console.log('📋 Parsed flags:', { all: flagArray, devlog: devlogFlags });
    
    // Store in localStorage for persistence
    localStorage.setItem('current_post_flags', flags);
    
    // Update navigation menu with new flags
    this.updateNavigationMenu(flagArray);
    
    console.log('✅ Post flags saved:', flags);
  }

  updateNavigationMenu(flags) {
    console.log('🧭 Updating navigation menu with flags:', flags);
    
    // Get all posts to work with
    const allPosts = this.posts || [];
    console.log('🧭 Total posts available for navigation:', allPosts.length);
    
    // Update All Posts submenu
    this.updateAllPostsSubmenu(allPosts);
    
    // Update Projects submenu
    this.updateProjectsSubmenu(allPosts);
    
    console.log('✅ Navigation menu fully updated');
  }

  updateAllPostsSubmenu(allPosts) {
    console.log('📚 Updating All Posts submenu with', allPosts.length, 'posts');
    
    // Find the all posts menu item
    const allPostsMenu = document.querySelector('#all-posts-menu');
    if (!allPostsMenu) {
      console.log('⚠️ All Posts menu not found');
      return;
    }
    
    // Clear existing submenu
    const existingSubmenu = allPostsMenu.querySelector('.submenu');
    if (existingSubmenu) {
      existingSubmenu.remove();
    }
    
    if (allPosts.length === 0) {
      console.log('📋 No posts to show in All Posts submenu');
      return;
    }
    
    // Group posts by devlog category
    const groupedPosts = {};
    const generalPosts = [];
    
    allPosts.forEach(post => {
      if (post.keywords && post.keywords.includes('devlog')) {
        let category = 'devlog';
        if (post.keywords.includes('devlog:')) {
          const devlogMatch = post.keywords.match(/devlog:([^,]+)/);
          category = devlogMatch ? `devlog:${devlogMatch[1]}` : 'devlog';
        }
        
        if (!groupedPosts[category]) {
          groupedPosts[category] = [];
        }
        groupedPosts[category].push(post);
      } else {
        generalPosts.push(post);
      }
    });
    
    // Create submenu
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.style.cssText = `
      position: absolute;
      left: 100%;
      top: 0;
      background: var(--menu-bg, #333);
      border: 1px solid var(--menu-border, #555);
      padding: 5px 0;
      min-width: 250px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-radius: 4px;
    `;
    
    // Add invisible buffer zone around submenu for easier navigation
    const bufferZone = document.createElement('div');
    bufferZone.style.cssText = `
      position: absolute;
      left: -10px;
      top: -10px;
      right: -10px;
      bottom: -10px;
      z-index: 999;
      pointer-events: none;
    `;
    submenu.appendChild(bufferZone);
    
    // Add devlog category groups first
    Object.keys(groupedPosts).forEach(category => {
      const posts = groupedPosts[category];
      
      // Add category separator with label
      const categorySeparator = document.createElement('div');
      categorySeparator.className = 'category-separator';
      categorySeparator.style.cssText = `
        padding: 6px 12px;
        background: var(--menu-bg, #333);
        color: var(--accent-color, #4a9eff);
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid var(--accent-color, #4a9eff);
        border-top: 2px solid var(--accent-color, #4a9eff);
        text-shadow: 0 0 8px var(--accent-color, #4a9eff);
      `;
      categorySeparator.textContent = category;
      submenu.appendChild(categorySeparator);
      
              // Add posts in this category
        posts.forEach(post => {
          const postEntry = document.createElement('div');
          postEntry.className = 'menu-entry';
          postEntry.textContent = post.title || post.slug;
          postEntry.style.cssText = `
            padding: 8px 12px 8px 20px;
            cursor: pointer;
            color: var(--menu-fg, #fff);
            font-size: 13px;
            border-bottom: 1px solid var(--border, #555);
            background: var(--menu-bg, #333);
            transition: background-color 0.15s ease, transform 0.15s ease;
            border-radius: 2px;
          `;
          
          postEntry.addEventListener('click', () => {
            // Check if we're in the editor
            console.log('🔍 Current pathname:', window.location.pathname);
            console.log('🔍 Current href:', window.location.href);
            if (window.location.pathname.includes('editor.html') || window.location.href.includes('editor.html')) {
              console.log('📝 In editor - redirecting to main blog with post:', post.slug);
              // Redirect to main blog with the selected post
              window.location.href = `index.html?post=${post.slug}`;
            } else {
              console.log('🏠 On main blog - loading post normally:', post.slug);
              // We're on the main blog, load post normally
              this.loadPost(post.slug);
              this.closeAllMenus();
            }
          });
          
          // Add hover effects
          postEntry.addEventListener('mouseenter', () => {
            postEntry.style.background = 'var(--menu-hover-bg, #555)';
            postEntry.style.transform = 'translateX(2px)';
          });
          
          postEntry.addEventListener('mouseleave', () => {
            postEntry.style.background = 'var(--menu-bg, #333)';
            postEntry.style.transform = 'translateX(0)';
          });
          
          submenu.appendChild(postEntry);
        });
    });
    
    // Add general posts at the end (if any)
    if (generalPosts.length > 0) {
      // Add general separator
      const generalSeparator = document.createElement('div');
      generalSeparator.className = 'category-separator';
      generalSeparator.style.cssText = `
        padding: 6px 12px;
        background: var(--menu-bg, #333);
        color: var(--accent-color, #4a9eff);
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid var(--accent-color, #4a9eff);
        border-top: 2px solid var(--accent-color, #4a9eff);
        text-shadow: 0 0 8px var(--accent-color, #4a9eff);
      `;
      generalSeparator.textContent = 'general';
      submenu.appendChild(generalSeparator);
      
      // Add general posts
      generalPosts.forEach(post => {
        const postEntry = document.createElement('div');
        postEntry.className = 'menu-entry';
        postEntry.textContent = post.title || post.slug;
        postEntry.style.cssText = `
          padding: 8px 12px 8px 20px;
          cursor: pointer;
          color: var(--menu-fg, #fff);
          font-size: 13px;
          border-bottom: 1px solid var(--border, #555);
          background: var(--menu-bg, #333);
          transition: background-color 0.15s ease, transform 0.15s ease;
          border-radius: 2px;
        `;
        
        postEntry.addEventListener('click', () => {
          // Check if we're in the editor
          console.log('🔍 Current pathname:', window.location.pathname);
          console.log('🔍 Current href:', window.location.href);
          if (window.location.pathname.includes('editor.html') || window.location.href.includes('editor.html')) {
            console.log('📝 In editor - redirecting to main blog with post:', post.slug);
            // Redirect to main blog with the selected post
            window.location.href = `index.html?post=${post.slug}`;
          } else {
            console.log('🏠 On main blog - loading post normally:', post.slug);
            // We're on the main blog, load post normally
            this.loadPost(post.slug);
            this.closeAllMenus();
          }
        });
        
        // Add hover effects
        postEntry.addEventListener('mouseenter', () => {
          postEntry.style.background = 'var(--menu-hover-bg, #555)';
          postEntry.style.transform = 'translateX(2px)';
        });
        
        postEntry.addEventListener('mouseleave', () => {
          postEntry.style.background = 'var(--menu-bg, #333)';
          postEntry.style.transform = 'translateX(0)';
        });
        
        submenu.appendChild(postEntry);
      });
    }
    
    allPostsMenu.appendChild(submenu);
    
    // Add mouse leave handler to close entire submenu with buffer
    let closeTimeout = null;
    const closeSubmenu = () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
      closeTimeout = setTimeout(() => {
        if (!allPostsMenu.matches(':hover') && !submenu.matches(':hover')) {
          submenu.remove();
        }
      }, 300); // Increased buffer time to 300ms
    };
    
    // Also close when leaving the entire navigation area
    const navigationArea = document.querySelector('#navigation-menu');
    if (navigationArea) {
      navigationArea.addEventListener('mouseleave', () => {
        // Don't close submenus when leaving navigation area
        // This prevents interference with Level 3 menus
        return;
      });
    }
    
    // Cancel close timeout when mouse enters submenu
    submenu.addEventListener('mouseenter', () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    });
    
    allPostsMenu.addEventListener('mouseleave', closeSubmenu);
    submenu.addEventListener('mouseleave', closeSubmenu);
    
    console.log('✅ All Posts submenu updated with grouped posts:', Object.keys(groupedPosts).length, 'categories +', generalPosts.length, 'general posts');
  }

  updateProjectsSubmenu(allPosts) {
    console.log('📋 Updating Projects submenu');
    
    // Find the projects menu item
    const projectsMenu = document.querySelector('#projects-menu');
    if (!projectsMenu) {
      console.log('⚠️ Projects menu not found');
      return;
    }
    
    // Clear existing projects submenu
    const existingSubmenu = projectsMenu.querySelector('.submenu');
    if (existingSubmenu) {
      existingSubmenu.remove();
    }
    
    // Filter for devlog posts
    const devlogPosts = allPosts.filter(post => {
      const postFlags = post.keywords || '';
      return postFlags.includes('devlog');
    });
    
    if (devlogPosts.length === 0) {
      console.log('📋 No devlog posts found');
      return;
    }
    
    // Group posts by devlog subcategory
    const devlogCategories = {};
    devlogPosts.forEach(post => {
      const postFlags = post.keywords || '';
      const devlogFlag = postFlags.split(',').find(f => f.trim().startsWith('devlog:'));
      
      if (devlogFlag) {
        const category = devlogFlag.split(':')[1] || 'general';
        if (!devlogCategories[category]) {
          devlogCategories[category] = [];
        }
        devlogCategories[category].push(post);
      } else if (postFlags.includes('devlog')) {
        // General devlog posts without subcategory
        if (!devlogCategories['general']) {
          devlogCategories['general'] = [];
        }
        devlogCategories['general'].push(post);
      }
    });
    
    // Create submenu with categories
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.style.cssText = `
      position: absolute;
      left: 100%;
      top: 0;
      background: var(--menu-bg, #333);
      border: 1px solid var(--menu-border, #555);
      padding: 5px 0;
      min-width: 200px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-radius: 4px;
    `;
    
    // Track currently open sub-submenu globally
    if (!this.globalCurrentlyOpenSubSubmenu) {
      this.globalCurrentlyOpenSubSubmenu = null;
    }
    
    // Add category entries that expand on hover
    Object.keys(devlogCategories).forEach(category => {
      const posts = devlogCategories[category];
      
      // Create category entry
      const categoryEntry = document.createElement('div');
      categoryEntry.className = 'menu-entry category-entry';
      categoryEntry.textContent = `${category} >`;
      categoryEntry.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        color: var(--menu-fg, #fff);
        font-size: 13px;
        border-bottom: 1px solid var(--border, #555);
        background: var(--menu-bg, #333);
        transition: background-color 0.15s ease;
        text-transform: capitalize;
        position: relative;
      `;
      
      // Create sub-submenu for this category
      const subSubmenu = document.createElement('div');
      subSubmenu.className = 'sub-submenu';
      subSubmenu.style.cssText = `
        position: absolute;
        left: 100%;
        top: 0;
        background: var(--menu-bg, #333);
        border: 1px solid var(--menu-border, #555);
        padding: 5px 0;
        min-width: 200px;
        z-index: 1001;
        display: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border-radius: 4px;
      `;
      
      // Position the sub-submenu to align with its category entry
      const positionSubSubmenu = () => {
        // Get the category entry's position relative to the submenu
        const categoryTop = categoryEntry.offsetTop;
        subSubmenu.style.top = `${categoryTop}px`;
      };
      
      // Add posts to sub-submenu
      posts.forEach(post => {
        const postEntry = document.createElement('div');
        postEntry.className = 'menu-entry';
        postEntry.textContent = post.title || post.slug;
        postEntry.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          color: var(--menu-fg, #fff);
          font-size: 13px;
          border-bottom: 1px solid var(--border, #555);
          background: var(--menu-bg, #333);
          transition: background-color 0.15s ease;
        `;
        
        // Add hover effects
        postEntry.addEventListener('mouseenter', () => {
          postEntry.style.background = 'var(--menu-hover-bg, #555)';
        });
        
        postEntry.addEventListener('mouseleave', () => {
          postEntry.style.background = 'var(--menu-bg, #333)';
        });
        
        // Add click handler to load post
        postEntry.addEventListener('click', () => {
          // Check if we're in the editor
          if (window.location.pathname.includes('editor.html')) {
            // Redirect to main blog with the selected post
            window.location.href = `index.html?post=${post.slug}`;
          } else {
            // We're on the main blog, load post normally
            this.loadPost(post.slug);
            // Close only the projects submenu, not all menus
            if (submenu.parentNode) {
              submenu.remove();
              this.globalCurrentlyOpenSubSubmenu = null;
            }
          }
        });
        
        subSubmenu.appendChild(postEntry);
      });
      
      // EXACT LOGIC: Level 3 only closes when new level 3 opens, nothing to do with mouse position
      categoryEntry.addEventListener('mouseenter', () => {
        // Close previously open sub-submenu ONLY when opening a new one
        if (this.globalCurrentlyOpenSubSubmenu && this.globalCurrentlyOpenSubSubmenu !== subSubmenu) {
          this.globalCurrentlyOpenSubSubmenu.style.display = 'none';
        }
        
        // Position and open this sub-submenu
        positionSubSubmenu();
        subSubmenu.style.display = 'block';
        this.globalCurrentlyOpenSubSubmenu = subSubmenu;
      });
      
      // NO mouseleave events - level 3 stays open until explicitly closed
      
      // Add both to the main submenu
      submenu.appendChild(categoryEntry);
      submenu.appendChild(subSubmenu);
    });
    
    projectsMenu.appendChild(submenu);
    
    // ONLY close when clicking outside the entire menu system
    document.addEventListener('click', (e) => {
      if (!projectsMenu.contains(e.target) && !submenu.contains(e.target)) {
        submenu.remove();
        this.globalCurrentlyOpenSubSubmenu = null;
      }
    });
    
    // Prevent any other mouse events from closing the Level 3 menus
    // Level 3 only closes when: new category hovered, post clicked, or click outside
    submenu.addEventListener('mouseleave', (e) => {
      // Do nothing - let Level 3 stay open
      e.stopPropagation();
    });
    
    // Prevent navigation area mouseleave from closing Level 3
    const navigationArea = document.querySelector('.navigation-area');
    if (navigationArea) {
      const originalMouseLeave = navigationArea.onmouseleave;
      navigationArea.addEventListener('mouseleave', (e) => {
        // Don't close Level 3 menus when leaving navigation area
        e.stopPropagation();
      });
    }
    
    console.log('✅ Projects submenu updated: simplified logic, level 3 only closes on category change or click outside');
  }

  showDevlogPostsWindow(category, posts) {
    console.log(`📋 Opening devlog posts window for category: ${category} with ${posts.length} posts`);
    
    // Remove any existing devlog window
    const existingWindow = document.getElementById('devlog-posts-window');
    if (existingWindow) {
      existingWindow.remove();
    }
    
    // Create the floating window in menu style 1
    const window = document.createElement('div');
    window.id = 'devlog-posts-window';
    window.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--menu-bg, #333);
      border: 1px solid var(--border, #555);
      padding: 16px;
      min-width: 350px;
      max-width: 500px;
      max-height: 70vh;
      z-index: 10000;
      overflow-y: auto;
      font-family: inherit;
      cursor: move;
    `;
    
    // Create header with title and close button
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border, #555);
      cursor: move;
    `;
    
    const title = document.createElement('div');
    title.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Posts`;
    title.style.cssText = `
      margin: 0;
      color: var(--menu-fg, #fff);
      font-size: 16px;
      font-weight: bold;
      text-transform: capitalize;
    `;
    
    const closeButton = document.createElement('div');
    closeButton.className = 'close-button';
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      cursor: pointer;
      font-size: 20px;
      color: var(--menu-fg, #fff);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      transition: color 0.15s ease;
    `;
    
    // Add hover effect to close button
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.color = 'var(--danger-color, #dc3545)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.color = 'var(--menu-fg, #fff)';
    });
    
    // Close window when close button is clicked
    closeButton.addEventListener('click', () => {
      window.remove();
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    window.appendChild(header);
    
    // Create posts list
    const postsList = document.createElement('div');
    postsList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 2px;
    `;
    
    posts.forEach(post => {
      const postEntry = document.createElement('div');
      postEntry.className = 'post-entry';
      postEntry.style.cssText = `
        padding: 10px 12px;
        background: var(--menu-bg, #333);
        border: 1px solid var(--border, #555);
        cursor: pointer;
        transition: background-color 0.15s ease;
        color: var(--menu-fg, #fff);
        font-size: 13px;
        line-height: 1.3;
      `;
      
      const postTitle = document.createElement('div');
      postTitle.textContent = post.title || post.slug;
      postTitle.style.cssText = `
        font-weight: normal;
        margin-bottom: 2px;
      `;
      
      const postDate = document.createElement('div');
      postDate.textContent = post.date || 'No date';
      postDate.style.cssText = `
        color: var(--muted, #888);
        font-size: 11px;
        font-style: italic;
      `;
      
      postEntry.appendChild(postTitle);
      postEntry.appendChild(postDate);
      
      // Add hover effect
      postEntry.addEventListener('mouseenter', () => {
        postEntry.style.background = 'var(--menu-hover-bg, #555)';
      });
      
      postEntry.addEventListener('mouseleave', () => {
        postEntry.style.background = 'var(--menu-bg, #333)';
      });
      
      // Add click handler to load post
      postEntry.addEventListener('click', () => {
        // Check if we're in the editor
        if (window.location.pathname.includes('editor.html')) {
          // Redirect to main blog with the selected post
          window.location.href = `index.html?post=${post.slug}`;
        } else {
          // We're on the main blog, load post normally
          this.loadPost(post.slug);
          window.remove();
        }
      });
      
      postsList.appendChild(postEntry);
    });
    
    window.appendChild(postsList);
    
    // Add to document
    document.body.appendChild(window);
    
    // Make entire window draggable (not just header)
    this.makeWindowDraggable(window);
    
    // Close window on escape key
    const closeOnEscape = (e) => {
      if (e.key === 'Escape') {
        window.remove();
        document.removeEventListener('keydown', closeOnEscape);
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    
    console.log(`✅ Devlog posts window opened for ${category} with ${posts.length} posts`);
  }

  makeWindowDraggable(window) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    // Make entire window draggable
    window.addEventListener('mousedown', (e) => {
      // Don't start dragging if clicking on close button or post entries
      if (e.target.closest('.close-button') || e.target.closest('.post-entry')) {
        return;
      }
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = window.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      
      window.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newLeft = startLeft + deltaX;
      const newTop = startTop + deltaY;
      
      // Keep window within viewport bounds
      const maxLeft = window.innerWidth - window.offsetWidth;
      const maxTop = window.innerHeight - window.offsetHeight;
      
      const clampedLeft = Math.max(0, Math.min(newLeft, maxLeft));
      const clampedTop = Math.max(0, Math.min(newTop, maxTop));
      
      window.style.left = `${clampedLeft}px`;
      window.style.top = `${clampedTop}px`;
      window.style.transform = 'none';
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        window.style.cursor = 'move';
      }
    });
  }

  toggleConsole() {
    console.log('Console toggle - implement as needed');
  }

  setupHoverNotes() {
    console.log('📝 Setting up hover notes...');
    
    // Find all elements with data-note attribute (including .note-link and .pigeon-label)
    const noteElements = document.querySelectorAll('[data-note]');
    
    noteElements.forEach(element => {
      // Remove existing listeners to prevent duplication
      element.removeEventListener('mouseenter', this.showHoverNote);
      element.removeEventListener('mouseleave', this.hideHoverNote);
      element.removeEventListener('mousemove', this.updateHoverNotePosition);
      
      // Add hover event listeners
      element.addEventListener('mouseenter', (e) => this.showHoverNote(e));
      element.addEventListener('mouseleave', () => this.hideHoverNote());
      element.addEventListener('mousemove', (e) => this.updateHoverNotePosition(e));
    });
    
    console.log(`✅ Hover notes setup for ${noteElements.length} elements`);
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
    
    tooltip.textContent = noteText;
    tooltip.style.display = 'block';
    
    // Position tooltip with boundary detection
    this.positionHoverNote(tooltip, event);
  }

  positionHoverNote(tooltip, event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const offset = 10;
    
    // Get tooltip dimensions (need to make it visible first to measure)
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = mouseX + offset;
    let top = mouseY - tooltipHeight - offset;
    
    // Check right boundary - if tooltip would go off screen, position to the left of cursor
    if (left + tooltipWidth > viewportWidth) {
      left = mouseX - tooltipWidth - offset;
    }
    
    // Check left boundary - if still off screen, align to left edge
    if (left < 0) {
      left = 5;
    }
    
    // Check top boundary - if tooltip would go off screen, position below cursor
    if (top < 0) {
      top = mouseY + offset;
    }
    
    // Check bottom boundary - if tooltip would go off screen, position above cursor
    if (top + tooltipHeight > viewportHeight) {
      top = mouseY - tooltipHeight - offset;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  updateHoverNotePosition(event) {
    const tooltip = document.getElementById('hoverNote');
    if (tooltip && tooltip.style.display === 'block') {
      this.positionHoverNote(tooltip, event);
    }
  }

  hideHoverNote() {
    const tooltip = document.getElementById('hoverNote');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  showHoverNotePreview(event) {
    const link = event.target;
    const noteText = link.getAttribute('data-note');
    
    if (!noteText) return;
    
    // Create or update hover note preview tooltip (menu style 2)
    let tooltip = document.getElementById('hoverNotePreview');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'hoverNotePreview';
      tooltip.style.cssText = `
        position: fixed;
        z-index: 1000;
        pointer-events: none;
        background: var(--menu-bg);
        border: 1px solid var(--border);
        padding: 4px 6px;
        font-size: 11px;
        color: var(--menu-fg);
        display: none;
        font-family: inherit;
        line-height: 1.3;
        white-space: pre-wrap;
        word-wrap: break-word;
      `;
      document.body.appendChild(tooltip);
    }
    
    // Calculate width based on text length
    const textWidth = Math.min(noteText.length * 6, 100); // 6px per character, max 100px
    tooltip.style.width = `${textWidth}px`;
    tooltip.textContent = noteText;
    tooltip.style.display = 'block';
    
    // Position tooltip with boundary detection (same as regular hover notes)
    this.positionHoverNote(tooltip, event);
  }

  hideHoverNotePreview() {
    const tooltip = document.getElementById('hoverNotePreview');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  showMenuStyle1Message(message, type = 'info') {
    // Remove any existing message
    const existingMessage = document.getElementById('menuStyle1Message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create message container in menu style 1
    const messageContainer = document.createElement('div');
    messageContainer.id = 'menuStyle1Message';
    messageContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg);
      border: 1px solid var(--border);
      padding: 16px 20px;
      font-family: inherit;
      font-size: 14px;
      color: var(--fg);
      z-index: 10000;
      max-width: 400px;
      text-align: center;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.4;
    `;

    // Add type-specific styling
    if (type === 'success') {
      messageContainer.style.borderColor = 'var(--success-color, #28a745)';
      messageContainer.style.color = 'var(--success-color, #28a745)';
    } else if (type === 'error') {
      messageContainer.style.borderColor = 'var(--danger-color, #dc3545)';
      messageContainer.style.color = 'var(--danger-color, #dc3545)';
    }

    messageContainer.textContent = message;
    document.body.appendChild(messageContainer);

    // Auto-remove after 5 seconds for success, 8 seconds for errors
    const autoRemoveDelay = type === 'success' ? 5000 : 8000;
    setTimeout(() => {
      if (messageContainer.parentNode) {
        messageContainer.remove();
      }
    }, autoRemoveDelay);

    // Click to dismiss
    messageContainer.addEventListener('click', () => {
      messageContainer.remove();
    });

    // Add cursor pointer to indicate it's clickable
    messageContainer.style.cursor = 'pointer';
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

  editCurrentPost() {
    console.log('✏️ editCurrentPost called');
    
    // Check if user is authenticated
    if (!this.isAuthenticated) {
      console.log('🔐 User not authenticated, redirecting to login');
      this.showGitHubLogin();
      return;
    }
    
    // Get current post data
    const currentPost = this.currentPost;
    if (!currentPost || !currentPost.slug) {
      console.log('⚠️ No current post to edit');
      this.showMenuStyle1Message('No post currently loaded to edit.', 'error');
      return;
    }
    
    console.log('✏️ Editing post:', currentPost);
    
    // Store post data for editor
    localStorage.setItem('editPostData', JSON.stringify({
      slug: currentPost.slug,
      title: currentPost.title,
      content: currentPost.content,
      keywords: currentPost.keywords,
      date: currentPost.date
    }));
    
    // Redirect to editor
    window.location.href = 'editor.html';
  }

  async checkForDuplicatePost(slug) {
    console.log('🔍 Checking for duplicate post:', slug);
    
    try {
      // Check if post exists on GitHub
      const response = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${slug}.json`);
      if (response.ok) {
        const postData = await response.json();
        const content = JSON.parse(atob(postData.content));
        return {
          slug: slug,
          title: content.title || slug,
          sha: postData.sha
        };
      }
      return null; // No duplicate found
    } catch (error) {
      console.warn('⚠️ Error checking for duplicate post:', error);
      return null;
    }
  }

  async showOverwriteConfirmation(newTitle, existingTitle) {
    console.log('⚠️ Showing overwrite confirmation for:', { newTitle, existingTitle });
    
    return new Promise((resolve) => {
      // Create menu style 1 confirmation popup
      const confirmBox = document.createElement('div');
      confirmBox.className = 'menu-style-1-confirm';
      confirmBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--menu-bg);
        border: 1px solid var(--border);
        padding: 16px 20px;
        z-index: 10000;
        min-width: 400px;
        text-align: center;
      `;
      
      const message = document.createElement('div');
      message.style.cssText = `
        color: var(--menu-fg);
        font-size: 14px;
        margin-bottom: 16px;
        line-height: 1.4;
      `;
      message.innerHTML = `A post with the same name already exists:<br><br><strong>${existingTitle}</strong><br><br>Do you want to overwrite it?<br><br>Press <strong>Y</strong> to confirm or <strong>N</strong> to cancel`;
      
      confirmBox.appendChild(message);
      document.body.appendChild(confirmBox);
      
      // Handle keyboard input
      const handleKeyPress = (e) => {
        if (e.key.toLowerCase() === 'y') {
          confirmBox.remove();
          document.removeEventListener('keydown', handleKeyPress);
          resolve(true);
        } else if (e.key.toLowerCase() === 'n') {
          confirmBox.remove();
          document.removeEventListener('keydown', handleKeyPress);
          resolve(false);
        }
      };
      
      document.addEventListener('keydown', handleKeyPress);
      confirmBox.focus();
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (confirmBox.parentNode) {
          confirmBox.remove();
          document.removeEventListener('keydown', handleKeyPress);
          resolve(false);
        }
      }, 10000);
    });
  }

  loadEditData() {
    console.log('📝 Checking for edit data...');
    
    const editData = localStorage.getItem('editPostData');
    if (!editData) {
      console.log('📝 No edit data found');
      return;
    }
    
    try {
      const editPost = JSON.parse(editData);
      console.log('📝 Loading edit data:', editPost);
      
      // Populate the form fields
      const titleField = document.getElementById('postTitle');
      const contentField = document.getElementById('visualEditor');
      
      if (titleField && editPost.title) {
        titleField.value = editPost.title;
        console.log('📝 Title populated:', editPost.title);
      }
      
      if (contentField && editPost.content) {
        contentField.innerHTML = editPost.content;
        console.log('📝 Content populated:', editPost.content);
      }
      
      // Set flags if available
      if (editPost.keywords) {
        this.currentPostFlags = editPost.keywords;
        localStorage.setItem('current_post_flags', editPost.keywords);
        console.log('📝 Flags set:', editPost.keywords);
      }
      
      // Clear the edit data after loading
      localStorage.removeItem('editPostData');
      console.log('📝 Edit data loaded and cleared');
      
      // Show success message
      this.showMenuStyle1Message(`Editing post: ${editPost.title}`, 'success');
      
    } catch (error) {
      console.error('❌ Error loading edit data:', error);
      localStorage.removeItem('editPostData'); // Clear invalid data
    }
  }

  // Cleanup method to prevent memory leaks
  destroy() {
    console.log('🧹 Cleaning up SimpleBlog...');
    
    // Remove event listeners
    const allPostsMenu = document.getElementById('all-posts-menu');
    if (allPostsMenu && this.allPostsMouseEnterHandler) {
      allPostsMenu.removeEventListener('mouseenter', this.allPostsMouseEnterHandler);
    }
    
    const projectsMenu = document.getElementById('projects-menu');
    if (projectsMenu && this.projectsMouseEnterHandler) {
      projectsMenu.removeEventListener('mouseenter', this.projectsMouseEnterHandler);
    }
    
    // Remove global event listeners
    document.removeEventListener('click', this.globalClickHandler);
    document.removeEventListener('keydown', this.globalKeyHandler);
    
    console.log('✅ Cleanup complete');
  }

  // ========== NEW EDIT MENU FUNCTIONS ==========



  showFontSizeWindow() {
    console.log('🔤 Opening font size window...');
    
    // Check if window already exists
    const existingWindow = document.getElementById('fontSizeWindow');
    if (existingWindow) {
      existingWindow.remove();
    }
    
    // Get current font size
    let currentSize = localStorage.getItem('fontSize') || '13';
    currentSize = parseInt(currentSize);
    
    // Create menu style 2 window
    const fontWindow = document.createElement('div');
    fontWindow.id = 'fontSizeWindow';
    fontWindow.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--menu-bg);
      color: var(--menu-fg);
      border: 1px solid var(--border);
      padding: 20px;
      z-index: 10000;
      font-family: monospace;
      font-size: 13px;
      min-width: 200px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    
    fontWindow.innerHTML = `
      <div style="margin-bottom: 15px; font-weight: bold;">Font Size</div>
      <div style="margin-bottom: 15px;">Current: ${currentSize}px</div>
      <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 15px;">
        <button id="font-decrease" style="
          background: var(--menu-bg);
          color: var(--menu-fg);
          border: 1px solid var(--border);
          padding: 8px 16px;
          cursor: pointer;
          font-family: monospace;
          font-size: 16px;
          font-weight: bold;
        ">-</button>
        <button id="font-increase" style="
          background: var(--menu-bg);
          color: var(--menu-fg);
          border: 1px solid var(--border);
          padding: 8px 16px;
          cursor: pointer;
          font-family: monospace;
          font-size: 16px;
          font-weight: bold;
        ">+</button>
      </div>
      <div style="font-size: 11px; color: var(--muted); margin-bottom: 10px;">Press + or - keys</div>
      <button id="font-close" style="
        background: var(--menu-bg);
        color: var(--menu-fg);
        border: 1px solid var(--border);
        padding: 6px 12px;
        cursor: pointer;
        font-family: monospace;
        font-size: 11px;
      ">Close</button>
    `;
    
    document.body.appendChild(fontWindow);
    
    // Add button event listeners
    const decreaseBtn = document.getElementById('font-decrease');
    const increaseBtn = document.getElementById('font-increase');
    const closeBtn = document.getElementById('font-close');
    
    decreaseBtn.addEventListener('click', () => {
      this.adjustFontSize('smaller');
      this.updateFontSizeDisplay();
    });
    
    increaseBtn.addEventListener('click', () => {
      this.adjustFontSize('larger');
      this.updateFontSizeDisplay();
    });
    
    closeBtn.addEventListener('click', () => {
      fontWindow.remove();
      document.removeEventListener('keydown', this.fontSizeKeyHandler);
    });
    
    // Add keyboard support
    this.fontSizeKeyHandler = (e) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        this.adjustFontSize('larger');
        this.updateFontSizeDisplay();
      } else if (e.key === '-') {
        e.preventDefault();
        this.adjustFontSize('smaller');
        this.updateFontSizeDisplay();
      } else if (e.key === 'Escape') {
        fontWindow.remove();
        document.removeEventListener('keydown', this.fontSizeKeyHandler);
      }
    };
    
    document.addEventListener('keydown', this.fontSizeKeyHandler);
    
    // Close on outside click
    setTimeout(() => {
      const outsideClick = (e) => {
        if (!fontWindow.contains(e.target)) {
          fontWindow.remove();
          document.removeEventListener('click', outsideClick);
          document.removeEventListener('keydown', this.fontSizeKeyHandler);
        }
      };
      document.addEventListener('click', outsideClick);
    }, 100);
    
    console.log('✅ Font size window opened');
  }
  
  updateFontSizeDisplay() {
    const currentSize = localStorage.getItem('fontSize') || '13';
    const sizeDisplay = document.querySelector('#fontSizeWindow div:nth-child(2)');
    if (sizeDisplay) {
      sizeDisplay.textContent = `Current: ${currentSize}px`;
    }
  }

  adjustFontSize(action) {
    console.log(`🔤 Adjusting font size: ${action}`);
    
    const contentElement = document.getElementById('post-content');
    if (!contentElement) {
      console.log('⚠️ No post content found');
      return;
    }
    
    let currentSize = localStorage.getItem('fontSize') || '13';
    currentSize = parseInt(currentSize);
    
    switch (action) {
      case 'smaller':
        currentSize = Math.max(10, currentSize - 1);
        break;
      case 'larger':
        currentSize = Math.min(24, currentSize + 1);
        break;
      case 'reset':
        currentSize = 13;
        break;
    }
    
    // Apply font size to post content specifically
    contentElement.style.fontSize = currentSize + 'px';
    localStorage.setItem('fontSize', currentSize.toString());
    
    console.log(`✅ Font size set to ${currentSize}px`);
  }

  quickEdit() {
    console.log('✏️ Opening quick edit...');
    
    const currentPost = this.currentPost;
    if (!currentPost) {
      alert('No post currently loaded to edit');
      return;
    }
    
    // Store edit data and redirect to editor
    localStorage.setItem('editPostData', JSON.stringify(currentPost));
    window.location.href = 'editor.html';
  }

  showCategoryManager() {
    console.log('🗂️ Opening category manager...');
    
    // Create modal for category management
    const modal = document.createElement('div');
    modal.className = 'category-manager-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: var(--menu-bg);
      color: var(--menu-fg);
      padding: 20px;
      border: 1px solid var(--border);
      min-width: 400px;
      max-height: 70vh;
      overflow-y: auto;
    `;
    
    content.innerHTML = `
      <h3>Category Manager</h3>
      <p>Manage post categories and devlog projects:</p>
      <div id="category-list">Loading categories...</div>
      <div style="margin-top: 20px;">
        <button onclick="this.closest('.category-manager-modal').remove()" style="background: var(--menu-bg); color: var(--menu-fg); border: 1px solid var(--border); padding: 5px 10px; cursor: pointer;">Close</button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Load categories
    this.loadCategories();
  }

  showDraftManager() {
    console.log('📝 Opening draft manager...');
    
    // Create modal for draft management
    const modal = document.createElement('div');
    modal.className = 'draft-manager-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: var(--menu-bg);
      color: var(--menu-fg);
      padding: 20px;
      border: 1px solid var(--border);
      min-width: 400px;
      max-height: 70vh;
      overflow-y: auto;
    `;
    
    content.innerHTML = `
      <h3>Draft Manager</h3>
      <p>Manage your saved drafts:</p>
      <div id="draft-list">Loading drafts...</div>
      <div style="margin-top: 20px;">
        <button onclick="this.closest('.draft-manager-modal').remove()" style="background: var(--menu-bg); color: var(--menu-fg); border: 1px solid var(--border); padding: 5px 10px; cursor: pointer;">Close</button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Load drafts
    this.loadDrafts();
  }

  importPost() {
    console.log('📥 Importing post...');
    
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const postData = JSON.parse(e.target.result);
          
          // Populate editor with imported data
          const titleInput = document.getElementById('postTitle');
          const contentEditor = document.getElementById('visualEditor');
          
          if (titleInput) titleInput.value = postData.title || '';
          if (contentEditor) contentEditor.innerHTML = postData.content || '';
          
          // Set flags if they exist
          if (postData.keywords) {
            localStorage.setItem('current_post_flags', postData.keywords);
          }
          
          console.log('✅ Post imported successfully');
          this.showMenuStyle1Message('Post imported successfully!', 'success');
          
        } catch (error) {
          console.error('❌ Error importing post:', error);
          this.showMenuStyle1Message('Error importing post. Please check the file format.', 'error');
        }
      };
      
      reader.readAsText(file);
    };
    
    fileInput.click();
  }

  async saveDraft() {
    console.log('💾 Saving draft...');
    
    const token = localStorage.getItem('github_token');
    if (!token) {
      this.showMenuStyle1Message('GitHub connection required to save drafts', 'error');
      return;
    }
    
    // Get current post data
    const titleInput = document.getElementById('postTitle');
    const contentEditor = document.getElementById('visualEditor');
    const flags = localStorage.getItem('current_post_flags') || '';
    
    if (!titleInput || !contentEditor) {
      this.showMenuStyle1Message('Editor not found', 'error');
      return;
    }
    
    const title = titleInput.value.trim() || 'Untitled Draft';
    const content = contentEditor.innerHTML.trim();
    
    if (!content) {
      this.showMenuStyle1Message('Cannot save empty draft', 'error');
      return;
    }
    
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    const draftData = {
      slug: slug,
      title: title,
      date: new Date().toISOString().split('T')[0],
      category: 'draft',
      keywords: flags,
      content: content,
      isDraft: true,
      savedAt: new Date().toISOString()
    };
    
    try {
      // Save to GitHub in drafts folder
      const repo = localStorage.getItem('github_repo') || 'pigeonPious/page';
      const filename = `draft-${slug}-${Date.now()}.json`;
      const path = `drafts/${filename}`;
      
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Save draft: ${title}`,
          content: btoa(JSON.stringify(draftData, null, 2))
        })
      });
      
      if (response.ok) {
        console.log('✅ Draft saved successfully');
        this.showMenuStyle1Message('Draft saved successfully!', 'success');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      this.showMenuStyle1Message('Error saving draft. Please check your connection.', 'error');
    }
  }

  async loadCategories() {
    // Implementation for loading and displaying categories
    const categoryList = document.getElementById('category-list');
    if (categoryList) {
      categoryList.innerHTML = 'Category management features coming soon...';
    }
  }

  async loadDrafts() {
    // Implementation for loading and displaying drafts
    const draftList = document.getElementById('draft-list');
    if (draftList) {
      draftList.innerHTML = 'Draft management features coming soon...';
    }
  }

  initializeFontSize() {
    const savedSize = localStorage.getItem('fontSize');
    if (savedSize) {
      document.body.style.fontSize = savedSize + 'px';
      console.log(`🔤 Font size restored to ${savedSize}px`);
    }
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
