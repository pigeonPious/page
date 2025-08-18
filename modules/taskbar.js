/**
 * Taskbar Module - Clean, maintainable navigation system
 * Uses event-driven architecture for better module communication
 */

class TaskbarModule {
  constructor() {
    this.initialized = false;
    this.menuState = new Map();
    this.eventHandlers = new Map();
    this.config = {
      animationDuration: 200,
      menuCloseDelay: 100
    };
  }

  async init() {
    if (this.initialized) return;
    
    console.log('🔧 Initializing TaskbarModule...');
    
    try {
      // Wait for core to be ready
      if (window.ppPage) {
        await window.ppPage.waitForModule('core');
      }
      
      this.render();
      this.bindEvents();
      this.initializeMenuSystem();
      
      this.initialized = true;
      console.log('✅ TaskbarModule initialized successfully');
      
      // Emit ready event
      if (window.ppPage) {
        window.ppPage.emit('taskbarReady');
      }
    } catch (error) {
      console.error('❌ TaskbarModule initialization failed:', error);
      throw error;
    }
  }

  render() {
    const taskbarHTML = this.generateHTML();
    
    // Find existing taskbar or create new one
    const existingTaskbar = document.querySelector('.menu-bar');
    if (existingTaskbar) {
      existingTaskbar.outerHTML = taskbarHTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', taskbarHTML);
    }
  }

  generateHTML() {
    const buildWord = this.generateBuildWord();
    
    return `
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
              <div class="menu-entry has-submenu" id="all-posts-menu">All Posts ></div>
              <div class="menu-entry has-submenu" id="devlog-menu">Devlog ></div>
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
            <span id="github-status" onclick="this.handleGitHubSetup()">not connected</span>
          </div>
          
          <div class="build-indicator" style="margin-left: auto; padding: 0 8px; font-size: 11px; color: #666; font-family: monospace;">
            ${buildWord}
          </div>
        </div>
      </div>
    `;
  }

  generateBuildWord() {
    const words = [
      'alpha', 'beta', 'gamma', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
      'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
      'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey',
      'xray', 'yankee', 'zulu', 'crimson', 'azure', 'emerald', 'golden'
    ];
    
    const buildDate = '20250822';
    let seed = 0;
    for (let i = 0; i < buildDate.length; i++) {
      seed += buildDate.charCodeAt(i);
    }
    
    return words[seed % words.length];
  }

  bindEvents() {
    // Menu system events
    this.bindMenuEvents();
    
    // Button events
    this.bindButtonEvents();
    
    // Global events
    this.bindGlobalEvents();
  }

  bindMenuEvents() {
    // Menu toggle events
    document.addEventListener('click', (e) => {
      const menuItem = e.target.closest('.menu-item');
      if (!menuItem) return;
      
      const menuType = menuItem.dataset.menu;
      if (menuType) {
        this.toggleMenu(menuType);
      }
    });

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

  bindButtonEvents() {
    // Star button (home)
    this.addEventHandler('#star-button', 'click', () => {
      window.location.href = 'index.html';
    });

    // New post button
    this.addEventHandler('#new-post', 'click', (e) => {
      e.preventDefault();
      window.location.href = 'editor.html';
    });

    // Make note button
    this.addEventHandler('#make-note-button', 'click', () => {
      this.handleMakeNote();
    });

    // Console toggle
    this.addEventHandler('#toggle-console', 'click', () => {
      this.toggleConsole();
    });

    // Theme mode buttons
    this.addEventHandler('[data-mode]', 'click', (e) => {
      const mode = e.target.dataset.mode;
      this.setThemeMode(mode);
    });

    // Navigation menu items
    this.addEventHandler('#most-recent-post', 'click', () => {
      this.navigateToMostRecent();
    });

    this.addEventHandler('#random-post', 'click', () => {
      this.navigateToRandom();
    });
  }

  bindGlobalEvents() {
    // Listen for theme changes
    if (window.ppPage) {
      window.ppPage.on('themeChanged', (event) => {
        this.updateThemeDisplay(event.detail.mode);
      });
    }
  }

  addEventHandler(selector, event, handler) {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener(event, handler);
      this.eventHandlers.set(`${selector}-${event}`, { element, event, handler });
    }
  }

  toggleMenu(menuType) {
    const menuItem = document.querySelector(`[data-menu="${menuType}"]`);
    if (!menuItem) return;

    const dropdown = menuItem.querySelector('.menu-dropdown');
    const isOpen = dropdown.classList.contains('open');

    // Close all other menus first
    this.closeAllMenus();

    // Toggle current menu
    if (!isOpen) {
      dropdown.classList.add('open');
      this.menuState.set(menuType, true);
    }
  }

  closeAllMenus() {
    document.querySelectorAll('.menu-dropdown.open').forEach(dropdown => {
      dropdown.classList.remove('open');
    });
    this.menuState.clear();
  }

  initializeMenuSystem() {
    // Initialize submenu system
    this.initializeSubmenus();
    
    // Set initial theme mode
    this.updateThemeDisplay('dark');
  }

  initializeSubmenus() {
    // All posts submenu
    const allPostsMenu = document.getElementById('all-posts-menu');
    if (allPostsMenu) {
      allPostsMenu.addEventListener('mouseenter', () => {
        this.showSubmenu(allPostsMenu, 'all-posts');
      });
    }

    // Devlog submenu
    const devlogMenu = document.getElementById('devlog-menu');
    if (devlogMenu) {
      devlogMenu.addEventListener('mouseenter', () => {
        this.showSubmenu(devlogMenu, 'devlog');
      });
    }
  }

  showSubmenu(menuElement, submenuType) {
    // Implementation for submenu display
    console.log(`Showing ${submenuType} submenu`);
  }

  // Event handlers
  handleMakeNote() {
    if (window.ppPage) {
      const editorModule = window.ppPage.getModule('editor');
      if (editorModule && editorModule.makeNote) {
        editorModule.makeNote();
      } else {
        console.warn('Editor module not available for make note functionality');
      }
    }
  }

  toggleConsole() {
    if (window.ppPage) {
      const consoleModule = window.ppPage.getModule('console');
      if (consoleModule && consoleModule.toggle) {
        consoleModule.toggle();
      } else {
        console.warn('Console module not available');
      }
    }
  }

  setThemeMode(mode) {
    if (window.ppPage) {
      const themeModule = window.ppPage.getModule('theme');
      if (themeModule && themeModule.setMode) {
        themeModule.setMode(mode);
      } else {
        console.warn('Theme module not available');
      }
    }
  }

  updateThemeDisplay(mode) {
    // Update theme display in taskbar
    const themeButtons = document.querySelectorAll('[data-mode]');
    themeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  navigateToMostRecent() {
    // Navigate to most recent post
    console.log('Navigating to most recent post');
  }

  navigateToRandom() {
    // Navigate to random post
    console.log('Navigating to random post');
  }

  // Public API methods
  refresh() {
    this.render();
    this.bindEvents();
  }

  destroy() {
    // Remove all event handlers
    this.eventHandlers.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventHandlers.clear();
    
    // Remove taskbar from DOM
    const taskbar = document.getElementById('main-taskbar');
    if (taskbar) {
      taskbar.remove();
    }
    
    this.initialized = false;
  }
}

// Export module factory
const TaskbarModule = () => new TaskbarModule();

// Export for global access
if (typeof window !== 'undefined') {
  window.TaskbarModule = TaskbarModule;
  window.TaskbarModuleClass = TaskbarModule;
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TaskbarModule, TaskbarModuleClass };
}
