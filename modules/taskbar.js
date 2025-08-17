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

function getSharedTaskbarHTML() {
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
  </div>
</div>
  `;
}

function loadSharedTaskbar() {
  try {
    const taskbarHTML = getSharedTaskbarHTML();
    
    // Find the existing menu bar and replace it
    const existingMenuBar = document.querySelector('.menu-bar');
    if (existingMenuBar) {
      existingMenuBar.outerHTML = taskbarHTML;
    } else {
      // If no existing menu bar, insert at the beginning of body
      document.body.insertAdjacentHTML('afterbegin', taskbarHTML);
    }
    
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
    
    // Wait a moment for DOM to update, then initialize menu functionality
    setTimeout(() => {
      initializeMenuSystem();
    }, 50);
    
    // Initialize theme module's view menu if available
    if (window.PPPageCore && window.PPPageCore.modules.theme) {
      console.log('Setting up theme module view menu...');
      window.PPPageCore.modules.theme.setupViewMenu();
    }
    
    // Fallback: Initialize View menu if the setupViewMenu function exists globally
    if (typeof setupViewMenu === 'function') {
      setupViewMenu();
    }
    
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

  } catch (error) {
    console.error('Error loading shared taskbar:', error);
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
    
    // Wait for PPPageCore and modules to be ready
    const waitForModules = () => {
      if (window.PPPageCore && window.PPPageCore.modules && window.PPPageCore.modules.posts) {
        // Modules are ready, initialize buttons
        initializeTaskbarButtons();
      } else {
        // Wait a bit longer and try again
        setTimeout(waitForModules, 200);
      }
    };
    
    waitForModules();
    console.log('Menu system initialization started...');
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
      
      // Use the theme module if available
      if (window.ppPage) {
        const themeModule = window.ppPage.getModule('theme');
        if (themeModule) {
          if (mode === 'dark') {
            themeModule.setTheme('dark');
          } else if (mode === 'light') {
            themeModule.setTheme('light');
          } else if (mode === 'custom') {
            // For custom mode, we could show a color picker or use a default
            themeModule.setTheme('custom', '#2a2a2a');
          } else if (mode === 'random') {
            // Generate random dark color for random mode
            const h = Math.floor(Math.random() * 361);
            const s = Math.floor(Math.random() * 41) + 30; // 30-70%
            const l = Math.floor(Math.random() * 31) + 15; // 15-45%
            const randomColor = `hsl(${h},${s}%,${l}%)`;
            themeModule.setTheme('custom', randomColor);
          }
        } else {
          console.error('Theme module not available');
        }
      } else {
        // Fallback for basic theme switching without the theme module
        console.log('Using fallback theme switching');
        
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
    
    // Initialize star button functionality (for latest post)
    const starButton = document.getElementById('star-button');
    if (starButton) {
      starButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Star button clicked');
        
        // Log feature description to console
        logFeature('Latest Post', 'Quick access to the most recently published blog post');
        
        if (window.ppPage) {
          const postsModule = window.ppPage.getModule('posts');
          if (postsModule && postsModule.loadLatestPost) {
            postsModule.loadLatestPost();
          } else {
            console.error('Posts module or loadLatestPost method not available');
          }
        } else {
          console.error('PPPage core not available');
        }
      });
      console.log('✅ Star button connected');
    }

    // Initialize random post button
    const randomPostButton = document.getElementById('random-post');
    if (randomPostButton) {
      randomPostButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Random post button clicked');
        
        // Log feature description to console
        logFeature('Random Post', 'Navigate to a randomly selected blog post for discovery');
        
        if (window.ppPage) {
          const postsModule = window.ppPage.getModule('posts');
          if (postsModule && postsModule.loadRandomPost) {
            postsModule.loadRandomPost();
          } else {
            console.error('Posts module or loadRandomPost method not available');
          }
        } else {
          console.error('PPPage core not available');
        }
      });
      console.log('✅ Random post button connected');
    }

    // Initialize most recent post button
    const mostRecentButton = document.getElementById('most-recent-post');
    if (mostRecentButton) {
      mostRecentButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Most recent button clicked');
        
        // Log feature description to console
        logFeature('Most Recent', 'Load the chronologically newest blog post');
        
        if (window.ppPage) {
          const postsModule = window.ppPage.getModule('posts');
          if (postsModule && postsModule.loadMostRecentPost) {
            postsModule.loadMostRecentPost();
          } else {
            console.error('Posts module or loadMostRecentPost method not available');
          }
        } else {
          console.error('PPPage core not available');
        }
      });
      console.log('✅ Most recent button connected');
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
  } catch (error) {
    console.error('Error connecting taskbar buttons:', error);
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
      }
    }, 100);
  });
} else {
  // DOM already ready
  setTimeout(() => {
    if (!window.ppPage || !window.ppPage.getModule) {
      console.log('PPPage system not detected, using standalone taskbar initialization');
      loadSharedTaskbar();
    }
  }, 100);
}

// Export for modular system
if (typeof window !== 'undefined') {
  window.TaskbarModule = {
    async init() {
      console.log('Initializing Taskbar module...');
      loadSharedTaskbar();
    },
    load: loadSharedTaskbar,
    initialize: initializeMenuSystem
  };
}
