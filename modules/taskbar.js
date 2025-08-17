/**
 * Shared Taskbar - Original horizontal layout for modular architecture
 * Provides navigation menus without console dependencies
 */

// Helper function to log feature descriptions to console
function logFeature(featureName, description) {
  try {
    if (window.ppPage && window.ppPage.getModule) {
      const consoleModule = window.ppPage.getModule('console');
      if (consoleModule && consoleModule.logFeature) {
        consoleModule.logFeature(featureName, description);
      }
    }
  } catch (error) {
    console.log(`Feature: ${featureName} - ${description}`);
  }
}

// Global function to handle Make Note clicks from taskbar
function handleMakeNote() {
  // Try multiple approaches to find the make note function
  if (typeof editor !== 'undefined' && editor.makeNote) {
    editor.makeNote();
  } else if (typeof makeNoteFromTaskbar !== 'undefined') {
    makeNoteFromTaskbar();
  } else if (typeof window.makeNoteFromTaskbar !== 'undefined') {
    window.makeNoteFromTaskbar();
  } else {
    console.log('Make note function not available');
  }
}

// Function to generate a random build identifier word
function generateBuildWord() {
  const words = [
    'alpha', 'beta', 'gamma', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
    'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
    'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey',
    'xray', 'yankee', 'zulu', 'crimson', 'azure', 'emerald', 'golden',
    'silver', 'platinum', 'copper', 'iron', 'steel', 'crystal', 'diamond',
    'ruby', 'sapphire', 'pearl', 'coral', 'amber', 'jade', 'onyx',
    'marble', 'granite', 'quartz', 'opal', 'topaz', 'turquoise'
  ];
  
  // Use build date as seed for consistent word per build
  const buildDate = '20250824'; // This should be updated with each build
  let seed = 0;
  for (let i = 0; i < buildDate.length; i++) {
    seed += buildDate.charCodeAt(i);
  }
  
  return words[seed % words.length];
}

function getSharedTaskbarHTML() {
  const buildWord = generateBuildWord();
  return `
<div class="menu-bar">
  <div class="menu-bar-inner">
    <div class="menu-star" id="star-button">*</div>
    <div class="menu-item"><div class="label" data-menu>File</div><div class="menu-dropdown"><a class="menu-entry" id="new-post" href="editor.html">New</a><div class="menu-entry admin-only" id="edit-post-button" style="display: none;">Edit Post</div></div></div>
    <div class="menu-item"><div class="label" data-menu>Edit</div><div class="menu-dropdown"><div class="menu-entry disabled">Undo</div><div class="menu-entry editor-only" id="make-note-button">Make Note</div></div></div>
    <div class="menu-item"><div class="label" data-menu>Navigation</div><div class="menu-dropdown" id="navigation-dropdown">
      <a class="menu-entry" href="index.html">Blog</a>
      <a class="menu-entry" href="#">About</a>
      <a class="menu-entry" href="#">Contact</a>
      <div class="menu-separator"></div>
      <div class="menu-entry" id="most-recent-post">Most Recent</div>
      <div class="menu-entry" id="random-post">Random Post</div>
      <div class="menu-entry has-submenu" id="all-posts-menu">All Posts ></div>
      <div class="menu-entry has-submenu" id="devlog-menu">Devlog ></div>
    </div></div>
    <div class="menu-item"><div class="label" data-menu>View</div><div class="menu-dropdown"><div class="menu-entry" data-mode="dark">Dark</div><div class="menu-entry" data-mode="light">Light</div><div class="menu-entry" data-mode="custom">Custom…</div><div class="menu-entry" data-mode="random">Random</div><div class="menu-separator"></div><div class="menu-entry" id="toggle-console">Console</div></div></div>
    <div class="menu-item"><div class="label" data-menu>Connect</div><div class="menu-dropdown"><div class="menu-entry" id="bluesky-share">Share to Bluesky</div><div class="menu-entry" id="twitter-share">Share to Twitter</div></div></div>
    <div class="taskbar-status editor-only">
      <span id="github-status" onclick="editor.setupGitHub()">not connected</span>
    </div>
    <div class="build-indicator" style="margin-left: auto; padding: 0 8px; font-size: 11px; color: #666; font-family: monospace;">${buildWord}</div>
  </div>
</div>
  `;
}

