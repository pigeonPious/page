/**
 * ppPage Core Module
 * Central module manager for robust, conflict-free functionality
 */

class PPPageCore {
  constructor() {
    this.modules = new Map();
    this.initialized = false;
    this.debug = false;
  }

  log(message, type = 'info') {
    if (this.debug || type === 'error') {
      console.log(`[PPPage ${type.toUpperCase()}] ${message}`);
    }
  }

  async registerModule(name, moduleFactory) {
    try {
      const module = await moduleFactory();
      this.modules.set(name, module);
      this.log(`Module '${name}' registered successfully`);
      
      if (module.init && typeof module.init === 'function') {
        await module.init();
        this.log(`Module '${name}' initialized`);
      }
      
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
      return `${url}${separator}t=${Date.now()}`;
    },

    // Slug generation
    generateSlug: (text) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    },

    // Date formatting
    formatDate: (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
}

// Create global instance
window.ppPage = new PPPageCore();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PPPageCore;
}
