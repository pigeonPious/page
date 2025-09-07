/**
 * PPPage - Simple, Reliable Blog System
 * Everything in one file for maximum reliability
 */

// CACHE BUST: This file was last modified at 2025-01-23
// If you see this comment, the file is being served fresh
// Version: 2.3 - Nested posts indexing + sitemap visibility tweaks
class SimpleBlog {
  constructor() {
    // Version check and cache busting
    const currentVersion = '2.3.1';
    const storedVersion = localStorage.getItem('ppPage_js_version');
    if (storedVersion !== currentVersion) {
      console.log('🔄 New JavaScript version detected:', currentVersion, 'vs stored:', storedVersion);
      localStorage.setItem('ppPage_js_version', currentVersion);
      // Force a reload if this is a major version change
      if (storedVersion && storedVersion !== currentVersion) {
        console.log('🔄 Major version change detected, forcing reload...');
        setTimeout(() => window.location.reload(true), 100);
        return;
      }
    }
    
    this.currentPost = null;
    this.posts = [];
    // Load theme from localStorage or default to dark
    this.theme = localStorage.getItem('ppPage_theme') || 'dark';
    
    // Initialize handler references to prevent memory leaks
    this.allPostsMouseEnterHandler = null;

    // Prevent sitemap from auto-hiding on resize unless explicitly enabled
    this.disableSiteMapAutoHide = true;

    console.log('ppPage runtime JS version', currentVersion, 'build at', new Date().toISOString());
    this.init();
  }

  applyCornerLogo() {
    try {
      const el = document.getElementById('cornerGif');
      if (!el) return;
      const cacheBust = Date.now();
      el.style.backgroundImage = `url('assets/logo.png?_cb=${cacheBust}')`;
      // Responsive scale: 50% on small viewports
      const applySize = () => {
        const isSmall = window.innerWidth < 700;
        el.style.width = isSmall ? '50px' : '100px';
        el.style.height = isSmall ? '50px' : '100px';
      };
      applySize();
      window.addEventListener('resize', applySize);
    } catch {}
  }

  init() {
    this.createTaskbar();
    this.bindEvents();
    
    // Check for repository updates and clear cache if needed
    this.checkRepositoryUpdates();
    
    // Ensure sitemap is visible immediately (not in editor)
    if (!window.location.pathname.includes('editor.html')) {
      this.disableSiteMapAutoHide = true;
      try { this.showSiteMap(); } catch (e) { console.warn('Initial showSiteMap failed', e); }
    }

    // Ensure logo applied on init as well (not only delayed)
    try {
      if (typeof this.ensureLogoApplied === 'function') {
        this.ensureLogoApplied();
      } else {
        this.applyCornerLogo();
      }
    } catch {}
    
    // Try to load cached posts first for immediate submenu access
    const cachedPosts = localStorage.getItem('posts');
    if (cachedPosts) {
      try {
        this.posts = JSON.parse(cachedPosts);
      } catch (error) {
        console.warn('Could not parse cached posts:', error);
        localStorage.removeItem('posts');
      }
    }
    
    // Load posts first, then handle URL parameters
    this.loadPosts().then((posts) => {
      // Store the loaded posts in the instance
      if (posts && posts.length > 0) {
        this.posts = posts;
        localStorage.setItem('posts', JSON.stringify(posts));
        console.log('Posts loaded and stored:', posts.length);
      }
      
      // Check for post parameter in URL (from editor navigation)
      const urlParams = new URLSearchParams(window.location.search);
      const postSlug = urlParams.get('post');
      if (postSlug) {
        this.loadPost(postSlug);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Check for post hash in URL (direct linking)
      const hashSlug = window.location.hash.substring(1); // Remove # from hash
      if (hashSlug) {
        this.loadPost(hashSlug);
      }
      
      // Check for stored current post (for page reloads)
      if (!postSlug && !hashSlug) {
        const storedCurrentPost = localStorage.getItem('current_post_slug');
        if (storedCurrentPost) {
          this.loadPost(storedCurrentPost);
        } else {
          // No stored post, no URL params - load most recent post
          if (this.posts && this.posts.length > 0) {
            const mostRecent = this.posts[0]; // Already sorted by date
            this.loadPost(mostRecent.slug);
          }
        }
      }
      
      // Show site map by default after posts are loaded (only in blog mode)
      if (!window.location.pathname.includes('editor.html')) {
        setTimeout(() => {
          // Force show site map on load (do not auto-hide)
          this.disableSiteMapAutoHide = true;
          if (!this.siteMapManuallyToggled) {
            this.showSiteMap();
          }
        }, 500);
      }
      
      // Load and display projects in menu
      this.loadAndDisplayProjects();
      
      // Do not prebuild All Posts submenu; it is built on demand to avoid stale/old styling
    }).catch(error => {
      console.error('Error loading posts:', error);
    });
    
    // Handle browser back/forward navigation
    window.addEventListener('popstate', (event) => {
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

    // Set up periodic repository update checks (every 5 minutes)
    setInterval(() => {
      this.checkRepositoryUpdates();
    }, 5 * 60 * 1000); // 5 minutes

    // Also check for updates when user becomes active (returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('🔍 Tab became visible, checking for updates...');
        this.checkRepositoryUpdates();
      }
    });
    
    this.setTheme(this.theme, false); // Don't open HSL picker on page load
    
    // Ensure hover note colors are set for the current theme
    if (this.theme === 'dark') {
      this.updateHoverNoteColors('#ffffff');
    } else if (this.theme === 'light') {
      this.updateHoverNoteColors('#000000');
    }
    

    
    // If custom theme, check for saved HSL values and apply them
    if (this.theme === 'custom') {
      const savedHSL = localStorage.getItem('ppPage_custom_hsl');
      if (savedHSL) {
        try {
          const { h, s, l } = JSON.parse(savedHSL);
          this.applyCustomTheme(h, s, l);
        } catch (error) {
          console.warn('Could not parse saved custom theme HSL values on page load:', error);
        }
      }
    }
    
    // If random theme, check for saved random theme values and apply them
    if (this.theme === 'random') {
      const savedRandomTheme = localStorage.getItem('ppPage_random_theme');
      if (savedRandomTheme) {
        try {
          const { h, s, l } = JSON.parse(savedRandomTheme);
          this.applyCustomTheme(h, s, l);
        } catch (error) {
          console.warn('Could not parse saved random theme on page load:', error);
        }
      }
    }
    
    // Load saved post flags
    this.loadSavedFlags();
    
    // Setup text selection monitoring
    this.setupSelectionMonitoring();
    
    // Setup text selection monitoring
    this.setupSelectionMonitoring();
    
    // Check authentication status

    

    
    // Load logo from configuration

    
    // Ensure logo is applied when DOM is ready (guard for missing method)
    setTimeout(() => {
      if (typeof this.ensureLogoApplied === 'function') {
        this.ensureLogoApplied();
      }
    }, 1000);
    
    console.log('SimpleBlog initialized successfully');
  }



  createTaskbar() {
    const taskbarHTML = `
      <div class="menu-bar" id="main-taskbar">
        <div class="menu-bar-inner">
          <div class="menu-star" id="star-button" title="Home">*</div>
          
          <div class="menu-item" data-menu="edit">
            <div class="label">Edit</div>
            <div class="menu-dropdown">
              <div class="menu-entry" id="open-github-btn">Open GitHub</div>
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
          
        
        <div class="menu-item" data-menu="pigeon" style="margin-left: auto;">
          <div class="label">PiousPigeon</div>
          <div class="menu-dropdown">
            <div class="menu-entry" id="bluesky-link">Bluesky: @piouspigeon.bsky.social</div>
            <div class="menu-entry" id="twitter-link">Twitter</div>
            <div class="menu-entry" id="itch-link">Itch: piouspigeon.itch.io</div>
          </div>
        </div>
        </div>
      </div>
    `;

    // Insert at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', taskbarHTML);
    console.log('Taskbar created');
    
    // Bind events after taskbar is in the DOM
    this.bindEventListener(document.getElementById('about-btn'), 'click', (e) => { e.preventDefault(); this.loadPost('about'); });
    this.bindEventListener(document.getElementById('contact-btn'), 'click', (e) => { e.preventDefault(); this.loadPost('contact'); });
    this.bindEventListener(document.getElementById('open-github-btn'), 'click', (e) => { e.preventDefault(); this.openCurrentPostInGitHub(); });
    
    // Bind PiousPigeon dropdown events
    this.bindEventListener(document.getElementById('bluesky-link'), 'click', (e) => { 
      e.preventDefault(); 
      e.stopPropagation(); // Prevent menu from closing
      window.open('https://bsky.app/profile/piouspigeon.bsky.social', '_blank'); 
    });
    this.bindEventListener(document.getElementById('itch-link'), 'click', (e) => { 
      e.preventDefault(); 
      e.stopPropagation(); // Prevent menu from closing
      window.open('https://piouspigeon.itch.io', '_blank'); 
    });
    this.bindEventListener(document.getElementById('twitter-link'), 'click', (e) => { 
      e.preventDefault(); 
      e.stopPropagation(); // Prevent menu from closing
      /* Twitter link to be added later */ 
    });


  }

  // Helper Methods
  bindEventListener(element, event, handler) {
    if (element) {
      element.addEventListener(event, handler);
    }
  }

  // Check for repository updates and clear cache if needed
  async checkRepositoryUpdates() {
    try {
      console.log('🔍 Checking for repository updates...');
      
      // Get the last commit date from GitHub API
      const response = await fetch('https://api.github.com/repos/pigeonPious/page/commits?per_page=1');
      if (response.ok) {
        const commits = await response.json();
        if (commits && commits.length > 0) {
          const latestCommitDate = commits[0].commit.author.date;
          const latestCommitHash = commits[0].sha.substring(0, 8);
          
          console.log('🔍 Latest commit:', latestCommitHash, 'at', latestCommitDate);
          
          // Check if we have a stored commit hash
          const storedCommitHash = localStorage.getItem('ppPage_last_commit_hash');
          const storedCommitDate = localStorage.getItem('ppPage_last_commit_date');
          
          if (storedCommitHash && storedCommitHash !== latestCommitHash) {
            console.log('🔄 Repository updated! Clearing cache...');
            console.log('🔄 Old commit:', storedCommitHash, 'New commit:', latestCommitHash);
            
            // Show user notification
            this.showUserMessage(`Repository updated! Processing file renames and refreshing...`, 'info');
            
            // Clear all cached data
            this.clearAllCache();
            
            // Store new commit info
            localStorage.setItem('ppPage_last_commit_hash', latestCommitHash);
            localStorage.setItem('ppPage_last_commit_date', latestCommitDate);
            
                  // Check for assets that need numeric renaming
      console.log('🔄 Checking for assets that need numeric renaming...');
      await this.checkAssetsForNumericRenaming();
            
            // Force reload to get fresh content
            console.log('🔄 Forcing page reload for fresh content...');
            setTimeout(() => window.location.reload(true), 3000);
            return;
          } else if (!storedCommitHash) {
            // First time visit, store current commit info
            localStorage.setItem('ppPage_last_commit_hash', latestCommitHash);
            localStorage.setItem('ppPage_last_commit_date', latestCommitDate);
            console.log('🔍 First visit, stored commit info:', latestCommitHash);
          } else {
            console.log('✅ Repository is up to date');
          }
        }
      }
    } catch (error) {
      console.warn('Could not check repository updates:', error);
      // Don't fail the page load if this check fails
    }
  }