function loadSharedTaskbar() {
  try {
    console.log('🔧 loadSharedTaskbar() called');
    
    const taskbarHTML = getSharedTaskbarHTML();
    console.log('✅ Generated taskbar HTML, length:', taskbarHTML.length);
    
    // Find the existing menu bar and replace it
    const existingMenuBar = document.querySelector('.menu-bar');
    if (existingMenuBar) {
      console.log('🔄 Replacing existing menu bar');
      existingMenuBar.outerHTML = taskbarHTML;
    } else {
      console.log('➕ Inserting new menu bar at beginning of body');
      document.body.insertAdjacentHTML('afterbegin', taskbarHTML);
    }
    
function loadSharedTaskbar() {
  try {
    console.log('🔧 loadSharedTaskbar() called');
    
    const taskbarHTML = getSharedTaskbarHTML();
    console.log('✅ Generated taskbar HTML, length:', taskbarHTML.length);
    
    // Find the existing menu bar and replace it
    const existingMenuBar = document.querySelector('.menu-bar');
    if (existingMenuBar) {
      console.log('🔄 Replacing existing menu bar');
      existingMenuBar.outerHTML = taskbarHTML;
    } else {
      console.log('➕ Inserting new menu bar at beginning of body');
      document.body.insertAdjacentHTML('afterbegin', taskbarHTML);
    }

    // Verify insertion with retry logic
    let retryCount = 0;
    const maxRetries = 5;
    const verifyAndInitialize = () => {
      const menuBarAfterInsert = document.querySelector('.menu-bar');
      console.log('✅ Menu bar after insertion:', !!menuBarAfterInsert);
      
      if (!menuBarAfterInsert && retryCount < maxRetries) {
        console.log(`Retry ${retryCount + 1}/${maxRetries}: Menu bar not found, retrying insertion...`);
        document.body.insertAdjacentHTML('afterbegin', taskbarHTML);
        retryCount++;
        setTimeout(verifyAndInitialize, 100);
        return;
      }
      
      if (!menuBarAfterInsert) {
        console.error('Failed to insert menu bar after maximum retries');
        return;
      }
      
      // Continue with initialization
      initializeTaskbarContent();
    };
    
    verifyAndInitialize();

  } catch (error) {
    console.error('Error loading shared taskbar:', error);
    // Retry once after a delay
    setTimeout(() => {
      try {
        loadSharedTaskbar();
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }, 1000);
  }
}

function initializeTaskbarContent() {
  try {
    // Show/hide editor-specific items based on page
    const isEditorPage = document.getElementById('postTitle') !== null;
    const editorOnlyItems = document.querySelectorAll('.editor-only');
    
    editorOnlyItems.forEach(item => {
      if (isEditorPage) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
    
    // Initialize menu functionality immediately
    const menuInitialized = initializeMenuDropdowns();
    if (!menuInitialized) {
      console.error('Menu dropdown initialization failed, retrying...');
      setTimeout(() => initializeMenuDropdowns(), 200);
    }
    
    // Initialize module-dependent functionality
    setTimeout(() => {
      initializeMenuSystem();
    }, 100);
    
    // Initialize theme module's view menu if available
    setTimeout(() => {
      if (window.ppPage) {
        const themeModule = window.ppPage.getModule('theme');
        if (themeModule && themeModule.setupViewMenu) {
          console.log('Setting up theme module view menu...');
          themeModule.setupViewMenu();
        }
      }
      
      // Fallback: Initialize View menu if the setupViewMenu function exists globally
      if (typeof setupViewMenu === 'function') {
        setupViewMenu();
      }
    }, 200);
    
    // Add simple editor specific functionality
    if (isEditorPage && typeof editor !== 'undefined') {
      // Replace the main site's "New" functionality with simple editor new document
      const newPostLink = document.getElementById('new-post');
      if (newPostLink) {
        newPostLink.onclick = (e) => {
          e.preventDefault();
          editor.newDocument();
        };
        newPostLink.removeAttribute('href');
      }
    }
    
    // Add Make Note button event listener
    const makeNoteButton = document.getElementById('make-note-button');
    if (makeNoteButton) {
      makeNoteButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Log feature description to console
        logFeature('Make Note', 'Create contextual notes linked to selected text');
        
        handleMakeNote();
      });
    }

    // Check authentication status and show/hide admin features
    checkAuthStatusForTaskbar();
    
    console.log('✅ Taskbar content initialization completed');
    
  } catch (error) {
    console.error('Error initializing taskbar content:', error);
  }
}

function initializeMenuSystem() {
  try {
    console.log('Initializing menu system...');
    
    // Verify taskbar elements exist first
    const menuBar = document.querySelector('.menu-bar');
    if (!menuBar) {
      console.error('Menu bar not found, retrying in 100ms...');
      setTimeout(initializeMenuSystem, 100);
      return;
    }
    
    // Initialize basic menu dropdown functionality first
    initializeMenuDropdowns();
    
    // Wait for ppPage and modules to be ready with improved checking
    const waitForModules = (retryCount = 0) => {
      const maxRetries = 20; // Max 4 seconds of retries
      
      console.log(`Checking if modules are ready... (attempt ${retryCount + 1}/${maxRetries})`);
      
      if (!window.ppPage || typeof window.ppPage.getModule !== 'function') {
        console.log('PPPage system not ready, waiting...');
        if (retryCount < maxRetries) {
          setTimeout(() => waitForModules(retryCount + 1), 200);
        } else {
          console.error('PPPage system failed to initialize after maximum retries');
        }
        return;
      }
      
      const postsModule = window.ppPage.getModule('posts');
      if (!postsModule) {
        console.log('Posts module not ready, waiting...');
        if (retryCount < maxRetries) {
          setTimeout(() => waitForModules(retryCount + 1), 200);
        } else {
          console.error('Posts module failed to load after maximum retries');
        }
        return;
      }
      
      // Check if posts module has the required methods
      const requiredMethods = ['loadLatestPost', 'loadRandomPost', 'loadMostRecentPost'];
      const hasAllMethods = requiredMethods.every(method => typeof postsModule[method] === 'function');
      
      if (!hasAllMethods) {
        console.log('Posts module methods not ready, waiting...');
        if (retryCount < maxRetries) {
          setTimeout(() => waitForModules(retryCount + 1), 200);
        } else {
          console.error('Posts module methods failed to initialize after maximum retries');
        }
        return;
      }
      
      // Check if posts are loaded
      if (!postsModule.posts || postsModule.posts.length === 0) {
        console.log('Posts data not loaded yet, waiting...');
        if (retryCount < maxRetries) {
          setTimeout(() => waitForModules(retryCount + 1), 200);
        } else {
          console.error('Posts data failed to load after maximum retries');
        }
        return;
      }
      
      console.log(`All modules ready with ${postsModule.posts.length} posts loaded, initializing buttons...`);
      const success = initializeTaskbarButtons();
      if (!success && retryCount < maxRetries) {
        console.log('Button initialization failed, retrying...');
        setTimeout(() => waitForModules(retryCount + 1), 500);
      }
    };
    
    waitForModules();
  } catch (error) {
    console.error('Error initializing menu system:', error);
  }
}

function initializeMenuDropdowns() {
  console.log('Setting up menu dropdown functionality...');
  
  // Menu dropdown functionality
  const menuItems = document.querySelectorAll('.menu-item');
  console.log(`Found ${menuItems.length} menu items`);
  
  if (menuItems.length === 0) {
    console.error('No menu items found! Taskbar may not be loaded yet.');
    return false;
  }
  
  menuItems.forEach((item, index) => {
    const label = item.querySelector('.label');
    const dropdown = item.querySelector('.menu-dropdown');
    
    if (label && dropdown) {
      const labelText = label.textContent.trim();
      console.log(`Setting up menu: "${labelText}"`);
      
      // Prevent text deselection on mousedown
      label.addEventListener('mousedown', (e) => {
        e.preventDefault(); // This prevents text deselection
      });
      
      label.addEventListener('click', (e) => {
        e.stopPropagation();
        
        console.log(`Menu "${labelText}" clicked`);
        
        // Close all other dropdowns
        menuItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('open');
          }
        });
        
        // Toggle current dropdown
        const wasOpen = item.classList.contains('open');
        item.classList.toggle('open');
        console.log(`Menu "${labelText}" is now: ${item.classList.contains('open') ? 'OPEN' : 'CLOSED'}`);
      });
    } else {
      console.warn(`Menu item ${index} missing label or dropdown:`, {
        hasLabel: !!label,
        hasDropdown: !!dropdown,
        item: item
      });
    }
  });
  
  // Prevent text deselection on all menu entries
  const menuEntries = document.querySelectorAll('.menu-entry');
  menuEntries.forEach(entry => {
    entry.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent text deselection
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    menuItems.forEach(item => {
      item.classList.remove('open');
    });
  });
  
  // Setup theme switching for View menu
  setupThemeSwitching();
  
  console.log('✅ Menu dropdown functionality initialized');
  return true;
}

