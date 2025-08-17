/* Console Output System - Global status line at bottom of window */

// Create and initialize the console output element
function initializeConsoleOutput() {
  // Remove existing console if it exists
  const existingConsole = document.getElementById('global-console');
  if (existingConsole) {
    existingConsole.remove();
  }

  // Create console element
  const consoleElement = document.createElement('div');
  consoleElement.id = 'global-console';
  consoleElement.innerHTML = `
    <div class="console-content">
      <span class="console-icon">ℹ️</span>
      <span class="console-text">Ready</span>
      <button class="console-close" onclick="hideConsoleMessage()">×</button>
    </div>
  `;
  
  // Add CSS styles
  const styles = `
    #global-console {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-secondary, #f5f5f5);
      border-top: 1px solid var(--border, #ddd);
      padding: 8px 15px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      z-index: 9999;
      display: none;
      transition: all 0.2s ease;
    }
    
    body.dark-mode #global-console {
      background: var(--bg-secondary, #2a2a2a);
      border-top-color: var(--border, #444);
      color: var(--fg, #fff);
    }
    
    #global-console.show {
      display: block;
    }
    
    #global-console.error {
      background: #ff4444;
      color: white;
    }
    
    #global-console.warning {
      background: #ffaa00;
      color: white;
    }
    
    #global-console.success {
      background: #00aa44;
      color: white;
    }
    
    .console-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .console-icon {
      margin-right: 8px;
      font-size: 14px;
    }
    
    .console-text {
      flex: 1;
    }
    
    .console-close {
      background: none;
      border: none;
      color: inherit;
      font-size: 16px;
      cursor: pointer;
      padding: 0 4px;
      opacity: 0.7;
      margin-left: 10px;
    }
    
    .console-close:hover {
      opacity: 1;
    }
    
    /* Adjust body padding when console is shown */
    body.console-active {
      padding-bottom: 40px;
    }
  `;
  
  // Add styles to document
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
  
  // Add console to document
  document.body.appendChild(consoleElement);
  
  console.log('Console output system initialized');
}

// Show console message
function showConsoleMessage(message, type = 'info', duration = 0) {
  const consoleElement = document.getElementById('global-console');
  if (!consoleElement) {
    // Console not ready yet, just log to browser console
    console.log(`Console: [${type.toUpperCase()}] ${message}`);
    return;
  }
  
  const iconElement = consoleElement.querySelector('.console-icon');
  const textElement = consoleElement.querySelector('.console-text');
  
  // Set icon and message based on type
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    loading: '⏳'
  };
  
  iconElement.textContent = icons[type] || icons.info;
  textElement.textContent = message;
  
  // Remove existing type classes and add new one
  consoleElement.className = 'show';
  if (type && type !== 'info') {
    consoleElement.classList.add(type);
  }
  
  // Add body class for padding adjustment
  document.body.classList.add('console-active');
  
  // Auto-hide after duration (if specified)
  if (duration > 0) {
    setTimeout(() => {
      hideConsoleMessage();
    }, duration);
  }
  
  console.log(`Console: [${type.toUpperCase()}] ${message}`);
}

// Hide console message
function hideConsoleMessage() {
  const consoleElement = document.getElementById('global-console');
  if (consoleElement) {
    consoleElement.classList.remove('show', 'error', 'warning', 'success');
    document.body.classList.remove('console-active');
  }
}

// Add hover tooltips to navigation elements
function addNavigationTooltips() {
  // Add tooltips to navigation items
  const tooltips = {
    'star-button': 'Navigate to most recent post',
    'most-recent-post': 'Go to the newest published post',
    'random-post': 'Navigate to a random post',
    'all-posts-menu': 'Browse all posts chronologically',
    'devlog-menu': 'Browse development logs by project',
    'new-post': 'Create a new post',
    'make-note-button': 'Add a note to selected text (Ctrl+M)',
    'keywords-btn': 'Set post keywords/flags',
    'images-btn': 'Open image gallery',
    'export-btn': 'Export post as JSON file',
    'publish-btn': 'Publish post to GitHub'
  };

  Object.entries(tooltips).forEach(([id, tooltip]) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('mouseenter', () => {
        showConsoleMessage(tooltip, 'info');
      });
      element.addEventListener('mouseleave', () => {
        hideConsoleMessage();
      });
    }
  });

  // Add tooltips to menu labels
  document.querySelectorAll('.label[data-menu]').forEach(label => {
    const menuName = label.textContent.trim();
    const tooltips = {
      'File': 'File operations - create and edit posts',
      'Edit': 'Editing tools and note functions', 
      'Navigation': 'Navigate between posts and pages',
      'View': 'Change theme and display options',
      'Connect': 'Social sharing and GitHub setup'
    };
    
    if (tooltips[menuName]) {
      label.addEventListener('mouseenter', () => {
        showConsoleMessage(tooltips[menuName], 'info');
      });
      label.addEventListener('mouseleave', () => {
        hideConsoleMessage();
      });
    }
  });
}

// Initialize tooltips after taskbar loads
function initializeTooltips() {
  // Wait for taskbar to be ready
  const checkTaskbar = () => {
    if (document.getElementById('star-button')) {
      addNavigationTooltips();
      console.log('Navigation tooltips initialized');
    } else {
      setTimeout(checkTaskbar, 100);
    }
  };
  setTimeout(checkTaskbar, 500);
}

// Convenience functions - safe versions
window.showConsoleMessage = function(message, type = 'info', duration = 0) {
  if (typeof showConsoleMessage === 'function') {
    showConsoleMessage(message, type, duration);
  } else {
    console.log(`Console: [${type.toUpperCase()}] ${message}`);
  }
};

window.hideConsoleMessage = function() {
  if (typeof hideConsoleMessage === 'function') {
    hideConsoleMessage();
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeConsoleOutput();
    initializeTooltips();
  });
} else {
  initializeConsoleOutput();
  initializeTooltips();
}
