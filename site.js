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
    
    // Try to load cached posts first for immediate submenu access
    const cachedPosts = localStorage.getItem('posts');
    if (cachedPosts) {
      try {
        this.posts = JSON.parse(cachedPosts);
        console.log('📚 Loaded', this.posts.length, 'cached posts for immediate submenu access');
      } catch (error) {
        console.warn('⚠️ Could not parse cached posts:', error);
        localStorage.removeItem('posts');
      }
    }
    
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
      
      // Check for stored current post (for page reloads)
      if (!postSlug && !hashSlug) {
        const storedCurrentPost = localStorage.getItem('current_post_slug');
        if (storedCurrentPost) {
          console.log(`🔄 Reloading with stored current post: ${storedCurrentPost}`);
          this.loadPost(storedCurrentPost);
        } else {
          // No stored post, no URL params - load most recent post
          if (this.posts && this.posts.length > 0) {
            const mostRecent = this.posts[0]; // Already sorted by date
            console.log(`📚 No stored post, loading most recent: ${mostRecent.title}`);
            this.loadPost(mostRecent.slug);
          }
        }
      }
      
      // Show site map by default after posts are loaded (only in blog mode)
      if (!window.location.pathname.includes('editor.html')) {
        setTimeout(() => {
          // Only show site map automatically if user hasn't manually toggled it or hidden it
          if (!this.siteMapManuallyToggled && !this.siteMapManuallyHidden) {
            this.showSiteMap();
          }
        }, 500);
      } else {
        console.log('🗺️ Site map not shown (editor mode)');
      }
      
      // Load and display projects in menu
      this.loadAndDisplayProjects();
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
              <div class="menu-entry" id="random-post">Random Post</div>
              <div class="menu-separator"></div>
              <div class="menu-entry" id="show-site-map">Site Map</div>
            </div>
          </div>
          
          <div class="menu-item" data-menu="projects">
            <div class="label">Projects</div>
            <div class="menu-dropdown" id="projects-dropdown">
      
            </div>
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

    // Insert at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', taskbarHTML);
    console.log('✅ Taskbar created');
    
    // Bind events after taskbar is in the DOM
    this.bindEventListener(document.getElementById('about-btn'), 'click', (e) => { e.preventDefault(); this.loadPost('about'); });
    this.bindEventListener(document.getElementById('contact-btn'), 'click', (e) => { e.preventDefault(); this.loadPost('contact'); });
    this.bindEventListener(document.getElementById('logout-btn'), 'click', () => { this.logout(); });
  }

  // Helper Methods
  bindEventListener(element, event, handler) {
    if (element) {
      element.addEventListener(event, handler);
    }
  }

  // Logout functionality
  logout() {
    console.log('Logging out...');
    
    // Check if this was called from console
    const isFromConsole = new Error().stack?.includes('executeCommand') || false;
    
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_oauth_token');
    localStorage.removeItem('github_token_type');
    
    // Hide logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.style.display = 'none';
    }
    
    // Update GitHub status
    const underscore = document.getElementById('github-connect-underscore');
    if (underscore) {
      underscore.textContent = '_';
      underscore.style.color = '#fff';
    }
    
    console.log('Logged out successfully');
    
    // If called from console, provide feedback
    if (isFromConsole) {
      this.printToConsole('✅ Logged out of GitHub successfully');
    }
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
      const token = localStorage.getItem('github_token');
      if (!token) {
        alert('No GitHub token found in localStorage');
        return;
      }
      
      console.log('Testing GitHub token...');
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
        }
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
    
    // Menu colors for consistent styling - use CSS variables from stylesheets
    // These will be overridden by theme-specific CSS rules
    root.style.setProperty('--muted', '#888888');
    root.style.setProperty('--border', '#555555');
    
    console.log('✅ CSS variables setup complete');
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
    
    // Star button (toggle sitemap)
    this.addClickHandler('#star-button', () => {
      console.log('⭐ Star button clicked - toggling sitemap');
      this.toggleSiteMap();
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
    
    // Force reindex button
    this.addClickHandler('#force-reindex-button', () => {
      console.log('🔄 Force reindex button clicked');
      this.forceReindexPosts();
    });
    
    // Check rate limit button
    this.addClickHandler('#check-rate-limit', () => {
      console.log('📊 Check rate limit button clicked');
      this.checkRateLimit();
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

  this.addClickHandler('#open-draft-btn', () => {
    console.log('📁 Open Draft button clicked');
    this.showDraftsModal();
  });

  this.addClickHandler('#keywords-btn', () => {
    console.log('🏷️ Flags button clicked');
    this.showFlagsModal();
  });

  this.addClickHandler('#open-console-btn', () => {
    console.log('🖥️ Console button clicked');
    this.showConsole();
  });

    // Open in GitHub button
    this.addClickHandler('#open-in-github', () => {
      console.log('Open in GitHub button clicked');
      this.openCurrentPostInGitHub();
    });





    // Editor mode toggle (Raw/Preview)
    this.addClickHandler('#toggle-editor-mode', () => {
      console.log('📝 Editor mode toggle clicked');
      this.toggleEditorMode();
    });

    // GitHub connect button (old - will be removed from menu)
    this.addClickHandler('#github-connect', () => {
      console.log('GitHub connect button clicked');
      this.showGitHubLogin();
    });
    
    // GitHub connect underscore
    this.addClickHandler('#github-connect-underscore', () => {
      console.log('GitHub connect underscore clicked');
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

    // Site Map button
    this.addClickHandler('#show-site-map', () => {
      console.log('🗺️ Site Map button clicked');
      this.showSiteMap();
    });

    // Build indicator - no click handler needed, only changes on actual builds
    // this.addClickHandler('#build-indicator', () => {
    //   console.log('🔧 Build indicator clicked - incrementing build');
    //   this.incrementBuildWord();
    // });
    

    

    
    this.addClickHandler('#test-github-token', () => {
      console.log('Test GitHub token button clicked');
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
      
      // Setup title field event listener for new posts
      this.setupTitleFieldListener();
    }
  }

  setupSubmenus() {
    console.log('🔧 Setting up submenus...');
    
    // Global menu manager - ensures only one menu open at each level
    this.closeOtherLevel1Menus = (currentMenu) => {
      const allLevel1Menus = ['all-posts-menu'];
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
    
    // Close other main menus when one is opened
    this.closeOtherMainMenus = (currentMenu) => {
      const allMainMenus = ['navigation', 'projects', 'view', 'connect'];
      allMainMenus.forEach(menuId => {
        if (menuId !== currentMenu) {
          const menu = document.querySelector(`[data-menu="${menuId}"]`);
          if (menu) {
            const dropdown = menu.querySelector('.menu-dropdown');
            if (dropdown) {
              dropdown.classList.remove('open');
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
      allPostsMenu.removeEventListener('click', this.allPostsClickHandler);
      
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
      
      this.allPostsClickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('📚 All posts submenu clicked');
        
        // Close other level 1 menus first
        this.closeOtherLevel1Menus('all-posts-menu');
        
        // Toggle submenu - close if open, open if closed
        const existingSubmenu = allPostsMenu.querySelector('.submenu');
        if (existingSubmenu) {
          existingSubmenu.remove();
        } else {
          this.showAllPostsSubmenu(allPostsMenu);
        }
      };
      
      allPostsMenu.addEventListener('mouseenter', this.allPostsMouseEnterHandler);
      allPostsMenu.addEventListener('mouseleave', this.allPostsMouseLeaveHandler);
      allPostsMenu.addEventListener('click', this.allPostsClickHandler);
      console.log('✅ All posts submenu handler attached');
    } else {
      console.warn('⚠️ All posts menu element not found');
    }





    
    console.log('✅ Submenus setup complete with menu hierarchy management');
  }





  // Helper function to display posts in submenus with category labels
  displayPostsInSubmenu(submenu, posts) {
    // Clear any existing content
    submenu.innerHTML = '';
    
    // Add invisible buffer zone around submenu for easier navigation
    const bufferZone = document.createElement('div');
    bufferZone.style.cssText = `
      position: absolute;
      left: -10px;
      top: -10px;
      right: -10px;
      bottom: -10px;
      z-index: 9999;
      pointer-events: none;
    `;
    submenu.appendChild(bufferZone);
    
    // Add post entries with category grouping
    if (posts && posts.length > 0) {
      // Group posts by categories (flags)
      const categories = {};
      const uncategorized = [];
      
      posts.forEach((post) => {
        if (!post || !post.slug) {
          return;
        }
        
        if (post.keywords && post.keywords.trim()) {
          // Split flags by comma and process each one
          const flags = post.keywords.split(',').map(f => f.trim()).filter(f => f.length > 0);
          
          flags.forEach(flag => {
            // Capitalize first letter of the flag
            let displayName = flag.charAt(0).toUpperCase() + flag.slice(1).toLowerCase();
            
            if (!categories[displayName]) {
              categories[displayName] = [];
            }
            
            // Only add post if it's not already in this category
            if (!categories[displayName].find(p => p.slug === post.slug)) {
              categories[displayName].push(post);
            }
          });
        } else {
          uncategorized.push(post);
        }
      });
      
      // Display categorized posts
      Object.keys(categories).sort().forEach(category => {
        const postsInCategory = categories[category];
        
        // Add category label
        const categoryLabel = document.createElement('div');
        categoryLabel.className = 'menu-entry category-label';
        categoryLabel.textContent = `└─ ${category}`;
        categoryLabel.style.cssText = `
          padding: 1px 12px;
          color: var(--fg, #acada8);
          font-size: 10px;
          font-weight: normal;
          cursor: default;
          pointer-events: none;
          margin-top: 4px;
          margin-bottom: 1px;
          opacity: 0.7;
        `;
        submenu.appendChild(categoryLabel);
        
        // Add posts in this category
        postsInCategory.sort((a, b) => (a.title || '').localeCompare(b.title || '')).forEach((post) => {
          const entry = document.createElement('div');
          entry.className = 'menu-entry';
          entry.textContent = `   ├─ ${post.title || 'Untitled'}`;
          entry.style.cssText = `
            padding: 1px 12px 1px 20px;
            cursor: pointer; 
            color: var(--menu-fg, #fff);
            transition: background-color 0.15s ease;
            border-radius: 3px;
            margin: 0.25px 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
            font-size: 11px;
          `;
          
          entry.title = `Click to load: ${post.title} (${post.slug})`;
          
          entry.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.location.pathname.includes('editor.html')) {
              window.location.href = `index.html?post=${post.slug}`;
            } else {
              this.loadPost(post.slug);
            }
          });
          
          submenu.appendChild(entry);
        });
      });
      
      // Display uncategorized posts if any
      if (uncategorized.length > 0) {
        // Add uncategorized label
        const uncategorizedLabel = document.createElement('div');
        uncategorizedLabel.className = 'menu-entry category-label';
        uncategorizedLabel.textContent = `└─ Uncategorized`;
        uncategorizedLabel.style.cssText = `
          padding: 1px 12px;
          color: var(--fg, #acada8);
          font-size: 10px;
          font-weight: normal;
          cursor: default;
          pointer-events: none;
          margin-top: 4px;
          margin-bottom: 1px;
          opacity: 0.7;
        `;
        submenu.appendChild(uncategorizedLabel);
        
        // Add uncategorized posts
        uncategorized.sort((a, b) => (a.title || '').localeCompare(b.title || '')).forEach((post) => {
          const entry = document.createElement('div');
          entry.className = 'menu-entry';
          entry.textContent = `   ├─ ${post.title || 'Untitled'}`;
          entry.style.cssText = `
            padding: 1px 12px 1px 20px;
            cursor: pointer; 
            color: var(--menu-fg, #fff);
            transition: background-color 0.15s ease;
            border-radius: 3px;
            margin: 0.25px 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
            font-size: 11px;
          `;
          
          entry.title = `Click to load: ${post.title} (${post.slug})`;
          
          entry.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.location.pathname.includes('editor.html')) {
              window.location.href = `index.html?post=${post.slug}`;
            } else {
              this.loadPost(post.slug);
            }
          });
          
          submenu.appendChild(entry);
        });
      }
    } else {
      const noPostsEntry = document.createElement('div');
      noPostsEntry.className = 'menu-entry';
      noPostsEntry.textContent = 'No posts found';
      noPostsEntry.style.cssText = 'padding: 8px 15px; color: var(--muted, #888); font-style: italic;';
      submenu.appendChild(noPostsEntry);
    }
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
    
    // Remove existing submenu
    const existingSubmenu = menuElement.querySelector('.submenu');
    if (existingSubmenu) {
      existingSubmenu.remove();
    }
    
    // Add new submenu
    menuElement.appendChild(submenu);
    
    // Use cached posts if available, otherwise load
    if (this.posts && this.posts.length > 0) {
      this.displayPostsInSubmenu(submenu, this.posts);
    } else {
      // Show loading indicator
      const loadingEntry = document.createElement('div');
      loadingEntry.className = 'menu-entry';
      loadingEntry.textContent = 'Loading posts...';
      loadingEntry.style.cssText = 'padding: 8px 15px; color: var(--muted, #888); font-style: italic;';
      submenu.appendChild(loadingEntry);
      
      // Load and display posts
      this.loadPostsForSubmenu(submenu);
    }
    
    // Remove submenu on mouse leave
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
  
  // Load posts for submenu (fallback when cache is empty)
  async loadPostsForSubmenu(submenu) {
    try {
      const timestamp = Date.now();
      const indexUrl = `https://api.github.com/repos/pigeonPious/page/contents/posts/index.json?t=${timestamp}`;
      const response = await fetch(indexUrl);
      
      if (response.ok) {
        const indexData = await response.json();
        let allPosts = [];
        
        // GitHub API returns content in base64, need to decode
        if (indexData.content && indexData.encoding === 'base64') {
          try {
            const decodedContent = atob(indexData.content);
            const parsedData = JSON.parse(decodedContent);
            
            if (Array.isArray(parsedData)) {
              allPosts = parsedData;
            } else if (parsedData.posts && Array.isArray(parsedData.posts)) {
              allPosts = parsedData.posts;
            }
            
            // Update local posts array to keep in sync
            this.posts = allPosts;
            
            // Display posts in submenu
            this.displayPostsInSubmenu(submenu, allPosts);
          } catch (decodeError) {
            console.error('❌ Error decoding GitHub content:', decodeError);
            throw new Error('Failed to decode index content');
          }
        } else {
          throw new Error('Unexpected GitHub API response format');
        }
      } else {
        throw new Error(`GitHub API failed: ${response.status}`);
      }
    } catch (error) {
      console.log('🔄 Submenu: GitHub API failed, trying local index.json...');
      
      // Fallback to local index.json
      try {
        const localResponse = await fetch('posts/index.json');
        if (localResponse.ok) {
          const localData = await localResponse.json();
          console.log('🔍 Submenu: Local index.json loaded:', localData);
          
          let allPosts = [];
          if (Array.isArray(localData)) {
            allPosts = localData;
          } else if (localData.posts && Array.isArray(localData.posts)) {
            allPosts = localData.posts;
          } else {
            throw new Error('Unexpected local index format');
          }
          
          console.log('✅ Submenu: Loaded posts from local index:', allPosts.length);
          
          // Update local posts array to keep in sync
          this.posts = allPosts;
          
          // Display posts in submenu
          this.displayPostsInSubmenu(submenu, allPosts);
          return;
        } else {
          throw new Error(`Local index failed: ${localResponse.status}`);
        }
      } catch (localError) {
        console.error('❌ Submenu: Both GitHub API and local index failed:', localError);
        submenu.innerHTML = '<div class="menu-entry" style="padding: 8px 15px; color: var(--danger-color, #dc3545); font-style: italic;">Error loading posts</div>';
      }
    }
  }
  // Force reindex all posts across the site (admin only)
  async forceReindexPosts() {
    console.log('🔄 Force reindex started');
    
    // Check if user is admin
    if (!this.isAdmin()) {
      console.log('⚠️ Non-admin user attempted to force reindex');
      const statusElement = document.getElementById('github-status');
      if (statusElement) {
        statusElement.textContent = 'Admin only';
        statusElement.style.color = '#dc3545'; // Red
        
        // Reset status after 3 seconds
        setTimeout(() => {
          statusElement.textContent = 'not connected';
          statusElement.style.color = '';
        }, 3000);
      }
      return;
    }
    
    try {
      // Clear cached posts
      this.posts = null;
      localStorage.removeItem('posts');
      
      // Show loading message
      const statusElement = document.getElementById('github-status');
      const originalStatus = statusElement ? statusElement.textContent : 'not connected';
      if (statusElement) {
        statusElement.textContent = 'Reindexing...';
        statusElement.style.color = '#ffa500'; // Orange
      }
      
      // Force reload posts from GitHub with fresh timestamp
      const timestamp = Date.now();
      const indexUrl = `https://api.github.com/repos/pigeonPious/page/contents/posts/index.json?t=${timestamp}`;
      console.log('🔄 Loading fresh posts index from GitHub:', indexUrl);
      
      const response = await fetch(indexUrl);
      if (response.ok) {
        const indexData = await response.json();
        let allPosts = [];
        
        // GitHub API returns content in base64, need to decode
        if (indexData.content && indexData.encoding === 'base64') {
          try {
            const decodedContent = atob(indexData.content);
            const parsedData = JSON.parse(decodedContent);
            
            if (Array.isArray(parsedData)) {
              allPosts = parsedData;
            } else if (parsedData.posts && Array.isArray(parsedData.posts)) {
              allPosts = parsedData.posts;
            }
            
            // Update local posts array
            this.posts = allPosts;
            
            // Cache the fresh posts
            localStorage.setItem('posts', JSON.stringify(allPosts));
            
            console.log('✅ Reindex complete. Found', allPosts.length, 'posts');
            
            // Show success message
            if (statusElement) {
              statusElement.textContent = 'Reindexed!';
              statusElement.style.color = '#28a745'; // Green
            
            // Reset status after 3 seconds
            setTimeout(() => {
              statusElement.textContent = originalStatus;
              statusElement.style.color = '';
            }, 3000);
            }
            
            // Update any open submenus
            this.updateOpenSubmenus();
            
          } catch (decodeError) {
            console.error('❌ Error decoding GitHub content:', decodeError);
            throw new Error('Failed to decode index content');
          }
        } else {
          throw new Error('Unexpected GitHub API response format');
        }
        
      } else if (response.status === 403) {
        console.warn('⚠️ GitHub API returned 403 - trying to force push updated index to GitHub');
        
        // When GitHub API is blocked, try to force push the current local state
        try {
          // Get current posts from localStorage or create fresh index
          let currentPosts = this.posts || [];
          if (currentPosts.length === 0) {
            // Try to load from local posts directory
            try {
              const localResponse = await fetch('posts/index.json');
              if (localResponse.ok) {
                const localData = await localResponse.json();
                currentPosts = Array.isArray(localData) ? localData : (localData.posts || []);
              }
            } catch (localError) {
              console.warn('⚠️ Could not load local posts:', localError);
            }
          }
          
          if (currentPosts.length > 0) {
            // Force push the current index to GitHub (this will overwrite the remote index)
            const forcePushSuccess = await this.forcePushIndexToGitHub(currentPosts);
            if (forcePushSuccess) {
              console.log('✅ Force reindex completed by pushing updated index to GitHub');
              
              // Show success message
              if (statusElement) {
                statusElement.textContent = 'Reindexed & pushed!';
                statusElement.style.color = '#28a745'; // Green
                
                // Reset status after 3 seconds
                setTimeout(() => {
                  statusElement.textContent = originalStatus;
                  statusElement.style.color = '';
                }, 3000);
              }
              
              // Update any open submenus
              this.updateOpenSubmenus();
              return;
            }
          }
          
          throw new Error('Could not force push index to GitHub');
        } catch (forcePushError) {
          console.warn('⚠️ Force push failed:', forcePushError);
          
          // Fall back to local-only reindex as last resort
          try {
            const localResponse = await fetch('posts/index.json');
            if (localResponse.ok) {
              const localData = await localResponse.json();
              const localPosts = Array.isArray(localData) ? localData : (localData.posts || []);
              
              this.posts = localPosts;
              localStorage.setItem('posts', JSON.stringify(localPosts));
              
              console.log('✅ Force reindex completed using local fallback, posts updated:', localPosts.length);
              
              // Show success message
              if (statusElement) {
                statusElement.textContent = 'Reindexed (local only)';
                statusElement.style.color = '#ffa500'; // Orange - warning
                
                // Reset status after 3 seconds
                setTimeout(() => {
                  statusElement.textContent = originalStatus;
                  statusElement.style.color = '';
                }, 3000);
              }
              
              // Update any open submenus
              this.updateOpenSubmenus();
              return;
            }
          } catch (localError) {
            console.warn('⚠️ Local fallback also failed:', localError);
          }
          
          throw new Error(`GitHub API blocked (403) and all fallbacks failed`);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('❌ Force reindex failed:', error);
      
      // Show error message
      const statusElement = document.getElementById('github-status');
      if (statusElement) {
        let errorMessage = 'Reindex failed';
        if (error.message && error.message.includes('403')) {
          errorMessage = 'API blocked - try later';
        } else if (error.message && error.message.includes('local fallback failed')) {
          errorMessage = 'Both sources failed';
        }
        
        statusElement.textContent = errorMessage;
        statusElement.style.color = '#dc3545'; // Red
        
        // Reset status after 3 seconds
        setTimeout(() => {
          statusElement.textContent = originalStatus;
          statusElement.style.color = '';
        }, 3000);
      }
    }
  }

  // Force push the posts index to GitHub (bypasses SHA requirement)
  async forcePushIndexToGitHub(posts) {
    console.log('🚀 Force pushing posts index to GitHub...');
    
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        console.warn('⚠️ No GitHub token found for force push');
        return false;
      }
      
      // Create the index content
      const indexContent = JSON.stringify(posts, null, 2);
      const encodedContent = btoa(unescape(encodeURIComponent(indexContent)));
      
      // Try to push without SHA first (creates new file if none exists)
      const pushResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts/index.json', {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Force reindex: Update posts index (${posts.length} posts)`,
          content: encodedContent,
          branch: 'main'
        })
      });
      
      if (pushResponse.ok) {
        console.log('✅ Force push successful - index updated on GitHub');
        return true;
      } else if (pushResponse.status === 422) {
        // File exists but SHA is required - try to get SHA and update
        console.log('🔄 File exists, trying to get SHA and update...');
        
        try {
          // Try to get SHA from public API (might work even when authenticated API is blocked)
          const shaResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts/index.json');
          if (shaResponse.ok) {
            const shaData = await shaResponse.json();
            const sha = shaData.sha;
            
            if (sha) {
              // Now update with SHA
              const updateResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts/index.json', {
                method: 'PUT',
                headers: {
                  'Authorization': `token ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: `Force reindex: Update posts index (${posts.length} posts)`,
                  content: encodedContent,
                  sha: sha,
                  branch: 'main'
                })
              });
              
              if (updateResponse.ok) {
                console.log('✅ Force push successful with SHA - index updated on GitHub');
                return true;
              }
            }
          }
        } catch (shaError) {
          console.warn('⚠️ Could not get SHA for update:', shaError);
        }
        
        // If all else fails, try to delete and recreate
        console.log('🔄 Trying delete and recreate approach...');
        try {
          // This is risky but might work when other methods fail
          const deleteResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts/index.json', {
            method: 'DELETE',
            headers: {
              'Authorization': `token ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Force reindex: Delete old index for recreation`,
              sha: 'force-delete', // This might fail, but worth trying
              branch: 'main'
            })
          });
          
          if (deleteResponse.ok || deleteResponse.status === 404) {
            // Now create new file
            const createResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts/index.json', {
              method: 'PUT',
              headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `Force reindex: Create new posts index (${posts.length} posts)`,
                content: encodedContent,
                branch: 'main'
              })
            });
            
            if (createResponse.ok) {
              console.log('✅ Force push successful via delete/recreate - index updated on GitHub');
              return true;
            }
          }
        } catch (deleteError) {
          console.warn('⚠️ Delete and recreate failed:', deleteError);
        }
      }
      
      console.error('❌ Force push failed:', pushResponse.status, pushResponse.statusText);
      return false;
      
    } catch (error) {
      console.error('❌ Force push error:', error);
      return false;
    }
  }

  // Fast reindex for just the current/new post
  async fastReindexCurrentPost() {
    console.log('⚡ Fast reindex for current post');
    
    try {
      // Get current post data from editor
      const postTitle = document.getElementById('postTitle')?.value || '';
      const postContent = document.getElementById('visualEditor')?.innerHTML || '';
      const currentFlags = localStorage.getItem('current_post_flags') || '';
      
      if (!postTitle.trim()) {
        console.log('⚠️ No title found for fast reindex');
        return;
      }
      
      // Create a temporary post object for the current post
      const currentPost = {
        slug: postTitle.toLowerCase().replace(/[^a-z0-9]/gi, '-'),
        title: postTitle,
        date: new Date().toISOString().split('T')[0].replace(/-/g, '-'),
        keywords: currentFlags,
        content: postContent
      };
      
      // Update local posts array
      if (!this.posts) this.posts = [];
      
      // Find if this post already exists
      const existingIndex = this.posts.findIndex(p => p.slug === currentPost.slug);
      if (existingIndex >= 0) {
        // Update existing post
        this.posts[existingIndex] = { ...this.posts[existingIndex], ...currentPost };
        console.log('✅ Updated existing post in local index');
      } else {
        // Add new post
        this.posts.unshift(currentPost); // Add to beginning
        console.log('✅ Added new post to local index');
      }
      
      // Update localStorage cache
      localStorage.setItem('posts', JSON.stringify(this.posts));
      
      // Update any open submenus
      this.updateOpenSubmenus();
      
      console.log('⚡ Fast reindex completed for:', currentPost.title);
      
    } catch (error) {
      console.error('❌ Fast reindex error:', error);
    }
  }
  
  // Update any open submenus with fresh data
  updateOpenSubmenus() {
    // Update All Posts submenu if open
    const allPostsSubmenu = document.querySelector('#all-posts-menu .submenu');
    if (allPostsSubmenu && this.posts) {
      this.displayPostsInSubmenu(allPostsSubmenu, this.posts);
    }
    
    // Update Categories submenu if open
    const categoriesSubmenu = document.querySelector('#categories-menu .submenu');
    if (categoriesSubmenu && this.posts) {
      this.displayCategoriesInSubmenu(categoriesSubmenu, this.posts);
    }
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



  async loadPosts() {
    console.log('🔍 loadPosts: Loading posts from index...');
    
    try {
      // Load posts from GitHub index (much faster than scanning directory)
      const timestamp = Date.now();
      const indexUrl = `https://api.github.com/repos/pigeonPious/page/contents/posts/index.json?t=${timestamp}`;
      console.log('🔍 loadPosts: Loading posts index from GitHub:', indexUrl);
      
      const response = await fetch(indexUrl);
      if (response.ok) {
        const indexData = await response.json();
        console.log('🔍 loadPosts: GitHub index data loaded:', indexData);
        
        // GitHub API returns content in base64, need to decode
        if (indexData.content && indexData.encoding === 'base64') {
          try {
            const decodedContent = atob(indexData.content);
            const parsedData = JSON.parse(decodedContent);
            console.log('🔍 loadPosts: Decoded index data:', parsedData);
            
            // Handle both array and object formats
            if (Array.isArray(parsedData)) {
              this.posts = parsedData;
            } else if (parsedData.posts && Array.isArray(parsedData.posts)) {
              this.posts = parsedData.posts;
            } else {
              console.warn('⚠️ loadPosts: Unexpected index format:', parsedData);
              // Don't clear posts array - keep cached posts if available
              if (!this.posts || this.posts.length === 0) {
                this.posts = [];
              }
            }
          } catch (decodeError) {
            console.error('❌ Error decoding GitHub content:', decodeError);
            // Don't clear posts array - keep cached posts if available
            if (!this.posts || this.posts.length === 0) {
              this.posts = [];
            }
          }
        } else {
          console.warn('⚠️ loadPosts: Unexpected GitHub API response format:', indexData);
          // Don't clear posts array - keep cached posts if available
          if (!this.posts || this.posts.length === 0) {
            this.posts = [];
          }
        }
        
        console.log('📚 loadPosts: Posts loaded from index:', this.posts.length);
        
        // Cache posts in localStorage for submenu use
        localStorage.setItem('posts', JSON.stringify(this.posts));
        
        if (this.posts.length > 0) {
          // Sort by date for reference, but don't auto-load most recent
          // (let the init function decide which post to load)
          this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
          console.log('📚 loadPosts: Posts sorted by date, ready for loading');
          
          // Don't create submenus on page load - only create them on hover
          console.log('🧭 loadPosts: Posts loaded, submenus will be created on hover');
          

        } else {
          console.log('⚠️ loadPosts: No posts found in index');
          // Don't clear posts array - keep cached posts if available
          if (!this.posts || this.posts.length === 0) {
            this.displayDefaultContent();
          }
        }
      } else {
        console.warn('⚠️ loadPosts: Could not load index file:', response.status);
        // Don't clear posts array - keep cached posts if available
        if (!this.posts || this.posts.length === 0) {
          this.displayDefaultContent();
        }
      }
    } catch (error) {
      console.error('❌ loadPosts: Error loading index:', error);
      // Don't clear posts array - keep cached posts if available
      if (!this.posts || this.posts.length === 0) {
        this.displayDefaultContent();
      }
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
        
        // Store the current post slug in localStorage for the GitHub button
        if (post.slug) {
          localStorage.setItem('current_post_slug', post.slug);
          console.log(`💾 Stored current post slug in localStorage: ${post.slug}`);
        }
        
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
      
      // Setup image click handlers for full preview
      this.setupImageClickHandlers(contentElement);
      
      // Add clearfix to ensure floating images don't extend beyond content
      const clearfix = document.createElement('div');
      clearfix.style.cssText = `
        clear: both;
        height: 0;
        overflow: hidden;
        margin: 0;
        padding: 0;
      `;
      contentElement.appendChild(clearfix);
      
      console.log('🔍 Set content to:', post.content ? post.content.substring(0, 100) + '...' : '');
    } else {
      console.error('❌ contentElement not found!');
    }
    
    // Setup hover notes for the displayed post
    console.log('🔍 Setting up hover notes...');
    this.setupHoverNotes();
    
    // Add navigation controls
    this.addPostNavigation(post);
    
    // Reset site map manual state when showing a new post
    this.siteMapManuallyToggled = false;
    this.siteMapManuallyHidden = false;
    
    console.log('✅ Post displayed successfully:', post.title);
  }

  // Setup image click handlers for full preview functionality
  setupImageClickHandlers(contentElement) {
    const images = contentElement.querySelectorAll('img');
    console.log(`🖼️ Setting up click handlers for ${images.length} images`);
    
    images.forEach((img, index) => {
      // Remove any existing click handlers to prevent duplicates
      const newImg = img.cloneNode(true);
      img.parentNode.replaceChild(newImg, img);
      
      // Add click handler for full preview
      newImg.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`🖼️ Image ${index + 1} clicked:`, newImg.src);
        
        // Test if the function exists and is callable
        if (typeof this.showImagePreview === 'function') {
          this.showImagePreview(newImg.src, newImg.alt || 'Image');
        } else {
          console.error('❌ showImagePreview function not found!');
        }
      });
      
      // Also add a mousedown event as backup
      newImg.addEventListener('mousedown', (e) => {
        console.log(`🖼️ Image ${index + 1} mousedown:`, newImg.src);
      });
      
      // Add visual indication that image is clickable
      newImg.style.cursor = 'pointer';
      newImg.title = 'Click to view full size';
      
      // Ensure the image is clickable
      newImg.style.pointerEvents = 'auto';
      newImg.style.userSelect = 'none';
      
      console.log(`🖼️ Click handler added to image ${index + 1}:`, newImg.src, {
        cursor: newImg.style.cursor,
        pointerEvents: newImg.style.pointerEvents,
        userSelect: newImg.style.userSelect
      });
    });
  }

  // Show full-size image preview
  showImagePreview(imageSrc, imageAlt) {
    console.log('🖼️ showImagePreview called with:', { imageSrc, imageAlt });
    
    // Remove existing preview if any
    const existingPreview = document.getElementById('image-preview-overlay');
    if (existingPreview) {
      existingPreview.remove();
      console.log('🖼️ Removed existing preview');
    }
    
    // Create overlay
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
    
    // Create image container with improved sizing logic
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
    
    // Create image element with proper sizing
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
    
    // Wait for image to load to calculate proper sizing
    fullImage.onload = () => {
      const viewportWidth = window.innerWidth - 100; // Account for 50px padding on each side
      const viewportHeight = window.innerHeight - 100;
      
      let displayWidth = fullImage.naturalWidth;
      let displayHeight = fullImage.naturalHeight;
      
      // Calculate scaling to fit within viewport
      const scaleX = viewportWidth / displayWidth;
      const scaleY = viewportHeight / displayHeight;
      const scale = Math.min(scaleX, scaleY); // Allow scaling up for small images
      
      // Apply calculated dimensions
      displayWidth = Math.floor(displayWidth * scale);
      displayHeight = Math.floor(displayHeight * scale);
      
      fullImage.style.width = `${displayWidth}px`;
      fullImage.style.height = `${displayHeight}px`;
      
      console.log('🖼️ Image preview sized:', {
        natural: `${fullImage.naturalWidth}x${fullImage.naturalHeight}`,
        display: `${displayWidth}x${displayHeight}`,
        viewport: `${viewportWidth}x${viewportHeight}`,
        scale: scale.toFixed(3)
      });
    };
    
    // Create close button
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
    
    // Add hover effect to close button
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = 'var(--accent)';
      closeButton.style.color = 'white';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'var(--bg)';
      closeButton.style.color = 'var(--fg)';
    });
    
    // Add click handlers
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.remove();
    });
    
    // Close overlay when clicking anywhere (including on the image)
    overlay.addEventListener('click', () => {
      overlay.remove();
    });
    
    // Also close when clicking on the image itself
    fullImage.addEventListener('click', () => {
      overlay.remove();
    });
    
    // Assemble and add to DOM
    imageContainer.appendChild(fullImage);
    imageContainer.appendChild(closeButton);
    overlay.appendChild(imageContainer);
    document.body.appendChild(overlay);
    
    console.log('🖼️ Image preview overlay added to DOM');
    
    // Verify the overlay is actually in the DOM
    const verifyOverlay = document.getElementById('image-preview-overlay');
    if (verifyOverlay) {
      console.log('✅ Image preview overlay verified in DOM');
    } else {
      console.error('❌ Image preview overlay not found in DOM after creation');
    }
    
    // Add escape key handler
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Add window resize handler to recalculate image sizing
    const resizeHandler = () => {
      if (fullImage.complete && fullImage.naturalWidth) {
        const viewportWidth = window.innerWidth - 100; // Account for 50px padding on each side
        const viewportHeight = window.innerHeight - 100;
        
        let displayWidth = fullImage.naturalWidth;
        let displayHeight = fullImage.naturalHeight;
        
        const scaleX = viewportWidth / displayWidth;
        const scaleY = viewportHeight / displayHeight;
        const scale = Math.min(scaleX, scaleY); // Allow scaling up for small images
        
        displayWidth = Math.floor(displayWidth * scale);
        displayHeight = Math.floor(displayHeight * scale);
        
        fullImage.style.width = `${displayWidth}px`;
        fullImage.style.height = `${displayHeight}px`;
        
        console.log('🖼️ Image preview resized:', {
          display: `${displayWidth}x${displayHeight}`,
          viewport: `${viewportWidth}x${viewportHeight}`,
          scale: scale.toFixed(3)
        });
      }
    };
    window.addEventListener('resize', resizeHandler);
    
    // Clean up event listeners when overlay is removed
    overlay.addEventListener('remove', () => {
      document.removeEventListener('keydown', escapeHandler);
      window.removeEventListener('resize', resizeHandler);
    });
  }

  addPostNavigation(currentPost) {
    console.log('🔍 addPostNavigation called with:', currentPost);
    console.log('🔍 this.posts length:', this.posts ? this.posts.length : 'undefined');
    
    if (!currentPost || !this.posts || this.posts.length === 0) {
      console.log('🔍 Early return - missing data');
      return;
    }
    
    // Don't show navigation for 'about' and 'contact' pages
    if (currentPost.slug === 'about' || currentPost.slug === 'contact') {
      console.log('🔍 Early return - about/contact page');
      return;
    }
    
    const contentElement = document.getElementById('post-content');
    if (!contentElement) return;
    
    // Find current post index
    const currentIndex = this.posts.findIndex(post => post.slug === currentPost.slug);
    if (currentIndex === -1) return;
    
    // Get current post categories
    const currentCategories = currentPost.keywords ? 
      currentPost.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0) : [];
    
    // Find next and previous posts
    let nextPost = null;
    let prevPost = null;
    
    // First try to find posts in the same category
    if (currentCategories.length > 0) {
      const categoryPosts = this.posts.filter(post => {
        if (!post.keywords) return false;
        const postCategories = post.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        return postCategories.some(cat => currentCategories.includes(cat));
      });
      
      if (categoryPosts.length > 1) {
        const categoryIndex = categoryPosts.findIndex(post => post.slug === currentPost.slug);
        if (categoryIndex > 0) {
          prevPost = categoryPosts[categoryIndex - 1];
        }
        if (categoryIndex < categoryPosts.length - 1) {
          nextPost = categoryPosts[categoryIndex + 1];
          console.log('🔍 Next post in category:', nextPost.title);
        }
      }
    }
    
    // If no category navigation found, use chronological navigation
    if (!nextPost && !prevPost) {
      if (currentIndex > 0) {
        prevPost = this.posts[currentIndex - 1];
      }
      if (currentIndex < this.posts.length - 1) {
        nextPost = this.posts[currentIndex + 1];
      }
    }
    
    // Create navigation container
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
    
    // Add previous post link
    if (prevPost) {
      const prevLink = document.createElement('div');
      prevLink.innerHTML = `<a href="#" class="nav-link prev-link" data-slug="${prevPost.slug}" style="font-size: 10px; opacity: 0.5;">_previous</a>`;
      prevLink.style.cssText = 'margin-bottom: 0px; line-height: 1;';
      navContainer.appendChild(prevLink);
      
      // Add click handler
      prevLink.querySelector('.prev-link').addEventListener('click', (e) => {
        e.preventDefault();
        this.loadPost(prevPost.slug);
      });
    }
    
    // Add next post link
    if (nextPost) {
      const nextLink = document.createElement('div');
      nextLink.innerHTML = `<a href="#" class="nav-link next-link" data-slug="${nextPost.slug}" style="font-size: 10px; opacity: 0.5;">_next</a>`;
      nextLink.style.cssText = 'margin-bottom: 0px; line-height: 1;';
      navContainer.appendChild(nextLink);
      
      // Add click handler
      nextLink.querySelector('.next-link').addEventListener('click', (e) => {
        e.preventDefault();
        this.loadPost(nextPost.slug);
      });
    }
    
    // Add navigation to content
    contentElement.appendChild(navContainer);
    
    // Debug: Log navigation creation
    console.log('🧭 Navigation created:', {
      prevPost: prevPost ? prevPost.slug : 'none',
      nextPost: nextPost ? nextPost.slug : 'none',
      navContainer: navContainer.outerHTML
    });
    
    // Additional debug info
    console.log('🧭 Navigation container added to DOM:', navContainer);
    console.log('🧭 Content element children count after adding nav:', contentElement.children.length);
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
        // Navigate to blog view with this post
        window.location.href = `index.html#${mostRecent.slug}`;
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
        // Navigate to blog view with this post
        window.location.href = `index.html#${randomPost.slug}`;
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
      // Always generate a new random theme when random button is clicked
      console.log('🎲 Random theme button clicked - generating new random theme');
      
      // Generate new random theme values
      const h = Math.floor(Math.random() * 361);
      const s = Math.floor(Math.random() * 41) + 30;
      const l = Math.floor(Math.random() * 31) + 15;
      const color = `hsl(${h},${s}%,${l}%)`;
      
      // Save the new random theme values
      const themeData = { h, s, l, color };
      localStorage.setItem('ppPage_random_theme', JSON.stringify(themeData));
      console.log('🎲 Generated and saved new random theme:', color, { h, s, l });
      
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
    
    // Check if note contains a URL and make base text clickable
    const urlMatch = noteText.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      const url = urlMatch[1];
      
      // Add click handler to base text
      span.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(url, '_blank');
      });
    }
    
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
    
    // Check if magazine already exists
    let magazine = document.getElementById('imageMagazine');
    
    if (magazine) {
      // Remove existing magazine
      magazine.remove();
    }
    
    // Create new magazine
    magazine = this.createImageMagazine();
    document.body.appendChild(magazine);
    
    // Position the magazine to the left of the text body in editor
    const editorContent = document.querySelector('.editor-content') || document.querySelector('main');
    let initialX = '20px';
    let initialY = '60px'; // Below taskbar
    
    if (editorContent) {
      const editorRect = editorContent.getBoundingClientRect();
      // Position magazine to the left of editor content with small buffer
      initialX = (editorRect.left - 140) + 'px'; // 120px width + 20px buffer
      initialY = '60px'; // Below taskbar
    }
    
    // Position the magazine
    magazine.style.position = 'fixed';
    magazine.style.left = initialX;
    magazine.style.top = initialY;
    magazine.style.transform = 'none'; // No centering transform
    magazine.style.zIndex = '10000';
    
    // Show the magazine
    magazine.style.display = 'flex';
    magazine.classList.remove('hidden');
    
    console.log('🔍 Magazine positioned at:', { x: initialX, y: initialY });
    console.log('🔍 Magazine created and positioned');
    
    // Load images from assets folder
    console.log('🔍 Loading images...');
    this.loadImagesToMagazine();
    
    // Fix any existing images that might be missing overlays
    setTimeout(() => {
      this.fixMissingImageOverlays();
    }, 200);
    
    console.log('✅ Image magazine opened');
  }

  showDraftsModal() {
    console.log('📁 Opening drafts modal...');
    
    // Check if modal already exists
    let modal = document.getElementById('draftsModal');
    
    if (modal) {
      // Remove existing modal
      modal.remove();
    }
    
    // Create new modal
    modal = this.createDraftsModal();
    document.body.appendChild(modal);
    
    // Position the modal in the center of the window
    modal.style.position = 'fixed';
    modal.style.left = '50%';
    modal.style.top = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.zIndex = '10000';
    
    // Show the modal
    modal.style.display = 'flex';
    
    console.log('🔍 Drafts modal positioned at center of window');
    console.log('🔍 Drafts modal created and positioned');
    
    // Load drafts from GitHub
    this.loadDraftsFromGitHub();
    
    console.log('✅ Drafts modal opened');
  }
  createDraftsModal() {
    const modal = document.createElement('div');
    modal.id = 'draftsModal';
    modal.style.cssText = `
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 20px;
      min-width: 400px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-family: monospace;
      font-size: 12px;
      color: var(--fg);
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Drafts';
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: normal;
      color: var(--fg);
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: var(--fg);
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;
    `;
    
    closeBtn.addEventListener('click', () => {
      const modal = document.getElementById('draftsModal');
      if (modal) {
        modal.remove();
      }
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Content container
    const content = document.createElement('div');
    content.id = 'draftsContent';
    content.style.cssText = `
      min-height: 100px;
    `;
    
    // Loading indicator
    const loading = document.createElement('div');
    loading.textContent = 'Loading drafts...';
    loading.style.cssText = `
      text-align: center;
      color: var(--muted);
      padding: 20px;
    `;
    content.appendChild(loading);
    
    modal.appendChild(header);
    modal.appendChild(content);
    
    return modal;
  }

  async loadDraftsFromGitHub() {
    try {
      console.log('🔍 Loading drafts from GitHub...');
      
      // Get GitHub token
      const githubToken = this.getCurrentToken();
      if (!githubToken) {
        this.displayDraftsError('GitHub authentication required');
        return;
      }
      
      // Test token validity first
      const testResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (testResponse.status === 401) {
        console.log('⚠️ Token expired or invalid, clearing authentication');
        this.clearAuthentication();
        this.displayDraftsError('GitHub token expired. Please re-authenticate.');
        return;
      }
      
      if (!testResponse.ok) {
        throw new Error(`GitHub authentication failed: ${testResponse.status}`);
      }
      
      // Fetch drafts from GitHub
      const response = await fetch('https://api.github.com/repos/pigeonPious/page/contents/drafts', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.status === 401) {
        console.log('⚠️ Token expired when accessing drafts, clearing authentication');
        this.clearAuthentication();
        this.displayDraftsError('GitHub token expired. Please re-authenticate.');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const drafts = await response.json();
      console.log('✅ Drafts loaded from GitHub:', drafts);
      
      // Filter for JSON files and display them
      const jsonDrafts = drafts.filter(item => 
        item.type === 'file' && item.name.endsWith('.json')
      );
      
      this.displayDrafts(jsonDrafts);
      
    } catch (error) {
      console.error('❌ Error loading drafts:', error);
      this.displayDraftsError('Failed to load drafts: ' + error.message);
    }
  }

  clearAuthentication() {
          console.log('Clearing authentication...');
    
    // Remove tokens from localStorage
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_oauth_token');
    localStorage.removeItem('github_token_type');
    
    // Update UI to show not connected
    this.updateAuthStatus(false);
    
    console.log('✅ Authentication cleared');
  }

  displayDrafts(drafts) {
    const content = document.getElementById('draftsContent');
    if (!content) return;
    
    if (drafts.length === 0) {
      content.innerHTML = '<div style="text-align: center; color: var(--muted); padding: 20px;">No drafts found</div>';
      return;
    }
    
    // Clear loading indicator
    content.innerHTML = '';
    
    // Create drafts list
    drafts.forEach(draft => {
      const draftItem = document.createElement('div');
      draftItem.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        border: 1px solid var(--border);
        border-radius: 3px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      `;
      
      draftItem.addEventListener('mouseenter', () => {
        draftItem.style.backgroundColor = 'var(--sidebar-bg)';
      });
      
      draftItem.addEventListener('mouseleave', () => {
        draftItem.style.backgroundColor = 'transparent';
      });
      
      // Draft name (clickable to open)
      const draftName = document.createElement('span');
      draftName.textContent = draft.name.replace('.json', '');
      draftName.style.cssText = `
        flex: 1;
        cursor: pointer;
      `;
      
      // Delete button (X)
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.style.cssText = `
        background: none;
        border: none;
        color: var(--danger-color);
        font-size: 16px;
        cursor: pointer;
        padding: 4px 8px;
        margin-left: 12px;
        border-radius: 2px;
        transition: background-color 0.2s ease;
      `;
      
      deleteBtn.addEventListener('mouseenter', () => {
        deleteBtn.style.backgroundColor = 'var(--danger-color)';
        deleteBtn.style.color = 'white';
      });
      
      deleteBtn.addEventListener('mouseleave', () => {
        deleteBtn.style.backgroundColor = 'transparent';
        deleteBtn.style.color = 'var(--danger-color)';
      });
      
      // Add click handlers
      draftName.addEventListener('click', () => {
        this.openDraft(draft.name);
      });
      
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteDraft(draft.name);
      });
      
      draftItem.appendChild(draftName);
      draftItem.appendChild(deleteBtn);
      content.appendChild(draftItem);
    });
  }

  displayDraftsError(message) {
    const content = document.getElementById('draftsContent');
    if (!content) return;
    
    content.innerHTML = `
      <div style="text-align: center; color: var(--danger-color); padding: 20px;">
        ${message}
      </div>
    `;
  }

  async openDraft(draftName) {
    try {
      console.log('📁 Opening draft:', draftName);
      
      // Get GitHub token
      const githubToken = this.getCurrentToken();
      if (!githubToken) {
        alert('GitHub authentication required');
        return;
      }
      
      // Fetch draft content from GitHub
      const response = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/drafts/${draftName}`, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.status === 401) {
        console.log('⚠️ Token expired when opening draft, clearing authentication');
        this.clearAuthentication();
        alert('GitHub token expired. Please re-authenticate.');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch draft: ${response.status}`);
      }
      
      const draftData = await response.json();
      const content = atob(draftData.content); // Decode base64 content
      const draft = JSON.parse(content);
      
      console.log('✅ Draft loaded:', draft);
      
      // Populate editor with draft content
      this.populateEditorWithDraft(draft);
      
      // Close the drafts modal
      const modal = document.getElementById('draftsModal');
      if (modal) {
        modal.remove();
      }
      
    } catch (error) {
      console.error('❌ Error opening draft:', error);
      alert('Failed to open draft: ' + error.message);
    }
  }

  populateEditorWithDraft(draft) {
    // Populate title
    const titleInput = document.getElementById('postTitle');
    if (titleInput && draft.title) {
      titleInput.value = draft.title;
    }
    
    // Populate content
    const contentEditor = document.getElementById('visualEditor');
    if (contentEditor && draft.content) {
      contentEditor.innerHTML = draft.content;
    }
    
    // Populate flags/keywords
    if (draft.keywords) {
      localStorage.setItem('current_post_flags', draft.keywords);
    }
    
    // Store draft slug for potential overwriting
    if (draft.slug) {
      localStorage.setItem('current_draft_slug', draft.slug);
    }
    
    console.log('✅ Editor populated with draft content');
  }

  async deleteDraft(draftName) {
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete the draft "${draftName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      console.log('🗑️ Deleting draft:', draftName);
      
      // Get GitHub token
      const githubToken = this.getCurrentToken();
      if (!githubToken) {
        alert('GitHub authentication required');
        return;
      }
      
      // First get the file to get its SHA
      const getResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/drafts/${draftName}`, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (getResponse.status === 401) {
        console.log('⚠️ Token expired when deleting draft, clearing authentication');
        this.clearAuthentication();
        alert('GitHub token expired. Please re-authenticate.');
        return;
      }
      
      if (!getResponse.ok) {
        throw new Error(`Failed to get draft info: ${getResponse.status}`);
      }
      
      const draftInfo = await getResponse.json();
      const sha = draftInfo.sha;
      
      // Delete the file
      const deleteResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/drafts/${draftName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Delete draft: ${draftName}`,
          sha: sha
        })
      });
      
      if (deleteResponse.status === 401) {
        console.log('⚠️ Token expired when deleting draft, clearing authentication');
        this.clearAuthentication();
        alert('GitHub token expired. Please re-authenticate.');
        return;
      }
      
      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete draft: ${deleteResponse.status}`);
      }
      
      console.log('✅ Draft deleted successfully');
      
      // Refresh the drafts list
      this.loadDraftsFromGitHub();
      
    } catch (error) {
      console.error('❌ Error deleting draft:', error);
      alert('Failed to delete draft: ' + error.message);
    }
  }

  // Console Interface
  showConsole() {
    console.log('Opening console...');
    
    // Allow console to open for everyone, but check admin for commands
    
    // Check if console already exists
    let consoleWindow = document.getElementById('consoleWindow');
    
    if (consoleWindow) {
      // Remove existing console
      consoleWindow.remove();
    }
    
    // Create new console
    consoleWindow = this.createConsole();
    document.body.appendChild(consoleWindow);
    
    // Position console at bottom left of browser window
    consoleWindow.style.position = 'fixed';
    consoleWindow.style.left = '20px';
    consoleWindow.style.bottom = '20px';
    consoleWindow.style.zIndex = '10000';
    
    // Show the console
    consoleWindow.style.display = 'flex';
    
    // Focus on input
    const input = consoleWindow.querySelector('#consoleInput');
    if (input) {
      input.focus();
    }
    
    // Print welcome message based on admin status
    if (this.isAdmin()) {
      this.printToConsole('Console ready. Type "?" for help.');
    } else {
      this.printToConsole('Console ready. Commands require admin access.');
    }
    
    console.log('Console opened');
  }

  createConsole() {
    const consoleWindow = document.createElement('div');
    consoleWindow.id = 'consoleWindow';
    consoleWindow.style.cssText = `
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      width: 500px;
      height: 300px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-family: monospace;
      font-size: 12px;
      color: var(--fg);
      cursor: move;
    `;
    
    // Header with close button
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 6px 8px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg);
      color: var(--fg);
      cursor: move;
      user-select: none;
    `;
    
    const title = document.createElement('span');
    title.textContent = 'Console';
    title.style.cssText = `
      font-weight: normal;
      font-size: 12px;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: var(--fg);
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;
    `;
    
    closeBtn.addEventListener('click', () => {
      const consoleWindow = document.getElementById('consoleWindow');
      if (consoleWindow) {
        consoleWindow.remove();
      }
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Output area
    const output = document.createElement('div');
    output.id = 'consoleOutput';
    output.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      background: var(--bg);
      border: none;
      color: var(--fg);
      font-family: monospace;
      font-size: 11px;
      line-height: 1.3;
      white-space: pre-wrap;
      word-wrap: break-word;
    `;
    
    // Input area
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
      display: flex;
      align-items: center;
      padding: 6px 8px;
      border-top: 1px solid var(--border);
      background: var(--bg);
    `;
    
    const prompt = document.createElement('span');
    prompt.textContent = '> ';
    prompt.style.cssText = `
      color: var(--fg);
      margin-right: 6px;
      user-select: none;
    `;
    
    const input = document.createElement('input');
    input.id = 'consoleInput';
    input.type = 'text';
    input.style.cssText = `
      flex: 1;
      background: transparent;
      border: none;
      color: var(--fg);
      font-family: monospace;
      font-size: 11px;
      outline: none;
    `;
    
    const cursor = document.createElement('span');
    cursor.className = 'console-cursor';
    cursor.textContent = '_';
    cursor.style.cssText = `
      color: var(--fg);
      animation: blink 1s infinite;
      margin-left: 2px;
    `;
    
    // Add cursor animation if it doesn't exist
    if (!document.getElementById('console-cursor-animation')) {
      const style = document.createElement('style');
      style.id = 'console-cursor-animation';
      style.textContent = `
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    inputContainer.appendChild(prompt);
    inputContainer.appendChild(input);
    inputContainer.appendChild(cursor);
    
    // Make console draggable
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = consoleWindow.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      consoleWindow.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      consoleWindow.style.left = (startLeft + deltaX) + 'px';
      consoleWindow.style.top = (startTop + deltaY) + 'px';
      consoleWindow.style.bottom = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        consoleWindow.style.cursor = 'move';
      }
    });
    
    // Handle input
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const inputValue = input.value.trim();
        if (inputValue) {
          // Check admin access for all commands
          if (!this.isAdmin()) {
            this.printToConsole('admin only');
            input.value = '';
            return;
          }
          
          if (this.addProjectLinkState) {
            // Handle project link input flow
            this.handleProjectLinkInput(inputValue);
          } else {
            // Handle regular commands
            this.executeCommand(inputValue);
          }
          input.value = '';
        }
      } else if (e.key === 'Escape') {
        if (this.addProjectLinkState) {
          this.printToConsole('Cancelled.');
          this.addProjectLinkState = null;
          this.pendingProjectLink = {};
        }
        input.value = '';
        input.blur();
      }
    });
    
    consoleWindow.appendChild(header);
    consoleWindow.appendChild(output);
    consoleWindow.appendChild(inputContainer);
    
    return consoleWindow;
  }

  printToConsole(message) {
    const output = document.getElementById('consoleOutput');
    if (!output) return;
    
    const line = document.createElement('div');
    line.textContent = message;
    line.style.cssText = `
      margin-bottom: 2px;
      color: var(--fg);
    `;
    
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  executeCommand(command) {
    console.log('🖥️ Executing command:', command);
    
    // Double-check admin access for admin-only commands
    const adminCommands = ['force-reindex', 'check-rate-limit', 'link', 'project'];
    const isAdminCommand = adminCommands.some(cmd => command.startsWith(cmd));
    
    if (isAdminCommand && !this.isAdmin()) {
      this.printToConsole('admin only');
      return;
    }
    
    // Check if we're in project mode
    if (this.projectMode) {
      this.handleProjectModeInput(command);
      return;
    }
    
    // Check if we're waiting for project link input
    if (this.addProjectLinkState) {
      this.handleProjectLinkInput(command);
      return;
    }
    
    // Handle main console commands
    if (command === '?' || command === 'help') {
      this.showHelp();
    } else if (command === 'clear') {
      this.clearConsole();
    } else if (command === 'search') {
      this.printToConsole('Usage: search [keyword] - Search posts by keyword');
    } else if (command.startsWith('search ')) {
      const keyword = command.substring(7).trim();
      this.searchPosts(keyword);
    } else if (command === 'status') {
      this.showGitHubStatus();
    } else if (command === 'cache') {
      this.showCacheStatus();
    } else if (command === 'posts') {
      this.showPostsInfo();
    } else if (command === 'force-reindex') {
      this.forceReindex();
    } else if (command === 'check-rate-limit') {
      this.checkRateLimit();
    } else if (command === 'logout') {
      this.logout();
    } else if (command === 'link') {
      this.startAddProjectLink();
    } else if (command === 'project') {
      this.enterProjectMode();
    } else {
      this.printToConsole(`Unknown command: ${command}`);
    }
  }

  showHelp() {
    // Check admin access
    if (!this.isAdmin()) {
      this.printToConsole('admin only');
      return;
    }
    
    this.printToConsole('Available commands:');
    this.printToConsole('  ? or help - Show this help');
    this.printToConsole('  clear - Clear console output');
    this.printToConsole('  search [keyword] - Search posts by keyword');
    this.printToConsole('  status - Show GitHub connection status');
    this.printToConsole('  cache - Show cache status');
    this.printToConsole('  posts - Show post count and list');
    this.printToConsole('  force-reindex - Force reindex all posts');
    this.printToConsole('  check-rate-limit - Check GitHub rate limit');
    this.printToConsole('  logout - Logout of GitHub');
    this.printToConsole('  link - Add a new project link');
    this.printToConsole('  project - Enter project mode for advanced project management');
    this.printToConsole('');
  }

  clearConsole() {
    const output = document.getElementById('consoleOutput');
    if (output) {
      output.innerHTML = '';
      this.printToConsole('Console cleared.');
    }
  }

  searchPosts(keyword) {
    // Implement post search functionality
    // This is a placeholder, you'll need to implement the actual search logic
    this.printToConsole(`Searching for posts containing "${keyword}"...`);
  }

  showGitHubStatus() {
    // Implement GitHub status display
    // This is a placeholder, you'll need to implement the actual status logic
    this.printToConsole('GitHub status: Connected');
  }

  showCacheStatus() {
    // Implement cache status display
    // This is a placeholder, you'll need to implement the actual cache status logic
    this.printToConsole('Cache status: 100 posts cached');
  }

  showPostsInfo() {
    // Implement post info display
    // This is a placeholder, you'll need to implement the actual post info logic
    this.printToConsole('Total posts: 100');
    this.printToConsole('Post list:');
    this.printToConsole('  - Post 1');
    this.printToConsole('  - Post 2');
    this.printToConsole('  - Post 3');
  }

  forceReindex() {
    // Implement force reindex functionality
    // This is a placeholder, you'll need to implement the actual reindexing logic
    this.printToConsole('Forcing reindex of all posts...');
  }
  checkRateLimit() {
    // Implement rate limit check
    // This is a placeholder, you'll need to implement the actual rate limit check logic
    this.printToConsole('GitHub rate limit: 5000 remaining');
  }

  enterProjectMode() {
    // Check admin access
    if (!this.isAdmin()) {
      this.printToConsole('admin only');
      return;
    }
    
    this.projectMode = true;
    this.printToConsole('Entered project mode');
    this.printToConsole('Type "help" for available commands or "escape" to exit');
  }

  startAddProjectLink() {
    // Check admin access
    if (!this.isAdmin()) {
      this.printToConsole('admin only');
      return;
    }
    
    this.printToConsole('link:');
    this.addProjectLinkState = 'waiting_for_link';
    this.pendingProjectLink = {};
  }

  async handleProjectLinkInput(input) {
    // Check admin access
    if (!this.isAdmin()) {
      this.printToConsole('admin only');
      this.addProjectLinkState = null;
      this.pendingProjectLink = {};
      return;
    }
    
    if (this.addProjectLinkState === 'waiting_for_link') {
      this.pendingProjectLink.url = input;
      this.printToConsole(`link: ${input}`);
      this.printToConsole('label:');
      this.addProjectLinkState = 'waiting_for_label';
    } else if (this.addProjectLinkState === 'waiting_for_label') {
      this.pendingProjectLink.label = input;
      this.printToConsole(`label: ${input}`);
      this.printToConsole(`Confirm: Add "${this.pendingProjectLink.label}" linking to "${this.pendingProjectLink.url}"? (y/n)`);
      this.addProjectLinkState = 'waiting_for_confirmation';
    } else if (this.addProjectLinkState === 'waiting_for_confirmation') {
      if (input.toLowerCase() === 'y' || input.toLowerCase() === 'yes') {
        await this.addProjectLink(this.pendingProjectLink.label, this.pendingProjectLink.url);
      } else {
        this.printToConsole('Cancelled.');
      }
      this.addProjectLinkState = null;
      this.pendingProjectLink = {};
    }
  }
  // New project mode console handler
  async handleProjectModeInput(input) {
    if (!this.isAdmin()) {
      this.printToConsole('admin only');
      this.exitProjectMode();
      return;
    }

    const command = input.trim().toLowerCase();
    
    if (command === 'escape' || command === 'exit' || command === 'quit') {
      this.exitProjectMode();
      return;
    }
    
    if (command === 'add') {
      this.startAddProjectLink();
      return;
    }
    
    if (command.startsWith('delete ')) {
      const label = input.substring(7).trim(); // Remove "delete " prefix
      if (label) {
        await this.deleteProject(label);
      } else {
        this.printToConsole('Usage: delete LINK LABEL HERE');
      }
      return;
    }
    
    if (command === 'list') {
      await this.listProjects();
      return;
    }
    
    if (command === 'help' || command === '?') {
      this.showProjectModeHelp();
      return;
    }
    
    this.printToConsole(`Unknown command: ${input}`);
    this.printToConsole('Type "help" for available commands or "escape" to exit project mode');
  }

  exitProjectMode() {
    this.projectMode = false;
    this.printToConsole('Exited project mode');
    this.printToConsole('Type "project" to re-enter project mode');
  }

  showProjectModeHelp() {
    this.printToConsole('Project Mode Commands:');
    this.printToConsole('  add - Add new project link');
    this.printToConsole('  delete LINK LABEL HERE - Delete specified project');
    this.printToConsole('  list - Show all current projects');
    this.printToConsole('  help or ? - Show this help');
    this.printToConsole('  escape/exit/quit - Exit project mode');
  }

  async addProjectLink(label, url) {
    try {
      this.printToConsole('Adding project link...');
      
      // Get GitHub token
      const tokenInfo = this.getCurrentToken();
      if (!tokenInfo) {
        this.printToConsole('Error: GitHub authentication required');
        return;
      }
      
      // Load existing projects
      const projects = await this.loadProjectsFromGitHub();
      
      // Add new project
      const newProject = {
        label: label,
        url: url,
        id: Date.now().toString()
      };
      
      projects.push(newProject);
      
      // Save back to GitHub
      await this.saveProjectsToGitHub(projects);
      
      // Update the projects menu
      this.updateProjectsMenu(projects);
      
      this.printToConsole(`✅ Project link "${label}" added successfully!`);
      
    } catch (error) {
      console.error('❌ Error adding project link:', error);
      this.printToConsole(`Error: ${error.message}`);
    }
  }

  async deleteProject(label) {
    try {
      this.printToConsole(`Deleting project: ${label}`);
      
      // Get GitHub token
      const tokenInfo = this.getCurrentToken();
      if (!tokenInfo) {
        this.printToConsole('Error: GitHub authentication required');
        return;
      }
      
      // Load existing projects
      const projects = await this.loadProjectsFromGitHub();
      
      // Find and remove the project
      const projectIndex = projects.findIndex(p => p.label.toLowerCase() === label.toLowerCase());
      if (projectIndex === -1) {
        this.printToConsole(`❌ Project "${label}" not found`);
        return;
      }
      
      const deletedProject = projects.splice(projectIndex, 1)[0];
      
      // Save back to GitHub
      await this.saveProjectsToGitHub(projects);
      
      // Update the projects menu
      this.updateProjectsMenu(projects);
      
      this.printToConsole(`✅ Project "${deletedProject.label}" deleted successfully!`);
      
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      this.printToConsole(`Error: ${error.message}`);
    }
  }

  async listProjects() {
    try {
      const projects = await this.loadProjectsFromGitHub();
      
      if (projects.length === 0) {
        this.printToConsole('No projects found');
        return;
      }
      
      this.printToConsole(`Found ${projects.length} project(s):`);
      projects.forEach((project, index) => {
        this.printToConsole(`  ${index + 1}. ${project.title} → ${project.url}`);
      });
      
    } catch (error) {
      console.error('❌ Error listing projects:', error);
      this.printToConsole(`Error: ${error.message}`);
    }
  }

  async loadProjectsFromGitHub() {
    try {
      const tokenInfo = this.getCurrentToken();
      if (!tokenInfo) {
        console.warn('⚠️ loadProjectsFromGitHub: No GitHub token found');
        return [];
      }
      
      const token = tokenInfo.token;
      console.log(`🔍 loadProjectsFromGitHub: Using ${tokenInfo.type} token`);
      
      // Try to load from projects.json file
      const response = await fetch('https://api.github.com/repos/pigeonPious/page/contents/projects.json', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = atob(data.content);
        return JSON.parse(content);
      } else if (response.status === 404) {
        // File doesn't exist, return empty array
        console.log('📝 projects.json not found, returning empty array');
        return [];
      } else {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      return [];
    }
  }

  async saveProjectsToGitHub(projects) {
    try {
      const tokenInfo = this.getCurrentToken();
      if (!tokenInfo) {
        throw new Error('GitHub authentication required');
      }
      
      const token = tokenInfo.token;
      console.log(`💾 saveProjectsToGitHub: Using ${tokenInfo.type} token`);
      
      // Get current file info if it exists
      let sha = null;
      try {
        const getResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/projects.json', {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (getResponse.ok) {
          const data = await getResponse.json();
          sha = data.sha;
        }
      } catch (error) {
        // File doesn't exist, that's fine
        console.log('📝 projects.json not found, will create new file');
      }
      
      // Prepare content
      const content = JSON.stringify(projects, null, 2);
      const encodedContent = btoa(content);
      
      // Create or update file
      const method = sha ? 'PUT' : 'POST';
      const url = 'https://api.github.com/repos/pigeonPious/page/contents/projects.json';
      
      const body = {
        message: sha ? `Update projects: Add ${projects[projects.length - 1].label}` : 'Add projects.json',
        content: encodedContent
      };
      
      if (sha) {
        body.sha = sha;
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save projects: ${response.status}`);
      }
      
      console.log('✅ Projects saved to GitHub');
      
    } catch (error) {
      console.error('❌ Error saving projects:', error);
      throw error;
    }
  }



  // This function is no longer needed but keeping for compatibility
  setupImageMagazineButtons() {
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



  createImageMagazine() {
    const magazine = document.createElement('div');
    magazine.id = 'imageMagazine';
    magazine.className = 'image-magazine-only';
    magazine.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 500px;
      background: var(--bg);
      border: 1px solid var(--border);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      cursor: move;
    `;
    
    // Header with import button
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 4px 8px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg);
      color: var(--fg);
      cursor: move;
      user-select: none;
    `;
    
    // Make entire magazine draggable
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    magazine.addEventListener('mousedown', (e) => {
      // Don't start drag if clicking on buttons or interactive elements
      if (e.target.tagName === 'BUTTON' || e.target.classList.contains('image-magazine-btn')) {
        return;
      }
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = magazine.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      magazine.style.cursor = 'grabbing';
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
        magazine.style.cursor = 'move';
      }
    });
    
    const importBtn = document.createElement('button');
    importBtn.textContent = 'Import';
    importBtn.type = 'button';
    importBtn.style.cssText = `
      font-weight: normal;
      color: var(--fg);
      cursor: pointer;
      font-size: 12px;
      padding: 2px 6px;
      background: transparent;
      border: none;
      outline: none;
      font-family: inherit;
      transition: color 0.2s;
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
    

    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.type = 'button';
    closeBtn.style.cssText = `
      color: var(--fg);
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      padding: 4px 8px;
      background: transparent;
      border: none;
      min-width: 20px;
      text-align: center;
      outline: none;
      font-family: inherit;
      transition: color 0.2s;
    `;
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
    console.log('🔍 Close button style.visibility:', closeBtn.style.visibility);
    console.log('🔍 Import button style.pointerEvents:', closeBtn.style.pointerEvents);
    

    
    // Content area
    const content = document.createElement('div');
    content.id = 'imageGallery';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 4px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 3px;
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
    
    // Don't start hidden - let showImagesModal control visibility
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
        border: 1px solid var(--border);
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s;
        background: transparent;
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
      
      // Add drag and drop functionality
      item.draggable = true;
      item.addEventListener('dragstart', (e) => {
        // Set both text data and image data for better compatibility
        e.dataTransfer.setData('text/plain', filename);
        e.dataTransfer.setData('text/html', `<img src="assets/${filename}" style="max-width: 200px; height: auto;">`);
        e.dataTransfer.effectAllowed = 'copy';
        item.style.opacity = '0.5';
      });
      
      item.addEventListener('dragend', () => {
        item.style.opacity = '1';
      });
      
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
      position: relative;
      float: left;
      margin-right: 16px;
      margin-bottom: 12px;
      width: 200px;
      height: 200px;
      clear: both;
      display: block;
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
    
    // Insert the image as a block element, not inline
    let inserted = false;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Check if selection is within the post content area
      if (visualEditor.contains(range.commonAncestorContainer) || 
          visualEditor === range.commonAncestorContainer) {
        // Insert as a block element
        const blockElement = document.createElement('div');
        blockElement.appendChild(imageContainer);
        range.insertNode(blockElement);
        range.collapse(false);
        inserted = true;
        console.log('✅ Image inserted at cursor position as block');
      }
    }
    
    if (!inserted) {
      // No selection, insert at the end of the post content
      const blockElement = document.createElement('div');
      blockElement.appendChild(imageContainer);
      visualEditor.appendChild(blockElement);
      console.log('✅ Image inserted at end of post as block');
    }
    
    // Add positioning overlay functionality with retry mechanism
    this.addImagePositioningOverlay(imageContainer);
    
    // Verify overlay was added, retry if needed
    setTimeout(() => {
      if (!imageContainer.querySelector('.image-position-overlay')) {
        console.log('⚠️ Overlay not found, retrying...');
        this.addImagePositioningOverlay(imageContainer);
      }
    }, 100);
    
    console.log('✅ Image inserted:', filename);
  }
  setupEditorDragAndDrop() {
    // Only setup once
    if (this.editorDragAndDropSetup) return;
    this.editorDragAndDropSetup = true;
    
    const visualEditor = document.getElementById('visualEditor');
    if (!visualEditor) return;
    
    // Prevent default drag behaviors
    visualEditor.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      visualEditor.classList.add('drag-over');
    });
    
    visualEditor.addEventListener('dragleave', (e) => {
      if (!visualEditor.contains(e.relatedTarget)) {
        visualEditor.classList.remove('drag-over');
      }
    });
    
    visualEditor.addEventListener('drop', (e) => {
      e.preventDefault();
      visualEditor.classList.remove('drag-over');
      
      // Try to get HTML data first for better preview
      let filename = e.dataTransfer.getData('text/html');
      if (filename) {
        // Extract filename from HTML if possible
        const match = filename.match(/src="assets\/([^"]+)"/);
        if (match) {
          filename = match[1];
        }
      }
      
      // Fallback to text data
      if (!filename) {
        filename = e.dataTransfer.getData('text/plain');
      }
      
      if (filename) {
        console.log('🖼️ Dropped image:', filename);
        this.insertImageToPost(filename);
      }
    });
    
    console.log('✅ Editor drag and drop setup complete');
  }



  addImagePositioningOverlay(imageContainer) {
    console.log('🔧 Adding positioning overlay to image container:', imageContainer);
    
    // Ensure the image container is properly set up
    if (!imageContainer || !imageContainer.appendChild) {
      console.error('❌ Invalid image container for overlay:', imageContainer);
      return;
    }
    
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
        background: transparent;
        color: var(--accent);
        border: none;
        padding: 6px 10px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
        pointer-events: auto;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      ">&lt;</button>
      <button class="pos-btn pos-row" style="
        background: transparent;
        color: var(--accent);
        border: none;
        padding: 6px 10px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
        pointer-events: auto;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      ">—</button>
      <button class="pos-btn pos-right" style="
        background: transparent;
        color: var(--accent);
        border: none;
        padding: 6px 10px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
        pointer-events: auto;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      ">&gt;</button>
      <button class="pos-btn pos-delete" style="
        position: absolute;
        top: 4px;
        right: 4px;
        background: transparent;
        color: var(--danger-color);
        border: none;
        padding: 4px 6px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
        pointer-events: auto;
        line-height: 1;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      ">×</button>
    `;
    
    // Ensure image container has relative positioning
    imageContainer.style.position = 'relative';
    
    // Add overlay to image container
    try {
      imageContainer.appendChild(overlay);
      console.log('✅ Overlay appended successfully');
    } catch (error) {
      console.error('❌ Failed to append overlay:', error);
      return;
    }
    
    // Verify overlay was added
    if (!imageContainer.querySelector('.image-position-overlay')) {
      console.error('❌ Overlay not found after append');
      return;
    }
    
    // Show overlay on mouseenter
    imageContainer.addEventListener('mouseenter', () => {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';
      console.log('🖱️ Overlay shown on mouseenter');
    });
    
    // Hide overlay on mouseleave
    imageContainer.addEventListener('mouseleave', () => {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      console.log('🖱️ Overlay hidden on mouseleave');
    });
    
    // Add click handlers for positioning
    const leftBtn = overlay.querySelector('.pos-left');
    const rowBtn = overlay.querySelector('.pos-row');
    const rightBtn = overlay.querySelector('.pos-right');
    const deleteBtn = overlay.querySelector('.pos-delete');
    
    // Verify all buttons were found
    if (!leftBtn || !rowBtn || !rightBtn || !deleteBtn) {
      console.error('❌ Some positioning buttons not found:', { leftBtn, rowBtn, rightBtn, deleteBtn });
      return;
    }
    
    // Left positioning (float left)
    leftBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageContainer.style.cssText = `
        position: relative;
        float: left;
        margin-right: 16px;
        margin-bottom: 12px;
        width: 200px;
        height: 200px;
        clear: both;
      `;
      console.log('✅ Image positioned left');
    });
    
    // Row positioning (inline, no clear)
    rowBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageContainer.style.cssText = `
        position: relative;
        float: left;
        margin-right: 16px;
        margin-bottom: 12px;
        width: 200px;
        height: 200px;
        clear: none;
        display: block;
      `;
      console.log('✅ Image positioned left');
    });
    
    // Right positioning (float right)
    rightBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageContainer.style.cssText = `
        position: relative;
        float: right;
        margin-left: 16px;
        margin-bottom: 12px;
        width: 200px;
        height: 200px;
        clear: both;
      `;
      console.log('✅ Image positioned right');
    });
    
    // Delete button functionality
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this image?')) {
        imageContainer.remove();
        console.log('✅ Image deleted from post');
      }
    });
    
    // Setup drag and drop for the visual editor if not already done
    this.setupEditorDragAndDrop();
    
    console.log('✅ Image positioning overlay setup complete');
  }

  // Function to check and fix any images missing overlays
  fixMissingImageOverlays() {
    console.log('🔧 Checking for images missing overlays...');
    
    const visualEditor = document.getElementById('visualEditor');
    if (!visualEditor) return;
    
    const imageContainers = visualEditor.querySelectorAll('.image-container');
    let fixedCount = 0;
    
    imageContainers.forEach(container => {
      if (!container.querySelector('.image-position-overlay')) {
        console.log('⚠️ Found image container without overlay, fixing...');
        this.addImagePositioningOverlay(container);
        fixedCount++;
      }
    });
    
    if (fixedCount > 0) {
      console.log(`✅ Fixed ${fixedCount} missing image overlays`);
    } else {
      console.log('✅ All image overlays are present');
    }
  }

  // Helper function to sanitize content for safe publishing
  sanitizeContent(content) {
    if (!content) return '';
    
    console.log('🧹 Sanitizing content for publishing...');
    
    // Remove or replace problematic characters
    let sanitized = content
      // Replace smart quotes with regular quotes
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      // Replace em dashes and en dashes with regular dashes
      .replace(/[\u2013\u2014]/g, '-')
      // Replace other problematic Unicode characters
      .replace(/[\u2022\u2026]/g, '')
      // Remove null characters
      .replace(/\0/g, '')
      // Remove other control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    console.log('🧹 Content sanitization complete');
    return sanitized;
  }



  // Function to update posts index incrementally (much more efficient)
  async updatePostsIndexIncrementally(postData, isEdit) {
    console.log('🔄 Updating posts index incrementally...');
    
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        console.error('❌ No GitHub token found for index update');
        return false;
      }
      
      // Get current index file to get its SHA
      const indexResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts/index.json', {
        headers: {
          'Authorization': `token ${token}`,
        }
      });
      
      if (!indexResponse.ok) {
        console.error('❌ Could not fetch current index file:', indexResponse.status);
        return false;
      }
      
      const indexData = await indexResponse.json();
      const currentIndex = JSON.parse(atob(indexData.content));
      
      console.log('📊 Current index has', currentIndex.length, 'posts');
      
      // Create new index entry for this post
      const newIndexEntry = {
        slug: postData.slug,
        title: postData.title,
        date: postData.date,
        keywords: postData.keywords || 'general'
      };
      
      let updatedIndex;
      
      if (isEdit) {
        // For edits: update existing entry
        updatedIndex = currentIndex.map(post => 
          post.slug === postData.slug ? newIndexEntry : post
        );
        console.log('✏️ Updated existing post in index:', postData.slug);
      } else {
        // For new posts: add to beginning (newest first)
        updatedIndex = [newIndexEntry, ...currentIndex];
        console.log('➕ Added new post to index:', postData.slug);
      }
      
      // Sort by date (newest first)
      updatedIndex.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Update local posts array
      this.posts = updatedIndex;
      localStorage.setItem('posts', JSON.stringify(updatedIndex));
      
      // Update the index file on GitHub
      const updateResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts/index.json', {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: isEdit ? 
            `Update post in index: ${postData.title}` : 
            `Add new post to index: ${postData.title}`,
          content: btoa(JSON.stringify(updatedIndex, null, 2)),
          sha: indexData.sha,
          branch: 'main'
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Index updated successfully on GitHub');
        return true;
      } else {
        console.error('❌ Failed to update index:', updateResponse.status);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error updating posts index:', error);
      return false;
    }
  }

  // Function to rebuild the entire posts index from actual GitHub files (kept for manual use)
  // ⚠️ WARNING: This function makes N+3 API calls where N = number of posts
  // Use only when you need to completely rebuild the index (e.g., after manual file changes)
  // For normal post publishing, use updatePostsIndexIncrementally() instead
  async rebuildPostsIndexFromGitHub() {
    console.log('🔄 Rebuilding posts index from actual GitHub files...');
    console.log('⚠️ This will make many API calls - use only when necessary!');
    
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        console.error('❌ No GitHub token found for index rebuild');
        return false;
      }
      
      // Get the list of all files in the posts directory
      const postsResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts', {
        headers: {
          'Authorization': `token ${token}`,
        }
      });
      
      if (!postsResponse.ok) {
        console.error('❌ Failed to fetch posts directory:', postsResponse.status);
        return false;
      }
      
      const postsDirectory = await postsResponse.json();
      console.log('📁 Found posts directory contents:', postsDirectory.length, 'items');
      
      // Filter for JSON files (actual posts, not index.json)
      const postFiles = postsDirectory.filter(item => 
        item.type === 'file' && 
        item.name.endsWith('.json') && 
        item.name !== 'index.json'
      );
      
      console.log('📄 Found post files:', postFiles.length);
      console.log('⚠️ Will make', postFiles.length + 3, 'API calls total');
      
      // Build new index by reading each post file
      const newIndex = [];
      
      for (const postFile of postFiles) {
        try {
          const postResponse = await fetch(postFile.url, {
            headers: {
              'Authorization': `token ${token}`,
            }
          });
          
          if (postResponse.ok) {
            const postData = await postResponse.json();
            const postContent = JSON.parse(atob(postData.content));
            
            // Extract metadata for index
            const indexEntry = {
              slug: postContent.slug,
              title: postContent.title,
              date: postContent.date,
              keywords: postContent.keywords || 'general'
            };
            
            newIndex.push(indexEntry);
            console.log('✅ Added to index:', indexEntry.title);
          } else {
            console.warn('⚠️ Could not read post file:', postFile.name, postResponse.status);
          }
        } catch (error) {
          console.error('❌ Error reading post file:', postFile.name, error);
        }
      }
      
      // Sort by date (newest first)
      newIndex.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      console.log('📊 New index built with', newIndex.length, 'posts');
      
      // Get current index file to get its SHA
      const indexResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts/index.json', {
        headers: {
          'Authorization': `token ${token}`,
        }
      });
      
      if (!indexResponse.ok) {
        console.error('❌ Could not fetch current index file:', indexResponse.status);
        return false;
      }
      
      const indexData = await indexResponse.json();
      
      // Update the index file with the new data
      const updateResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts/index.json', {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Rebuild posts index from actual files - ensure perfect synchronization',
          content: btoa(JSON.stringify(newIndex, null, 2)),
          sha: indexData.sha,
          branch: 'main'
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Posts index rebuilt and updated successfully');
        // Update local posts array
        this.posts = newIndex;
        return true;
      } else {
        console.error('❌ Failed to update index file:', updateResponse.status);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error rebuilding posts index:', error);
      return false;
    }
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
        console.log('No GitHub token found, redirecting to login');
        this.showGitHubLogin();
        return;
      }
      
      // Check if user is authenticated
              console.log('Checking authentication...');
      const isAuthenticated = await this.checkAuthentication();
              console.log('Authentication result:', isAuthenticated);
      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
        this.showGitHubLogin();
        return;
      }
      console.log('Authentication successful, proceeding with publish...');
      
      // Get current flags from localStorage (more reliable than DOM)
      const currentFlags = localStorage.getItem('current_post_flags') || '';
      const finalFlags = currentFlags.trim() || 'general';
      
      console.log('🏷️ Current flags from localStorage:', currentFlags);
      console.log('🏷️ Final flags for post:', finalFlags);
      
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
          // Try multiple approaches to get the SHA
          let shaFound = false;
          
          // Method 1: Try GitHub API with auth
          try {
            const postResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${originalSlug}.json`, {
              headers: {
                'Authorization': `token ${githubToken}`,
              }
            });
            
            if (postResponse.ok) {
              const postData = await postResponse.json();
              currentSha = postData.sha;
              shaFound = true;
              console.log('✅ Got current SHA for edit (GitHub API):', currentSha);
            } else {
              console.warn('⚠️ GitHub API returned status for SHA fetch:', postResponse.status);
            }
          } catch (error) {
            console.warn('⚠️ Error getting SHA from GitHub API:', error);
          }
          
          // Method 2: Try GitHub API without auth (public access)
          if (!shaFound) {
            try {
              const publicResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${originalSlug}.json`);
              
              if (publicResponse.ok) {
                const postData = await publicResponse.json();
                currentSha = postData.sha;
                shaFound = true;
                console.log('✅ Got current SHA for edit (public API):', currentSha);
              } else {
                console.warn('⚠️ Public API returned status for SHA fetch:', publicResponse.status);
              }
            } catch (error) {
              console.warn('⚠️ Error getting SHA from public API:', error);
            }
          }
          
          // Method 3: Try to get SHA from local posts cache
          if (!shaFound && this.posts && this.posts.length > 0) {
            const localPost = this.posts.find(p => p.slug === originalSlug);
            if (localPost && localPost.sha) {
              currentSha = localPost.sha;
              shaFound = true;
              console.log('✅ Got current SHA for edit (local cache):', currentSha);
            }
          }
          
          if (!shaFound) {
            console.warn('⚠️ Could not get SHA for edit - will try to create new file');
          }
        } catch (error) {
          console.warn('⚠️ Could not parse edit data:', error);
        }
      }
      
      // Create post data - use original slug for edits, new slug for new posts
      const postData = {
        slug: isEdit ? originalSlug : title.toLowerCase().replace(/[^a-z0-9]/gi, '-'),
        title: title,
        date: new Date().toISOString().split('T')[0].replace(/-/g, '-'),
        keywords: finalFlags,
        content: content
      };
      
      console.log('📝 Post data prepared:', postData);
      
      // Check for duplicate posts (only for new posts, not edits)
      if (!isEdit) {
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
          if (duplicatePost.sha) {
            currentSha = duplicatePost.sha;
            console.log('✅ Using SHA from duplicate check:', currentSha);
          } else {
                    // Always try to fetch SHA for existing posts, even if duplicate check failed
        console.log('🔄 Need to fetch SHA for existing post...');
        
        // Try multiple methods to get SHA
        let shaFound = false;
        
        // Method 1: Try public GitHub API
        try {
          const shaResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${postData.slug}.json`);
          if (shaResponse.ok) {
            const shaData = await shaResponse.json();
            currentSha = shaData.sha;
            shaFound = true;
            console.log('✅ Successfully fetched SHA (public API):', currentSha);
          } else {
            console.warn('⚠️ Public API failed to fetch SHA, status:', shaResponse.status);
          }
        } catch (shaError) {
          console.error('❌ Error fetching SHA from public API:', shaError);
        }
        
        // Method 2: Try authenticated GitHub API
        if (!shaFound && githubToken) {
          try {
            const authShaResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${postData.slug}.json`, {
              headers: {
                'Authorization': `token ${githubToken}`,
              }
            });
            if (authShaResponse.ok) {
              const shaData = await authShaResponse.json();
              currentSha = shaData.sha;
              shaFound = true;
              console.log('✅ Successfully fetched SHA (authenticated API):', currentSha);
            } else {
              console.warn('⚠️ Authenticated API failed to fetch SHA, status:', authShaResponse.status);
            }
          } catch (authShaError) {
            console.error('❌ Error fetching SHA from authenticated API:', authShaError);
          }
        }
        
        if (!shaFound) {
          console.warn('⚠️ Could not fetch SHA from any method - will try to create new file');
        }
          }
        }
      }
      
      // Token already retrieved at function start
      
      // For edits, we always use the original slug, so no slug change handling needed
      // The post will be updated in place with the new content, title, and flags
      
      // If we still don't have a SHA for an edit, we'll need to handle this specially
      if (isEdit && !currentSha) {
        console.log('⚠️ No SHA available for edit - will try alternative approach');
        // We'll try to create a new file, which might fail if it already exists
        // But this is better than the current 422 error
      }
      
      // Sanitize content to remove problematic characters
      const sanitizedPostData = {
        ...postData,
        content: this.sanitizeContent(postData.content)
      };
      
      // Create post file content
      const postContent = JSON.stringify(sanitizedPostData, null, 2);
      
      // Safely encode content to base64, handling special characters
      let encodedContent;
      try {
        // First try standard btoa
        encodedContent = btoa(postContent);
      } catch (error) {
        console.log('⚠️ Standard btoa failed, using UTF-8 safe encoding...');
        // Fallback: convert to UTF-8 bytes then encode
        encodedContent = btoa(unescape(encodeURIComponent(postContent)));
      }
      
      console.log('📝 Content encoding successful, length:', encodedContent.length);
      
      // Publish directly to GitHub using GitHub API
      const requestBody = {
        message: commitMessage,
        content: encodedContent,
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
              console.log('API endpoint:', `https://api.github.com/repos/pigeonPious/page/contents/posts/${postData.slug}.json`);
      console.log('Token length:', githubToken ? githubToken.length : 0);
      
      const response = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${postData.slug}.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        console.log('✅ Post published successfully to GitHub');
        
        // Update the posts index incrementally instead of rebuilding from scratch
        console.log('🔄 Updating posts index incrementally...');
        const indexUpdated = await this.updatePostsIndexIncrementally(postData, isEdit);
        
        if (indexUpdated) {
          // Clear edit data after successful publish
          if (isEdit) {
            localStorage.removeItem('editPostData');
            console.log('🧹 Edit data cleared after successful publish');
          }
          

          
          this.showMenuStyle1Message(`🎉 Post published successfully!\n\nTitle: ${title}\nSlug: ${postData.slug}\n\nYour post is now live on GitHub!\n\nIndex updated efficiently with minimal API calls.`, 'success');
          
          // Redirect to the published post after a short delay
          setTimeout(() => {
            window.location.href = `index.html?post=${postData.slug}`;
          }, 3000);
        } else {
          this.showMenuStyle1Message('⚠️ Post published but index update failed. Please refresh the page to see updated navigation.', 'warning');
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
      } else if (error.message && error.message.includes('InvalidCharacterError')) {
        errorMessage = 'Content contains invalid characters. This usually happens with special formatting or copied text. Please try editing the content and removing any unusual characters.';
      }
      
      this.showMenuStyle1Message(`❌ Failed to publish post: ${errorMessage}`, 'error');
      }
      
    } catch (error) {
      console.error('❌ Error publishing post:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages
      let userMessage = 'Error publishing post. ';
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        userMessage += 'Network error - please check your internet connection.';
      } else if (error.message && error.message.includes('sha')) {
        userMessage += 'SHA validation error - please try refreshing and editing again.';
      } else if (error.message) {
        userMessage += error.message;
      } else {
        userMessage += 'Please check your connection and try again.';
      }
      
      this.showMenuStyle1Message(userMessage, 'error');
    }
  }

  async updatePostsIndex(postData) {
    try {
      const token = localStorage.getItem('github_token');
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
            // Update existing entry
            currentIndex[existingIndex] = {
              slug: postData.slug,
              title: postData.title,
              date: postData.date,
              keywords: postData.keywords
            };
            console.log('✅ Updated existing post in index:', postData.slug);
          } else {
            // For edits, we should always find the existing post
            // If not found, this indicates an error in the edit process
            console.error('❌ Edit post not found in index:', postData.slug);
            console.error('❌ Available slugs:', currentIndex.map(p => p.slug));
            throw new Error(`Edit post '${postData.slug}' not found in posts index. This indicates a synchronization error.`);
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
      // Check for OAuth token first, then fall back to PAT
      const oauthToken = localStorage.getItem('github_oauth_token');
      const patToken = localStorage.getItem('github_token');
      const tokenType = localStorage.getItem('github_token_type');
      
      let token = null;
      let authMethod = null;
      
      if (oauthToken && tokenType === 'oauth') {
        token = oauthToken;
        authMethod = 'OAuth';
      } else if (patToken) {
        token = patToken;
        authMethod = 'PAT';
      }
      
      if (!token) {
        console.log('No GitHub token found in localStorage');
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
        const isAdmin = userData.login === 'pigeonPious';
        console.log(`Authentication check: ${isAdmin ? 'SUCCESS' : 'FAILED'} - User: ${userData.login} (${authMethod})`);
        return isAdmin;
      } else {
                  console.log(`Token validation failed with status: ${response.status} (${authMethod})`);
        // Token might be expired, remove it
        if (authMethod === 'OAuth') {
          localStorage.removeItem('github_oauth_token');
          localStorage.removeItem('github_token_type');
        } else {
          localStorage.removeItem('github_token');
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      // On error, remove the token to force re-authentication
      localStorage.removeItem('github_oauth_token');
      localStorage.removeItem('github_token');
      localStorage.removeItem('github_token_type');
      return false;
    }
  }

  // Helper method to check if current user is admin
  isAdmin() {
    // Check for OAuth token first, then fall back to PAT
    const oauthToken = localStorage.getItem('github_oauth_token');
    const patToken = localStorage.getItem('github_token');
    const tokenType = localStorage.getItem('github_token_type');
    
    if (oauthToken && tokenType === 'oauth') {
      return true; // OAuth tokens are more reliable
    } else if (patToken) {
      return true; // PAT fallback
    }
    
    return false;
  }

  // Helper method to get the current authentication token (OAuth or PAT)
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

  async deletePost(slug) {
    try {
      const tokenInfo = this.getCurrentToken();
      if (!tokenInfo) {
        console.warn('⚠️ deletePost: No GitHub token found');
        return false;
      }
      
      const token = tokenInfo.token;
      console.log(`🗑️ deletePost: Using ${tokenInfo.type} token`);
      
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
      const token = localStorage.getItem('github_token');
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
    console.log('Showing GitHub OAuth login...');
    
    // Get the PiousPigeon label position for anchoring
    const pigeonLabel = document.querySelector('.pigeon-label');
    if (!pigeonLabel) {
      console.log('⚠️ PiousPigeon label not found');
      return;
    }
    
    const labelRect = pigeonLabel.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    
    // Calculate position - anchor to right side of PiousPigeon label
    let left = labelRect.right + 10; // 10px to the right of the label
    let top = labelRect.bottom + 5; // 5px below the label
    
    // Adjust horizontal position if too close to right edge
    if (left + 350 > windowWidth - 20) {
      left = windowWidth - 370; // 350px width + 20px margin
    }
    
    // Create single-line input box (like flags input)
    const inputBox = document.createElement('div');
    inputBox.id = 'githubLoginInput';
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
    input.type = 'password';
    input.placeholder = '';
    input.style.cssText = `
      background: transparent;
      border: none;
      color: var(--menu-fg);
      font-size: 13px;
      width: 100%;
      outline: none;
      font-family: inherit;
    `;
    
    // Add help text below input
    const helpText = document.createElement('div');
    helpText.style.cssText = `
      font-size: 11px;
      color: var(--muted);
      margin-top: 4px;
      font-style: italic;
    `;
    helpText.textContent = '';
    
    inputBox.appendChild(input);
    inputBox.appendChild(helpText);
    document.body.appendChild(inputBox);
    input.focus();
    
    // Handle input events
    const handleInput = async (e) => {
      if (e.key === 'Enter') {
        const token = input.value.trim();
        if (token) {
          // Show loading state
          helpText.textContent = 'Authenticating...';
          helpText.style.color = 'var(--accent)';
          
          try {
            await this.authenticateWithToken(token);
            // Success - page will reload
          } catch (error) {
            // Show error message
            helpText.textContent = `Login failed: ${error.message}`;
            helpText.style.color = 'var(--danger-color)';
            input.focus();
          }
        }
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

  // Check GitHub API rate limit status
  async checkRateLimit() {
    try {
      const tokenInfo = this.getCurrentToken();
      let headers = {
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (tokenInfo && tokenInfo.token) {
        headers['Authorization'] = `token ${tokenInfo.token}`;
      }
      
      const response = await fetch('https://api.github.com/rate_limit', { headers });
      
      if (response.ok) {
        const rateLimitData = await response.json();
        const core = rateLimitData.resources.core;
        const search = rateLimitData.resources.search;
        
        console.log('📊 Rate Limit Status:', {
          core: {
            limit: core.limit,
            remaining: core.remaining,
            reset: new Date(core.reset * 1000).toLocaleString(),
            used: core.used
          },
          search: {
            limit: search.limit,
            remaining: search.remaining,
            reset: new Date(search.reset * 1000).toLocaleString(),
            used: search.used
          }
        });
        
        // Show rate limit status in the UI
        this.showRateLimitStatus(core, search);
        
        return { core, search };
      } else {
        console.warn('⚠️ Could not fetch rate limit info:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Error checking rate limit:', error);
      return null;
    }
  }

  // Show rate limit status in the UI
  showRateLimitStatus(core, search) {
    // Find or create rate limit status element
    let statusElement = document.getElementById('rate-limit-status');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.id = 'rate-limit-status';
      statusElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--menu-bg, #333);
        border: 1px solid var(--border, #555);
        padding: 15px;
        border-radius: 6px;
        font-size: 12px;
        color: var(--menu-fg, #fff);
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      `;
      document.body.appendChild(statusElement);
    }
    
    // Calculate remaining percentage
    const corePercent = Math.round((core.remaining / core.limit) * 100);
    const searchPercent = Math.round((search.remaining / search.limit) * 100);
    
    // Determine color based on remaining requests
    const getColor = (percent) => {
      if (percent > 50) return '#28a745'; // Green
      if (percent > 20) return '#ffc107'; // Yellow
      return '#dc3545'; // Red
    };
    
    const coreColor = getColor(corePercent);
    const searchColor = getColor(searchPercent);
    
    // Format reset time
    const resetTime = new Date(core.reset * 1000).toLocaleTimeString();
    
    statusElement.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold;">📊 GitHub API Rate Limit</div>
      
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>Core API:</span>
          <span style="color: ${coreColor};">${core.remaining}/${core.limit}</span>
        </div>
        <div style="background: #444; height: 4px; border-radius: 2px;">
          <div style="background: ${coreColor}; height: 100%; width: ${corePercent}%; border-radius: 2px;"></div>
        </div>
      </div>
      
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>Search API:</span>
          <span style="color: ${coreColor};">${search.remaining}/${search.limit}</span>
        </div>
        <div style="background: #444; height: 4px; border-radius: 2px;">
          <div style="background: ${searchColor}; height: 100%; width: ${searchPercent}%; border-radius: 2px;"></div>
        </div>
      </div>
      
      <div style="font-size: 11px; color: var(--muted, #888);">
        Resets at: ${resetTime}
      </div>
      
      <button onclick="this.parentElement.remove()" style="
        position: absolute;
        top: 5px;
        right: 5px;
        background: none;
        border: none;
        color: var(--muted, #888);
        cursor: pointer;
        font-size: 14px;
      ">×</button>
    `;
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (statusElement && statusElement.parentElement) {
        statusElement.remove();
      }
    }, 10000);
  }

  async authenticateWithToken(token) {
    if (!token) {
      throw new Error('Please enter a GitHub token');
    }
    
    // Test the token with GitHub API
    console.log('Testing GitHub token...');
    
    try {
      // Test user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${token}` }
      });
      
      if (!userResponse.ok) {
        throw new Error(`Token validation failed: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      console.log('Token validated for user:', userData.login);
      
      // Test repository access
      const repoResponse = await fetch('https://api.github.com/repos/pigeonPious/page', {
        headers: { 'Authorization': `token ${token}` }
      });
      
      if (!repoResponse.ok) {
        throw new Error(`Repository access failed: ${repoResponse.status}`);
      }
      
      console.log('Repository access confirmed');
      
      // Store the token
      localStorage.setItem('github_token', token);
      localStorage.setItem('github_user', userData.login);
      
      // Reload page immediately without confirmation
      location.reload();
      
    } catch (error) {
      console.error('Token validation failed:', error);
      throw error; // Re-throw the error so the caller can handle it
    }
  }

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
      link.removeEventListener('click', this.handleHoverNoteClick);
      
      // Add hover event listeners
      link.addEventListener('mouseenter', (e) => this.showHoverNotePreview(e));
      link.addEventListener('mouseleave', () => this.hideHoverNotePreview());
      
      // Add click handler for existing hovernotes with URLs
      const noteText = link.getAttribute('data-note');
      if (noteText && noteText.match(/(https?:\/\/[^\s]+)/i)) {
        link.addEventListener('click', (e) => this.handleHoverNoteClick(e));
      }
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
        console.log('OAuth callback successful');
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

  openCurrentPostInGitHub() {
          console.log('Opening current post in GitHub...');
    
    // Get the current post slug from localStorage or URL
    let postSlug = localStorage.getItem('current_post_slug');
    
    if (!postSlug) {
      // Try to get from URL if we're editing an existing post
      const urlParams = new URLSearchParams(window.location.search);
      postSlug = urlParams.get('post');
    }
    
    if (!postSlug) {
      console.log('⚠️ No post slug found - cannot open in GitHub');
      // Show a message to the user
      alert('No post to open. Please save or load a post first.');
      return;
    }
    
    // Construct the GitHub URL for the post file
    const githubUrl = `https://github.com/pigeonPious/page/blob/main/posts/${postSlug}.json`;
    
          console.log('Opening GitHub URL:', githubUrl);
    
    // Open in a new tab
    window.open(githubUrl, '_blank');
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
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      overflow-x: hidden;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      scrollbar-width: thin;
      scrollbar-color: var(--muted, #888) transparent;
    `;
    
    // Add invisible buffer zone around submenu for easier navigation
    const bufferZone = document.createElement('div');
    bufferZone.style.cssText = `
      position: absolute;
      left: -10px;
      top: -10px;
      right: -10px;
      bottom: -10px;
      z-index: 9999;
      pointer-events: none;
    `;
    submenu.appendChild(bufferZone);
    
    // Add devlog category groups first
    Object.keys(groupedPosts).sort().forEach(category => {
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
      posts.sort((a, b) => (a.title || '').localeCompare(b.title || '')).forEach(post => {
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
      generalPosts.sort((a, b) => (a.title || '').localeCompare(b.title || '')).forEach(post => {
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
    // This method is no longer used - projects menu is now static
    return;
    console.log('📋 Updating Projects submenu');
    
    // Find the projects dropdown container
    const projectsDropdown = document.querySelector('#projects-dropdown');
    if (!projectsDropdown) {
      console.log('⚠️ Projects dropdown not found');
      return;
    }
    
    // Find the projects menu item (the "Loading..." element)
    const projectsMenu = document.querySelector('#projects-menu');
    if (!projectsMenu) {
      console.log('⚠️ Projects menu not found');
      return;
    }
    
    // Filter for devlog posts
    console.log('📋 All posts for projects menu:', allPosts);
    const devlogPosts = allPosts.filter(post => {
      const postFlags = post.keywords || '';
      const hasDevlog = postFlags.includes('devlog');
      console.log(`📋 Post "${post.title}" has keywords: "${postFlags}", devlog: ${hasDevlog}`);
      return hasDevlog;
    });
    
    console.log('📋 Devlog posts found:', devlogPosts);
    
    if (devlogPosts.length === 0) {
      console.log('📋 No devlog posts found');
      projectsMenu.textContent = 'No projects found';
      return;
    }
    
    // Group posts by devlog subcategory
    const devlogCategories = {};
    devlogPosts.forEach(post => {
      const postFlags = post.keywords || '';
      const devlogFlag = postFlags.split(',').find(f => f.trim().startsWith('devlog:'));
      
      console.log(`📋 Processing post "${post.title}":`);
      console.log(`  - Keywords: "${postFlags}"`);
      console.log(`  - Devlog flag found: "${devlogFlag}"`);
      
      if (devlogFlag) {
        // Extract just the category name after "devlog:" and before any comma
        const category = devlogFlag.split(':')[1] || 'general';
        // Clean up category name for display - take everything before the first comma
        let displayName = category.trim().split(',')[0].trim();
        
        // Capitalize first letter of the category name
        if (displayName.length > 0) {
          displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();
        }
        
        console.log(`  - Category: "${category}" -> Display name: "${displayName}"`);
        
        if (!devlogCategories[displayName]) {
          devlogCategories[displayName] = [];
        }
        devlogCategories[displayName].push(post);
      } else if (postFlags.includes('devlog')) {
        // General devlog posts without subcategory
        console.log(`  - General devlog post (no subcategory)`);
        if (!devlogCategories['General']) {
          devlogCategories['General'] = [];
        }
        devlogCategories['General'].push(post);
      }
    });
    
    console.log('📋 Final devlog categories:', devlogCategories);
    
    // Create simple list of project categories
    const categoriesList = document.createElement('div');
    categoriesList.className = 'project-categories';
    categoriesList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 2px;
    `;
    
    // Add category entries
    Object.keys(devlogCategories).forEach(category => {
      const posts = devlogCategories[category];
      
      // Create category entry
      const categoryEntry = document.createElement('div');
      categoryEntry.className = 'menu-entry project-category';
      categoryEntry.textContent = `${category} >`;
      categoryEntry.style.cssText = `
        padding: 3px 6px;
        cursor: pointer;
        color: var(--fg);
        font-size: 12px;
        transition: background-color 0.15s ease;
        text-transform: capitalize;
      `;
      
      // Add hover effect
      categoryEntry.addEventListener('mouseenter', () => {
        categoryEntry.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      });
      
      categoryEntry.addEventListener('mouseleave', () => {
        categoryEntry.style.backgroundColor = 'transparent';
      });
      
      // Add click handler to show posts
      categoryEntry.addEventListener('click', () => {
        this.showCategoryWindow(category, posts);
      });
      
      categoriesList.appendChild(categoryEntry);
    });
    
    // Replace the "Loading..." text with the project categories
    projectsMenu.innerHTML = '';
    projectsMenu.appendChild(categoriesList);
    
    console.log('✅ Projects submenu updated with simple category list');
  }

  updateProjectsMenu(projects) {
    const projectsDropdown = document.getElementById('projects-dropdown');
    if (!projectsDropdown) return;
    
    // Clear existing content
    projectsDropdown.innerHTML = '';
    
    // Add projects
    if (projects && projects.length > 0) {
      projects.forEach(project => {
        const entry = document.createElement('div');
        entry.className = 'menu-entry';
        entry.textContent = project.label;
        
        entry.title = `Click to visit: ${project.url}`;
        
        entry.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(project.url, '_blank');
        });
        
        projectsDropdown.appendChild(entry);
      });
    } else {
      // Show message if no projects
      const noProjects = document.createElement('div');
      noProjects.textContent = 'No projects yet';
      noProjects.style.cssText = `
        padding: 8px 15px;
        color: var(--muted, #888);
        font-style: italic;
        text-align: center;
      `;
      projectsDropdown.appendChild(noProjects);
    }
  }

  async loadAndDisplayProjects() {
    try {
      console.log('🔍 Loading projects for menu display...');
      const projects = await this.loadProjectsFromGitHub();
      this.updateProjectsMenu(projects);
      console.log('✅ Projects menu updated with', projects.length, 'projects');
    } catch (error) {
      console.error('❌ Error loading projects for menu:', error);
    }
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

  showCategoryWindow(category, posts) {
    console.log(`📋 Opening category window for ${category} with ${posts.length} posts`);
    
    // Remove any existing category window
    const existingWindow = document.getElementById('category-window');
    if (existingWindow) {
      existingWindow.remove();
    }
    
    // Create the category window in menu style 1
    const window = document.createElement('div');
    window.id = 'category-window';
    window.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg);
      border: 1px solid var(--border);
      padding: 12px;
      min-width: 250px;
      max-width: 300px;
      max-height: 70vh;
      z-index: 10000;
      overflow-y: auto;
      font-family: inherit;
      cursor: move;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    // Create header with title and close button
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
      cursor: move;
    `;
    
    const title = document.createElement('div');
    title.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Posts`;
    title.style.cssText = `
      margin: 0;
      color: var(--fg);
      font-size: 13px;
      font-weight: bold;
      text-transform: capitalize;
    `;
    
    const closeButton = document.createElement('div');
    closeButton.className = 'close-button';
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      cursor: pointer;
      font-size: 16px;
      color: var(--fg);
      width: 20px;
      height: 20px;
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
      closeButton.style.color = 'var(--fg)';
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
      gap: 1px;
    `;
    
    posts.forEach(post => {
      const postEntry = document.createElement('div');
      postEntry.className = 'post-entry';
      postEntry.style.cssText = `
        padding: 4px 0;
        color: var(--fg);
        cursor: pointer;
        transition: background-color 0.15s ease;
        font-size: 13px;
      `;
      
      postEntry.textContent = post.title || post.slug;
      postEntry.title = `Click to open: ${post.title || post.slug}`;
      
      // Add hover effects
      postEntry.addEventListener('mouseenter', () => {
        postEntry.style.backgroundColor = 'var(--accent-color, #4a9eff)';
        postEntry.style.color = 'white';
      });
      
      postEntry.addEventListener('mouseleave', () => {
        postEntry.style.backgroundColor = 'var(--bg)';
        postEntry.style.color = 'var(--fg)';
      });
      
      // Add click handler to load post
      postEntry.addEventListener('click', () => {
        console.log(`📖 Loading post: ${post.title || post.slug}`);
        
        // Close the category window
        window.remove();
        
        // Load the post
        if (window.location.pathname.includes('editor.html')) {
          window.location.href = `index.html?post=${post.slug}`;
        } else {
          this.loadPost(post.slug);
        }
      });
      
      postsList.appendChild(postEntry);
    });
    
    window.appendChild(postsList);
    
    // Add to document
    document.body.appendChild(window);
    
    // Make window draggable
    this.makeWindowDraggable(window);
    
    // Close window on escape key
    const closeOnEscape = (e) => {
      if (e.key === 'Escape') {
        window.remove();
        document.removeEventListener('keydown', closeOnEscape);
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    
    // Move window to left side of screen
    setTimeout(() => {
      window.style.left = '20px';
      window.style.transform = 'none';
    }, 100);
    
    console.log(`✅ Category window opened for ${category} with ${posts.length} posts`);
  }
  // Show site map when viewing a post
  showSiteMap() {
    console.log('🔍 showSiteMap called');
    
    // Remove existing site map if present
    this.hideSiteMap();
    
    // Check for any remaining site maps in DOM
    const existingSiteMaps = document.querySelectorAll('#site-map');
    if (existingSiteMaps.length > 0) {
      console.log('⚠️ Found', existingSiteMaps.length, 'existing site maps, removing them');
      existingSiteMaps.forEach(map => map.remove());
    }
    
    // Also check if we already have a currentSiteMap reference
    if (this.currentSiteMap) {
      console.log('⚠️ currentSiteMap reference exists, removing it');
      this.currentSiteMap.remove();
      this.currentSiteMap = null;
    }
    
    // Get current post slug
    const currentSlug = localStorage.getItem('current_post_slug');
    
    // Create site map container
    const siteMap = document.createElement('div');
    siteMap.id = 'site-map';
    siteMap.style.cssText = `
      position: fixed;
      top: 19px;
      left: 2px;
      background: transparent;
      padding: 8px;
      z-index: 100;
      font-family: monospace;
      font-size: 11px;
      line-height: 1.2;
      color: var(--fg);
      opacity: 0.5;
      pointer-events: none;
      max-height: calc(100vh - 60px);
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      scrollbar-color: var(--muted) transparent;
    `;
    
    // Create content container
    const content = document.createElement('div');
    content.style.cssText = `
      pointer-events: auto;
      padding-right: 8px;
    `;
    
    // Fetch posts from GitHub and build tree (with local fallback)
    const loadPostsForSiteMap = async () => {
      try {
        // Try GitHub API first
        const response = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts/index.json');
        if (response.ok) {
          const indexData = await response.json();
          
          // GitHub API returns content in base64, need to decode
          if (indexData.content && indexData.encoding === 'base64') {
            try {
              const decodedContent = atob(indexData.content);
              const posts = JSON.parse(decodedContent);
              console.log('🔍 Site map: Loaded posts from GitHub:', posts.length);
              return posts;
            } catch (decodeError) {
              console.error('❌ Error decoding GitHub content for site map:', decodeError);
              throw new Error('Failed to decode GitHub content');
            }
          } else {
            throw new Error('Unexpected GitHub API response format');
          }
        } else {
          throw new Error(`GitHub API failed: ${response.status}`);
        }
      } catch (error) {
        console.log('🔄 Site map: GitHub API failed, trying local index.json...');
        
        // Fallback to local index.json
        try {
          const localResponse = await fetch('posts/index.json');
          if (localResponse.ok) {
            const localData = await localResponse.json();
            console.log('🔍 Site map: Loaded posts from local index:', localData);
            
            if (Array.isArray(localData)) {
              return localData;
            } else if (localData.posts && Array.isArray(localData.posts)) {
              return localData.posts;
            } else {
              throw new Error('Unexpected local index format');
            }
          } else {
            throw new Error(`Local index failed: ${localResponse.status}`);
          }
        } catch (localError) {
          console.error('❌ Site map: Both GitHub API and local index failed:', localError);
          throw localError;
        }
      }
    };
    
    // Load posts and build site map
    loadPostsForSiteMap().then(posts => {
            
            // Group posts by all flags (not just devlog)
        const categories = {};
        posts.forEach(post => {
          if (post.keywords && post.keywords.trim()) {
            // Split flags by comma and process each one
            const flags = post.keywords.split(',').map(f => f.trim()).filter(f => f.length > 0);
            
            flags.forEach(flag => {
              // Capitalize first letter of the flag
              let displayName = flag.charAt(0).toUpperCase() + flag.slice(1).toLowerCase();
              
              if (!categories[displayName]) {
                categories[displayName] = [];
              }
              
              // Only add post if it's not already in this category
              if (!categories[displayName].find(p => p.slug === post.slug)) {
                categories[displayName].push(post);
              }
            });
          }
        });
        
        // Build the tree structure
        let treeHTML = '';
        
        // Add empty vertical lines above the tree to connect with star button
        treeHTML += `<div style="margin-bottom: 2px;">|</div>`;
        treeHTML += `<div style="margin-bottom: 2px;">|</div>`;
        
        // Show all categories and posts
        Object.keys(categories).sort().forEach(category => {
          const postsInCategory = categories[category];
          
          // Check if current post is in this category
          const isCurrentCategory = currentSlug && postsInCategory.some(p => p.slug === currentSlug);
          
          if (isCurrentCategory) {
            // Show expanded category if current post is in it
            treeHTML += `<div style="margin-bottom: 6px;">`;
            treeHTML += `<span class="expanded-category-header" data-category="${category}" style="cursor: pointer; pointer-events: auto; font-weight: bold; margin-bottom: 1px;">└─${category}</span>`;
            
            // Show posts in category
            postsInCategory.sort((a, b) => (a.title || '').localeCompare(b.title || '')).forEach(post => {
              const isCurrentPost = post.slug === currentSlug;
              treeHTML += `<div style="margin-left: 12px; margin-bottom: 1px;">`;
              treeHTML += `<span class="post-link" data-slug="${post.slug}" style="cursor: pointer; pointer-events: auto; ${isCurrentPost ? 'font-weight: bold;' : ''}">`;
              treeHTML += `   ├─${post.title}`;
              treeHTML += `</span>`;
              treeHTML += `</div>`;
            });
            
            treeHTML += `</div>`;
          } else {
            // Show collapsed category with click to expand
            treeHTML += `<div style="margin-bottom: 4px;">`;
            treeHTML += `<span class="category-link" data-category="${category}" style="cursor: pointer; pointer-events: auto; font-weight: bold;">└─${category}</span>`;
            treeHTML += `</div>`;
          }
        });
        
        // Show uncategorized posts (always expanded)
        const uncategorized = posts.filter(post => !post.keywords || !post.keywords.trim());
        if (uncategorized.length > 0) {
          treeHTML += `<div style="margin-bottom: 6px;">`;
          treeHTML += `<div style="font-weight: bold; margin-bottom: 1px;">└─Uncategorized</div>`;
          uncategorized.sort((a, b) => (a.title || '').localeCompare(b.title || '')).forEach(post => {
            const isCurrentPost = post.slug === currentSlug;
            treeHTML += `<div style="margin-left: 12px; margin-bottom: 1px;">`;
            treeHTML += `<span class="post-link" data-slug="${post.slug}" style="cursor: pointer; pointer-events: auto; ${isCurrentPost ? 'font-weight: bold;' : ''}">`;
            treeHTML += `   ├─${post.title}`;
            treeHTML += `</span>`;
            treeHTML += `</div>`;
          });
          treeHTML += `</div>`;
        }
        
        content.innerHTML = treeHTML;
        
        // Add click handlers for post links
        const postLinks = content.querySelectorAll('.post-link');
        postLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const slug = link.getAttribute('data-slug');
            
            if (window.location.pathname.includes('editor.html')) {
              // In editor mode: populate the editor with this post
              console.log(`📝 Editor mode: Loading post ${slug} for editing`);
              this.loadEditDataForPost(slug);
            } else {
              // In blog mode: navigate to the post
              console.log(`📖 Blog mode: Loading post ${slug} for viewing`);
              this.loadPost(slug);
            }
            // Don't close site map - keep it open
          });
        });
        
        // Add click handlers for category links
        const categoryLinks = content.querySelectorAll('.category-link');
        categoryLinks.forEach(link => {
          link.addEventListener('click', () => {
            const category = link.getAttribute('data-category');
            this.expandCategoryInSiteMap(category, posts);
          });
        });
        
        // Add click handlers for expanded category headers (to collapse)
        const expandedCategoryHeaders = content.querySelectorAll('.expanded-category-header');
        expandedCategoryHeaders.forEach(header => {
          header.addEventListener('click', () => {
            const category = header.getAttribute('data-category');
            this.collapseCategoryInSiteMap(category, posts);
          });
        });
        
        // Add content to site map
        siteMap.appendChild(content);
        
        // Add to page
        document.body.appendChild(siteMap);
        
        // Store reference
        this.currentSiteMap = siteMap;
        
        // Add scroll event listener to show scroll indicators
        siteMap.addEventListener('scroll', () => {
          const { scrollTop, scrollHeight, clientHeight } = siteMap;
          
          // Add/remove fade indicators based on scroll position
          if (scrollTop > 0) {
            siteMap.style.setProperty('--show-top-fade', '1');
          } else {
            siteMap.style.setProperty('--show-top-fade', '0');
          }
          
          if (scrollTop < scrollHeight - clientHeight - 1) {
            siteMap.style.setProperty('--show-bottom-fade', '1');
          } else {
            siteMap.style.setProperty('--show-bottom-fade', '0');
          }
        });
        
        // Add resize listener to auto-close site map when window gets too narrow
        this.siteMapResizeHandler = () => {
          const windowWidth = window.innerWidth;
          const siteMapWidth = 280; // Approximate width of site map content
          const minContentWidth = 600; // Minimum width needed for main content
          
          if (windowWidth < (siteMapWidth + minContentWidth)) {
            this.hideSiteMap();
          }
        };
        
        window.addEventListener('resize', this.siteMapResizeHandler);
        
        // Check initial window size
        this.siteMapResizeHandler();
        
      }).catch(error => {
        console.error('Error loading posts for site map:', error);
        content.innerHTML = '<div style="color: var(--fg);">Error loading site map</div>';
        
        // Still add the site map container even if loading failed
        siteMap.appendChild(content);
        document.body.appendChild(siteMap);
        this.currentSiteMap = siteMap;
      });
    

  }
  
  // Expand a category in the site map
  expandCategoryInSiteMap(categoryName, allPosts) {
    if (!this.currentSiteMap) return;
    
    const currentSlug = localStorage.getItem('current_post_slug');
    const content = this.currentSiteMap.querySelector('div');
    
    // Find the category link to replace
    const categoryLink = content.querySelector(`[data-category="${categoryName}"]`);
    if (!categoryLink) return;
    
    // Get posts for this category using new flag-based logic
    const categoryPosts = allPosts.filter(post => {
      if (post.keywords && post.keywords.trim()) {
        const flags = post.keywords.split(',').map(f => f.trim()).filter(f => f.length > 0);
        return flags.some(flag => {
          const displayName = flag.charAt(0).toUpperCase() + flag.slice(1).toLowerCase();
          return displayName === categoryName;
        });
      }
      return false;
    });
    
    // Create expanded category HTML
    let expandedHTML = '';
    expandedHTML += `<div style="margin-bottom: 6px;">`;
    expandedHTML += `<span class="expanded-category-header" data-category="${categoryName}" style="cursor: pointer; pointer-events: auto; font-weight: bold; margin-bottom: 1px;">└─${categoryName}</span>`;
    
    // Show posts in category
    categoryPosts.sort((a, b) => (a.title || '').localeCompare(b.title || '')).forEach(post => {
      const isCurrentPost = post.slug === currentSlug;
      expandedHTML += `<div style="margin-left: 12px; margin-bottom: 1px;">`;
      expandedHTML += `<span class="post-link" data-slug="${post.slug}" style="cursor: pointer; pointer-events: auto; ${isCurrentPost ? 'font-weight: bold;' : ''}">`;
      expandedHTML += `   ├─${post.title}`;
      expandedHTML += `</span>`;
      expandedHTML += `</div>`;
    });
    
    expandedHTML += `</div>`;
    
    // Replace the category link with expanded content
    const categoryContainer = categoryLink.parentElement;
    categoryContainer.outerHTML = expandedHTML;
    
    // Re-add click handlers for the new post links
    const newPostLinks = this.currentSiteMap.querySelectorAll('.post-link');
    newPostLinks.forEach(link => {
      // First, remove any existing listeners to avoid duplicates
      link.replaceWith(link.cloneNode(true));
    });
    
    // Now, get the fresh links and add the correct listener
    const freshPostLinks = this.currentSiteMap.querySelectorAll('.post-link');
    freshPostLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const slug = link.getAttribute('data-slug');
        if (window.location.pathname.includes('editor.html')) {
          console.log(`📝 Editor mode: Loading post ${slug} for editing from expanded category`);
          this.loadEditDataForPost(slug);
        } else {
          this.loadPost(slug);
        }
      });
    });
    
    // Add click handler for the new expanded category header
    const newCategoryHeader = this.currentSiteMap.querySelector(`[data-category="${categoryName}"]`);
    if (newCategoryHeader) {
      newCategoryHeader.addEventListener('click', () => {
        this.collapseCategoryInSiteMap(categoryName, allPosts);
      });
    }
  }
  
  // Collapse a category in the site map
  collapseCategoryInSiteMap(categoryName, allPosts) {
    if (!this.currentSiteMap) return;
    
    const content = this.currentSiteMap.querySelector('div');
    
    // Find the expanded category to replace
    const expandedCategory = content.querySelector(`[data-category="${categoryName}"]`);
    if (!expandedCategory) return;
    
    // Get posts for this category
    const categoryPosts = allPosts.filter(post => {
      if (post.keywords) {
        const categoryMatch = post.keywords.match(/devlog:([^,]+)/);
        if (categoryMatch) {
          return categoryMatch[1].trim() === categoryName;
        }
      }
      return false;
    });
    
    // Create collapsed category HTML
    const collapsedHTML = `<div style="margin-bottom: 4px;"><span class="category-link" data-category="${categoryName}" style="cursor: pointer; pointer-events: auto; font-weight: bold;">└─${categoryName} (${categoryPosts.length})</span></div>`;
    
    // Replace the expanded category with collapsed content
    const categoryContainer = expandedCategory.closest('div');
    categoryContainer.outerHTML = collapsedHTML;
    
    // Re-add click handler for the new category link
    const newCategoryLink = content.querySelector(`[data-category="${categoryName}"]`);
    if (newCategoryLink) {
      newCategoryLink.addEventListener('click', () => {
        this.expandCategoryInSiteMap(categoryName, allPosts);
      });
    }
  }

  // Hide site map
  hideSiteMap() {
    console.log('🔍 hideSiteMap called, currentSiteMap:', this.currentSiteMap);
    
    if (this.currentSiteMap) {
      // Remove resize listener
      if (this.siteMapResizeHandler) {
        window.removeEventListener('resize', this.siteMapResizeHandler);
        this.siteMapResizeHandler = null;
      }
      
      this.currentSiteMap.remove();
      this.currentSiteMap = null;
      console.log('✅ Site map removed');
      
      // If this was a manual hide, mark it so automatic show doesn't interfere
      if (this.siteMapManuallyToggled) {
        this.siteMapManuallyHidden = true;
      }
    } else {
      console.log('⚠️ No currentSiteMap reference found');
      
      // Fallback: remove any site maps by ID
      const siteMaps = document.querySelectorAll('#site-map');
      if (siteMaps.length > 0) {
        console.log('🔍 Found', siteMaps.length, 'site maps by ID, removing them');
        siteMaps.forEach(map => map.remove());
      }
    }
  }

  // Toggle site map visibility
  toggleSiteMap() {
    console.log('🔍 toggleSiteMap called');
    
    // Mark that user has manually toggled the site map
    this.siteMapManuallyToggled = true;
    
    if (this.currentSiteMap) {
      this.hideSiteMap();
    } else {
      this.showSiteMap();
    }
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

  toggleEditorMode() {
    console.log('📝 Toggling editor mode...');
    
    // Get the toggle button
    const toggleBtn = document.getElementById('toggle-editor-mode');
    if (!toggleBtn) {
      console.error('❌ Toggle button not found');
      return;
    }
    
    // Get the visual editor
    const visualEditor = document.getElementById('visualEditor');
    if (!visualEditor) {
      console.error('❌ Visual editor not found');
      return;
    }
    
    // Check current mode
    const isRawMode = visualEditor.classList.contains('raw-mode');
    
    if (isRawMode) {
      // Switch to Preview mode - restore original HTML
      if (visualEditor.dataset.originalHtml) {
        visualEditor.innerHTML = visualEditor.dataset.originalHtml;
      }
      visualEditor.classList.remove('raw-mode');
      toggleBtn.textContent = 'Raw Mode';
      console.log('✅ Switched to Preview mode');
    } else {
      // Switch to Raw mode - save current HTML and show raw content
      visualEditor.dataset.originalHtml = visualEditor.innerHTML;
      
      // Get the raw HTML content
      let rawContent = visualEditor.innerHTML;
      
      // Format the HTML for better readability
      rawContent = this.formatHTML(rawContent);
      
      // Set the content to show raw HTML
      visualEditor.innerHTML = `<pre style="margin: 0; padding: 0; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word; color: var(--fg); background: transparent;">${this.escapeHtml(rawContent)}</pre>`;
      
      visualEditor.classList.add('raw-mode');
      toggleBtn.textContent = 'Preview Mode';
      console.log('✅ Switched to Raw mode');
    }
  }

  // Helper function to format HTML for better readability
  formatHTML(html) {
    // Add line breaks and indentation for better readability
    return html
      .replace(/></g, '>\n<')
      .replace(/(<[^>]+>)/g, (match) => {
        // Add indentation based on tag depth
        const depth = (match.match(/<\//g) || []).length;
        const indent = '  '.repeat(Math.max(0, depth));
        return indent + match;
      });
  }

  // Helper function to escape HTML for display
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
      element.removeEventListener('click', this.handleHoverNoteClick);
      
      // Add hover event listeners
      element.addEventListener('mouseenter', (e) => this.showHoverNote(e));
      element.addEventListener('mouseleave', () => this.hideHoverNote());
      element.addEventListener('mousemove', (e) => this.updateHoverNotePosition(e));
      
      // Add click handler for existing hovernotes with URLs
      const noteText = element.getAttribute('data-note');
      if (noteText && noteText.match(/(https?:\/\/[^\s]+)/i)) {
        element.addEventListener('click', (e) => this.handleHoverNoteClick(e));
      }
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
        background: var(--menu-bg);
        border: 1px solid var(--border);
        padding: 6px 8px;
        min-width: 140px;
        max-width: 260px;
        font-size: 12px;
        color: var(--menu-fg);
        display: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        cursor: default;
      `;
      document.body.appendChild(tooltip);
    }
    
    // Check if note contains a URL
    const urlMatch = noteText.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      const url = urlMatch[1];
      tooltip.innerHTML = noteText.replace(url, `<span style="color: var(--accent-color, #4a9eff); text-decoration: underline; cursor: pointer;">${url}</span>`);
      tooltip.style.cursor = 'pointer';
      tooltip.style.pointerEvents = 'auto';
      
      // Add click handler to open URL
      tooltip.onclick = () => {
        window.open(url, '_blank');
      };
      
      // Add visual indication that tooltip is clickable
      tooltip.style.borderColor = 'var(--accent)';
      tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    } else {
      tooltip.textContent = noteText;
      tooltip.style.cursor = 'default';
      tooltip.style.pointerEvents = 'none';
      tooltip.onclick = null;
      tooltip.style.borderColor = 'var(--border)';
      tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    }
    
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

  handleHoverNoteClick(event) {
    const element = event.target;
    const noteText = element.getAttribute('data-note');
    
    if (!noteText) return;
    
    // Check if note contains a URL
    const urlMatch = noteText.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      const url = urlMatch[1];
      console.log('🔗 Opening URL from hovernote:', url);
      window.open(url, '_blank');
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
        cursor: default;
      `;
      document.body.appendChild(tooltip);
    }
    
    // Check if note contains a URL
    const urlMatch = noteText.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      const url = urlMatch[1];
      tooltip.innerHTML = noteText.replace(url, `<span style="color: var(--accent-color, #4a9eff); text-decoration: underline; cursor: pointer;">${url}</span>`);
      tooltip.style.cursor = 'pointer';
      tooltip.style.pointerEvents = 'auto';
      
      // Add click handler to open URL
      tooltip.onclick = () => {
        window.open(url, '_blank');
      };
      
      // Add visual indication that tooltip is clickable
      tooltip.style.borderColor = 'var(--accent)';
      tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    } else {
      tooltip.textContent = noteText;
      tooltip.style.cursor = 'default';
      tooltip.style.pointerEvents = 'none';
      tooltip.onclick = null;
      tooltip.style.borderColor = 'var(--border)';
      tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    }
    
    // Calculate width based on text length
    const textWidth = Math.min(noteText.length * 6, 100); // 6px per character, max 100px
    tooltip.style.width = `${textWidth}px`;
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
      console.log('User not authenticated, redirecting to login');
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
        console.log(`✅ Found existing post on GitHub: ${slug} (SHA: ${postData.sha})`);
        return {
          slug: slug,
          title: content.title || slug,
          sha: postData.sha
        };
      } else if (response.status === 404) {
        console.log(`✅ No existing post found on GitHub: ${slug}`);
        return null; // No duplicate found
      } else {
        console.warn(`⚠️ GitHub API returned status ${response.status} for ${slug}`);
      }
    } catch (error) {
      console.log(`🔄 GitHub API failed for ${slug}, trying local check...`);
    }
    
    // Fallback: check local posts array and local files
    try {
      if (this.posts && this.posts.length > 0) {
        const existingPost = this.posts.find(post => post.slug === slug);
        if (existingPost) {
          console.log(`✅ Found existing post in local cache: ${slug}`);
          // For local posts, we'll need to fetch the SHA when publishing
          return {
            slug: slug,
            title: existingPost.title || slug,
            sha: null,
            needsShaFetch: true
          };
        }
      }
      
      // Also check if we have a local file
      try {
        const localResponse = await fetch(`posts/${slug}.json`);
        if (localResponse.ok) {
          console.log(`✅ Found existing local post file: ${slug}`);
          return {
            slug: slug,
            title: slug, // We don't know the title from local file
            sha: null,
            needsShaFetch: true
          };
        }
      } catch (localError) {
        // Local file doesn't exist
      }
      
      // If we have posts in memory, check if any have this slug
      if (this.posts && this.posts.length > 0) {
        const memoryPost = this.posts.find(post => post.slug === slug);
        if (memoryPost) {
          console.log(`✅ Found existing post in memory: ${slug}`);
          return {
            slug: slug,
            title: memoryPost.title || slug,
            sha: null,
            needsShaFetch: true
          };
        }
      }
      
      console.log(`✅ No existing post found locally: ${slug}`);
      return null; // No duplicate found
    } catch (fallbackError) {
      console.error('❌ Error in fallback duplicate check:', fallbackError);
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
  
  // Load edit data for a specific post (used by site map in editor mode)
  async loadEditDataForPost(slug) {
    console.log(`📝 Loading edit data for post: ${slug}`);
    
    // Try GitHub API first (preferred source)
    try {
      const response = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${slug}.json`);
      if (response.ok) {
        const indexData = await response.json();
        if (indexData.content && indexData.encoding === 'base64') {
          const decodedContent = atob(indexData.content);
          const postData = JSON.parse(decodedContent);
          console.log(`✅ Loaded post data from GitHub: ${postData.title}`);
          this.populateEditorWithPost(postData);
          return;
        }
      }
    } catch (githubError) {
      console.log('🔄 GitHub API failed, trying local...');
    }
    
    // Fallback to local file if GitHub fails
    try {
      const localResponse = await fetch(`posts/${slug}.json`);
      if (localResponse.ok) {
        const postData = await localResponse.json();
        console.log(`✅ Loaded post data from local: ${postData.title}`);
        this.populateEditorWithPost(postData);
        return;
      }
    } catch (localError) {
      console.log('🔄 Local file not found');
    }
    
    console.error('❌ Could not load post data for editing');
  }
  
  // Populate editor fields with post data
  populateEditorWithPost(postData) {
    console.log(`📝 Populating editor with: ${postData.title}`);
    
    // Populate title field
    const titleField = document.getElementById('postTitle');
    if (titleField) {
      titleField.value = postData.title || '';
      console.log('✅ Title field populated');
    }
    
    // Populate content field
    const contentField = document.getElementById('visualEditor');
    if (contentField) {
      contentField.innerHTML = postData.content || '';
      console.log('✅ Content field populated');
    }
    
    // Populate flags/keywords field
    const flagsField = document.getElementById('keywords-input');
    if (flagsField) {
      flagsField.value = postData.keywords || '';
      console.log('✅ Flags field populated');
    }
    
    // Store current post slug for editing
    localStorage.setItem('current_post_slug', postData.slug);
    console.log(`✅ Editor populated with post: ${postData.title}`);
  }

  loadEditData() {
    console.log('📝 Checking for edit data...');
    
    // Hide site map when in editor mode
    if (window.location.pathname.includes('editor.html')) {
      this.hideSiteMap();
      console.log('🗺️ Site map hidden (editor mode)');
    }
    
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
        
        // Update localStorage with the current post slug for GitHub button
        const slug = editPost.title.toLowerCase().replace(/[^a-z0-9]/gi, '-');
        localStorage.setItem('current_post_slug', slug);
        console.log('💾 Updated current post slug in localStorage:', slug);
      }
      
      // Add event listener to title field to update localStorage as user types
      if (titleField) {
        titleField.addEventListener('input', () => {
          const currentTitle = titleField.value.trim();
          if (currentTitle) {
            const slug = currentTitle.toLowerCase().replace(/[^a-z0-9]/gi, '-');
            localStorage.setItem('current_post_slug', slug);
            console.log('💾 Updated current post slug in localStorage:', slug);
          }
        });
        console.log('📝 Added title field event listener for localStorage updates');
      }
      
      if (contentField && editPost.content) {
        contentField.innerHTML = editPost.content;
        console.log('📝 Content populated:', editPost.content);
        
        // Fix any images that might be missing overlays after loading content
        setTimeout(() => {
          this.fixMissingImageOverlays();
        }, 300);
      }
      
      // Set flags if available
      if (editPost.keywords) {
        this.currentPostFlags = editPost.keywords;
        localStorage.setItem('current_post_flags', editPost.keywords);
        
        // Populate the flags input field
        const flagsInput = document.getElementById('keywords-input');
        if (flagsInput) {
          flagsInput.value = editPost.keywords;
          console.log('📝 Flags input field populated:', editPost.keywords);
        }
        
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

  setupTitleFieldListener() {
    console.log('📝 Setting up title field listener for new posts...');
    
    const titleField = document.getElementById('postTitle');
    if (titleField) {
      // Add event listener to title field to update localStorage as user types
      titleField.addEventListener('input', () => {
        const currentTitle = titleField.value.trim();
        if (currentTitle) {
          const slug = currentTitle.toLowerCase().replace(/[^a-z0-9]/gi, '-');
          localStorage.setItem('current_post_slug', slug);
          console.log('💾 Updated current post slug in localStorage:', slug);
        }
      });
      console.log('📝 Added title field event listener for new posts');
    } else {
      console.log('⚠️ Title field not found for event listener setup');
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
    
    const categoriesMenu = document.getElementById('categories-menu');
    if (categoriesMenu && this.categoriesMouseEnterHandler) {
      categoriesMenu.removeEventListener('mouseenter', this.categoriesMouseEnterHandler);
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
    
    // Check authentication first
    const isAuthenticated = await this.checkAuthentication();
    if (!isAuthenticated) {
      this.showMenuStyle1Message('GitHub authentication required to save drafts', 'error');
      this.showGitHubLogin();
      return;
    }
    
    const token = localStorage.getItem('github_token');
    if (!token) {
      this.showMenuStyle1Message('GitHub token not found', 'error');
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
      const repo = 'pigeonPious/page'; // Hardcoded for now
      const filename = `draft-${slug}-${Date.now()}.json`;
      const path = `drafts/${filename}`;
      
      console.log('💾 Saving draft to:', path);
      
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
        const errorData = await response.json();
        console.error('❌ Draft save failed:', response.status, errorData);
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      this.showMenuStyle1Message(`Error saving draft: ${error.message}`, 'error');
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