function setupThemeSwitching() {
  console.log('Setting up theme switching...');
  
  // Handle theme mode buttons (Dark, Light, Custom, Random)
  const themeButtons = document.querySelectorAll('[data-mode]');
  console.log(`Found ${themeButtons.length} theme buttons`);
  
  themeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const mode = button.getAttribute('data-mode');
      console.log(`Theme button clicked: ${mode}`);
      
      // Log feature description to console
      const descriptions = {
        'dark': 'Switch to dark theme for comfortable night reading',
        'light': 'Switch to light theme for daytime browsing',
        'custom': 'Apply a custom color scheme for personalization',
        'random': 'Generate a random color theme for visual variety'
      };
      if (descriptions[mode]) {
        logFeature('Theme Switch', descriptions[mode]);
      }
      
function setupThemeSwitching() {
  console.log('Setting up theme switching...');
  
  // Handle theme mode buttons (Dark, Light, Custom, Random)
  const themeButtons = document.querySelectorAll('[data-mode]');
  console.log(`Found ${themeButtons.length} theme buttons`);
  
  themeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const mode = button.getAttribute('data-mode');
      console.log(`Theme button clicked: ${mode}`);
      
      // Log feature description to console
      const descriptions = {
        'dark': 'Switch to dark theme for comfortable night reading',
        'light': 'Switch to light theme for daytime browsing',
        'custom': 'Apply a custom color scheme for personalization',
        'random': 'Generate a random color theme for visual variety'
      };
      if (descriptions[mode]) {
        logFeature('Theme Switch', descriptions[mode]);
      }
      
      // Try to use the theme module first
      let themeHandled = false;
      if (window.ppPage) {
        const themeModule = window.ppPage.getModule('theme');
        if (themeModule && typeof themeModule.setTheme === 'function') {
          console.log('Using theme module for theme switching');
          try {
            if (mode === 'custom') {
              themeModule.setTheme('custom', '#2a2a2a');
            } else if (mode === 'random') {
              themeModule.setTheme('random');
            } else {
              themeModule.setTheme(mode);
            }
            themeHandled = true;
          } catch (error) {
            console.error('Theme module error:', error);
          }
        }
      }
      
      // Fallback theme switching if module not available
      if (!themeHandled) {
        console.log('Using fallback theme switching');
        applyFallbackTheme(mode);
      }
    });
  });
  
  // Setup console toggle button
  const consoleToggleButton = document.getElementById('toggle-console');
  if (consoleToggleButton) {
    // Function to update button text based on console visibility
    const updateConsoleButtonText = () => {
      if (window.ppPage && window.ppPage.getModule) {
        const consoleModule = window.ppPage.getModule('console');
        if (consoleModule && consoleModule.isConsoleVisible) {
          const isVisible = consoleModule.isConsoleVisible();
          consoleToggleButton.textContent = isVisible ? 'Hide Console' : 'Show Console';
        }
      }
    };
    
    // Set initial text
    updateConsoleButtonText();
    
    consoleToggleButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Log feature description to console
      logFeature('Console Toggle', 'Show/hide the debug console output window');
      
      // Toggle console visibility
      if (window.ppPage && window.ppPage.getModule) {
        const consoleModule = window.ppPage.getModule('console');
        if (consoleModule) {
          // Check current visibility and toggle
          if (consoleModule.isConsoleVisible()) {
            consoleModule.hide();
          } else {
            consoleModule.show();
          }
          
          // Update button text after toggling
          setTimeout(updateConsoleButtonText, 50);
        }
      }
    });
    console.log('✅ Console toggle button setup complete');
  }
  
  console.log('✅ Theme switching setup complete');
}

