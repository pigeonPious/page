/**
 * Console Output Module
 * Persistent Box Style 1 console in bottom left corner
 * Shows debug messages and feature descriptions
 */

const ConsoleModule = () => {
  let consoleElement = null;
  let messagesContainer = null;
  let isVisible = false;
  let messageHistory = [];
  let maxMessages = 50;

  function createElement() {
    if (consoleElement) return consoleElement;

    // Check if console already exists in DOM to prevent duplicates
    const existingConsole = document.getElementById('persistent-console') || 
                           document.getElementById('global-console') ||
                           document.querySelector('.console-output');
                           
    if (existingConsole) {
      console.log('Console already exists, reusing existing element');
      consoleElement = existingConsole;
      messagesContainer = existingConsole.querySelector('.console-messages');
      return consoleElement;
    }

    // Create main console container
    consoleElement = document.createElement('div');
    consoleElement.id = 'persistent-console';
    consoleElement.className = 'box-style-1 console-output';
    
    // Add inline styles as fallback
    consoleElement.style.cssText = `
      position: fixed !important;
      background: #f7f7f7 !important;
      border: 1px solid #cccccc !important;
      color: #232323 !important;
      font-family: monospace;
      font-size: 12px;
      z-index: 999;
      width: 300px;
      max-height: 200px;
      border-radius: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;
    
    // Apply theme-aware colors if CSS variables are available
    if (getComputedStyle(document.documentElement).getPropertyValue('--bg')) {
      consoleElement.style.background = 'var(--bg)';
      consoleElement.style.borderColor = 'var(--border)';
      consoleElement.style.color = 'var(--fg)';
    }
    
    // Create console header
    const header = document.createElement('div');
    header.className = 'console-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 8px;
      background: #f7f7f7;
      border-bottom: 1px solid #cccccc;
      cursor: move;
      user-select: none;
      flex-shrink: 0;
    `;
    header.innerHTML = `
      <span class="console-title" style="font-weight: bold; font-size: 12px; color: #232323;">Console</span>
      <div class="console-controls" style="display: flex; gap: 4px;">
        <button class="console-btn clear-btn" style="background: transparent; border: none; color: #232323; font-size: 11px; cursor: pointer; padding: 2px 4px;" title="Clear console">Clear</button>
        <button class="console-btn toggle-btn" style="background: transparent; border: none; color: #232323; font-size: 11px; cursor: pointer; padding: 2px 4px;" title="Toggle console">-</button>
      </div>
    `;

    // Create messages container
    messagesContainer = document.createElement('div');
    messagesContainer.className = 'console-messages';
    messagesContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 4px;
      max-height: 150px;
      font-size: 11px;
      line-height: 1.4;
    `;

    // Create initial status message
    const welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'console-message info';
    welcomeMsg.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 2px;
      padding: 2px 4px;
      word-wrap: break-word;
      align-items: flex-start;
      background: transparent;
    `;
    welcomeMsg.innerHTML = `
      <span class="message-time" style="color: #666; font-size: 10px; min-width: 60px; flex-shrink: 0; font-family: monospace;">${getCurrentTime()}</span>
      <span class="message-type" style="color: #3a7bd5; font-size: 10px; font-weight: bold; min-width: 45px; flex-shrink: 0; text-transform: uppercase;">INFO</span>
      <span class="message-text" style="flex: 1; color: #232323;">Console initialized</span>
    `;
    messagesContainer.appendChild(welcomeMsg);

    // Assemble console
    consoleElement.appendChild(header);
    consoleElement.appendChild(messagesContainer);

    // Add to page
    document.body.appendChild(consoleElement);

    // Add event listeners
    setupEventListeners();

    return consoleElement;
  }

  function setupEventListeners() {
    const clearBtn = consoleElement.querySelector('.clear-btn');
    const toggleBtn = consoleElement.querySelector('.toggle-btn');

    clearBtn?.addEventListener('click', clearMessages);
    toggleBtn?.addEventListener('click', toggleVisibility);

    // Make console draggable by header
    const header = consoleElement.querySelector('.console-header');
    makeDraggable(consoleElement, header);
  }

  function makeDraggable(element, handle) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = element.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      handle.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newX = initialX + deltaX;
      let newY = initialY + deltaY;

      // Keep within viewport bounds
      const rect = element.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      element.style.left = newX + 'px';
      element.style.top = newY + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        handle.style.cursor = 'move';
      }
    });
  }

  function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }

  function getMessageTypeStyle(type) {
    const styles = {
      info: 'background: transparent;',
      debug: 'background: rgba(58, 123, 213, 0.1);',
      warning: 'background: rgba(255, 165, 0, 0.2);',
      error: 'background: rgba(255, 69, 69, 0.2);',
      feature: 'background: rgba(34, 197, 94, 0.15);'
    };
    return styles[type] || styles.info;
  }

  function addMessage(text, type = 'info') {
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `console-message ${type}`;
    messageDiv.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 2px;
      padding: 2px 4px;
      word-wrap: break-word;
      align-items: flex-start;
      ${getMessageTypeStyle(type)}
    `;
    messageDiv.innerHTML = `
      <span class="message-time" style="color: #666; font-size: 10px; min-width: 60px; flex-shrink: 0; font-family: monospace;">${getCurrentTime()}</span>
      <span class="message-type" style="color: #3a7bd5; font-size: 10px; font-weight: bold; min-width: 45px; flex-shrink: 0; text-transform: uppercase;">${type.toUpperCase()}</span>
      <span class="message-text" style="flex: 1; color: #232323;">${text}</span>
    `;

    messagesContainer.appendChild(messageDiv);
    
    // Store in history
    messageHistory.push({ text, type, time: new Date() });
    
    // Limit message count
    if (messageHistory.length > maxMessages) {
      messageHistory.shift();
      const firstMessage = messagesContainer.querySelector('.console-message');
      if (firstMessage) {
        firstMessage.remove();
      }
    }

    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Show console briefly if hidden
    if (!isVisible) {
      showBriefly();
    }
  }

  function clearMessages() {
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';
    messageHistory = [];
    
    // Add cleared message
    addMessage('Console cleared', 'info');
  }

  function toggleVisibility() {
    if (!consoleElement) return;

    const messages = consoleElement.querySelector('.console-messages');
    const toggleBtn = consoleElement.querySelector('.toggle-btn');
    
    if (isVisible) {
      messages.style.display = 'none';
      toggleBtn.textContent = '+';
      consoleElement.classList.add('minimized');
      isVisible = false;
    } else {
      messages.style.display = 'block';
      toggleBtn.textContent = '-';
      consoleElement.classList.remove('minimized');
      isVisible = true;
    }
  }

  function showBriefly() {
    if (isVisible) return;
    
    const messages = consoleElement.querySelector('.console-messages');
    const toggleBtn = consoleElement.querySelector('.toggle-btn');
    
    // Show temporarily
    messages.style.display = 'block';
    consoleElement.classList.remove('minimized');
    
    // Hide again after 3 seconds
    setTimeout(() => {
      if (!isVisible) {
        messages.style.display = 'none';
        consoleElement.classList.add('minimized');
      }
    }, 3000);
  }

  function show() {
    if (!consoleElement) createElement();
    
    consoleElement.style.display = 'block';
    isVisible = true;
    
    const messages = consoleElement.querySelector('.console-messages');
    const toggleBtn = consoleElement.querySelector('.toggle-btn');
    messages.style.display = 'block';
    toggleBtn.textContent = '-';
    consoleElement.classList.remove('minimized');
  }

  function hide() {
    if (!consoleElement) return;
    
    consoleElement.style.display = 'none';
    isVisible = false;
  }

  function logFeature(featureName, description) {
    addMessage(`Feature: ${featureName} - ${description}`, 'feature');
  }

  function logDebug(message) {
    addMessage(message, 'debug');
  }

  function logWarning(message) {
    addMessage(message, 'warning');
  }

  function logError(message) {
    addMessage(message, 'error');
  }

  // Initialize when module loads
  function init() {
    createElement();
    
    // Position in bottom left corner
    consoleElement.style.left = '20px';
    consoleElement.style.bottom = '20px';
    
    // Hook into ppPage.log() system if available
    if (window.ppPage && window.ppPage.log) {
      const originalLog = window.ppPage.log.bind(window.ppPage);
      window.ppPage.log = function(message, type = 'info') {
        // Call original log
        originalLog(message, type);
        // Also show in console
        addMessage(message, type);
      };
      ppPage.log('Console output module hooked into ppPage.log()', 'debug');
    }

    // Show console initially
    show();
    
    addMessage('Console output module loaded', 'info');
  }

  return {
    init,
    show,
    hide,
    addMessage,
    clearMessages,
    toggleVisibility,
    logFeature,
    logDebug,
    logWarning,
    logError,
    isConsoleVisible: () => isVisible,
    getMessageHistory: () => [...messageHistory]
  };
};

// Auto-register if ppPage is available
if (typeof window !== 'undefined' && window.ppPage) {
  window.ppPage.registerModule('console', ConsoleModule);
}

// Also expose globally for compatibility
if (typeof window !== 'undefined') {
  window.ConsoleModule = ConsoleModule;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConsoleModule;
}
