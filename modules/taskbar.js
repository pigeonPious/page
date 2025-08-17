/**
 * Shared Taskbar - Original horizontal layout for modular architecture
 * Provides navigation menus without console dependencies
 */

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
    const isEditorPage = document.getElementById('postTitle') !== null;
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
    
    // Initialize View menu if the setupViewMenu function exists
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

  } catch (error) {
    console.error('Error loading shared taskbar:', error);
  }
}

function initializeMenuSystem() {
  try {
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

function initializeTaskbarButtons() {
  try {
    console.log('Connecting taskbar buttons to modules...');
    
    // Initialize star button functionality (for latest post)
    const starButton = document.getElementById('star-button');
    if (starButton) {
      starButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Star button clicked');
        if (window.PPPageCore && window.PPPageCore.modules.posts) {
          window.PPPageCore.modules.posts.loadLatestPost();
        } else {
          console.error('Posts module not available');
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
        if (window.PPPageCore && window.PPPageCore.modules.posts) {
          window.PPPageCore.modules.posts.loadRandomPost();
        } else {
          console.error('Posts module not available');
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
        if (window.PPPageCore && window.PPPageCore.modules.posts) {
          window.PPPageCore.modules.posts.loadMostRecentPost();
        } else {
          console.error('Posts module not available');
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
        if (window.PPPageCore && window.PPPageCore.modules.navigation) {
          window.PPPageCore.modules.navigation.showAllPostsMenu();
        } else {
          console.error('Navigation module not available');
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSharedTaskbar);
} else {
  loadSharedTaskbar();
}

// Export for modular system
if (typeof window !== 'undefined') {
  window.TaskbarModule = {
    load: loadSharedTaskbar,
    initialize: initializeMenuSystem
  };
}