function applyFallbackTheme(mode) {
  try {
    if (mode === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('custom-mode');
      localStorage.setItem('ppPage_theme', 'dark');
    } else if (mode === 'light') {
      document.body.classList.remove('dark-mode', 'custom-mode');
      localStorage.setItem('ppPage_theme', 'light');
    } else if (mode === 'custom' || mode === 'random') {
      // Generate a custom color
      const h = mode === 'random' ? Math.floor(Math.random() * 361) : 210;
      const s = mode === 'random' ? Math.floor(Math.random() * 41) + 30 : 20;
      const l = mode === 'random' ? Math.floor(Math.random() * 31) + 15 : 25;
      const color = `hsl(${h},${s}%,${l}%)`;
      
      document.body.classList.remove('dark-mode');
      document.body.classList.add('custom-mode');
      document.body.style.setProperty('--bg', color);
      document.body.style.setProperty('--menu-bg', color);
      
      // Adjust text color based on lightness
      const textColor = l < 50 ? '#ffffff' : '#232323';
      document.body.style.setProperty('--fg', textColor);
      document.body.style.setProperty('--menu-fg', textColor);
      
      localStorage.setItem('ppPage_theme', 'custom');
      console.log(`Applied fallback ${mode} theme with color: ${color}`);
    }
  } catch (error) {
    console.error('Error applying fallback theme:', error);
  }
}
    });
  });
  
  // Setup console toggle button
  const consoleToggleButton = document.getElementById('toggle-console');
  if (consoleToggleButton) {
    // Function to update button text based on console visibility
    const updateConsoleButtonText = () => {
      if (window.ppPage && window.ppPage.getModule) {
        const consoleModule = window.ppPage.getModule('console');
        if (consoleModule && consoleModule.isConsoleVisible) {
          const isVisible = consoleModule.isConsoleVisible();
          consoleToggleButton.textContent = isVisible ? 'Hide Console' : 'Show Console';
        }
      }
    };
    
    // Set initial text
    updateConsoleButtonText();
    
    consoleToggleButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Log feature description to console
      logFeature('Console Toggle', 'Show/hide the debug console output window');
      
      // Toggle console visibility
      if (window.ppPage && window.ppPage.getModule) {
        const consoleModule = window.ppPage.getModule('console');
        if (consoleModule) {
          // Check current visibility and toggle
          if (consoleModule.isConsoleVisible()) {
            consoleModule.hide();
          } else {
            consoleModule.show();
          }
          
          // Update button text after toggling
          setTimeout(updateConsoleButtonText, 50);
        }
      }
    });
    console.log('✅ Console toggle button setup complete');
  }
  
  console.log('✅ Theme switching setup complete');
}

