/**
 * ppPage Core Module
 * Central module manager for robust, conflict-free functionality
 */

class PPPageCore {
  constructor() {
    this.modules = new Map();
    this.initialized = false;
    this.debug = false;
    this.eventBus = new EventTarget();
    this.config = {
      moduleTimeout: 5000,
      retryAttempts: 3
    };
  }

  log(message, type = 'info') {
    if (this.debug || type === 'error') {
      console.log(`[PPPage ${type.toUpperCase()}] ${message}`);
    }
  }

  // Enhanced event system for module communication
  emit(eventName, data) {
    this.eventBus.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }

  on(eventName, handler) {
    this.eventBus.addEventListener(eventName, handler);
  }

  off(eventName, handler) {
    this.eventBus.removeEventListener(eventName, handler);
  }

  async registerModule(name, moduleFactory) {
    try {
      this.log(`Registering module '${name}'...`);
      
      // Check if module already exists
      if (this.modules.has(name)) {
        this.log(`Module '${name}' already registered, replacing...`);
      }

      const module = await moduleFactory();
      
      // Validate module structure
      if (!module || typeof module !== 'object') {
        throw new Error(`Module '${name}' factory returned invalid module`);
      }

      this.modules.set(name, module);
      this.log(`Module '${name}' registered successfully`);
      
      // Initialize module if it has init method
      if (module.init && typeof module.init === 'function') {
        await module.init();
        this.log(`Module '${name}' initialized`);
      }
      
      // Emit module registered event
      this.emit('moduleRegistered', { name, module });
      
      return module;
    } catch (error) {
      this.log(`Failed to register module '${name}': ${error.message}`, 'error');
      throw error;
    }
  }

  getModule(name) {
    return this.modules.get(name);
  }

  hasModule(name) {
    return this.modules.has(name);
  }

  // Get all registered modules
  getAllModules() {
    return Array.from(this.modules.entries());
  }

  // Wait for a specific module to be available
  async waitForModule(name, timeout = this.config.moduleTimeout) {
    if (this.hasModule(name)) {
      return this.getModule(name);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for module '${name}'`));
      }, timeout);

      const handler = (event) => {
        if (event.detail.name === name) {
          clearTimeout(timeoutId);
          this.off('moduleRegistered', handler);
          resolve(event.detail.module);
        }
      };

      this.on('moduleRegistered', handler);
    });
  }

  async init() {
    if (this.initialized) return;
    
    this.log('Initializing PPPage Core...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    this.initialized = true;
    this.emit('coreInitialized');
    this.log('PPPage Core initialized successfully');
  }

  // Utility methods for common operations
  utils = {
    // Safe DOM element getter
    getElement: (selector, context = document) => {
      try {
        return context.querySelector(selector);
      } catch (error) {
        this.log(`Error selecting element '${selector}': ${error.message}`, 'error');
        return null;
      }
    },

    // Safe event listener addition
    addEvent: (element, event, handler, options = {}) => {
      if (!element) return false;
      try {
        element.addEventListener(event, handler, options);
        return true;
      } catch (error) {
        this.log(`Error adding event listener: ${error.message}`, 'error');
        return false;
      }
    },

    // Safe fetch with error handling
    fetch: async (url, options = {}) => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
      } catch (error) {
        this.log(`Fetch error for '${url}': ${error.message}`, 'error');
        throw error;
      }
    },

    // Generate cache-busting URLs
    cacheBustUrl: (url) => {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}v=${Date.now()}`;
    },

    // Debounce function calls
    debounce: (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    // Throttle function calls
    throttle: (func, limit) => {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  };

  // Cleanup method
  destroy() {
    this.modules.clear();
    this.initialized = false;
    this.log('PPPage Core destroyed');
  }
}

// Create and export the core instance
const ppPage = new PPPageCore();

// Export to window for global access
if (typeof window !== 'undefined') {
  window.ppPage = ppPage;
  window.PPPageCore = PPPageCore;
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PPPageCore, ppPage };
}