  // Clear all cached data
  clearAllCache() {
    console.log('🧹 Clearing all cached data...');
    
    // Clear posts cache
    localStorage.removeItem('posts');
    localStorage.removeItem('current_post_slug');
    
    // Clear theme cache (keep user preferences)
    // localStorage.removeItem('ppPage_theme');
    // localStorage.removeItem('ppPage_custom_href');
    // localStorage.removeItem('ppPage_random_theme');
    
    // Clear font size cache
    localStorage.removeItem('ppPage_font_size');
    
    // Clear site map state
    localStorage.removeItem('ppPage_site_map_hidden');
    localStorage.removeItem('ppPage_site_map_manually_toggled');
    
    // Clear console cache
    localStorage.removeItem('ppPage_console_history');
    
    // Clear any other potential caches
    localStorage.removeItem('ppPage_js_version');
    
    // Try to clear browser HTTP cache for critical resources
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('posts') || name.includes('site')) {
            caches.delete(name);
            console.log('🧹 Cleared HTTP cache:', name);
          }
        });
      });
    }
    
    // Show user-friendly message
    this.showUserMessage('Cache cleared! Refreshing page...', 'success');
    
    console.log('🧹 Cache cleared successfully');
  }

  // Show user-friendly message (fallback if showMenuStyle1Message doesn't exist)
  showUserMessage(message, type = 'info') {
    try {
      // Try to use existing method if it exists
      if (typeof this.showMenuStyle1Message === 'function') {
        this.showMenuStyle1Message(message, type);
      } else {
        // Fallback: show alert
        alert(`${type.toUpperCase()}: ${message}`);
      }
    } catch (error) {
      // Ultimate fallback: console log
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }









  setupCSSVariables() {
    console.log('Setting up CSS variables...');
    
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
    
    console.log('CSS variables setup complete');
  }
  
  setupResponsiveDesign() {
    console.log('Setting up responsive design...');
    
    // Function to update navigation text based on screen width
    const updateNavigationText = () => {
      const navigationLabel = document.querySelector('.menu-item[data-menu="navigation"] .label');
      if (navigationLabel) {
        if (window.innerWidth <= 768) {
          navigationLabel.textContent = 'Nav';
        } else {
          navigationLabel.textContent = 'Navigation';
        }
      }
    };
    
    // Update on page load
    updateNavigationText();
    
    // Update on window resize
    window.addEventListener('resize', updateNavigationText);
    
    console.log('Responsive design setup complete');
  }

  bindEvents() {
    console.log('bindEvents() called');
    
    // Setup CSS variables
    this.setupCSSVariables();
    
    // Setup responsive design
    this.setupResponsiveDesign();
    
    // Menu system
    this.setupMenuSystem();
    
    // Button events
    this.setupButtonEvents();
    
    // Global events
    this.setupGlobalEvents();
  }

  setupMenuSystem() {
    // Initialize text selection preservation
    this.initializeTextSelectionPreservation();
    
    // Menu toggle - store reference for cleanup
    this.globalClickHandler = (e) => {
      // Don't close menus when clicking on theme buttons
      if (e.target.closest('[data-mode]')) {
        return;
      }
      
      const menuItem = e.target.closest('.menu-item');
      if (menuItem) {
        this.toggleMenu(menuItem);
      } else {
        this.closeAllMenus();
      }
    };
    document.addEventListener('click', this.globalClickHandler);

    // Close on escape - store reference for cleanup
    this.globalKeyHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeAllMenus();
      }
    };
    document.addEventListener('keydown', this.globalKeyHandler);
    
    // Prevent text selection loss on taskbar elements
    this.preventSelectionLoss();
  }

  toggleMenu(menuItem) {
    const dropdown = menuItem.querySelector('.menu-dropdown');
    const isOpen = menuItem.classList.contains('open');
    
    // Close all other menus
    this.closeAllMenus();
    
    // Toggle current menu - add 'open' class to menu-item, not dropdown
    if (!isOpen) {
      menuItem.classList.add('open');
    } else {
      menuItem.classList.remove('open');
    }
  }

  closeAllMenus() {
    const openMenus = document.querySelectorAll('.menu-item.open');
    
    openMenus.forEach(menuItem => {
      menuItem.classList.remove('open');
    });
    
    // Close all submenus and sub-submenus
    const allSubmenus = document.querySelectorAll('.submenu, .sub-submenu');
    
    allSubmenus.forEach(submenu => {
      submenu.remove();
      console.log('Removed submenu:', submenu.className);
    });
    
    // Reset menu state
    this.resetMenuState();
  }

  resetMenuState() {
    console.log('Resetting menu state - all submenus cleared');
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
    
    console.log('Submenu selection preservation observer setup complete');
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
        console.log('Text selection captured:', this.currentSelection.text);
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
            console.log('Preserving selection before click:', this.currentSelection.text);
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
                console.log('Selection restored after click:', this.tempSelection.text);
              } catch (error) {
                console.warn('Could not restore selection:', error);
              }
            }, 10);
          }
        });
      });
    });
    
    console.log('Selection preservation handlers added');
  }
  setupButtonEvents() {
    
    // Star button (toggle sitemap)
    this.addClickHandler('#star-button', () => {
      console.log('Star button clicked - toggling sitemap');
      this.toggleSiteMap();
    });

    // New post button
    this.addClickHandler('#new-post', (e) => {
      console.log('New post button clicked');
      e.preventDefault();
      window.location.href = 'editor.html';
    });

    // Make note button
    this.addClickHandler('#make-note-button', () => {
      console.log('Make note button clicked');
      // Ensure text selection is preserved before creating note
      this.preserveEditorSelection();
      this.captureSelectionAndMakeNote();
    });
    

    

    
    // Edit post button
    this.addClickHandler('#edit-post-button', () => {
      console.log('Edit post button clicked');
      this.editCurrentPost();
    });

    // Editor-specific buttons
    this.addClickHandler('#import-btn', () => {
      console.log('Import button clicked');
      this.importPost();
    });

    this.addClickHandler('#export-btn', () => {
      console.log('Export button clicked');
      this.exportPost();
    });

    this.addClickHandler('#save-draft-btn', () => {
      console.log('Save draft button clicked');
      this.saveDraft();
    });

    this.addClickHandler('#images-btn', () => {
      console.log('Images button clicked');
      console.log('About to call showImagesModal...');
      this.showImagesModal();
      console.log('showImagesModal called');
    });

      this.addClickHandler('#publish-btn', () => {
    console.log('Publish button clicked');
    this.showPublishModal();
  });

  this.addClickHandler('#open-draft-btn', () => {
    console.log('Open Draft button clicked');
    this.showDraftsModal();
  });

  this.addClickHandler('#keywords-btn', () => {
    console.log('Flags button clicked');
    this.showFlagsModal();
  });

  this.addClickHandler('#delete-post-button', () => {
    console.log('Delete post button clicked');
    this.showDeletePostConfirmation();
  });

  

    // Open in GitHub button
    this.addClickHandler('#open-in-github', () => {
      console.log('Open in GitHub button clicked');
      this.openCurrentPostInGitHub();
    });







    // Editor mode toggle (Raw/Preview)
    this.addClickHandler('#toggle-editor-mode', () => {
      console.log('Editor mode toggle clicked');
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
    console.log('Setting up theme buttons...');
    this.addClickHandler('[data-mode]', (e) => {
      const mode = e.target.dataset.mode;
      console.log('Theme button clicked:', mode);
      console.log('Target element:', e.target);
      console.log('Dataset:', e.target.dataset);
      console.log('Element text:', e.target.textContent);
      console.log('Element classes:', e.target.className);
      
      if (mode === 'custom') {
        console.log('Custom theme button clicked - calling setTheme...');
      }
      
      this.setTheme(mode, mode === 'custom'); // Open HSL picker only for custom theme
    });



    // Navigation buttons
    this.addClickHandler('#most-recent-post', () => {
      console.log('🕒 Most recent post clicked');
      this.loadMostRecentPost();
    });

    this.addClickHandler('#random-post', () => {
      console.log('Random post clicked');
      this.loadRandomPost();
    });

    // Site Map button (toggle)
    this.addClickHandler('#show-site-map', () => {
      console.log('Site Map button clicked');
      this.toggleSiteMap();
    });

    // Build indicator - no click handler needed, only changes on actual builds
    // this.addClickHandler('#build-indicator', () => {
    //   console.log('Build indicator clicked - incrementing build');
    //   this.incrementBuildWord();
    // });
    

    

    
    this.addClickHandler('#test-github-token', () => {
      console.log('Test GitHub token button clicked');
  
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
      console.log(' Font size button clicked');
      // Font size functionality removed
    });
    

    
    this.addClickHandler('#draft-manager-button', () => {
      console.log('Draft manager button clicked');
      this.showDraftManager();
    });
  }



  addClickHandler(selector, handler) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      elements.forEach(element => {
        element.addEventListener('click', handler);
      });
    } else {
        // No elements found for selector
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
    console.log('Setting up submenus...');
    
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
        console.log('All posts submenu hovered');
        if (openTimeout) {
          clearTimeout(openTimeout);
        }
        openTimeout = setTimeout(() => {
          // Close other level 1 menus first
          this.closeOtherLevel1Menus('all-posts-menu');
          
          // Only create submenu if it doesn't already exist
          const existingSubmenu = allPostsMenu.querySelector('.submenu');
          if (!existingSubmenu) {
            console.log('Creating new All Posts submenu');
            this.showAllPostsSubmenu(allPostsMenu);
          } else {
            console.log('All Posts submenu already exists, not recreating');
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
        console.log('All posts submenu clicked');
        
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
      console.log('All posts submenu handler attached');
    } else {
      console.warn('All posts menu element not found');
    }





    
    console.log('Submenus setup complete with menu hierarchy management');
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
    
    // Use cached posts if available, otherwise load using the same method as sitemap
    if (this.posts && this.posts.length > 0) {
      this.displayPostsInSubmenu(submenu, this.posts);
    } else {
      // Show loading indicator
      const loadingEntry = document.createElement('div');
      loadingEntry.className = 'menu-entry';
      loadingEntry.textContent = 'Loading posts...';
      loadingEntry.style.cssText = 'padding: 8px 15px; color: var(--muted, #888); font-style: italic;';
      submenu.appendChild(loadingEntry);
      
      // Load posts using the same method as sitemap to ensure consistency
      try {
        // Try to load from the static posts index first
        const indexResponse = await fetch('posts-index.json');
        if (indexResponse.ok) {
          const indexData = await indexResponse.json();
          console.log('All Posts submenu: Found static index with', indexData.total_posts, 'posts');
          
          // Convert index data to post objects
          const posts = [];
          for (const postData of indexData.posts) {
            try {
              // Load the actual post content (support nested path via path or filename)
              const relativePath = (postData && (postData.path || postData.filename)) || '';
              const postUrl = `https://raw.githubusercontent.com/pigeonPious/page/main/posts/${relativePath}?_cb=${Date.now()}`;
              const response = await fetch(postUrl);
              if (response.ok) {
                const content = await response.text();
                const post = this.parseTxtPost(content, postData.slug);
                if (post) {
                  posts.push(post);
                }
              }
            } catch (error) {
              console.error('All Posts submenu: Error loading post content:', postData && postData.filename, error);
            }
          }
          
          if (posts.length > 0) {
            console.log('All Posts submenu: Successfully loaded', posts.length, 'posts from static index');
            this.posts = posts;
            localStorage.setItem('posts', JSON.stringify(posts));
            this.displayPostsInSubmenu(submenu, posts);
            return;
          }
        }
      } catch (error) {
        console.log('All Posts submenu: Static index failed, falling back to live discovery:', error);
      }
      
      // Fallback to live discovery if static index fails
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
      console.log('Submenu: Loading posts for submenu...');
      
      // Use the same method as loadPosts to ensure consistency
      const cacheBust = Date.now();
      let postFiles = [];
      
      // Method 1: Try GitHub API first
      try {
        const response = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts?_cb=${cacheBust}`);
        if (response.ok) {
          const contents = await response.json();
          const txtFiles = contents.filter(item => 
            item.type === 'file' && item.name.endsWith('.txt')
          );
          
          if (txtFiles.length > 0) {
            postFiles = txtFiles.map(item => ({
              name: item.name,
              download_url: item.download_url
            }));
            console.log('Submenu: Found', postFiles.length, 'posts via GitHub API');
          }
        }
      } catch (error) {
        console.log('Submenu: GitHub API method failed:', error);
      }
      
      // Method 2: Fallback to public directory browsing
      if (postFiles.length === 0) {
        try {
          console.log('Submenu: Trying public directory browsing...');
          const corsProxy = 'https://corsproxy.io/?';
          const postsDirResponse = await fetch(corsProxy + `https://github.com/pigeonPious/page/tree/main/posts?_cb=${cacheBust}`);
          
          if (postsDirResponse.ok) {
            const htmlContent = await postsDirResponse.text();
            
            // Parse HTML to find all .txt files
            const txtFileMatches = htmlContent.match(/href="[^"]*\.txt"/g);
            if (txtFileMatches) {
              const discoveredFiles = txtFileMatches
                .map(match => match.match(/href="([^"]+)"/)[1])
                .filter(href => href.includes('/posts/') && href.endsWith('.txt'))
                .map(href => {
                  const filename = href.split('/').pop();
                  return {
                    name: filename,
                    download_url: `https://raw.githubusercontent.com/pigeonPious/page/main/posts/${filename}?_cb=${cacheBust}`
                  };
                });
              
              if (discoveredFiles.length > 0) {
                postFiles = discoveredFiles;
                console.log('Submenu: Found', postFiles.length, 'posts via directory browsing');
              }
            }
          }
        } catch (error) {
          console.log('Submenu: Directory browsing failed:', error);
        }
      }
      
      // Method 3: Try GitHub Tree API as last resort
      if (postFiles.length === 0) {
        try {
          console.log('Submenu: Trying GitHub Tree API...');
          const response = await fetch('https://api.github.com/repos/pigeonPious/page/git/trees/main?recursive=1');
          if (response.ok) {
            const treeData = await response.json();
            const txtFiles = treeData.tree.filter(item => 
              item.path.startsWith('posts/') && item.path.endsWith('.txt')
            );
            
            if (txtFiles.length > 0) {
              postFiles = txtFiles.map(item => ({
                name: item.path.replace('posts/', ''),
                download_url: `https://raw.githubusercontent.com/pigeonPious/page/main/${item.path}?_cb=${cacheBust}`
              }));
              console.log('Submenu: Found', postFiles.length, 'posts via Tree API');
            }
          }
        } catch (error) {
          console.log('Submenu: Tree API failed:', error);
        }
      }
      if (postFiles.length > 0) {
        console.log('Submenu: Processing', postFiles.length, 'post files...');
        
        // Fetch and parse each post file
        const posts = [];
        for (const postFile of postFiles) {
          try {
            const postResponse = await fetch(postFile.download_url + (postFile.download_url.includes('?') ? '&' : '?') + '_cb=' + cacheBust);
            if (postResponse.ok) {
              const postContent = await postResponse.text();
              
              // Extract slug from filename (remove .txt extension)
              const slug = postFile.name.replace('.txt', '');
              
              // Parse the .txt file content
              const post = this.parseTxtPost(postContent, slug);
              
              if (post) {
                posts.push(post);
                console.log('Submenu: Successfully parsed post:', post.title);
              }
            }
          } catch (postError) {
            console.warn('Could not parse post file:', postFile.name, postError);
          }
        }
        
        if (posts.length > 0) {
          // Sort by date for reference
          posts.sort((a, b) => new Date(b.date) - new Date(a.date));
          console.log('Submenu: Successfully loaded', posts.length, 'posts');
          
          // Update local posts array to keep in sync
          this.posts = posts;
          localStorage.setItem('posts', JSON.stringify(posts));
          
          // Display posts in submenu
          this.displayPostsInSubmenu(submenu, posts);
        } else {
          console.log('Submenu: No posts could be parsed');
          submenu.innerHTML = '<div class="menu-entry" style="padding: 8px 15px; color: var(--muted, #888); font-style: italic;">No posts found</div>';
        }
      } else {
        console.log('Submenu: No .txt files found in posts directory');
        submenu.innerHTML = '<div class="menu-entry" style="padding: 8px 15px; color: var(--muted, #888); font-style: italic;">No posts found</div>';
      }
    } catch (error) {
      console.error('Submenu: Failed to load posts:', error);
      submenu.innerHTML = '<div class="menu-entry" style="padding: 8px 15px; color: var(--danger-color, #dc3545); font-style: italic;">Error loading posts</div>';
    }
  }




  




  // Get the commit date for a specific file from GitHub
  async getCommitDate(filePath) {
    try {
      // Try to get the commit history for the specific file
      const response = await fetch(`https://api.github.com/repos/pigeonPious/page/commits?path=${filePath}&per_page=1`);
      if (response.ok) {
        const commits = await response.json();
        if (commits && commits.length > 0) {
          // Get the most recent commit date for this file
          const commitDate = new Date(commits[0].commit.author.date);
          return commitDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
        }
      }
    } catch (error) {
      console.warn(`Could not fetch commit date for ${filePath}:`, error);
    }
    
    // Fallback to current date if commit date cannot be fetched
    return new Date().toISOString().split('T')[0];
  }

  async loadPosts() {
    let posts = [];
    try {
      console.log('loadPosts: Loading posts from static index...');
      
      // Try to load from the static posts index first
      const indexResponse = await fetch('posts-index.json');
      if (indexResponse.ok) {
        const indexData = await indexResponse.json();
        console.log('loadPosts: Found static index with', indexData.total_posts, 'posts');
        
        // Convert index data to post objects
        for (const postData of indexData.posts) {
          try {
            // Support nested paths: prefer path, else filename (which itself may include folders)
            const relativePath = (postData && (postData.path || postData.filename)) || '';
            if (!relativePath) continue;
            const postUrl = `https://raw.githubusercontent.com/pigeonPious/page/main/posts/${relativePath}?_cb=${Date.now()}`;
            const response = await fetch(postUrl);
            if (response.ok) {
              const content = await response.text();
              const slug = postData.slug || this.computeSlugFromPostPath(relativePath);
              const post = this.parseTxtPost(content, slug);
              if (post) {
                post.path = relativePath; // keep exact relative path for media loading
                posts.push(post);
              }
            }
          } catch (error) {
            console.error('Error loading post content:', postData && postData.filename, error);
          }
        }
        
        console.log('loadPosts: Loaded', posts.length, 'posts from static index; will also discover nested posts');
      }
    } catch (error) {
      console.log('loadPosts: Static index failed, falling back to live discovery:', error);
    }
    
    // Fallback to live discovery if static index fails
    console.log('loadPosts: Falling back to live repository scanning...');
    const cacheBust = Date.now();
    let postFiles = [];
    
    // Method 1: GitHub API (top-level files)
    try {
      console.log('loadPosts: Scanning GitHub repository for .txt files...');
      const response = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts?_cb=${cacheBust}`);
      if (response.ok) {
        const contents = await response.json();
        const txtFiles = contents.filter(item => 
          item.type === 'file' && item.name.endsWith('.txt')
        );
        txtFiles.forEach(item => {
          postFiles.push({
            name: item.name, // top-level only
            download_url: item.download_url
          });
        });
        if (txtFiles.length > 0) {
          console.log('loadPosts: Found', txtFiles.length, 'top-level posts via GitHub API');
        }
      }
    } catch (error) {
      console.log('loadPosts: GitHub API method failed:', error);
    }
    
    // Method 2: Public directory browsing (top-level only)
    try {
      console.log('loadPosts: Trying public directory browsing...');
      const corsProxy = 'https://corsproxy.io/?';
      const postsDirResponse = await fetch(corsProxy + `https://github.com/pigeonPious/page/tree/main/posts?_cb=${cacheBust}`);
      if (postsDirResponse.ok) {
        const htmlContent = await postsDirResponse.text();
        const txtFileMatches = htmlContent.match(/href="[^"]*\.txt"/g);
        if (txtFileMatches) {
          txtFileMatches
            .map(match => match.match(/href="([^"]+)"/)[1])
            .filter(href => href.includes('/posts/') && href.endsWith('.txt'))
            .forEach(href => {
              const filename = href.split('/').pop();
              postFiles.push({
                name: filename,
                download_url: `https://raw.githubusercontent.com/pigeonPious/page/main/posts/${filename}?_cb=${cacheBust}`
              });
            });
          console.log('loadPosts: Added posts via directory browsing');
        }
      }
    } catch (error) {
      console.log('loadPosts: Directory browsing failed:', error);
    }
    
    // Method 3: GitHub Tree API (recursive discovery of nested files)
    try {
      console.log('loadPosts: Trying GitHub Tree API for nested posts...');
      const response = await fetch('https://api.github.com/repos/pigeonPious/page/git/trees/main?recursive=1');
      if (response.ok) {
        const treeData = await response.json();
        const txtFiles = treeData.tree.filter(item => 
          item.path.startsWith('posts/') && item.path.endsWith('.txt')
        );
        txtFiles.forEach(item => {
          postFiles.push({
            name: item.path.replace('posts/', ''), // relative path under posts
            download_url: `https://raw.githubusercontent.com/pigeonPious/page/main/${item.path}?_cb=${cacheBust}`
          });
        });
        if (txtFiles.length > 0) {
          console.log('loadPosts: Found', txtFiles.length, 'posts via Tree API');
        }
      }
    } catch (error) {
      console.log('loadPosts: Tree API failed:', error);
    }
    
    // Deduplicate by relative path name and process
    const seen = new Set();
    const discoveredPosts = [];
    console.log('loadPosts: Processing', postFiles.length, 'post files...');
    for (const postFile of postFiles) {
      const key = postFile.name;
      if (seen.has(key)) continue;
      seen.add(key);
      try {
        const postResponse = await fetch(postFile.download_url + (postFile.download_url.includes('?') ? '&' : '?') + '_cb=' + cacheBust);
        if (postResponse.ok) {
          const postContent = await postResponse.text();
          const slug = this.computeSlugFromPostPath(postFile.name);
          const post = this.parseTxtPost(postContent, slug);
          if (post) {
            post.path = postFile.name;
            discoveredPosts.push(post);
          }
        }
      } catch (postError) {
        console.warn('Could not parse post file:', postFile.name, postError);
      }
    }
    
    // Merge unique by slug, prefer index-loaded metadata when duplicate
    const bySlug = new Map();
    for (const p of posts) bySlug.set(p.slug, p);
    for (const p of discoveredPosts) if (!bySlug.has(p.slug)) bySlug.set(p.slug, p);
    const combined = Array.from(bySlug.values());
    
    if (combined.length === 0) {
      console.log('loadPosts: No posts found');
      return [];
    }
    
    // Sort by date desc
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));
    return combined;
  }

  parseTxtPost(content, slug) {
    try {
      // Split content into lines
      const lines = content.split('\n');
      let title = 'Untitled';
      let date = new Date().toISOString().split('T')[0]; // Default to today
      let keywords = 'general';
      let postContent = '';
      
      // Parse the first few lines for metadata
      let inContent = false;
      let haveSeenNonEmpty = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        if (!inContent) {
          // Skip leading blank lines entirely
          if (!haveSeenNonEmpty && trimmedLine === '') {
            continue;
          }
          if (trimmedLine !== '') {
            haveSeenNonEmpty = true;
          }
          
          // Look for title (first non-empty line or line starting with #)
          if (trimmedLine.startsWith('# ')) {
            title = trimmedLine.substring(2).trim();
            continue;
          } else if (trimmedLine.startsWith('Title: ')) {
            title = trimmedLine.substring(7).trim();
            continue;
          }
          
          // Look for date
          if (trimmedLine.startsWith('Date: ')) {
            date = trimmedLine.substring(6).trim();
            continue;
          }
          
          // Look for keywords
          if (trimmedLine.startsWith('Keywords: ')) {
            keywords = trimmedLine.substring(10).trim();
            continue;
          }
          
          // If we've seen any non-empty metadata and then hit a blank or '---', switch to content
          if (haveSeenNonEmpty && (trimmedLine === '' || trimmedLine.startsWith('---'))) {
            inContent = true;
            continue;
          }
          
          // If this is the first non-empty line and no title found, use it as title
          if (title === 'Untitled' && trimmedLine !== '') {
            title = trimmedLine;
            continue;
          }
        }
        
        // Add to content
        if (inContent || i > 10) { // Start content after metadata or after 10 lines
          postContent += line + '\n';
        }
      }
      
      // Check for [FLAGS: category1, category2] syntax in title and content
      const flagsMatch = title.match(/\[FLAGS:\s*([^\]]+)\]/);
      if (flagsMatch) {
        const extractedFlags = flagsMatch[1].trim();
        // If we already have keywords, append the new flags
        if (keywords && keywords !== 'general') {
          keywords = `${keywords}, ${extractedFlags}`;
        } else {
          keywords = extractedFlags;
        }
        // Remove the [FLAGS: ...] from the title
        title = title.replace(/\[FLAGS:\s*[^\]]+\]/, '').trim();
      }
      
      // Also check for [FLAGS: ...] in the content body
      const contentFlagsMatch = postContent.match(/\[FLAGS:\s*([^\]]+)\]/);
      if (contentFlagsMatch) {
        const extractedContentFlags = contentFlagsMatch[1].trim();
        // If we already have keywords, append the new flags
        if (keywords && keywords !== 'general') {
          keywords = `${keywords}, ${extractedContentFlags}`;
        } else {
          keywords = extractedContentFlags;
        }
        // Remove the [FLAGS: ...] from the content
        postContent = postContent.replace(/\[FLAGS:\s*[^\]]+\]/, '');
      }
      
      // Process content for hover notes and images
      postContent = this.processPostContent(postContent, slug);
      
      return {
        slug: slug,
        title: title,
        date: date,
        keywords: keywords,
        content: postContent
      };
    } catch (error) {
      console.error('Error parsing .txt post:', error);
      return null;
    }
  }

  // Compute canonical slug from a relative post path under posts/
  // Example: 'devlogs/newpost/newpost.txt' -> 'devlogs/newpost'
  //          'notes/today.txt' -> 'notes/today'
  //          'sample-post.txt' -> 'sample-post'
  computeSlugFromPostPath(relativePath) {
    try {
      if (!relativePath || typeof relativePath !== 'string') return '';
      const withoutExt = relativePath.replace(/\.txt$/i, '');
      const parts = withoutExt.split('/');
      if (parts.length >= 2) {
        const last = parts[parts.length - 1];
        const parent = parts[parts.length - 2];
        if (last === parent) {
          return parts.slice(0, parts.length - 1).join('/');
        }
      }
      return withoutExt;
    } catch (e) {
      console.warn('computeSlugFromPostPath error for', relativePath, e);
      return String(relativePath || '').replace(/\.txt$/i, '');
    }
  }

  // Resolve relative path under posts/ for a given slug using loaded index
  resolvePathForSlug(slug) {
    try {
      if (!slug) return '';
      const fromIndex = (this.posts || []).find(p => p && p.slug === slug);
      if (fromIndex && fromIndex.path) {
        return fromIndex.path;
      }
      // Fallback to naive mapping
      return `${slug}.txt`;
    } catch (e) {
      return `${slug}.txt`;
    }
  }

  processPostContent(content, slug) {
    // Process hover notes: [DISPLAY TEXT:HOVERNOTE CONTENT HERE]
    content = content.replace(/\[([^:]+):([^\]]+)\]/g, (match, displayText, hoverContent) => {
      return `<span class="hover-note" data-hover="${hoverContent.trim()}">${displayText.trim()}</span>`;
    });
    
    // Process images with alignment options
    let imageIndex = 0;
    
    // Process [IMAGER] - right aligned (default)
    content = content.replace(/\[IMAGER\]/g, () => {
      imageIndex++;
      return `<div class="post-image post-image-right" data-post="${slug}" data-index="${imageIndex}"></div>`;
    });
    
    // Process [IMAGEL] - left aligned
    content = content.replace(/\[IMAGEL\]/g, () => {
      imageIndex++;
      return `<div class="post-image post-image-left" data-post="${slug}" data-index="${imageIndex}"></div>`;
    });
    
    // Process [IMAGE] - right aligned (default)
    content = content.replace(/\[IMAGE\]/g, () => {
      imageIndex++;
      return `<div class="post-image post-image-right" data-post="${slug}" data-index="${imageIndex}"></div>`;
    });

    // Process [R] - random image from assets/images (25% smaller)
    content = content.replace(/\[R\]/g, () => {
      return `<div class="post-random-image post-image-right" data-rand="1"></div>`;
    });
    
    // Final cleanup: Remove any remaining [FLAGS: ...] syntax that might have been missed
    content = content.replace(/\[FLAGS:\s*[^\]]+\]/g, '');
    
    // Convert line breaks to HTML breaks to preserve formatting
    content = content.replace(/\n/g, '<br>');
    
    return content;
  }

  async loadRandomAssetImages() {
    if (this._cachedAssetImages && Array.isArray(this._cachedAssetImages) && this._cachedAssetImages.length > 0) {
      return this._cachedAssetImages;
    }
    const cacheBust = Date.now();
    const images = [];
    const exts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    // Method 0: Static index file generated by CI to avoid API limits
    try {
      const resp = await fetch(`assets-images.json?_cb=${cacheBust}`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.images)) {
          data.images.forEach(p => {
            const name = p.split('/').pop();
            const lower = (name || '').toLowerCase();
            const ext = exts.find(ext => lower.endsWith(ext));
            if (ext) {
              images.push({ name, url: encodeURI(`https://raw.githubusercontent.com/pigeonPious/page/main/${p}?_cb=${cacheBust}`), type: ext });
            }
          });
        }
      }
    } catch {}
    try {
      // Try GitHub API for assets/images
      const resp = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/assets/images?_cb=${cacheBust}`);
      if (resp.ok) {
        const list = await resp.json();
        list.forEach(item => {
          const lower = (item.name || '').toLowerCase();
          if (item.type === 'file' && exts.some(ext => lower.endsWith(ext))) {
            const ext = exts.find(ext => lower.endsWith(ext));
            images.push({
              name: item.name,
              url: encodeURI(`https://raw.githubusercontent.com/pigeonPious/page/main/assets/images/${item.name}?_cb=${cacheBust}`),
              type: ext
            });
          }
        });
      }
    } catch {}
    // Method 2: Directory browsing via GitHub HTML (CORS proxy)
    if (images.length === 0) {
      try {
        const corsProxy = 'https://corsproxy.io/?';
        const dirResp = await fetch(corsProxy + `https://github.com/pigeonPious/page/tree/main/assets/images?_cb=${cacheBust}`);
        if (dirResp.ok) {
          const html = await dirResp.text();
          const matches = html.match(/href="([^"]+)"/g) || [];
          matches
            .map(m => (m.match(/href="([^"]+)"/) || [null, ''])[1])
            .filter(href => href.includes('/assets/images/') && exts.some(ext => href.toLowerCase().endsWith(ext)))
            .forEach(href => {
              const name = href.split('/').pop();
              const lower = (name || '').toLowerCase();
              const ext = exts.find(ext => lower.endsWith(ext));
              images.push({
                name,
                url: encodeURI(`https://raw.githubusercontent.com/pigeonPious/page/main/assets/images/${name}?_cb=${cacheBust}`),
                type: ext
              });
            });
        }
      } catch {}
    }
    if (images.length === 0) {
      try {
        // Fallback to GitHub Tree API
        const resp = await fetch('https://api.github.com/repos/pigeonPious/page/git/trees/main?recursive=1');
        if (resp.ok) {
          const data = await resp.json();
          data.tree.filter(it => it.path.startsWith('assets/images/') && exts.some(ext => it.path.toLowerCase().endsWith(ext))).forEach(it => {
            const name = it.path.split('/').pop();
            const lower = name.toLowerCase();
            const ext = exts.find(ext => lower.endsWith(ext));
            images.push({
              name,
              url: encodeURI(`https://raw.githubusercontent.com/pigeonPious/page/main/${it.path}?_cb=${cacheBust}`),
              type: ext
            });
          });
        }
      } catch {}
    }
    this._cachedAssetImages = images;
    return images;
  }

  async loadAndDisplayRandomImages(contentElement) {
    try {
      const placeholders = contentElement.querySelectorAll('.post-random-image');
      if (!placeholders || placeholders.length === 0) return;
      const assets = await this.loadRandomAssetImages();
      if (!assets || assets.length === 0) return;
      placeholders.forEach(ph => {
        const chosen = assets[Math.floor(Math.random() * assets.length)];
        // Preserve alignment classes
        const alignmentClasses = [];
        if (ph.classList.contains('post-image-right')) alignmentClasses.push('post-image-right');
        if (ph.classList.contains('post-image-left')) alignmentClasses.push('post-image-left');
        // Create image element similar to displayMedia image, but 25% smaller
        const img = document.createElement('img');
        img.src = chosen.url;
        img.alt = chosen.name || 'Image';
        img.className = `post-media-content post-image-content random-asset ${alignmentClasses.join(' ')}`;
        img.style.cssText = `
          display: block;
          margin: 1em 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          cursor: pointer;
        `;
        img.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showImagePreview(img.src, img.alt || 'Image');
        });
        ph.parentNode.replaceChild(img, ph);
      });
    } catch (e) {
      console.warn('loadAndDisplayRandomImages error', e);
    }
  }

  async autoRenameMediaFiles(slug, filesToRename, mediaExtensions) {
    try {
      console.log(`autoRenameMediaFiles: Starting automatic renaming for ${filesToRename.length} files in posts/${slug}`);
      
      // Sort all files by their original names for consistent sequential numbering
      const sortedFiles = filesToRename.sort((a, b) => a.name.localeCompare(b.name));
      
      // Rename files in sequence based on their sorted names
      for (let i = 0; i < sortedFiles.length; i++) {
        const file = sortedFiles[i];
        const ext = mediaExtensions.find(ext => file.name.toLowerCase().endsWith(ext));
        const newName = `${i + 1}.${ext}`;
        
        if (file.name !== newName) {
          console.log(`autoRenameMediaFiles: Renaming ${file.name} to ${newName}`);
          
          try {
            // Note: This would require GitHub API with write permissions
            // For now, we'll log the suggested rename and provide instructions
            console.log(`autoRenameMediaFiles: SUGGESTED RENAME: ${file.name} → ${newName}`);
            console.log(`autoRenameMediaFiles: To complete renaming, manually rename the file in GitHub or use the GitHub API with write permissions`);
            
            // You can also show a user-friendly message
            this.showRenameSuggestion(slug, file.name, newName);
          } catch (error) {
            console.error(`autoRenameMediaFiles: Error renaming ${file.name}:`, error);
          }
        }
      }
      
      console.log(`autoRenameMediaFiles: Automatic renaming suggestions completed for posts/${slug}`);
      
    } catch (error) {
      console.error('Error in autoRenameMediaFiles:', error);
    }
  }

  async checkAssetsForNumericRenaming() {
    try {
      console.log('🏗️ Checking for assets that need numeric renaming...');
      
      // Dynamically discover ALL folders inside the posts directory
      const postsResponse = await fetch('https://api.github.com/repos/pigeonPious/page/contents/posts');
      if (!postsResponse.ok) {
        console.log('🏗️ Could not access posts directory (status: ${postsResponse.status})');
        return;
      }
      
      const postsContents = await postsResponse.json();
      const postFolders = postsContents.filter(item => item.type === 'directory');
      
      if (postFolders.length === 0) {
        console.log('🏗️ No post folders found in posts directory');
        return;
      }
      
      console.log(`🏗️ Found ${postFolders.length} post folders to check for non-numeric assets...`);
      
      let totalFilesNeedingRename = 0;
      const mediaExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'mov', 'avi', 'webm'];
      
      // Process each discovered post folder
      for (const folder of postFolders) {
        try {
          console.log(`🏗️ Checking folder: ${folder.name}`);
          
          // Get contents of the post's asset folder
          const response = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${folder.name}`);
          if (response.ok) {
            const contents = await response.json();
            
            // Filter for media files
            const mediaFiles = contents.filter(item => 
              item.type === 'file' && mediaExtensions.some(ext => item.name.toLowerCase().endsWith(ext))
            );
            
            if (mediaFiles.length > 0) {
              console.log(`🏗️ Found ${mediaFiles.length} media files in ${folder.name}`);
              
              // Check if any files need renaming
              const filesToRename = mediaFiles.filter(file => {
                const filename = file.name;
                const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
                return !/^\d+$/.test(nameWithoutExt);
              });
              
              if (filesToRename.length > 0) {
                console.log(`🏗️ ${filesToRename.length} files need renaming in ${folder.name}`);
                
                // Show what would be renamed
                for (const file of filesToRename) {
                  const ext = mediaExtensions.find(ext => file.name.toLowerCase().endsWith(ext));
                  const newName = `${filesToRename.indexOf(file) + 1}.${ext}`;
                  console.log(`🏗️ Would rename: ${file.name} → ${newName}`);
                }
                
                totalFilesNeedingRename += filesToRename.length;
              } else {
                console.log(`🏗️ All files in ${folder.name} are already numeric`);
              }
            } else {
              console.log(`🏗️ No media files found in ${folder.name}`);
            }
          } else {
            console.log(`🏗️ Could not access ${folder.name} folder (status: ${response.status})`);
          }
          
          // Small delay between folders to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`🏗️ Error processing folder ${folder.name}:`, error);
        }
      }
      
      if (totalFilesNeedingRename > 0) {
        console.log(`🏗️ Asset check completed! ${totalFilesNeedingRename} files need numeric renaming.`);
        this.showUserMessage(`${totalFilesNeedingRename} assets need numeric renaming. This will happen automatically during the next build.`, 'info');
      } else {
        this.showUserMessage('All assets are already in numeric format.', 'success');
      }
      
    } catch (error) {
      console.error('Error in asset check:', error);
      this.showUserMessage('Asset check encountered an error. Check console for details.', 'error');
    }
  }



  

  showRenameSuggestion(slug, oldName, newName) {
    // Create a notification to suggest the rename
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--menu-bg, #2d2d2d);
      border: 1px solid var(--border, #555);
      padding: 15px;
      border-radius: 5px;
      color: var(--menu-fg, #fff);
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    notification.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold;">📁 File Rename Suggestion</div>
      <div style="margin-bottom: 5px;"><strong>Post:</strong> ${slug}</div>
      <div style="margin-bottom: 5px;"><strong>Current:</strong> ${oldName}</div>
      <div style="margin-bottom: 10px;"><strong>Suggested:</strong> ${newName}</div>
      <div style="font-size: 11px; opacity: 0.8;">
        Rename this file in GitHub for better compatibility with the image loading system.
      </div>
      <button onclick="this.parentElement.remove()" style="
        margin-top: 10px;
        padding: 5px 10px;
        background: var(--accent, #4a9eff);
        border: none;
        color: white;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
      ">Dismiss</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  async loadImagesForPost(slug) {
    try {
      console.log(`loadImagesForPost: Resolving media for slug: ${slug}`);
      
      const mediaExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'mov', 'avi', 'webm'];
      const imageFiles = [];
      
      // Prefer index-provided media paths to avoid GitHub API rate limits
      try {
        const postFromIndex = (this.posts || []).find(p => p && p.slug === slug);
        if (postFromIndex && Array.isArray(postFromIndex.mediaPaths) && postFromIndex.mediaPaths.length > 0) {
          console.log(`loadImagesForPost: Using ${postFromIndex.mediaPaths.length} media paths from index`);
          postFromIndex.mediaPaths.forEach(rel => {
            const name = rel.split('/').pop();
            const ext = name.split('.').pop().toLowerCase();
            imageFiles.push({
              name,
              url: `https://raw.githubusercontent.com/pigeonPious/page/main/posts/${rel}?_cb=${Date.now()}`,
              type: ext
            });
          });
          return imageFiles;
        }
      } catch (e) {
        console.log('loadImagesForPost: index media lookup failed, falling back to GitHub API');
      }
      
      // Determine candidate folder: exactly the slug path (co-located media). Legacy lookup removed.
      const candidateFolders = [`posts/${slug}`];
      
      for (const folder of candidateFolders) {
        try {
          console.log(`loadImagesForPost: Checking folder via GitHub API: ${folder}`);
          const response = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/${folder}`);
          if (!response.ok) {
            console.log(`loadImagesForPost: Folder not accessible (${response.status}): ${folder}`);
            continue;
          }
          const contents = await response.json();
          const mediaFiles = contents.filter(item => 
            item.type === 'file' && mediaExtensions.some(ext => item.name.toLowerCase().endsWith(ext))
          );
          if (mediaFiles.length === 0) {
            console.log(`loadImagesForPost: No media in folder: ${folder}`);
            continue;
          }
          // Sort for consistency
          mediaFiles.sort((a, b) => a.name.localeCompare(b.name));
          mediaFiles.forEach(item => {
            imageFiles.push({
              name: item.name,
              url: `https://raw.githubusercontent.com/pigeonPious/page/main/${folder}/${item.name}`,
              type: mediaExtensions.find(ext => item.name.toLowerCase().endsWith(ext))
            });
          });
          console.log(`loadImagesForPost: Loaded ${imageFiles.length} media from ${folder}`);
          // Stop after first folder that yields media
          break;
        } catch (folderErr) {
          console.log(`loadImagesForPost: Error reading folder ${folder}:`, folderErr);
        }
      }
      
      console.log(`loadImagesForPost: Total media found: ${imageFiles.length}`);
      return imageFiles;
      
    } catch (error) {
      console.log('Could not load images for post:', slug, error);
      return [];
    }
  }

  async loadAndDisplayImages(slug, contentElement) {
    try {
      console.log(`loadAndDisplayImages: Starting for post: ${slug}`);
      
      const images = await this.loadImagesForPost(slug);
      console.log(`loadAndDisplayImages: Got ${images.length} images`);
      
      if (images.length > 0) {
        // Find all image placeholders in the content
        const imagePlaceholders = contentElement.querySelectorAll('.post-image');
        console.log(`loadAndDisplayImages: Found ${imagePlaceholders.length} image placeholders`);
        
        imagePlaceholders.forEach((placeholder, index) => {
          if (index < images.length) {
            // Use the image at this index
            const image = images[index];
            console.log(`loadAndDisplayImages: Displaying media ${index}: ${image.name}`);
            this.displayMedia(placeholder, image.url, image.name, image.type);
          } else {
            // If we have more placeholders than images, randomly select from available images
            const randomIndex = Math.floor(Math.random() * images.length);
            const image = images[randomIndex];
            console.log(`loadAndDisplayImages: Displaying random media for placeholder ${index}: ${image.name}`);
            this.displayMedia(placeholder, image.url, image.name, image.type);
          }
        });
      } else {
        console.log(`loadAndDisplayImages: No images found for post: ${slug}`);
      }
    } catch (error) {
      console.error('Error loading images for post:', slug, error);
    }
  }

  displayMedia(placeholder, mediaUrl, mediaName, mediaType) {
    // Determine if this is a video or image
    const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(mediaType);
    
    // Preserve alignment classes from the placeholder
    const alignmentClasses = [];
    if (placeholder.classList.contains('post-image-right')) {
      alignmentClasses.push('post-image-right');
    }
    if (placeholder.classList.contains('post-image-left')) {
      alignmentClasses.push('post-image-left');
    }
    
    if (isVideo) {
      // Create video thumbnail wrapper
      const videoWrapper = document.createElement('div');
      videoWrapper.className = `post-video-wrapper ${alignmentClasses.join(' ')}`;
      
      // Create video element for thumbnail
      const video = document.createElement('video');
      video.src = mediaUrl;
      video.preload = 'metadata';
      video.className = 'post-video-thumbnail';
      video.muted = true;
      video.playsInline = true;

      video.style.cssText = `
        width: 120px !important;
        height: 120px !important;
        object-fit: cover;
        display: block;
        border-radius: 8px;
      `;
      
      // Generate poster frame from first frame of video
      video.addEventListener('loadedmetadata', () => {
        // Seek to 0.1 seconds to avoid black frame at start
        video.currentTime = 0.1;
      });
      
      video.addEventListener('seeked', () => {
        // Create canvas to capture the current frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL and set as poster
        try {
          const posterUrl = canvas.toDataURL('image/jpeg', 0.8);
          video.poster = posterUrl;
          
          // Reset video to beginning
          video.currentTime = 0;
          
          console.log('Generated poster for video:', mediaName);
        } catch (error) {
          console.log('Could not generate poster for video:', error);
        }
      });
      
      // Track play/pause state for play button overlay
      video.addEventListener('play', () => {
        video.setAttribute('paused', 'false');
      });
      
      video.addEventListener('pause', () => {
        video.setAttribute('paused', 'true');
      });
      
      video.addEventListener('ended', () => {
        video.setAttribute('paused', 'true');
      });
      
      // Set initial paused state
      video.setAttribute('paused', 'true');
      
      // Create play button overlay
      const playButton = document.createElement('div');
      playButton.className = 'post-video-play-button';
      playButton.innerHTML = '▶';
      
      // Add click handler for full preview
      videoWrapper.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Video thumbnail clicked:', video.src);
        this.showVideoPreview(video.src, mediaName || 'Video');
      });
      

      
      // Assemble the thumbnail
      videoWrapper.appendChild(video);
      videoWrapper.appendChild(playButton);
      
      // Replace the placeholder with the video thumbnail
      placeholder.parentNode.replaceChild(videoWrapper, placeholder);
    } else {
      // Create image element (existing logic)
      const img = document.createElement('img');
      img.src = mediaUrl;
      img.alt = mediaName || 'Post image';
      img.className = `post-media-content post-image-content ${alignmentClasses.join(' ')}`;
      img.style.cssText = `
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1em 0;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        cursor: pointer;
      `;
      
      // Add click handler for full preview
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Image clicked:', img.src);
        this.showImagePreview(img.src, img.alt || 'Image');
      });
      

      
      // Replace the placeholder with the actual image
      placeholder.parentNode.replaceChild(img, placeholder);
    }
  }

  async filterAvailablePosts(posts) {
    if (!Array.isArray(posts)) {
      console.warn('filterAvailablePosts: posts is not an array:', posts);
      return [];
    }
    
    const availablePosts = [];
    
    for (const post of posts) {
      if (!post || !post.slug) {
        console.warn('Skipping invalid post in filter:', post);
        continue;
      }
      
      try {
        // Try GitHub API first, then local fallback
        let postExists = false;
        
        try {
          const githubResponse = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${post.slug}.txt`);
          if (githubResponse.ok) {
            postExists = true;
          }
        } catch (githubError) {
          // Try local fallback
          try {
            const localResponse = await fetch(`posts/${post.slug}.txt`);
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
          console.warn(` Post file not found: ${post.slug}.txt`);
        }
      } catch (error) {
        console.warn(` Error checking post ${post.slug}:`, error);
      }
    }
    
    console.log(` Filtered ${posts.length} posts down to ${availablePosts.length} available`);
    return availablePosts;
  }

  async loadPost(slug) {
    try {
      console.log(`Loading post: ${slug}`);
      
      // Use the same reliable method as sitemap (Method 5) - bypass GitHub API entirely
      let post = null;
      
      try {
        // Support nested paths: slug may contain folders relative to posts/
        const relativePath = this.resolvePathForSlug(slug);
        const rawUrl = `https://raw.githubusercontent.com/pigeonPious/page/main/posts/${relativePath}?_cb=${Date.now()}`;
        
        const response = await fetch(rawUrl);
        
        if (response.ok) {
          const postContent = await response.text();
          post = this.parseTxtPost(postContent, slug);
        } else if (response.status === 404) {
          console.log('Post not found on GitHub (404)');
        } else {
          console.log('Raw GitHub failed with status:', response.status);
        }
      } catch (rawError) {
        console.log('Raw GitHub method failed:', rawError);
      }
      
      // If raw method failed, try the same fallback methods as sitemap
      if (!post) {
        // Method 1: Try GitHub API with headers (nested path supported)
        try {
          const relativePath = this.resolvePathForSlug(slug);
          const response = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts/${relativePath}`, {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'SimpleBlog/1.0'
            }
          });
          if (response.ok) {
            const githubData = await response.json();
            const content = atob(githubData.content);
            post = this.parseTxtPost(content, slug);
          }
        } catch (error) {
          // Method 1 failed silently
        }
        
        // Method 2: Try GitHub Tree API (nested path supported)
      if (!post) {
        try {
            const response = await fetch('https://api.github.com/repos/pigeonPious/page/git/trees/main?recursive=1');
            if (response.ok) {
              const treeData = await response.json();
              const relativePath = this.resolvePathForSlug(slug);
              const postFile = treeData.tree.find(item => item.path === `posts/${relativePath}`);
              
              if (postFile) {
                const rawUrl = `https://raw.githubusercontent.com/pigeonPious/page/main/posts/${relativePath}?_cb=${Date.now()}`;
                const postResponse = await fetch(rawUrl);
                if (postResponse.ok) {
                  const postContent = await postResponse.text();
                  post = this.parseTxtPost(postContent, slug);
                }
              }
            }
          } catch (error) {
            // Method 2 failed silently
          }
        }
      }
      
      if (post) {
        this.displayPost(post);
        this.currentPost = post;
        
        // Store the current post slug in localStorage for the GitHub button
        if (post.slug) {
          localStorage.setItem('current_post_slug', post.slug);
          
          // Clear old edit data if we're loading a different post
          const oldEditData = localStorage.getItem('editPostData');
          if (oldEditData) {
            try {
              const oldEdit = JSON.parse(oldEditData);
              if (oldEdit.slug !== post.slug) {
                console.log(`Clearing old edit data for ${oldEdit.slug} - now viewing ${post.slug}`);
                localStorage.removeItem('editPostData');
              }
            } catch (error) {
              console.warn('Could not parse old edit data:', error);
              localStorage.removeItem('editPostData');
            }
          }
        }
        
        console.log(`Post loaded successfully: ${post.title}`);
        return post;
      } else {
        console.error(`Failed to load post ${slug}: Post not found`);
        this.displayDefaultContent();
      }
    } catch (error) {
      console.error(` Error loading post ${slug}:`, error);
      this.displayDefaultContent();
    }
  }

  displayPost(post) {
    // Update URL to reflect current post (for direct linking and sharing)
    if (post && post.slug) {
      // Use direct hash change for more reliable URL updates
      const currentHash = window.location.hash;
      const newHash = `#${post.slug}`;
      
      if (currentHash !== newHash) {
        console.log(`Updating URL hash from ${currentHash} to ${newHash}`);
        window.location.hash = newHash;
        
        // Also update history state for back/forward navigation
        window.history.replaceState({ postSlug: post.slug }, post.title, window.location.href);
        console.log('Updated URL hash and history state for:', post.slug);
      }
    }
    
    const titleElement = document.getElementById('post-title');
    const dateElement = document.getElementById('post-date');
    const contentElement = document.getElementById('post-content');

    if (titleElement) {
      titleElement.textContent = post.title || 'Untitled';
    } else {
      console.error('titleElement not found!');
    }
    
    if (dateElement) {
      dateElement.textContent = post.date || '';
    } else {
      console.error('dateElement not found!');
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
      
      // Load and display images for this post
      this.loadAndDisplayImages(post.slug, contentElement);
      // Load and display random asset images for [R]
      this.loadAndDisplayRandomImages(contentElement);
      
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
    } else {
      console.error('contentElement not found!');
    }
    
    // Setup hover notes for the displayed post
    this.setupHoverNotes();
    
    // Add navigation controls
    this.addPostNavigation(post);
    
    // Reset site map manual state when showing a new post
    this.siteMapManuallyToggled = false;
    this.siteMapManuallyHidden = false;
    
    console.log('Post displayed successfully:', post.title);
  }

  // Open the currently viewed post in GitHub
  openCurrentPostInGitHub() {
    // Get the current post slug from the URL hash
    const currentHash = window.location.hash;
    const currentSlug = currentHash.replace('#', '');
    
    if (currentSlug && currentSlug !== '') {
      // Construct the GitHub URL for the post
      const githubUrl = `https://github.com/pigeonPious/page/blob/main/posts/${currentSlug}.txt`;
      
      // Open in a new tab
      window.open(githubUrl, '_blank');
    } else {
      // If no post is currently viewed, open the main posts directory
      const postsUrl = 'https://github.com/pigeonPious/page/tree/main/posts';
      window.open(postsUrl, '_blank');
    }
  }

  // Setup image click handlers for full preview functionality
  setupImageClickHandlers(contentElement) {
    const images = contentElement.querySelectorAll('img');
    console.log(` Setting up click handlers for ${images.length} images`);
    
    images.forEach((img, index) => {
      // Remove any existing click handlers to prevent duplicates
      const newImg = img.cloneNode(true);
      img.parentNode.replaceChild(newImg, img);
      
      // Add click handler for full preview
      newImg.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(` Image ${index + 1} clicked:`, newImg.src);
        
        // Test if the function exists and is callable
        if (typeof this.showImagePreview === 'function') {
          this.showImagePreview(newImg.src, newImg.alt || 'Image');
        } else {
          console.error('showImagePreview function not found!');
        }
      });
      
      // Also add a mousedown event as backup
      newImg.addEventListener('mousedown', (e) => {
        console.log(` Image ${index + 1} mousedown:`, newImg.src);
      });
      
      // Add visual indication that image is clickable
      newImg.style.cursor = 'pointer';

      
      // Ensure the image is clickable
      newImg.style.pointerEvents = 'auto';
      newImg.style.userSelect = 'none';
      
      console.log(` Click handler added to image ${index + 1}:`, newImg.src, {
        cursor: newImg.style.cursor,
        pointerEvents: newImg.style.pointerEvents,
        userSelect: newImg.style.userSelect
      });
    });
  }

  // Show full-size image preview
  showImagePreview(imageSrc, imageAlt) {
    console.log('showImagePreview called with:', { imageSrc, imageAlt });
    
    // Remove existing preview if any
    const existingPreview = document.getElementById('image-preview-overlay');
    if (existingPreview) {
      existingPreview.remove();
      console.log('Removed existing preview');
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
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up for better performance
      
      // Apply calculated dimensions
      displayWidth = Math.floor(displayWidth * scale);
      displayHeight = Math.floor(displayHeight * scale);
      
      // For GIFs, limit maximum size to prevent performance issues
      if (imageSrc.toLowerCase().endsWith('.gif')) {
        const maxGifSize = 800; // Maximum dimension for GIFs
        if (displayWidth > maxGifSize || displayHeight > maxGifSize) {
          const gifScale = Math.min(maxGifSize / displayWidth, maxGifSize / displayHeight);
          displayWidth = Math.floor(displayWidth * gifScale);
          displayHeight = Math.floor(displayHeight * gifScale);
        }
      }
      
      fullImage.style.width = `${displayWidth}px`;
      fullImage.style.height = `${displayHeight}px`;
      
      console.log('Image preview sized:', {
        natural: `${fullImage.naturalWidth}x${fullImage.naturalHeight}`,
        display: `${displayWidth}x${displayHeight}`,
        viewport: `${viewportWidth}x${viewportHeight}`,
        scale: scale.toFixed(3),
        isGif: imageSrc.toLowerCase().endsWith('.gif')
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
    
    console.log('Image preview overlay added to DOM');
    
    // Verify the overlay is actually in the DOM
    const verifyOverlay = document.getElementById('image-preview-overlay');
    if (verifyOverlay) {
      console.log('Image preview overlay verified in DOM');
    } else {
      console.error('Image preview overlay not found in DOM after creation');
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
        
        console.log('Image preview resized:', {
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

  // Show full-size video preview
  showVideoPreview(videoSrc, videoName) {
    console.log('showVideoPreview called with:', { videoSrc, videoName });
    
    // Remove existing preview if any
    const existingPreview = document.getElementById('video-preview-overlay');
    if (existingPreview) {
      existingPreview.remove();
      console.log('Removed existing video preview');
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'video-preview-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 50px;
      box-sizing: border-box;
    `;
    
    // Create video container
    const videoContainer = document.createElement('div');
    videoContainer.style.cssText = `
      position: relative;
      cursor: default;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    `;
    
    // Create video element with proper sizing
    const fullVideo = document.createElement('video');
    fullVideo.src = videoSrc;
    fullVideo.controls = true;
    fullVideo.autoplay = false;
    fullVideo.preload = 'metadata';
    fullVideo.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;
    
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
    
    // Close overlay when clicking anywhere (including on the video)
    overlay.addEventListener('click', () => {
      overlay.remove();
    });
    
    // Also close when clicking on the video itself
    fullVideo.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent closing when clicking on video controls
    });
    
    // Assemble and add to DOM
    videoContainer.appendChild(fullVideo);
    videoContainer.appendChild(closeButton);
    overlay.appendChild(videoContainer);
    document.body.appendChild(overlay);
    
    console.log('Video preview overlay added to DOM');
    
    // Add escape key handler
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Clean up event listeners when overlay is removed
    overlay.addEventListener('remove', () => {
      document.removeEventListener('keydown', escapeHandler);
    });
  }

  addPostNavigation(currentPost) {
    console.log('addPostNavigation called with:', currentPost);
    console.log('this.posts length:', this.posts ? this.posts.length : 'undefined');
    
    if (!currentPost || !this.posts || this.posts.length === 0) {
      console.log('Early return - missing data');
      return;
    }
    
    // Don't show navigation for 'about' and 'contact' pages
    if (currentPost.slug === 'about' || currentPost.slug === 'contact') {
      console.log('Early return - about/contact page');
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
          console.log('Next post in category:', nextPost.title);
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
    
    console.log('Default content displayed');
  }

  loadMostRecentPost() {
    if (this.posts.length > 0) {
      const mostRecent = this.posts[0];
      if (mostRecent && mostRecent.slug) {
        // Navigate to blog view with this post
        window.location.href = `index.html#${mostRecent.slug}`;
      } else {
        console.warn('Most recent post missing slug');
        this.displayDefaultContent();
      }
    } else {
      console.log('No posts available');
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
        console.warn('Random post missing slug');
        this.displayDefaultContent();
      }
    } else {
      console.log('No posts available');
      this.displayDefaultContent();
    }
  }

  setTheme(mode, openHSL = false) {
    console.log('Setting theme:', mode, 'openHSL:', openHSL);
    this.theme = mode;
    
    // Remove existing theme classes
    document.body.classList.remove('dark-mode', 'light-mode', 'custom-mode');
    console.log(' Removed existing theme classes');
    
    // Clear any inline styles from previous custom/random themes
    const cssVars = ['--bg', '--fg', '--menu-bg', '--menu-fg', '--sidebar-bg', '--sidebar-fg', '--border', '--muted', '--link', '--accent', '--success-color', '--success-hover-color', '--danger-color', '--danger-hover-color', '--btn-text-color'];
    cssVars.forEach(varName => {
      document.body.style.removeProperty(varName);
    });
    console.log(' Cleared all inline CSS variables');
    
    if (mode === 'dark') {
      document.body.classList.add('dark-mode');
      console.log(' Added dark-mode class');
      // Update hover note colors for dark theme
      this.updateHoverNoteColors('#ffffff');
    } else if (mode === 'light') {
      document.body.classList.add('light-mode');
      console.log('Added light-mode class');
      // Update hover note colors for light theme
      this.updateHoverNoteColors('#000000');
    } else if (mode === 'custom') {
      document.body.classList.add('custom-mode');
      
      // Only open HSL color picker if explicitly requested (not on page load)
      if (openHSL) {
        console.log('Custom theme selected by user, opening HSL color picker...');
        try {
          this.openHSLColorPicker();
          console.log('HSL color picker opened successfully');
        } catch (error) {
          console.error('Error opening HSL color picker:', error);
          console.error('Error stack:', error.stack);
        }
      } else {
        console.log('Custom theme restored from localStorage, not opening HSL picker');
      }
    } else if (mode === 'random') {
      console.log('Random theme button clicked');
      
      // Generate new random color values
      const h = Math.floor(Math.random() * 361);
      const s = Math.floor(Math.random() * 41) + 30;
      const l = Math.floor(Math.random() * 31) + 15;
      const color = `hsl(${h},${s}%,${l}%)`;
      
      console.log('Generated random theme:', { h, s, l, color });
      
      // Save the random theme to localStorage
      const themeData = { h, s, l, color };
      localStorage.setItem('ppPage_random_theme', JSON.stringify(themeData));
      
      // Apply the random theme using the custom theme method
      this.applyCustomTheme(h, s, l);
      console.log('Random theme applied successfully');
    }
    
    // Update theme display
    this.updateThemeDisplay(mode);
    console.log('Theme display updated');
    
    // Save to localStorage
    localStorage.setItem('ppPage_theme', mode);
    console.log('Theme saved to localStorage');
    
    // If custom theme, also save HSL values
    if (mode === 'custom') {
      // Check if we have saved HSL values
      const savedHSL = localStorage.getItem('ppPage_custom_hsl');
      if (savedHSL) {
        try {
          const { h, s, l } = JSON.parse(savedHSL);
          this.applyCustomTheme(h, s, l);
          console.log('Applied saved custom theme HSL values:', { h, s, l });
        } catch (error) {
          console.warn('Could not parse saved custom theme HSL values:', error);
        }
      }
    }
    
    // Debug: show current body classes
    console.log('Current body classes:', document.body.className);
    console.log('Current CSS variables:', {
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
    console.log('openHSLColorPicker function called');
    
    // Remove existing color picker
    const existingPicker = document.getElementById('hsl-color-picker');
    if (existingPicker) {
      existingPicker.remove();
    }

    // Find the View menu to position the HSL picker relative to it
    const viewMenu = document.querySelector('[data-menu="view"]');
    if (!viewMenu) {
      console.error('View menu not found');
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
      console.log('HSL color picker closed by outside click');
    };
    
    // Add the click handler immediately
    document.addEventListener('click', outsideClickHandler);

    console.log('HSL color picker opened in menu style 1');
  }

  updateHoverNoteColors(textColor) {
    console.log('Updating hover note and hyperlink colors to:', textColor);
    
    // Update all hover note elements
    const hoverNotes = document.querySelectorAll('.hover-note');
    hoverNotes.forEach(note => {
      note.style.color = textColor;
      note.style.borderBottomColor = textColor;
    });
    
    // Update all hyperlinks
    const hyperlinks = document.querySelectorAll('a');
    hyperlinks.forEach(link => {
      link.style.color = textColor;
    });
    
    // Update CSS custom properties for future elements
    document.documentElement.style.setProperty('--hover-note-color', textColor);
    document.documentElement.style.setProperty('--hyperlink-color', textColor);
    document.documentElement.style.setProperty('--hover-note-border-color', textColor);
    
    console.log('Hover note and hyperlink colors updated');
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
    
    // Update hover note and hyperlink colors
    this.updateHoverNoteColors(fgColor);
    
    // Save custom theme HSL values to localStorage
    localStorage.setItem('ppPage_custom_hsl', JSON.stringify({ h, s, l }));
    console.log('Custom theme HSL values saved to localStorage:', { h, s, l });
    
    console.log('Custom theme applied:', { h, s, l, bgColor, fgColor });
  }

  captureSelectionAndMakeNote() {
    console.log('Using monitored selection to create hover note...');
    
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
    
    console.log('Using monitored selection:', this.lastValidSelection.text);
    
    // Use the monitored selection data
    this.capturedNoteData = {
      selectedText: this.lastValidSelection.text,
      range: this.lastValidSelection.range.cloneRange(),
      timestamp: this.lastValidSelection.timestamp
    };
    
    // Now open the note input
    this.openNoteInput();
  }




  // Scan local assets folder for images
  async scanLocalAssetsFolder() {
    try {
      // Try to fetch the local assets directory
      const cacheBust = Date.now();
      const response = await fetch(`assets/?_cb=${cacheBust}`);
      if (response.ok) {
        const html = await response.text();
        
        // Parse the directory listing to find image files
        const imageFiles = html.match(/href="([^"]+\.(jpg|jpeg|png|gif|webp|svg|bmp))"/gi);
        if (imageFiles) {
          const images = imageFiles
            .map(href => href.match(/href="([^"]+)"/i)[1])
            .filter(file => this.isImageFile(file));
          
          console.log('Found', images.length, 'images in local assets folder:', images);
          return images;
        }
      }
    } catch (error) {
      console.warn('Could not scan local assets folder:', error);
    }
    
    // Fallback to empty array
    return [];
  }






  shareToBluesky() {
    console.log('🔵 shareToBluesky: Starting Bluesky share...');
    
    try {
      // Get current post information
      const currentPost = this.currentPost;
      if (!currentPost || !currentPost.slug) {
        console.warn('shareToBluesky: No current post found');
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
            console.warn('shareToBluesky: Could not restore selection:', error);
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('shareToBluesky: Error sharing to Bluesky:', error);
      this.showMenuStyle1Message('Error sharing to Bluesky. Please try again.', 'error');
    }
  }

  shareToTwitter() {
    console.log('🐦 shareToTwitter: Starting Twitter share...');
    
    try {
      // Get current post information
      const currentPost = this.currentPost;
      if (!currentPost || !currentPost.slug) {
        console.warn('shareToTwitter: No current post found');
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
            console.warn('shareToTwitter: Could not restore selection:', error);
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('shareToTwitter: Error sharing to Twitter:', error);
      this.showMenuStyle1Message('Error sharing to Twitter. Please try again.', 'error');
    }
  }
  showGitHubLogin() {
    console.log('Showing GitHub OAuth login...');
    
    // Get the PiousPigeon label position for anchoring
    const pigeonLabel = document.querySelector('.pigeon-label');
    if (!pigeonLabel) {
      console.log('PiousPigeon label not found');
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

  // Load saved post flags
  loadSavedFlags() {
    try {
      const savedFlags = localStorage.getItem('current_post_flags');
      if (savedFlags) {
        console.log('Loading saved post flags:', savedFlags);
        // You can add logic here to restore flags if needed
      }
    } catch (error) {
      console.warn('Could not load saved flags:', error);
    }
  }

  setupSelectionMonitoring() {
    console.log('Setting up text selection monitoring...');
    
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
          console.log('Selection captured:', selectedText);
        }
      }
    });
    
    console.log('Text selection monitoring active');
  }


  showFlagsModal() {
    console.log('Setting post flags/keywords...');
    
    // Get the flags button position for anchoring
    const flagsBtn = document.getElementById('keywords-btn');
    if (!flagsBtn) {
      console.log('Flags button not found');
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
      console.log('Loaded existing flags:', existingFlags);
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
      console.log('No post slug found - cannot open in GitHub');
      // Show a message to the user
      alert('No post to open. Please save or load a post first.');
      return;
    }
    
    // Construct the GitHub URL for the post file
    const githubUrl = `https://github.com/pigeonPious/page/blob/main/posts/${postSlug}.txt`;
    
          console.log('Opening GitHub URL:', githubUrl);
    
    // Open in a new tab
    window.open(githubUrl, '_blank');
  }
  async setPostFlags(flags) {
    console.log('Setting post flags:', flags);
    
    // Store flags for the current post
    const postTitle = document.getElementById('postTitle')?.value || 'Untitled Post';
    
    // Parse flags for navigation menu
    const flagArray = flags.split(',').map(f => f.trim());
    const devlogFlags = flagArray.filter(f => f.startsWith('devlog:'));
    
    console.log('Parsed flags:', { all: flagArray, devlog: devlogFlags });
    
    // Store in localStorage for persistence
    localStorage.setItem('current_post_flags', flags);
    
    // Update navigation menu with new flags
    await this.updateNavigationMenu(flagArray);
    
    console.log('Post flags saved:', flags);
  }

  async updateNavigationMenu(flags) {
    console.log('🧭 Updating navigation menu with flags:', flags);
    
    // Get all posts to work with
    const allPosts = this.posts || [];
    console.log('🧭 Total posts available for navigation:', allPosts.length);
    
    // Update All Posts submenu
    await this.updateAllPostsSubmenu();
    

    
    console.log('Navigation menu fully updated');
  }
  async updateAllPostsSubmenu() {
    console.log('Updating All Posts submenu...');
    
    // Find the all posts menu item
    const allPostsMenu = document.querySelector('#all-posts-menu');
    if (!allPostsMenu) {
      console.log('All Posts menu not found');
      return;
    }
    
    // Clear existing submenu
    const existingSubmenu = allPostsMenu.querySelector('.submenu');
    if (existingSubmenu) {
      existingSubmenu.remove();
    }
    
    // Load posts using the same method as sitemap
    let allPosts = [];
    try {
      // Try to load from the static posts index first
      try {
        const indexResponse = await fetch('posts-index.json');
        if (indexResponse.ok) {
          const indexData = await indexResponse.json();
          console.log('All Posts: Found static index with', indexData.total_posts, 'posts');
          
          // Convert index data to post objects
          for (const postData of indexData.posts) {
            try {
              // Load the actual post content (support nested path via path or filename)
              const relativePath = (postData && (postData.path || postData.filename)) || '';
              const postUrl = `https://raw.githubusercontent.com/pigeonPious/page/main/posts/${relativePath}?_cb=${Date.now()}`;
              const response = await fetch(postUrl);
              if (response.ok) {
                const content = await response.text();
                const slug = postData.slug || this.computeSlugFromPostPath(relativePath);
                const post = this.parseTxtPost(content, slug);
                if (post) {
                  allPosts.push(post);
                  console.log('All Posts: Successfully parsed post:', post.title);
                }
              }
            } catch (error) {
              console.error('All Posts: Error loading post content:', postData && postData.filename, error);
            }
          }
          
          if (allPosts.length > 0) {
            console.log('All Posts: Successfully loaded', allPosts.length, 'posts from static index');
          }
        }
      } catch (error) {
        console.log('All Posts: Static index failed, falling back to live discovery:', error);
      }
      
      // Also perform live discovery to include nested posts and merge with index results
        console.log('All Posts: Falling back to live repository scanning...');
        const cacheBust = Date.now();
        let postFiles = [];
        
        // Method 1: Try GitHub API first
        try {
          const response = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts?_cb=${cacheBust}`);
          if (response.ok) {
            const contents = await response.json();
            const txtFiles = contents.filter(item => 
              item.type === 'file' && item.name.endsWith('.txt')
            );
            
            if (txtFiles.length > 0) {
              postFiles = txtFiles.map(item => ({
                name: item.name,
                download_url: item.download_url
              }));
              console.log('All Posts: Found', postFiles.length, 'posts via GitHub API');
            }
          }
        } catch (error) {
          console.log('All Posts: GitHub API method failed:', error);
        }
        
        // Method 2: Fallback to public directory browsing
        if (postFiles.length === 0) {
          try {
            console.log('All Posts: Trying public directory browsing...');
            const corsProxy = 'https://corsproxy.io/?';
            const postsDirResponse = await fetch(corsProxy + `https://github.com/pigeonPious/page/tree/main/posts?_cb=${cacheBust}`);
            
            if (postsDirResponse.ok) {
              const htmlContent = await postsDirResponse.text();
              
              // Parse HTML to find all .txt files
              const txtFileMatches = htmlContent.match(/href="[^"]*\.txt"/g);
              if (txtFileMatches) {
                const discoveredFiles = txtFileMatches
                  .map(match => match.match(/href="([^"]+)"/)[1])
                  .filter(href => href.includes('/posts/') && href.endsWith('.txt'))
                  .map(href => {
                    const filename = href.split('/').pop();
                    return {
                      name: filename,
                      download_url: `https://raw.githubusercontent.com/pigeonPious/page/main/posts/${filename}?_cb=${cacheBust}`
                    };
                  });
                
                if (discoveredFiles.length > 0) {
                  postFiles = discoveredFiles;
                  console.log('All Posts: Found', postFiles.length, 'posts via directory browsing');
                }
              }
            }
          } catch (error) {
            console.log('All Posts: Directory browsing failed:', error);
          }
        }
        
        // Method 3: Try GitHub Tree API for recursive discovery (nested folders)
        if (postFiles.length === 0) {
          try {
            console.log('All Posts: Trying GitHub Tree API...');
            const response = await fetch('https://api.github.com/repos/pigeonPious/page/git/trees/main?recursive=1');
            if (response.ok) {
              const treeData = await response.json();
              const txtFiles = treeData.tree.filter(item => 
                item.path.startsWith('posts/') && item.path.endsWith('.txt')
              );
              if (txtFiles.length > 0) {
                postFiles = txtFiles.map(item => ({
                  name: item.path.replace('posts/', ''),
                  download_url: `https://raw.githubusercontent.com/pigeonPious/page/main/${item.path}?_cb=${cacheBust}`
                }));
                console.log('All Posts: Found', postFiles.length, 'posts via Tree API');
              }
            }
          } catch (error) {
            console.log('All Posts: Tree API failed:', error);
          }
        }
        
        // Process discovered files
        if (postFiles.length > 0) {
          console.log('All Posts: Processing', postFiles.length, 'post files...');
          
          for (const postFile of postFiles) {
            try {
              const postResponse = await fetch(postFile.download_url + (postFile.download_url.includes('?') ? '&' : '?') + '_cb=' + cacheBust);
              if (postResponse.ok) {
                const postContent = await postResponse.text();
                
                // Compute slug from relative path (handles parent/child same-name folders)
                const slug = this.computeSlugFromPostPath(postFile.name);
                
                // Parse the .txt file content
                const post = this.parseTxtPost(postContent, slug);
                
                if (post) {
                  // Merge unique by slug
                  if (!allPosts.find(p => p.slug === post.slug)) {
                    allPosts.push(post);
                  }
                  console.log('All Posts: Successfully parsed post:', post.title);
                }
              }
            } catch (postError) {
              console.warn('Could not parse post file:', postFile.name, postError);
            }
          }
        }
    } catch (error) {
      console.error('All Posts: Error loading posts:', error);
    }
    
    if (allPosts.length === 0) {
      console.log('No posts to show in All Posts submenu');
      return;
    }
    
    // Use the exact same categorization logic as sitemap
    const categories = {};
    allPosts.forEach(post => {
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
    
    // Add all categories with posts
    Object.keys(categories).sort().forEach(category => {
      const posts = categories[category];
      
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
          console.log('🏠 Loading post from All Posts submenu:', post.slug);
          this.loadPost(post.slug);
          this.closeAllMenus();
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
    
    // Show uncategorized posts at the end (if any)
    const uncategorized = allPosts.filter(post => !post.keywords || !post.keywords.trim());
    if (uncategorized.length > 0) {
      // Add uncategorized separator
      const uncategorizedSeparator = document.createElement('div');
      uncategorizedSeparator.className = 'category-separator';
      uncategorizedSeparator.style.cssText = `
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
      uncategorizedSeparator.textContent = 'Uncategorized';
      submenu.appendChild(uncategorizedSeparator);
      
      // Add uncategorized posts
      uncategorized.sort((a, b) => (a.title || '').localeCompare(b.title || '')).forEach(post => {
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
          console.log('🏠 Loading uncategorized post from All Posts submenu:', post.slug);
          this.loadPost(post.slug);
          this.closeAllMenus();
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
    
    console.log('All Posts submenu updated with', allPosts.length, 'posts in', Object.keys(categories).length, 'categories');
  }

  updateProjectsSubmenu(allPosts) {
    // This method is no longer used - projects menu is now static
    return;
    console.log('Updating Projects submenu');
    
    // Find the projects dropdown container
    const projectsDropdown = document.querySelector('#projects-dropdown');
    if (!projectsDropdown) {
      console.log('Projects dropdown not found');
      return;
    }
    
    // Find the projects menu item (the "Loading..." element)
    const projectsMenu = document.querySelector('#projects-menu');
    if (!projectsMenu) {
      console.log('Projects menu not found');
      return;
    }
    
    // Filter for devlog posts
    console.log('All posts for projects menu:', allPosts);
    const devlogPosts = allPosts.filter(post => {
      const postFlags = post.keywords || '';
      const hasDevlog = postFlags.includes('devlog');
      console.log(` Post "${post.title}" has keywords: "${postFlags}", devlog: ${hasDevlog}`);
      return hasDevlog;
    });
    
    console.log('Devlog posts found:', devlogPosts);
    
    if (devlogPosts.length === 0) {
      console.log('No devlog posts found');
      projectsMenu.textContent = 'No projects found';
      return;
    }
    
    // Group posts by devlog subcategory
    const devlogCategories = {};
    devlogPosts.forEach(post => {
      const postFlags = post.keywords || '';
      const devlogFlag = postFlags.split(',').find(f => f.trim().startsWith('devlog:'));
      
      console.log(` Processing post "${post.title}":`);
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
    
    console.log('Final devlog categories:', devlogCategories);
    
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
    
    console.log('Projects submenu updated with simple category list');
  }

  async loadProjectsFromGitHub() {
    try {
      console.log('loadProjectsFromGitHub: Loading projects from projects.json');
      
      // Try to load from projects.json file
      const response = await fetch('projects.json');
      
      if (response.ok) {
        const projects = await response.json();
        console.log('loadProjectsFromGitHub: Loaded', projects.length, 'projects');
        return projects;
      } else {
        console.log('projects.json not found, returning empty array');
        return [];
      }
      
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
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
      console.log('Loading projects for menu display...');
      const projects = await this.loadProjectsFromGitHub();
      this.updateProjectsMenu(projects);
      console.log('Projects menu updated with', projects.length, 'projects');
    } catch (error) {
      console.error('Error loading projects for menu:', error);
    }
  }

  showDevlogPostsWindow(category, posts) {
    console.log(` Opening devlog posts window for category: ${category} with ${posts.length} posts`);
    
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
    
    console.log(` Devlog posts window opened for ${category} with ${posts.length} posts`);
  }

  showCategoryWindow(category, posts) {
    console.log(` Opening category window for ${category} with ${posts.length} posts`);
    
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
        console.log(` Loading post: ${post.title || post.slug}`);
        
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
    
    console.log(` Category window opened for ${category} with ${posts.length} posts`);
  }
  // Show site map when viewing a post
  showSiteMap() {
    console.log('showSiteMap called');
    
    // Remove existing site map if present
    this.hideSiteMap();
    
    // Check for any remaining site maps in DOM
    const existingSiteMaps = document.querySelectorAll('#site-map');
    if (existingSiteMaps.length > 0) {
      console.log('Found', existingSiteMaps.length, 'existing site maps, removing them');
      existingSiteMaps.forEach(map => map.remove());
    }
    
    // Also check if we already have a currentSiteMap reference
    if (this.currentSiteMap) {
      console.log('currentSiteMap reference exists, removing it');
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
    
    // Load posts for sitemap using the static index first, then fallback to live discovery
    const loadPostsForSiteMap = async () => {
      try {
        console.log('Site map: Loading posts for sitemap...');
        
        // Try to load from the static posts index first
        try {
          const indexResponse = await fetch('posts-index.json');
          if (indexResponse.ok) {
            const indexData = await indexResponse.json();
            console.log('Site map: Found static index with', indexData.total_posts, 'posts');
            
            // Convert index data to post objects
            const posts = [];
            for (const postData of indexData.posts) {
              try {
                // Load the actual post content (support nested path via path or filename)
                const relativePath = (postData && (postData.path || postData.filename)) || '';
                const postUrl = `https://raw.githubusercontent.com/pigeonPious/page/main/posts/${relativePath}?_cb=${Date.now()}`;
                const response = await fetch(postUrl);
                if (response.ok) {
                  const content = await response.text();
                  const slug = postData.slug || this.computeSlugFromPostPath(relativePath);
                  const post = this.parseTxtPost(content, slug);
                  if (post) {
                    posts.push(post);
                    console.log('Site map: Successfully parsed post:', post.title);
                  }
                }
              } catch (error) {
                console.error('Site map: Error loading post content:', postData && postData.filename, error);
              }
            }
            
            if (posts.length > 0) {
              console.log('Site map: Successfully loaded', posts.length, 'posts from static index');
              return posts;
            }
          }
        } catch (error) {
          console.log('Site map: Static index failed, falling back to live discovery:', error);
        }
        
        // Also perform live discovery to include nested posts and merge with index results
        console.log('Site map: Falling back to live repository scanning...');
        const cacheBust = Date.now();
        let postFiles = [];
        
        // Method 1: Try GitHub API first
        try {
          const response = await fetch(`https://api.github.com/repos/pigeonPious/page/contents/posts?_cb=${cacheBust}`);
          if (response.ok) {
            const contents = await response.json();
            const txtFiles = contents.filter(item => 
              item.type === 'file' && item.name.endsWith('.txt')
            );
            
            if (txtFiles.length > 0) {
              postFiles = txtFiles.map(item => ({
                name: item.name,
                download_url: item.download_url
              }));
              console.log('Site map: Found', postFiles.length, 'posts via GitHub API');
            }
          }
        } catch (error) {
          console.log('Site map: GitHub API method failed:', error);
        }
        
        // Method 2: Fallback to public directory browsing
        if (postFiles.length === 0) {
          try {
            console.log('Site map: Trying public directory browsing...');
            const corsProxy = 'https://corsproxy.io/?';
            const postsDirResponse = await fetch(corsProxy + `https://github.com/pigeonPious/page/tree/main/posts?_cb=${cacheBust}`);
            
            if (postsDirResponse.ok) {
              const htmlContent = await postsDirResponse.text();
              
              // Parse HTML to find all .txt files
              const txtFileMatches = htmlContent.match(/href="[^"]*\.txt"/g);
              if (txtFileMatches) {
                const discoveredFiles = txtFileMatches
                  .map(match => match.match(/href="([^"]+)"/)[1])
                  .filter(href => href.includes('/posts/') && href.endsWith('.txt'))
                  .map(href => {
                    const filename = href.split('/').pop();
                    return {
                      name: filename,
                      download_url: `https://raw.githubusercontent.com/pigeonPious/page/main/posts/${filename}?_cb=${cacheBust}`
                    };
                  });
                
                if (discoveredFiles.length > 0) {
                  postFiles = discoveredFiles;
                  console.log('Site map: Found', postFiles.length, 'posts via directory browsing');
                }
              }
            }
          } catch (error) {
            console.log('Site map: Directory browsing failed:', error);
          }
        }
        
        // Method 3: Try GitHub Tree API for recursive discovery (nested folders)
        if (postFiles.length === 0) {
          try {
            console.log('Site map: Trying GitHub Tree API...');
            const response = await fetch('https://api.github.com/repos/pigeonPious/page/git/trees/main?recursive=1');
            if (response.ok) {
              const treeData = await response.json();
              const txtFiles = treeData.tree.filter(item => 
                item.path.startsWith('posts/') && item.path.endsWith('.txt')
              );
              if (txtFiles.length > 0) {
                postFiles = txtFiles.map(item => ({
                  name: item.path.replace('posts/', ''),
                  download_url: `https://raw.githubusercontent.com/pigeonPious/page/main/${item.path}?_cb=${cacheBust}`
                }));
                console.log('Site map: Found', postFiles.length, 'posts via Tree API');
              }
            }
          } catch (error) {
            console.log('Site map: Tree API failed:', error);
          }
        }
        
        if (postFiles.length > 0) {
          console.log('Site map: Processing', postFiles.length, 'post files...');
          
          // Fetch and parse each post file
          const posts = [];
          for (const postFile of postFiles) {
            try {
              const postResponse = await fetch(postFile.download_url + (postFile.download_url.includes('?') ? '&' : '?') + '_cb=' + cacheBust);
              if (postResponse.ok) {
                const postContent = await postResponse.text();
                
                // Compute slug from relative path (handles parent/child same-name folders)
                const slug = this.computeSlugFromPostPath(postFile.name);
                
                // Parse the .txt file content
                const post = this.parseTxtPost(postContent, slug);
                
                if (post) {
                  // Merge uniqueness handled later; we push and dedupe when setting this.posts
                  posts.push(post);
                  console.log('Site map: Successfully parsed post:', post.title);
                }
              }
            } catch (postError) {
              console.warn('Could not parse post file:', postFile.name, postError);
            }
          }
          
          // Merge with any index-derived posts
          let merged = posts;
          try {
            const fromIndex = JSON.parse(localStorage.getItem('posts') || '[]');
            const bySlug = new Map();
            for (const p of fromIndex) bySlug.set(p.slug, p);
            for (const p of posts) if (!bySlug.has(p.slug)) bySlug.set(p.slug, p);
            merged = Array.from(bySlug.values());
          } catch {}

          console.log('Site map: Successfully loaded', merged.length, 'posts');
          
          // Update local state
          this.posts = merged;
          localStorage.setItem('posts', JSON.stringify(merged));
          
          return merged;
        } else {
          console.log('Site map: No .txt files found in posts directory');
          return [];
        }
      } catch (error) {
        console.error('Site map: Failed to load posts:', error);
        this.showMenuStyle1Message('Could not load sitemap', 'error');
        return [];
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
        
        // Show uncategorized posts (collapsed by default, unless current post is uncategorized)
        const uncategorized = posts.filter(post => !post.keywords || !post.keywords.trim());
        if (uncategorized.length > 0) {
          const isCurrentUncategorized = currentSlug && uncategorized.some(p => p.slug === currentSlug);
          
          if (isCurrentUncategorized) {
            // Show expanded uncategorized if current post is in it
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
          } else {
            // Show collapsed uncategorized
            treeHTML += `<div style="margin-bottom: 4px;">`;
            treeHTML += `<span class="category-link" data-category="uncategorized" style="cursor: pointer; pointer-events: auto; font-weight: bold;">└─Uncategorized</span>`;
            treeHTML += `</div>`;
          }
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
              console.log(` Editor mode: Loading post ${slug} for editing`);
              this.loadEditDataForPost(slug);
            } else {
              // In blog mode: navigate to the post
              console.log(` Blog mode: Loading post ${slug} for viewing`);
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
          const minContentWidth = 480; // Minimum width needed for main content (reduced to be less aggressive)
          
          if (!this.disableSiteMapAutoHide && windowWidth < (siteMapWidth + minContentWidth)) {
            this.hideSiteMap();
          }
        };
        
        window.addEventListener('resize', this.siteMapResizeHandler);
        
        // Don't auto-hide immediately on initial render; only react on subsequent resizes
        
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
          console.log(` Editor mode: Loading post ${slug} for editing from expanded category`);
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
    const collapsedHTML = `<div style="margin-bottom: 4px;"><span class="category-link" data-category="${categoryName}" style="cursor: pointer; pointer-events: auto; font-weight: bold;">└─${categoryName}</span></div>`;
    
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
    console.log('hideSiteMap called, currentSiteMap:', this.currentSiteMap);
    
    if (this.currentSiteMap) {
      // Remove resize listener
      if (this.siteMapResizeHandler) {
        window.removeEventListener('resize', this.siteMapResizeHandler);
        this.siteMapResizeHandler = null;
      }
      
      this.currentSiteMap.remove();
      this.currentSiteMap = null;
      console.log('Site map removed');
      
      // If this was a manual hide, mark it so automatic show doesn't interfere
      if (this.siteMapManuallyToggled) {
        this.siteMapManuallyHidden = true;
      }
    } else {
      console.log('No currentSiteMap reference found');
      
      // Fallback: remove any site maps by ID
      const siteMaps = document.querySelectorAll('#site-map');
      if (siteMaps.length > 0) {
        console.log('Found', siteMaps.length, 'site maps by ID, removing them');
        siteMaps.forEach(map => map.remove());
      }
    }
  }

  // Toggle site map visibility
  toggleSiteMap() {
    console.log('toggleSiteMap called');
    
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
    // Find all elements with data-note or data-hover attributes
    const noteElements = document.querySelectorAll('[data-note], [data-hover]');
    
    noteElements.forEach(element => {
      // Remove existing listeners to prevent duplication
      element.removeEventListener('mouseenter', this.showHoverNote);
      element.removeEventListener('mouseleave', this.hideHoverNote);
      element.addEventListener('mousemove', this.updateHoverNotePosition);
      element.removeEventListener('click', this.handleHoverNoteClick);
      
      // Add hover event listeners
      element.addEventListener('mouseenter', (e) => this.showHoverNote(e));
      element.addEventListener('mouseleave', () => this.hideHoverNote());
      element.addEventListener('mousemove', (e) => this.updateHoverNotePosition(e));
      
      // Add click handler for existing hovernotes with URLs
      const noteText = element.getAttribute('data-note') || element.getAttribute('data-hover');
      if (noteText && noteText.match(/(https?:\/\/[^\s]+)/i)) {
        element.addEventListener('click', (e) => this.handleHoverNoteClick(e));
      }
    });
  }

  showHoverNote(event) {
    const link = event.target;
    const noteText = link.getAttribute('data-note') || link.getAttribute('data-hover');
    
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

  // Position hover note tooltip with boundary detection
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
    const noteText = element.getAttribute('data-note') || element.getAttribute('data-hover');
    
    if (!noteText) return;
    
    // Check if note contains a URL
    const urlMatch = noteText.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      const url = urlMatch[1];
      console.log(' Opening URL from hovernote:', url);
      event.preventDefault();
      event.stopPropagation();
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



  // Cleanup method to prevent memory leaks
  destroy() {
    console.log(' Cleaning up SimpleBlog...');
    
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
    
    console.log('Cleanup complete');
  }
  // ========== NEW EDIT MENU FUNCTIONS ==========

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
window.SimpleBlog = SimpleBlog;