function initializeTaskbarButtons() {
  try {
    console.log('Connecting taskbar buttons to modules...');
    
    // Verify ppPage system is available
    if (!window.ppPage) {
      console.error('PPPage system not available for taskbar buttons');
      return false;
    }
    
    // Verify getModule function exists
    if (typeof window.ppPage.getModule !== 'function') {
      console.error('PPPage getModule function not available');
      return false;
    }
    
    // Get posts module and verify it has required methods
    const postsModule = window.ppPage.getModule('posts');
    if (!postsModule) {
      console.error('Posts module not available - retrying in 500ms...');
      setTimeout(initializeTaskbarButtons, 500);
      return false;
    }
    
    console.log('Posts module found, checking methods...');
    const requiredMethods = ['loadLatestPost', 'loadRandomPost', 'loadMostRecentPost'];
    const availableMethods = requiredMethods.filter(method => typeof postsModule[method] === 'function');
    
    if (availableMethods.length !== requiredMethods.length) {
      console.error(`Posts module missing methods. Available: ${availableMethods.join(', ')}`);
      console.error(`Missing: ${requiredMethods.filter(m => !availableMethods.includes(m)).join(', ')}`);
      return false;
    }
    
    console.log('All required posts methods available, setting up buttons...');
    
    // Initialize star button functionality (for latest post)
    const starButton = document.getElementById('star-button');
    if (starButton) {
      starButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Star button clicked');
        
        try {
          // Log feature description to console
          logFeature('Latest Post', 'Quick access to the most recently published blog post');
          
          if (window.ppPage) {
            const postsModule = window.ppPage.getModule('posts');
            if (postsModule && postsModule.loadLatestPost) {
              console.log('Calling loadLatestPost...');
              await postsModule.loadLatestPost();
              console.log('loadLatestPost completed successfully');
            } else {
              console.error('Posts module or loadLatestPost method not available');
            }
          } else {
            console.error('PPPage core not available');
          }
        } catch (error) {
          console.error('Error in star button handler:', error);
        }
      });
      console.log('✅ Star button connected');
    } else {
      console.error('❌ Star button not found in DOM');
    }

    // Initialize random post button
    const randomPostButton = document.getElementById('random-post');
    if (randomPostButton) {
      randomPostButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Random post button clicked');
        
        try {
          // Log feature description to console
          logFeature('Random Post', 'Navigate to a randomly selected blog post for discovery');
          
          if (window.ppPage) {
            const postsModule = window.ppPage.getModule('posts');
            if (postsModule && postsModule.loadRandomPost) {
              console.log('Calling loadRandomPost...');
              await postsModule.loadRandomPost();
              console.log('loadRandomPost completed successfully');
            } else {
              console.error('Posts module or loadRandomPost method not available');
            }
          } else {
            console.error('PPPage core not available');
          }
        } catch (error) {
          console.error('Error in random post button handler:', error);
        }
      });
      console.log('✅ Random post button connected');
    } else {
      console.error('❌ Random post button not found in DOM');
    }

    // Initialize most recent post button
    const mostRecentButton = document.getElementById('most-recent-post');
    if (mostRecentButton) {
      mostRecentButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Most recent button clicked');
        
        try {
          // Log feature description to console
          logFeature('Most Recent', 'Load the chronologically newest blog post');
          
          if (window.ppPage) {
            const postsModule = window.ppPage.getModule('posts');
            if (postsModule && postsModule.loadMostRecentPost) {
              console.log('Calling loadMostRecentPost...');
              await postsModule.loadMostRecentPost();
              console.log('loadMostRecentPost completed successfully');
            } else {
              console.error('Posts module or loadMostRecentPost method not available');
            }
          } else {
            console.error('PPPage core not available');
          }
        } catch (error) {
          console.error('Error in most recent button handler:', error);
        }
      });
      console.log('✅ Most recent button connected');
    } else {
      console.error('❌ Most recent button not found in DOM');
    }

    // Initialize all posts menu button
    const allPostsButton = document.getElementById('all-posts-menu');
    if (allPostsButton) {
      allPostsButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('All posts menu clicked');
        if (window.ppPage) {
          const navigationModule = window.ppPage.getModule('navigation');
          if (navigationModule && navigationModule.showAllPostsMenu) {
            navigationModule.showAllPostsMenu();
          } else {
            console.error('Navigation module or showAllPostsMenu method not available');
          }
        } else {
          console.error('PPPage core not available');
        }
      });
      console.log('✅ All posts menu connected');
    }

    console.log('All taskbar buttons connected successfully');
    return true;
  } catch (error) {
    console.error('Error connecting taskbar buttons:', error);
    return false;
  }
}

