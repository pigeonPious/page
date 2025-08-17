// Shared Taskbar Component - Generates identical taskbar for all pages

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
    <div class="menu-item"><div class="label" data-menu>View</div><div class="menu-dropdown"><div class="menu-entry" data-mode="dark">Dark</div><div class="menu-entry" data-mode="light">Light</div><div class="menu-entry" data-mode="custom">Custom…</div><div class="menu-entry" data-mode="random">Random</div></div></div>
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
    const isEditorPage = document.getElementById('postTitle') !== null; // Check if we're on simple editor page
    const editorOnlyItems = document.querySelectorAll('.editor-only');
    
    editorOnlyItems.forEach(item => {
      if (isEditorPage) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
    
    // Initialize menu functionality after loading
    initializeMenuSystem();
    
    // Initialize View menu (Custom/Random) if the setupViewMenu function exists
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
        handleMakeNote();
      });
    }

    // Check authentication status and show/hide admin features
    checkAuthStatusForTaskbar();

    // Add Edit Post button event listener
    const editPostButton = document.getElementById('edit-post-button');
    if (editPostButton) {
      editPostButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleEditPost();
      });
    }
  } catch (error) {
    console.warn('Could not load shared taskbar:', error);
    // Fallback: keep existing taskbar if loading fails
  }
}

// Initialize menu system (dropdown functionality, etc.)
function initializeMenuSystem() {
  console.log('Initializing menu system...');
  
  // Menu dropdown functionality
  const menuItems = document.querySelectorAll('.menu-item');
  console.log(`Found ${menuItems.length} menu items`);
  
  menuItems.forEach((item, index) => {
    const label = item.querySelector('.label');
    const dropdown = item.querySelector('.menu-dropdown');
    
    if (label && dropdown) {
      const labelText = label.textContent.trim();
      console.log(`Setting up menu: "${labelText}"`);
      
      // Don't replace the label - just add event listeners directly
      // Clear any existing event listeners by removing and re-adding
      const newLabel = label.cloneNode(true);
      label.parentNode.replaceChild(newLabel, label);
      
      // Prevent text deselection on mousedown
      newLabel.addEventListener('mousedown', (e) => {
        e.preventDefault(); // This prevents text deselection
      });
      
      newLabel.addEventListener('click', (e) => {
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
  
  // Theme switching - use main site's setTheme function if available
  const themeButtons = document.querySelectorAll('[data-mode]');
  themeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = button.getAttribute('data-mode');
      
      // Use main site's setTheme function if available, otherwise fallback to basic switching
      if (typeof setTheme === 'function') {
        if (mode === 'custom' || mode === 'random') {
          // Let the main site's setupViewMenu handle these
          return;
        }
        setTheme(mode);
      } else {
        // Fallback for simple editor or pages without full theme system
        if (mode === 'dark') {
          document.body.classList.add('dark-mode');
          document.body.classList.remove('custom-mode');
          localStorage.setItem('theme', 'dark');
        } else if (mode === 'light') {
          document.body.classList.remove('dark-mode', 'custom-mode');
          localStorage.setItem('theme', 'light');
        }
      }
    });
  });
  
  // Apply saved theme on load
  applyInitialTheme();
}

// Function to apply the initial theme based on localStorage
function applyInitialTheme() {
  const savedTheme = localStorage.getItem('theme');
  const customBg = localStorage.getItem('customBg');
  
  if (typeof setTheme === 'function') {
    // Use main site's setTheme function if available
    if (savedTheme === 'custom' && customBg) {
      setTheme('custom', customBg);
    } else if (savedTheme) {
      setTheme(savedTheme);
    }
  } else {
    // Fallback for simple editor
    if (savedTheme === 'custom' && customBg) {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('custom-mode');
      document.body.style.setProperty('--bg', customBg);
      document.body.style.setProperty('--menu-bg', customBg);
      
      // Extract lightness for text color
      let fg = '#232323';
      if (customBg.startsWith('hsl')) {
        const m = customBg.match(/hsl\(\d+,\s*\d+%?,\s*(\d+)%?\)/);
        if (m) {
          const l = parseInt(m[1]);
          fg = l < 60 ? '#fff' : '#232323';
        }
      }
      document.body.style.setProperty('--fg', fg);
      document.body.style.setProperty('--menu-fg', fg);
    } else if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('custom-mode');
    } else if (savedTheme === 'light') {
      document.body.classList.remove('dark-mode', 'custom-mode');
    }
  }
}

// Check authentication status and show/hide admin features
async function checkAuthStatusForTaskbar() {
  try {
    // Check authentication via auth-check endpoint
    const response = await fetch('/.netlify/functions/auth-check', {
      credentials: 'include' // Include cookies for authentication
    });
    const data = await response.json();
    
    if (data.authenticated && data.user && data.user.isAdmin) {
      // Show admin-only features
      const adminElements = document.querySelectorAll('.admin-only');
      adminElements.forEach(element => {
        element.style.display = 'block';
      });
    } else {
      // Hide admin-only features
      const adminElements = document.querySelectorAll('.admin-only');
      adminElements.forEach(element => {
        element.style.display = 'none';
      });
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    // Hide admin features on error
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
      element.style.display = 'none';
    });
  }
}

// Handle Edit Post button click
function handleEditPost() {
  // Check if we're on the main site with a post loaded
  const postContent = document.getElementById('post-content');
  
  if (!postContent) {
    alert('No post is currently loaded. Please navigate to a post first, then click Edit Post.');
    return;
  }

  // Get the current post slug from URL hash or find it in the page
  let currentSlug = null;
  
  // Try to get slug from URL hash
  if (window.location.hash && window.location.hash.startsWith('#')) {
    currentSlug = window.location.hash.substring(1);
  } else {
    // Look for post identifier in the page
    const postTitle = document.querySelector('h1');
    if (postTitle) {
      // Convert title to potential slug format
      currentSlug = postTitle.textContent.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
  }
  
  if (!currentSlug) {
    alert('Cannot determine which post to edit. Please ensure you have a post loaded.');
    return;
  }

  // Store the post slug for editing and redirect to editor
  sessionStorage.setItem('editingPostSlug', currentSlug);
  window.location.href = 'editor.html?edit=' + encodeURIComponent(currentSlug);
}

// Load the shared taskbar when the page loads - after other scripts
function initializeSharedTaskbar() {
  // Wait a bit for other scripts to load
  setTimeout(() => {
    loadSharedTaskbar();
  }, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSharedTaskbar);
} else {
  // DOM already loaded
  initializeSharedTaskbar();
}
