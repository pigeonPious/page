/**
 * PPPage Application Initializer
 * Clean, event-driven module initialization system
 */

class PPPageApp {
  constructor() {
    this.initialized = false;
    this.modules = new Map();
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._init();
    return this.initPromise;
  }

  async _init() {
    if (this.initialized) return;
    
    console.log('🚀 Starting PPPage Application...');
    
    try {
      // Wait for core to be available
      await this.waitForCore();
      
      // Initialize core
      await window.ppPage.init();
      
      // Register all modules in dependency order
      await this.registerModules();
      
      // Setup global error handling
      this.setupErrorHandling();
      
      this.initialized = true;
      console.log('✅ PPPage Application initialized successfully');
      
      // Emit app ready event
      window.ppPage.emit('appReady');
      
    } catch (error) {
      console.error('❌ PPPage Application initialization failed:', error);
      throw error;
    }
  }

  async waitForCore() {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    while (typeof window.ppPage === 'undefined' && attempts < maxAttempts) {
      console.log(`Waiting for PPPage Core... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof window.ppPage === 'undefined') {
      throw new Error('PPPage Core not found after waiting! Make sure core.js is loaded first.');
    }
    
    console.log('✅ PPPage Core found');
  }

  async registerModules() {
    const moduleFactories = [
      { name: 'posts', factory: window.PostsModule },
      { name: 'navigation', factory: window.NavigationModule },
      { name: 'editor', factory: window.EditorModule },
      { name: 'theme', factory: window.ThemeModule },
      { name: 'taskbar', factory: window.TaskbarModule },
      { name: 'console', factory: window.ConsoleModule }
    ];

    console.log('🔧 Registering modules...');
    
    for (const { name, factory } of moduleFactories) {
      if (typeof factory === 'function') {
        try {
          console.log(`🔧 Registering module: ${name}`);
          const module = await window.ppPage.registerModule(name, factory);
          this.modules.set(name, module);
          console.log(`✅ Module registered: ${name}`);
        } catch (error) {
          console.error(`❌ Failed to register module ${name}:`, error);
          // Continue with other modules
        }
      } else {
        console.warn(`⚠️ Module factory for '${name}' not found`);
      }
    }
  }

  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message);
      console.error('Global error:', error);
      
      if (window.ppPage) {
        window.ppPage.log(`Global error: ${error.message}`, 'error');
      }
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      if (window.ppPage) {
        window.ppPage.log(`Unhandled promise rejection: ${event.reason}`, 'error');
      }
    });
  }

  // Public API methods
  getModule(name) {
    return this.modules.get(name) || window.ppPage?.getModule(name);
  }

  refresh() {
    console.log('🔄 Refreshing PPPage Application...');
    this.modules.clear();
    this.initialized = false;
    this.initPromise = null;
    return this.init();
  }

  destroy() {
    console.log('🗑️ Destroying PPPage Application...');
    
    // Destroy all modules
    this.modules.forEach(module => {
      if (module.destroy && typeof module.destroy === 'function') {
        try {
          module.destroy();
        } catch (error) {
          console.error('Error destroying module:', error);
        }
      }
    });
    
    this.modules.clear();
    this.initialized = false;
    this.initPromise = null;
  }
}

// Create and export the app instance
const ppPageApp = new PPPageApp();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ppPageApp.init().catch(console.error);
  });
} else {
  // DOM already ready
  ppPageApp.init().catch(console.error);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.ppPageApp = ppPageApp;
  window.PPPageApp = PPPageApp;
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PPPageApp, ppPageApp };
}