function checkAuthStatusForTaskbar() {
  try {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const adminItems = document.querySelectorAll('.admin-only');
    
    adminItems.forEach(item => {
      if (isAuthenticated) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
  }
}

// Initialize when DOM is ready, but only if ppPage system isn't available
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment to see if ppPage system will handle initialization
    setTimeout(() => {
      if (!window.ppPage || !window.ppPage.getModule) {
        console.log('PPPage system not detected, using standalone taskbar initialization');
        loadSharedTaskbar();
      } else {
        // Even if ppPage exists, ensure taskbar is loaded
        const taskbarExists = document.querySelector('.menu-bar');
        if (!taskbarExists) {
          console.log('PPPage detected but taskbar missing, force loading...');
          loadSharedTaskbar();
        }
      }
    }, 100);
  });
} else {
  // DOM already ready
  setTimeout(() => {
    if (!window.ppPage || !window.ppPage.getModule) {
      console.log('PPPage system not detected, using standalone taskbar initialization');
      loadSharedTaskbar();
    } else {
      // Even if ppPage exists, ensure taskbar is loaded
      const taskbarExists = document.querySelector('.menu-bar');
      if (!taskbarExists) {
        console.log('PPPage detected but taskbar missing, force loading...');
        loadSharedTaskbar();
      }
    }
  }, 100);
}

