/**
 * Development Configuration
 * Centralized configuration for easier development and debugging
 */

const DevConfig = {
  // Debug settings
  debug: {
    enabled: true,
    logLevel: 'info', // 'error', 'warn', 'info', 'debug'
    showTimestamps: true,
    logToConsole: true,
    logToFile: false
  },

  // Module settings
  modules: {
    autoInit: true,
    timeout: 5000,
    retryAttempts: 3,
    loadOrder: [
      'core',
      'posts', 
      'navigation',
      'editor',
      'theme',
      'taskbar',
      'console'
    ]
  },

  // Taskbar settings
  taskbar: {
    autoRefresh: false,
    menuAnimation: true,
    submenuDelay: 200,
    clickDebounce: 100
  },

  // Editor settings
  editor: {
    autoSave: true,
    saveInterval: 30000, // 30 seconds
    maxDraftSize: 1000000, // 1MB
    supportedFormats: ['json', 'md', 'txt']
  },

  // Theme settings
  theme: {
    defaultMode: 'dark',
    autoSwitch: false,
    customColors: {
      primary: '#007acc',
      secondary: '#6c757d',
      accent: '#28a745'
    }
  },

  // Performance settings
  performance: {
    lazyLoad: true,
    cacheEnabled: true,
    maxCacheSize: 50, // MB
    imageOptimization: true
  },

  // Development helpers
  dev: {
    hotReload: false,
    mockData: false,
    performanceMonitoring: true,
    errorReporting: true
  },

  // API endpoints
  api: {
    baseUrl: '/.netlify/functions',
    timeout: 10000,
    retryAttempts: 3
  }
};

// Development utilities
const DevUtils = {
  // Log with configuration
  log(message, level = 'info', context = '') {
    if (!DevConfig.debug.enabled) return;
    
    if (DevConfig.debug.logLevel === 'error' && level !== 'error') return;
    if (DevConfig.debug.logLevel === 'warn' && !['error', 'warn'].includes(level)) return;
    
    const timestamp = DevConfig.debug.showTimestamps ? `[${new Date().toISOString()}]` : '';
    const prefix = `[PPPage:${level.toUpperCase()}]`;
    const contextStr = context ? `[${context}]` : '';
    
    const logMessage = `${timestamp} ${prefix} ${contextStr} ${message}`;
    
    if (DevConfig.debug.logToConsole) {
      const logMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[logMethod](logMessage);
    }
  },

  // Performance measurement
  measureTime(name, fn) {
    if (!DevConfig.dev.performanceMonitoring) {
      return fn();
    }
    
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.log(`${name} took ${(end - start).toFixed(2)}ms`, 'debug', 'PERF');
    return result;
  },

  // Async performance measurement
  async measureTimeAsync(name, fn) {
    if (!DevConfig.dev.performanceMonitoring) {
      return await fn();
    }
    
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    this.log(`${name} took ${(end - start).toFixed(2)}ms`, 'debug', 'PERF');
    return result;
  },

  // Error reporting
  reportError(error, context = '') {
    if (!DevConfig.dev.errorReporting) return;
    
    this.log(`Error in ${context}: ${error.message}`, 'error', 'ERROR');
    
    if (error.stack) {
      this.log(`Stack trace: ${error.stack}`, 'debug', 'ERROR');
    }
  },

  // Configuration getter with fallbacks
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = DevConfig;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  },

  // Configuration setter
  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    let target = DevConfig;
    
    for (const k of keys) {
      if (!target[k] || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    target[lastKey] = value;
    this.log(`Config updated: ${key} = ${JSON.stringify(value)}`, 'debug', 'CONFIG');
  }
};

// Export for global access
if (typeof window !== 'undefined') {
  window.DevConfig = DevConfig;
  window.DevUtils = DevUtils;
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DevConfig, DevUtils };
}