// Global function to ensure taskbar is always available
window.ensureTaskbar = function() {
  const taskbarExists = document.querySelector('.menu-bar');
  if (!taskbarExists) {
    console.log('Taskbar not found, force loading...');
    loadSharedTaskbar();
  } else {
    console.log('Taskbar already exists');
  }
};

// Export for modular system with enhanced error handling
if (typeof window !== 'undefined') {
  window.TaskbarModule = {
    async init() {
      console.log('🔧 TaskbarModule.init() called');
      try {
        // Check if taskbar already exists
        const existingTaskbar = document.querySelector('.menu-bar');
        if (existingTaskbar) {
          console.log('Taskbar already exists, reinitializing...');
          initializeTaskbarContent();
        } else {
          loadSharedTaskbar();
        }
        console.log('✅ TaskbarModule.init() completed successfully');
      } catch (error) {
        console.error('❌ TaskbarModule.init() failed:', error);
        // Retry once
        setTimeout(() => {
          try {
            loadSharedTaskbar();
          } catch (retryError) {
            console.error('❌ TaskbarModule.init() retry failed:', retryError);
          }
        }, 500);
      }
    },
    load: loadSharedTaskbar,
    initialize: initializeMenuSystem,
    ensureLoaded: function() {
      const taskbarExists = document.querySelector('.menu-bar');
      if (!taskbarExists) {
        this.init();
      }
      return taskbarExists;
    }
  };
  console.log('✅ TaskbarModule exported to window');
}
